from __future__ import annotations

from datetime import date as Date

from pydantic import BaseModel


class TransactionBase(BaseModel):
    description: str
    amount: float
    type: str  # INCOME|EXPENSE
    category: str
    date: Date
    isRecurring: bool = False
    tag: str | None = None


class TransactionCreate(TransactionBase):
    userId: str


class TransactionUpdate(BaseModel):
    description: str | None = None
    amount: float | None = None
    type: str | None = None
    category: str | None = None
    date: Date | None = None
    isRecurring: bool | None = None
    tag: str | None = None


class TransactionOut(TransactionBase):
    id: str
    userId: str

    model_config = {"from_attributes": True}
