from __future__ import annotations

from pydantic import BaseModel


class DashboardCategoryItem(BaseModel):
    name: str
    value: float
    color: str


class MonthlyTrendItem(BaseModel):
    name: str
    income: float
    expenses: float


class DashboardStatsOut(BaseModel):
    balance: float
    income: float
    expenses: float
    categoryData: list[DashboardCategoryItem]
    monthlyTrend: list[MonthlyTrendItem]
