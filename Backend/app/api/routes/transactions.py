from __future__ import annotations

import os
from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.db import get_db
from app.models.import_job import ImportJob
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transactions import TransactionCreate, TransactionOut, TransactionUpdate
from app.services.import_service import process_import_file_to_transactions

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionOut])
def list_transactions(
    userId: int | None = None,
    month: int | None = None,
    year: int | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TransactionOut]:
    # For security: if userId is omitted, default to current user.
    # If provided, it must match the current user (simple family mode).
    effective_user_id = user.id
    if userId is not None and userId != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if userId is not None:
        effective_user_id = userId

    q = select(Transaction).where(Transaction.user_id == effective_user_id)
    if month and year:
        start = date(year, month, 1)
        if month == 12:
            end = date(year + 1, 1, 1)
        else:
            end = date(year, month + 1, 1)
        q = q.where(Transaction.date >= start, Transaction.date < end)

    q = q.order_by(Transaction.date.desc(), Transaction.id.desc())
    rows = list(db.scalars(q).all())

    return [
        TransactionOut(
            id=str(t.id),
            userId=str(t.user_id),
            description=t.description,
            amount=float(t.amount),
            type=t.type,
            category=t.category,
            date=t.date,
            isRecurring=t.is_recurring,
            tag=t.tag,
        )
        for t in rows
    ]


@router.post("", response_model=TransactionOut)
def create_transaction(
    payload: TransactionCreate,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransactionOut:
    tx = Transaction(
        user_id=int(payload.userId),
        description=payload.description,
        amount=payload.amount,
        type=payload.type,
        category=payload.category,
        tag=payload.tag,
        date=payload.date,
        is_recurring=payload.isRecurring,
        source="manual",
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return TransactionOut(
        id=str(tx.id),
        userId=str(tx.user_id),
        description=tx.description,
        amount=float(tx.amount),
        type=tx.type,
        category=tx.category,
        date=tx.date,
        isRecurring=tx.is_recurring,
        tag=tx.tag,
    )


@router.put("/{tx_id}", response_model=TransactionOut)
def update_transaction(
    tx_id: int,
    payload: TransactionUpdate,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransactionOut:
    tx = db.get(Transaction, tx_id)
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    if payload.description is not None:
        tx.description = payload.description
    if payload.amount is not None:
        tx.amount = payload.amount
    if payload.type is not None:
        tx.type = payload.type
    if payload.category is not None:
        tx.category = payload.category
    if payload.tag is not None:
        tx.tag = payload.tag
    if payload.date is not None:
        tx.date = payload.date
    if payload.isRecurring is not None:
        tx.is_recurring = payload.isRecurring

    db.commit()
    db.refresh(tx)

    return TransactionOut(
        id=str(tx.id),
        userId=str(tx.user_id),
        description=tx.description,
        amount=float(tx.amount),
        type=tx.type,
        category=tx.category,
        date=tx.date,
        isRecurring=tx.is_recurring,
        tag=tx.tag,
    )


@router.delete("/{tx_id}")
def delete_transaction(
    tx_id: int,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tx = db.get(Transaction, tx_id)
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    db.delete(tx)
    db.commit()
    return {"ok": True}


@router.post("/import")
async def import_file(
    userId: int,
    file: UploadFile = File(...),
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    max_size = settings.max_upload_mb * 1024 * 1024
    data = await file.read()
    if len(data) > max_size:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large")

    os.makedirs(settings.upload_dir, exist_ok=True)

    safe_name = file.filename or "upload"
    disk_path = os.path.join(settings.upload_dir, f"{userId}-{safe_name}")
    with open(disk_path, "wb") as f:
        f.write(data)

    job = ImportJob(
        user_id=userId,
        filename=safe_name,
        content_type=file.content_type or "application/octet-stream",
        file_path=disk_path,
        file_size=len(data),
        status="PROCESSING",
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        created = await process_import_file_to_transactions(db=db, user_id=userId, file_path=disk_path, filename=safe_name)
        job.status = "DONE"
        db.commit()
        return {"created": created}
    except Exception as e:
        job.status = "FAILED"
        job.error_message = str(e)
        db.commit()
        raise
