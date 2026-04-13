from __future__ import annotations

import time
import re
import os
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from pymongo.errors import DuplicateKeyError

try:
    from backend.auth import (
        admin_creation_key_exists,
        admin_exists,
        create_access_token,
        create_new_admin_creation_key,
        ensure_admin_user,
        get_current_user,
        hash_password,
        require_super_admin,
        set_admin_creation_key,
        verify_password,
        TOKEN_TTL_SECONDS,
    )
    from backend.database import get_users_collection
except ModuleNotFoundError as exc:
    if exc.name not in {"backend", "backend.auth", "backend.database"}:
        raise
    from auth import (
        admin_creation_key_exists,
        admin_exists,
        create_access_token,
        create_new_admin_creation_key,
        ensure_admin_user,
        get_current_user,
        hash_password,
        require_super_admin,
        set_admin_creation_key,
        verify_password,
        TOKEN_TTL_SECONDS,
    )
    from database import get_users_collection


router = APIRouter(prefix="/api/auth", tags=["auth"])


def _is_production() -> bool:
    env = str(os.getenv("APP_ENV") or os.getenv("ENVIRONMENT") or "development").strip().lower()
    return env in {"production", "prod"}


def _cookie_secure() -> bool:
    value = os.getenv("COOKIE_SECURE")
    if value is None:
        return _is_production()
    return str(value).strip().lower() == "true"


def _cookie_samesite() -> str:
    value = os.getenv("COOKIE_SAMESITE", "lax").strip().lower()
    if value not in {"lax", "strict", "none"}:
        value = "lax"
    if value == "none" and not _cookie_secure():
        # Modern browsers reject SameSite=None without Secure.
        return "lax"
    return value


class RegisterPayload(BaseModel):
    username: str
    email: str
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(default="user")
    admin_key: str | None = None
    new_admin_key: str | None = None


class LoginPayload(BaseModel):
    identifier: str | None = None
    email: str | None = None
    password: str = Field(min_length=1, max_length=128)


def _public_user(user: dict[str, Any]) -> dict[str, Any]:
    role = str(user.get("role") or "user").strip().lower() or "user"
    return {
        "id": str(user.get("_id")),
        "username": user.get("username_display") or user.get("username"),
        "email": user.get("email"),
        "role": role,
    }


def _normalize_email(raw: str) -> str:
    email = str(raw or "").strip().lower()
    if "@" not in email or email.startswith("@") or email.endswith("@"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid email")
    return email


def _normalize_role(raw: str) -> str:
    role = str(raw or "user").strip().lower()
    if role not in {"user", "admin"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid role")
    return role


def _normalize_username(raw: str) -> str:
    username = str(raw or "").strip().lower()
    if not re.fullmatch(r"[a-z0-9_]{3,32}", username):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username must be 3-32 chars, using only letters, numbers, or underscore.",
        )
    return username


def _normalize_username_display(raw: str) -> str:
    username = str(raw or "").strip()
    if not re.fullmatch(r"[A-Za-z0-9_]{3,32}", username):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Username must be 3-32 chars, using only letters, numbers, or underscore.",
        )
    return username


def _validate_password_strength(password: str) -> None:
    value = str(password or "")
    checks = [
        (len(value) >= 8, "at least 8 characters"),
        (any(ch.islower() for ch in value), "one lowercase letter"),
        (any(ch.isupper() for ch in value), "one uppercase letter"),
        (any(ch.isdigit() for ch in value), "one number"),
        (any(not ch.isalnum() for ch in value), "one special character"),
    ]
    missing = [label for ok, label in checks if not ok]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Password must include {', '.join(missing)}.",
        )


@router.get("/signup-meta")
def signup_meta():
    ensure_admin_user()
    exists = admin_exists()
    key_exists = admin_creation_key_exists()
    return {
        "admin_exists": exists,
        "admin_key_required_for_admin_signup": False,
        "admin_key_initialized": key_exists,
    }


@router.post("/register")
def register(payload: RegisterPayload):
    ensure_admin_user()
    users = get_users_collection()
    username = _normalize_username(payload.username)
    username_display = _normalize_username_display(payload.username)
    email = _normalize_email(payload.email)
    requested_role = _normalize_role(payload.role)
    role = requested_role
    _validate_password_strength(payload.password)

    admins_exist = admin_exists()
    first_admin_created = False

    if requested_role == "admin":
        if admins_exist:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin self-registration is disabled. Super admin must promote users.",
            )
        else:
            first_admin_created = True
            role = "super_admin"
            new_admin_key = str(payload.new_admin_key or "").strip()
            if not new_admin_key:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="First admin must create an admin creation key.",
                )

    doc = {
        "username": username,
        "username_display": username_display,
        "email": email,
        "password_hash": hash_password(payload.password),
        "role": role,
        "created_at": int(time.time()),
    }

    try:
        users.insert_one(doc)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email or username already registered") from exc

    if first_admin_created:
        set_admin_creation_key(str(payload.new_admin_key).strip(), created_by=email)

    return {
        "message": f"{role.replace('_', ' ').title()} registered successfully",
        "user": {"username": username_display, "email": email, "role": role},
        "admin_creation_key": None,
        "admin_creation_key_show_once": False,
    }


@router.post("/login")
def login(payload: LoginPayload, response: Response):
    ensure_admin_user()

    users = get_users_collection()
    raw_identifier = str(payload.identifier or payload.email or "").strip()
    if not raw_identifier:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Identifier is required")

    if "@" in raw_identifier:
        email = _normalize_email(raw_identifier)
        user = users.find_one({"email": email})
    else:
        username = _normalize_username(raw_identifier)
        user = users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(
        {
            "username": user.get("username_display") or user.get("username"),
            "email": user["email"],
            "role": str(user.get("role") or "user").strip().lower() or "user",
            "sub": str(user["_id"]),
        }
    )
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=_cookie_secure(),
        samesite=_cookie_samesite(),
        max_age=TOKEN_TTL_SECONDS,
        path="/",
    )
    response.headers["Cache-Control"] = "no-store"
    return {"access_token": token, "token_type": "bearer", "user": _public_user(user)}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Logged out"}


@router.get("/me")
def me(current_user: dict[str, Any] = Depends(get_current_user)):
    return _public_user(current_user)


@router.post("/admin-key/rotate")
def rotate_admin_key(current_user: dict[str, Any] = Depends(require_super_admin)):
    new_key = create_new_admin_creation_key(created_by=current_user.get("email", "admin"))
    return {"admin_creation_key": new_key, "show_once": True}
