from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import TransactionIn, TransactionOut, Property, Client, UserRole
from schemas import (
    TransactionInCreate, TransactionInUpdate, TransactionInOut,
    TransactionOutCreate, TransactionOutUpdate, TransactionOutOut
)
from auth import get_current_user, require_roles
from typing import List, Optional

router = APIRouter(prefix="/transactions", tags=["Transactions"])

_DEFAULT_LIMIT = 500
_MAX_LIMIT = 2000


# ── Entradas (In) ──────────────────────────────────────

def _build_in_query(db, month, year, category, property_id):
    """Build filtered query for TransactionIn (shared by list and summary)."""
    q = db.query(TransactionIn)
    if month:
        q = q.filter(TransactionIn.competencia_month == month)
    if year:
        q = q.filter(TransactionIn.competencia_year == year)
    if category:
        q = q.filter(TransactionIn.category == category)
    if property_id:
        q = q.filter(TransactionIn.property_id == property_id)
    return q


@router.get("/in/summary")
def get_transactions_in_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    category: Optional[str] = None,
    property_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get total amount and count for TransactionIn with same filters as list."""
    from sqlalchemy import func
    q = _build_in_query(db, month, year, category, property_id)
    total = q.with_entities(func.coalesce(func.sum(TransactionIn.amount), 0)).scalar()
    count = q.count()
    return {"total_amount": round(float(total), 2), "count": count}


@router.get("/in", response_model=List[TransactionInOut])
def list_transactions_in(
    month: Optional[int] = None,
    year: Optional[int] = None,
    category: Optional[str] = None,
    property_id: Optional[int] = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(_DEFAULT_LIMIT, ge=1, le=_MAX_LIMIT),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = _build_in_query(db, month, year, category, property_id).options(
        joinedload(TransactionIn.property),
        joinedload(TransactionIn.client),
    )

    transactions = q.order_by(TransactionIn.date.desc()).offset(offset).limit(limit).all()
    result = []
    for t in transactions:
        out = TransactionInOut.model_validate(t)
        if t.property:
            out.property_name = t.property.name
        if t.client:
            out.client_name = t.client.name
        result.append(out)
    return result


@router.post("/in", response_model=TransactionInOut)
def create_transaction_in(
    data: TransactionInCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.FINANCEIRO))
):
    t = TransactionIn(**data.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    out = TransactionInOut.model_validate(t)
    if t.property:
        out.property_name = t.property.name
    if t.client:
        out.client_name = t.client.name
    return out


@router.put("/in/{tid}", response_model=TransactionInOut)
def update_transaction_in(
    tid: int,
    data: TransactionInUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.FINANCEIRO))
):
    t = db.query(TransactionIn).filter(TransactionIn.id == tid).first()
    if not t:
        raise HTTPException(status_code=404, detail="Entrada nao encontrada")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(t, key, val)
    db.commit()
    db.refresh(t)
    out = TransactionInOut.model_validate(t)
    if t.property:
        out.property_name = t.property.name
    if t.client:
        out.client_name = t.client.name
    return out


@router.delete("/in/{tid}")
def delete_transaction_in(
    tid: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.FINANCEIRO))
):
    t = db.query(TransactionIn).filter(TransactionIn.id == tid).first()
    if not t:
        raise HTTPException(status_code=404, detail="Entrada nao encontrada")
    db.delete(t)
    db.commit()
    return {"detail": "Entrada removida"}


# ── Saidas (Out) ───────────────────────────────────────

def _build_out_query(db, month, year, category, property_id):
    """Build filtered query for TransactionOut (shared by list and summary)."""
    q = db.query(TransactionOut)
    if month:
        q = q.filter(TransactionOut.competencia_month == month)
    if year:
        q = q.filter(TransactionOut.competencia_year == year)
    if category:
        q = q.filter(TransactionOut.category == category)
    if property_id:
        q = q.filter(TransactionOut.property_id == property_id)
    return q


@router.get("/out/summary")
def get_transactions_out_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    category: Optional[str] = None,
    property_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get total amount and count for TransactionOut with same filters as list."""
    from sqlalchemy import func
    q = _build_out_query(db, month, year, category, property_id)
    total = q.with_entities(func.coalesce(func.sum(TransactionOut.total_paid), 0)).scalar()
    count = q.count()
    return {"total_amount": round(float(total), 2), "count": count}


@router.get("/out", response_model=List[TransactionOutOut])
def list_transactions_out(
    month: Optional[int] = None,
    year: Optional[int] = None,
    category: Optional[str] = None,
    property_id: Optional[int] = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(_DEFAULT_LIMIT, ge=1, le=_MAX_LIMIT),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = _build_out_query(db, month, year, category, property_id).options(
        joinedload(TransactionOut.property)
    )

    transactions = q.order_by(TransactionOut.date.desc()).offset(offset).limit(limit).all()
    result = []
    for t in transactions:
        out = TransactionOutOut.model_validate(t)
        if t.property:
            out.property_name = t.property.name
        result.append(out)
    return result


@router.post("/out", response_model=TransactionOutOut)
def create_transaction_out(
    data: TransactionOutCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.FINANCEIRO))
):
    t = TransactionOut(**data.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return TransactionOutOut.model_validate(t)


@router.put("/out/{tid}", response_model=TransactionOutOut)
def update_transaction_out(
    tid: int,
    data: TransactionOutUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.FINANCEIRO))
):
    t = db.query(TransactionOut).filter(TransactionOut.id == tid).first()
    if not t:
        raise HTTPException(status_code=404, detail="Saida nao encontrada")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(t, key, val)
    db.commit()
    db.refresh(t)
    return TransactionOutOut.model_validate(t)


@router.delete("/out/{tid}")
def delete_transaction_out(
    tid: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.FINANCEIRO))
):
    t = db.query(TransactionOut).filter(TransactionOut.id == tid).first()
    if not t:
        raise HTTPException(status_code=404, detail="Saida nao encontrada")
    db.delete(t)
    db.commit()
    return {"detail": "Saida removida"}
