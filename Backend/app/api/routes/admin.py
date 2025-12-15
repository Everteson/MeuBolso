from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.db import get_db
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.admin import AdminUserCreate, UserOut

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=list[UserOut])
def list_users(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[UserOut]:
    users = list(db.scalars(select(User).order_by(User.created_at.asc())).all())
    return [UserOut.model_validate({"id": str(u.id), "name": u.name, "email": u.email, "role": u.role}) for u in users]


@router.post("/users", response_model=UserOut)
def create_user(
    payload: AdminUserCreate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> UserOut:
    exists = db.scalar(select(User).where(User.email == payload.email))
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    password = payload.password or "123456"
    user = User(
        name=payload.name,
        email=str(payload.email),
        role="MEMBER",
        password_hash=get_password_hash(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut.model_validate({"id": str(user.id), "name": user.name, "email": user.email, "role": user.role})


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if admin.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não é possível remover o administrador principal")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.role == "ADMIN":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não é possível remover outro ADMIN")

    db.delete(user)
    db.commit()
    return {"ok": True}
