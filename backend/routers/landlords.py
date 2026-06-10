from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Landlord, Property, TransactionIn, TransactionOut, Contract, UserRole
from schemas import LandlordCreate, LandlordUpdate, LandlordOut
from auth import get_current_user, require_roles
from typing import List, Optional
from collections import defaultdict

router = APIRouter(prefix="/landlords", tags=["Landlords"])

MONTH_NAMES = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
               "Jul", "Ago", "Set", "Out", "Nov", "Dez"]


@router.get("", response_model=List[LandlordOut])
def list_landlords(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = db.query(Landlord)
    if search:
        q = q.filter(Landlord.name.ilike(f"%{search}%"))
    landlords = q.order_by(Landlord.name).all()
    result = []
    for ll in landlords:
        out = LandlordOut.model_validate(ll)
        out.property_count = db.query(Property).filter(Property.landlord_id == ll.id).count()
        result.append(out)
    return result


@router.get("/{landlord_id}")
def get_landlord_profile(
    landlord_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    ll = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not ll:
        raise HTTPException(status_code=404, detail="Landlord nao encontrado")

    # Properties owned by this landlord
    properties = db.query(Property).filter(Property.landlord_id == ll.id).all()
    prop_ids = [p.id for p in properties]

    properties_data = []
    total_rent_paid = 0
    total_revenue = 0

    for p in properties:
        # Rent paid (from transactions_out with category containing "rent" or "aluguel")
        rent_txns = db.query(TransactionOut).filter(
            TransactionOut.property_id == p.id,
            TransactionOut.category.ilike("%rent%") | TransactionOut.category.ilike("%house rent%")
        ).all()
        rent_paid = sum(t.total_paid for t in rent_txns)
        total_rent_paid += rent_paid

        # Revenue from this property
        rev_txns = db.query(TransactionIn).filter(TransactionIn.property_id == p.id).all()
        revenue = sum(t.amount for t in rev_txns)
        total_revenue += revenue

        # Active clients count
        from models import Client
        active_clients = db.query(Client).filter(
            Client.property_id == p.id, Client.status == "ativo"
        ).count()

        properties_data.append({
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "address": p.address,
            "type": p.type.value if p.type else None,
            "status": p.status.value if p.status else None,
            "monthly_rent": p.monthly_rent,
            "contract_start": str(p.contract_start) if p.contract_start else None,
            "contract_end": str(p.contract_end) if p.contract_end else None,
            "rent_paid": round(rent_paid, 2),
            "revenue": round(revenue, 2),
            "active_clients": active_clients,
        })

    # Contracts linked to landlord's properties
    contracts = db.query(Contract).filter(Contract.property_id.in_(prop_ids)).order_by(Contract.start_date.desc()).all() if prop_ids else []
    contracts_data = [{
        "id": ct.id,
        "type": ct.type.value if ct.type else None,
        "property_name": ct.property.name if ct.property else None,
        "client_name": ct.client.name if ct.client else None,
        "start_date": str(ct.start_date) if ct.start_date else None,
        "end_date": str(ct.end_date) if ct.end_date else None,
        "value": ct.value,
        "status": ct.status.value if ct.status else None,
    } for ct in contracts]

    # Monthly rent payments breakdown
    rent_by_month = defaultdict(float)
    if prop_ids:
        all_rent_txns = db.query(TransactionOut).filter(
            TransactionOut.property_id.in_(prop_ids),
            TransactionOut.category.ilike("%rent%") | TransactionOut.category.ilike("%house rent%")
        ).all()
        for t in all_rent_txns:
            m = t.competencia_month or t.date.month
            y = t.competencia_year or t.date.year
            label = f"{MONTH_NAMES[m]}/{y}" if 1 <= m <= 12 else f"{m}/{y}"
            rent_by_month[(y, m, label)] += t.total_paid

    rent_history = [
        {"year": y, "month": m, "label": label, "amount": round(amt, 2)}
        for (y, m, label), amt in sorted(rent_by_month.items())
    ]

    return {
        "id": ll.id,
        "code": ll.code,
        "name": ll.name,
        "email": ll.email,
        "phone": ll.phone,
        "address": ll.address,
        "iban": ll.iban,
        "notes": ll.notes,
        "created_at": ll.created_at.isoformat() if ll.created_at else None,
        "properties": properties_data,
        "contracts": contracts_data,
        "rent_history": rent_history,
        "total_rent_paid": round(total_rent_paid, 2),
        "total_revenue": round(total_revenue, 2),
        "total_properties": len(properties),
        "total_monthly_rent": round(sum(p.monthly_rent for p in properties), 2),
    }


@router.post("", response_model=LandlordOut)
def create_landlord(
    data: LandlordCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    from main import _generate_landlord_code
    ll = Landlord(**data.model_dump())
    ll.code = _generate_landlord_code(db)
    db.add(ll)
    db.commit()
    db.refresh(ll)
    out = LandlordOut.model_validate(ll)
    out.property_count = 0
    return out


@router.put("/{landlord_id}", response_model=LandlordOut)
def update_landlord(
    landlord_id: int,
    data: LandlordUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    ll = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not ll:
        raise HTTPException(status_code=404, detail="Landlord nao encontrado")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(ll, key, val)
    db.commit()
    db.refresh(ll)
    out = LandlordOut.model_validate(ll)
    out.property_count = db.query(Property).filter(Property.landlord_id == ll.id).count()
    return out


@router.delete("/{landlord_id}")
def delete_landlord(
    landlord_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    ll = db.query(Landlord).filter(Landlord.id == landlord_id).first()
    if not ll:
        raise HTTPException(status_code=404, detail="Landlord nao encontrado")
    # Unlink properties
    db.query(Property).filter(Property.landlord_id == landlord_id).update({"landlord_id": None})
    db.delete(ll)
    db.commit()
    return {"detail": "Landlord removido"}
