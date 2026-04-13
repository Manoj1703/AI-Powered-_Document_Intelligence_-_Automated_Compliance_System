from __future__ import annotations

import os
import unittest
from unittest.mock import patch

from bson import ObjectId
from fastapi.testclient import TestClient
from pymongo.errors import DuplicateKeyError

# Keep app imports stable in tests without requiring real services.
os.environ.setdefault("MONGO_URI", "mongodb://localhost:27017")
os.environ.setdefault("SHOW_TRACEBACK", "false")
os.environ.setdefault("JWT_SECRET", "test-secret-for-ci-at-least-32-chars")

import app.auth as auth_core
from app.auth import hash_password
from app.main import app
from app.routes import auth as auth_routes
from app.routes import users as users_routes


class _InsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class _UpdateResult:
    def __init__(self, matched_count=0, modified_count=0):
        self.matched_count = matched_count
        self.modified_count = modified_count


class _DeleteResult:
    def __init__(self, deleted_count=0):
        self.deleted_count = deleted_count


class _UsersCursor(list):
    def sort(self, field, direction):
        reverse = int(direction) < 0
        return _UsersCursor(sorted(self, key=lambda item: str(item.get(field) or ""), reverse=reverse))


class FakeUsersCollection:
    def __init__(self):
        self.docs = [
            {
                "_id": ObjectId("65f1f1f1f1f1f1f1f1f1f1f2"),
                "username": "admin",
                "username_display": "Admin",
                "email": "admin@example.com",
                "password_hash": hash_password("Admin@123"),
                "role": "super_admin",
            },
            {
                "_id": ObjectId("65f1f1f1f1f1f1f1f1f1f1f3"),
                "username": "user01",
                "username_display": "User01",
                "email": "user01@example.com",
                "password_hash": hash_password("User@1234"),
                "role": "user",
            },
        ]

    def find_one(self, query, _projection=None):
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in query.items()):
                return dict(doc)
        return None

    def insert_one(self, document):
        for doc in self.docs:
            if doc.get("email") == document.get("email") or doc.get("username") == document.get("username"):
                raise DuplicateKeyError("duplicate")
        next_doc = dict(document)
        next_doc["_id"] = ObjectId()
        self.docs.append(next_doc)
        return _InsertResult(next_doc["_id"])

    def find(self, _query, projection):
        rows = []
        for doc in self.docs:
            item = dict(doc)
            if projection and projection.get("password_hash") == 0:
                item.pop("password_hash", None)
            rows.append(item)
        return _UsersCursor(rows)

    def update_one(self, query, update):
        target = self.find_one(query)
        if not target:
            return _UpdateResult()
        set_payload = dict(update.get("$set") or {})
        for index, doc in enumerate(self.docs):
            if doc.get("_id") == target.get("_id"):
                self.docs[index] = {**doc, **set_payload}
                return _UpdateResult(matched_count=1, modified_count=1)
        return _UpdateResult()

    def delete_one(self, query):
        before = len(self.docs)
        self.docs = [doc for doc in self.docs if not all(doc.get(k) == v for k, v in query.items())]
        deleted = 1 if len(self.docs) < before else 0
        return _DeleteResult(deleted_count=deleted)


class AuthUsersApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        app.dependency_overrides.clear()
        self.users = FakeUsersCollection()
        self._patchers = [
            patch("app.routes.auth.ensure_admin_user", lambda: None),
            patch("app.routes.auth.get_users_collection", return_value=self.users),
            patch("app.routes.users.get_users_collection", return_value=self.users),
            patch(
                "app.routes.auth.admin_exists",
                side_effect=lambda: any(d.get("role") in {"admin", "super_admin"} for d in self.users.docs),
            ),
            patch("app.routes.auth.admin_creation_key_exists", return_value=True),
            patch("app.routes.auth.set_admin_creation_key", lambda *_args, **_kwargs: None),
            patch("app.routes.auth.create_new_admin_creation_key", return_value="NEW-ADMIN-KEY"),
        ]
        for patcher in self._patchers:
            patcher.start()

    def tearDown(self):
        for patcher in reversed(self._patchers):
            patcher.stop()
        app.dependency_overrides.clear()

    def test_openapi_has_expected_paths(self):
        expected = {
            "/api/upload",
            "/api/documents",
            "/api/documents/{doc_id}",
            "/api/dashboard/stats",
            "/api/auth/signup-meta",
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/logout",
            "/api/auth/me",
            "/api/auth/admin-key/rotate",
            "/api/users",
            "/api/users/{user_id}/role",
            "/api/users/{user_id}",
            "/api/users/transfer-super-admin/{user_id}",
        }
        paths = set(app.openapi().get("paths", {}).keys())
        self.assertTrue(expected.issubset(paths))

    def test_signup_meta(self):
        response = self.client.get("/api/auth/signup-meta")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["admin_exists"], True)
        self.assertEqual(payload["admin_key_initialized"], True)

    def test_register_user(self):
        response = self.client.post(
            "/api/auth/register",
            json={
                "username": "new_user",
                "email": "new_user@example.com",
                "password": "Strong@123",
                "role": "user",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user"]["email"], "new_user@example.com")

    def test_login_logout_and_me(self):
        login_response = self.client.post(
            "/api/auth/login",
            json={"identifier": "admin@example.com", "password": "Admin@123"},
        )
        self.assertEqual(login_response.status_code, 200)
        token = login_response.json().get("access_token")
        self.assertTrue(token)

        app.dependency_overrides[auth_routes.get_current_user] = lambda: {
            "_id": ObjectId("65f1f1f1f1f1f1f1f1f1f1f2"),
            "username": "admin",
            "username_display": "Admin",
            "email": "admin@example.com",
            "role": "super_admin",
        }
        me_response = self.client.get("/api/auth/me")
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.json()["email"], "admin@example.com")

        logout_response = self.client.post("/api/auth/logout")
        self.assertEqual(logout_response.status_code, 200)

    def test_admin_routes_users_and_rotate_key(self):
        admin_user = {
            "_id": ObjectId("65f1f1f1f1f1f1f1f1f1f1f2"),
            "username": "admin",
            "username_display": "Admin",
            "email": "admin@example.com",
            "role": "super_admin",
        }
        app.dependency_overrides[auth_routes.require_super_admin] = lambda: admin_user
        app.dependency_overrides[users_routes.require_admin] = lambda: admin_user

        users_response = self.client.get("/api/users")
        self.assertEqual(users_response.status_code, 200)
        self.assertGreaterEqual(len(users_response.json()), 2)

        rotate_response = self.client.post("/api/auth/admin-key/rotate")
        self.assertEqual(rotate_response.status_code, 200)
        self.assertEqual(rotate_response.json()["admin_creation_key"], "NEW-ADMIN-KEY")

    def test_super_admin_user_management_endpoints(self):
        super_admin_user = {
            "_id": ObjectId("65f1f1f1f1f1f1f1f1f1f1f2"),
            "username": "admin",
            "username_display": "Admin",
            "email": "admin@example.com",
            "role": "super_admin",
        }
        app.dependency_overrides[users_routes.require_super_admin] = lambda: super_admin_user

        target = next(doc for doc in self.users.docs if doc.get("email") == "user01@example.com")
        target_id = str(target["_id"])

        promote = self.client.patch(f"/api/users/{target_id}/role", json={"role": "admin"})
        self.assertEqual(promote.status_code, 200)
        self.assertEqual(promote.json()["user"]["role"], "admin")

        transfer = self.client.post(f"/api/users/transfer-super-admin/{target_id}")
        self.assertEqual(transfer.status_code, 200)
        self.assertEqual(transfer.json()["new_super_admin_user_id"], target_id)

        old_super_admin = next(doc for doc in self.users.docs if doc.get("email") == "admin@example.com")
        new_super_admin = next(doc for doc in self.users.docs if doc.get("email") == "user01@example.com")
        self.assertEqual(old_super_admin.get("role"), "admin")
        self.assertEqual(new_super_admin.get("role"), "super_admin")

        protected_delete = self.client.delete(f"/api/users/{target_id}")
        self.assertEqual(protected_delete.status_code, 403)

    def test_non_super_admin_cannot_manage_roles(self):
        plain_admin = {
            "_id": ObjectId("65f1f1f1f1f1f1f1f1f1f1f2"),
            "username": "admin",
            "username_display": "Admin",
            "email": "admin@example.com",
            "role": "admin",
        }
        app.dependency_overrides[auth_core.get_current_user] = lambda: plain_admin

        target = next(doc for doc in self.users.docs if doc.get("email") == "user01@example.com")
        target_id = str(target["_id"])

        promote = self.client.patch(f"/api/users/{target_id}/role", json={"role": "admin"})
        self.assertEqual(promote.status_code, 403)


if __name__ == "__main__":
    unittest.main()
