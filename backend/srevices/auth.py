from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

try:
    from backend.database import get_system_collection, get_users_collection
except ModuleNotFoundError as exc:
    if exc.name not in {"backend", "backend.database"}:
        raise
    from database import get_system_collection, get_users_collection


TOKEN_TTL_SECONDS = int(os.getenv("JWT_EXPIRE_SECONDS", "86400"))


def _is_production_env() -> bool:
    env = str(os.getenv("APP_ENV") or os.getenv("ENVIRONMENT") or "development").strip().lower()
    return env in {"production", "prod"}


def _jwt_secret_from_env() -> str:
    configured = str(os.getenv("JWT_SECRET") or "").strip()
    if configured:
        if len(configured) < 32:
            raise RuntimeError("JWT_SECRET must be at least 32 characters.")
        return configured
    if _is_production_env():
        raise RuntimeError("JWT_SECRET must be configured in production.")
    return "dev-only-jwt-secret-change-me-before-production-2026"


JWT_SECRET = _jwt_secret_from_env()
JWT_ALG = "HS256"
bearer_scheme = HTTPBearer(auto_error=False)
ADMIN_ROLES = {"admin", "super_admin"}


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _b64url_decode(raw: str) -> bytes:
    pad = "=" * (-len(raw) % 4)
    return base64.urlsafe_b64decode((raw + pad).encode("utf-8"))


def _jwt_sign(message: bytes) -> bytes:
    return hmac.new(JWT_SECRET.encode("utf-8"), message, hashlib.sha256).digest()


def create_access_token(payload: dict[str, Any], ttl_seconds: int = TOKEN_TTL_SECONDS) -> str:
    header = {"alg": JWT_ALG, "typ": "JWT"}
    exp = int(time.time()) + ttl_seconds
    body = {**payload, "exp": exp}
    header_part = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    body_part = _b64url_encode(json.dumps(body, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{header_part}.{body_part}".encode("utf-8")
    sig = _b64url_encode(_jwt_sign(signing_input))
    return f"{header_part}.{body_part}.{sig}"


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        header_part, body_part, sig_part = token.split(".")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token format") from exc

    signing_input = f"{header_part}.{body_part}".encode("utf-8")
    expected_sig = _b64url_encode(_jwt_sign(signing_input))
    if not hmac.compare_digest(expected_sig, sig_part):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token signature")

    payload = json.loads(_b64url_decode(body_part))
    exp = int(payload.get("exp", 0))
    if exp <= int(time.time()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    return payload


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    iterations = 120_000
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations,
    )
    return f"pbkdf2_sha256${iterations}${salt}${derived.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        _, iter_str, salt, hex_hash = stored.split("$", 3)
    except ValueError:
        return False

    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        int(iter_str),
    ).hex()
    return hmac.compare_digest(derived, hex_hash)


def ensure_admin_user() -> None:
    users = get_users_collection()
    users.create_index("email", unique=True)
    users.create_index(
        "username",
        unique=True,
        partialFilterExpression={"username": {"$type": "string"}},
    )
    users.create_index("role")
    if users.count_documents({"role": "super_admin"}) == 0:
        first_admin = users.find_one(
            {"role": "admin"},
            sort=[("created_at", 1), ("_id", 1)],
        )
        if first_admin:
            users.update_one({"_id": first_admin["_id"]}, {"$set": {"role": "super_admin"}})


def admin_exists() -> bool:
    users = get_users_collection()
    return users.count_documents({"role": {"$in": list(ADMIN_ROLES)}}) > 0


def is_admin_role(role: Any) -> bool:
    return str(role or "").strip().lower() in ADMIN_ROLES


def is_super_admin_role(role: Any) -> bool:
    return str(role or "").strip().lower() == "super_admin"


def _admin_key_config() -> dict[str, Any] | None:
    system = get_system_collection()
    return system.find_one({"_id": "admin_creation_key"})


def admin_creation_key_exists() -> bool:
    config = _admin_key_config()
    return bool(config and config.get("key_hash"))


def set_admin_creation_key(raw_key: str, created_by: str) -> None:
    system = get_system_collection()
    system.replace_one(
        {"_id": "admin_creation_key"},
        {
            "_id": "admin_creation_key",
            "key_hash": hash_password(raw_key),
            "created_by": created_by,
            "created_at": int(time.time()),
        },
        upsert=True,
    )


def create_new_admin_creation_key(created_by: str) -> str:
    raw = secrets.token_urlsafe(24)
    set_admin_creation_key(raw, created_by)
    return raw


def verify_admin_creation_key(raw_key: str) -> bool:
    config = _admin_key_config()
    if not config:
        return False
    stored = str(config.get("key_hash") or "")
    if not stored:
        return False
    return verify_password(raw_key, stored)


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict[str, Any]:
    token = credentials.credentials if credentials else str(request.cookies.get("access_token") or "").strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = decode_access_token(token)
    email = str(payload.get("email", "")).lower()
    users = get_users_collection()
    user = users.find_one({"email": email}, {"password_hash": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_admin(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if not is_admin_role(current_user.get("role")):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access restricted")
    return current_user


def require_super_admin(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if not is_super_admin_role(current_user.get("role")):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin access required")
    return current_user
