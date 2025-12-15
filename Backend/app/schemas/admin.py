from __future__ import annotations

from pydantic import BaseModel, EmailStr


class AdminUserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str | None = None


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str

    model_config = {"from_attributes": True}
