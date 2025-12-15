from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=UserOut)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> UserOut:
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(subject=str(user.id))

    # To match the existing frontend types, we return a User object.
    # We'll include token as an extra field.
    # FastAPI will allow extra fields in response if we return dict.
    return UserOut.model_validate({"id": str(user.id), "name": user.name, "email": user.email, "role": user.role, "token": token})  # type: ignore


@router.post("/register", response_model=UserOut)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> UserOut:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    user = User(
        name=payload.name,
        email=str(payload.email),
        role="MEMBER",
        password_hash=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=str(user.id))
    return UserOut.model_validate({"id": str(user.id), "name": user.name, "email": user.email, "role": user.role, "token": token})  # type: ignore


from app.api.deps import get_current_user


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    # Cast id to string to match frontend types
    return UserOut.model_validate({"id": str(user.id), "name": user.name, "email": user.email, "role": user.role})
