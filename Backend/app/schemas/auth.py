from __future__ import annotations

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    token: str


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    token: str | None = None

    model_config = {"from_attributes": True}
