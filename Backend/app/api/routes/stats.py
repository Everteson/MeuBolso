from __future__ import annotations

from calendar import month_abbr
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.db import get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.stats import DashboardStatsOut

router = APIRouter(prefix="/api/stats", tags=["stats"])

COLORS = [
    "#10B981",
    "#3B82F6",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#6366F1",
]


@router.get("/dashboard", response_model=DashboardStatsOut)
def dashboard(
    userId: int | None = None,
    month: int | None = None,
    year: int | None = None,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardStatsOut:
    if not userId:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="userId is required")

    q = select(Transaction).where(Transaction.user_id == userId)
    if month and year:
        start = date(year, month, 1)
        if month == 12:
            end = date(year + 1, 1, 1)
        else:
            end = date(year, month + 1, 1)
        q = q.where(Transaction.date >= start, Transaction.date < end)

    rows = list(db.scalars(q).all())

    income = sum(float(t.amount) for t in rows if t.type == "INCOME")
    expenses = sum(float(t.amount) for t in rows if t.type == "EXPENSE")

    category_map: dict[str, float] = {}
    for t in rows:
        if t.type != "EXPENSE":
            continue
        category_map[t.category] = category_map.get(t.category, 0.0) + float(t.amount)

    category_data = [
        {"name": name, "value": value, "color": COLORS[i % len(COLORS)]}
        for i, (name, value) in enumerate(sorted(category_map.items(), key=lambda x: x[1], reverse=True))
    ]

    # Monthly trend: last 4 months (simple)
    today = date.today()
    trend = []
    for i in range(3, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        start = date(y, m, 1)
        end = date(y + 1, 1, 1) if m == 12 else date(y, m + 1, 1)

        subq = select(
            Transaction.type,
            func.sum(Transaction.amount).label("total"),
        ).where(
            Transaction.user_id == userId,
            Transaction.date >= start,
            Transaction.date < end,
        ).group_by(Transaction.type)

        totals = {row.type: float(row.total or 0) for row in db.execute(subq).all()}
        trend.append(
            {
                "name": month_abbr[m].title(),
                "income": totals.get("INCOME", 0.0),
                "expenses": totals.get("EXPENSE", 0.0),
            }
        )

    return DashboardStatsOut(
        balance=income - expenses,
        income=income,
        expenses=expenses,
        categoryData=category_data,
        monthlyTrend=trend,
    )


@router.get("/category-breakdown")
def category_breakdown(
    category: str,
    userId: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = (
        select(Transaction.tag, func.sum(Transaction.amount).label("total"))
        .where(Transaction.user_id == userId, Transaction.category == category, Transaction.type == "EXPENSE")
        .group_by(Transaction.tag)
    )

    rows = db.execute(q).all()
    result = []
    for tag, total in rows:
        result.append({"name": tag or "Sem Tag", "value": float(total or 0)})

    result.sort(key=lambda x: x["value"], reverse=True)
    return result
