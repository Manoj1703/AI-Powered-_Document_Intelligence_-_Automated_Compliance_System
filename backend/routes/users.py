from __future__ import annotations

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

try:
    from backend.auth import require_admin, require_super_admin
    from backend.database import get_users_collection
except ModuleNotFoundError as exc:
    if exc.name not in {"backend", "backend.auth", "backend.database"}:
        raise
    from auth import require_admin, require_super_admin
    from database import get_users_collection


router = APIRouter(prefix="/api/users", tags=["users"])


class RoleUpdatePayload(BaseModel):
    role: str


@router.get("")
def list_users(_admin: dict = Depends(require_admin)):
    users = get_users_collection()
    docs = users.find({}, {"password_hash": 0}).sort("email", 1)
    return [
        {
            "id": str(user.get("_id")),
            "username": user.get("username_display") or user.get("username"),
            "email": user.get("email"),
            "role": user.get("role", "user"),
        }
        for user in docs
    ]


@router.patch("/{user_id}/role")
def update_user_role(
    user_id: str,
    payload: RoleUpdatePayload,
    current_user: dict = Depends(require_super_admin),
):
    role = str(payload.role or "").strip().lower()
    if role not in {"admin", "user"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid role")

    try:
        target_id = ObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid user ID") from exc

    users = get_users_collection()
    target = users.find_one({"_id": target_id}, {"password_hash": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if str(target.get("role") or "").strip().lower() == "super_admin":
        raise HTTPException(status_code=403, detail="Super admin role cannot be modified")

    users.update_one({"_id": target_id}, {"$set": {"role": role}})
    updated = users.find_one({"_id": target_id}, {"password_hash": 0}) or target
    return {
        "message": f"Role updated to {role}",
        "user": {
            "id": str(updated.get("_id")),
            "username": updated.get("username_display") or updated.get("username"),
            "email": updated.get("email"),
            "role": updated.get("role", "user"),
        },
    }


@router.delete("/{user_id}")
def delete_user(user_id: str, current_user: dict = Depends(require_super_admin)):
    try:
        target_id = ObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid user ID") from exc

    users = get_users_collection()
    target = users.find_one({"_id": target_id}, {"password_hash": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if str(target.get("role") or "").strip().lower() == "super_admin":
        raise HTTPException(status_code=403, detail="Super admin account cannot be deleted")
    if str(target.get("email") or "").strip().lower() == str(current_user.get("email") or "").strip().lower():
        raise HTTPException(status_code=403, detail="You cannot delete your own account")

    users.delete_one({"_id": target_id})
    return {"message": "User deleted", "user_id": user_id}


@router.post("/transfer-super-admin/{user_id}")
def transfer_super_admin(user_id: str, current_user: dict = Depends(require_super_admin)):
    try:
        target_id = ObjectId(user_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid user ID") from exc

    users = get_users_collection()
    target = users.find_one({"_id": target_id}, {"password_hash": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    target_role = str(target.get("role") or "").strip().lower()
    if target_role not in {"admin", "user"}:
        raise HTTPException(status_code=403, detail="Target user cannot receive super admin role")

    current_email = str(current_user.get("email") or "").strip().lower()
    current_doc = users.find_one({"email": current_email})
    if not current_doc:
        raise HTTPException(status_code=404, detail="Current user not found")

    users.update_one({"_id": target_id}, {"$set": {"role": "super_admin"}})
    users.update_one({"_id": current_doc["_id"]}, {"$set": {"role": "admin"}})

    return {
        "message": "Super admin role transferred",
        "new_super_admin_user_id": user_id,
    }
