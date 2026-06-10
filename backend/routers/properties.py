from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Property, TransactionIn, TransactionOut, Client, Contract, Document, Room, Bed, PropertyRemark, UserRole
from schemas import PropertyCreate, PropertyUpdate, PropertyOut, PropertyProfile, RankingProperty, RemarkCreate, RemarkOut
from auth import get_current_user, require_roles
from typing import List, Optional

router = APIRouter(prefix="/properties", tags=["Properties"])


@router.get("", response_model=List[PropertyOut])
def list_properties(
    status: Optional[str] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = db.query(Property)
    if status:
        q = q.filter(Property.status == status)
    if type:
        q = q.filter(Property.type == type)
    props = q.order_by(Property.name).all()
    result = []
    for p in props:
        out = PropertyOut.model_validate(p)
        if p.landlord:
            out.landlord_name = p.landlord.name
        result.append(out)
    return result


@router.get("/ranking", response_model=List[RankingProperty])
def ranking_properties(
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    properties = db.query(Property).filter(Property.status == "ativo").all()
    rankings = []

    for prop in properties:
        q_in = db.query(TransactionIn).filter(TransactionIn.property_id == prop.id)
        q_out = db.query(TransactionOut).filter(TransactionOut.property_id == prop.id)

        if year:
            q_in = q_in.filter(TransactionIn.competencia_year == year)
            q_out = q_out.filter(TransactionOut.competencia_year == year)

        transactions_in = q_in.all()
        transactions_out = q_out.all()

        total_receita = sum(t.amount for t in transactions_in)
        total_despesas = sum(t.total_paid for t in transactions_out)
        resultado = total_receita - total_despesas
        margin = (resultado / total_receita * 100) if total_receita > 0 else 0

        if total_receita == 0:
            classification = "S/Dados"
        elif margin >= 50:
            classification = "A-Estrela"
        elif margin >= 30:
            classification = "B-Bom"
        elif margin >= 10:
            classification = "C-Regular"
        else:
            classification = "D-Atencao"

        rankings.append(RankingProperty(
            id=prop.id, code=prop.code, name=prop.name,
            total_receita=total_receita, total_despesas=total_despesas,
            resultado=resultado, margin_pct=round(margin, 1),
            classification=classification
        ))

    rankings.sort(key=lambda x: x.margin_pct, reverse=True)
    return rankings


@router.get("/{property_id}", response_model=PropertyProfile)
def get_property_profile(
    property_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Propriedade nao encontrada")

    transactions_in = db.query(TransactionIn).filter(TransactionIn.property_id == prop.id).all()
    transactions_out = db.query(TransactionOut).filter(TransactionOut.property_id == prop.id).all()
    clients = db.query(Client).filter(Client.property_id == prop.id).all()

    total_receita = sum(t.amount for t in transactions_in)
    total_expenses = sum(t.total_paid for t in transactions_out)
    resultado = total_receita - total_expenses
    margin = (resultado / total_receita * 100) if total_receita > 0 else 0

    # Expenses by category
    exp_by_cat = {}
    for t in transactions_out:
        cat = t.category or "Outros"
        exp_by_cat[cat] = exp_by_cat.get(cat, 0) + t.total_paid

    # Revenue by month
    rev_by_month = {}
    for t in transactions_in:
        key = f"{t.competencia_year}-{str(t.competencia_month).zfill(2)}" if t.competencia_month else t.date.strftime("%Y-%m")
        if key not in rev_by_month:
            rev_by_month[key] = {"month": key, "receita": 0}
        rev_by_month[key]["receita"] += t.amount

    # Expenses by month
    exp_by_month = {}
    for t in transactions_out:
        key = f"{t.competencia_year}-{str(t.competencia_month).zfill(2)}" if t.competencia_month else t.date.strftime("%Y-%m")
        if key not in exp_by_month:
            exp_by_month[key] = {"month": key, "total": 0}
        exp_by_month[key]["total"] += t.total_paid

    profile = PropertyProfile.model_validate(prop)
    profile.total_receita = total_receita
    profile.total_expenses = total_expenses
    profile.resultado = resultado
    profile.margin_pct = round(margin, 1)
    profile.expenses_by_category = exp_by_cat
    profile.revenue_by_month = sorted(rev_by_month.values(), key=lambda x: x["month"])
    profile.expenses_by_month = sorted(exp_by_month.values(), key=lambda x: x["month"])
    profile.clients = [{"id": c.id, "name": c.name, "status": c.status.value, "check_in": str(c.check_in) if c.check_in else None, "check_out": str(c.check_out) if c.check_out else None, "room_name": c.room.name if c.room else None, "bed_name": c.bed.name if c.bed else None, "monthly_value": c.monthly_value} for c in clients]

    # Contracts
    contracts = db.query(Contract).filter(Contract.property_id == prop.id).order_by(Contract.start_date.desc()).all()
    profile.contracts = [{"id": ct.id, "type": ct.type.value, "client_name": ct.client.name if ct.client else None, "client_id": ct.client_id, "start_date": str(ct.start_date) if ct.start_date else None, "end_date": str(ct.end_date) if ct.end_date else None, "value": ct.value, "status": ct.status.value, "signed": ct.signed} for ct in contracts]

    # Documents
    documents = db.query(Document).filter(Document.property_id == prop.id).order_by(Document.uploaded_at.desc()).all()
    profile.documents = [{"id": d.id, "name": d.name, "type": d.type, "category": d.category, "file_url": d.file_url, "uploaded_at": str(d.uploaded_at) if d.uploaded_at else None} for d in documents]

    # Rooms with beds and occupancy
    rooms = db.query(Room).filter(Room.property_id == prop.id).order_by(Room.name).all()
    rooms_data = []
    for room in rooms:
        beds_data = []
        for bed in room.beds:
            occupant = db.query(Client).filter(Client.bed_id == bed.id, Client.status == "ativo").first()
            beds_data.append({"id": bed.id, "name": bed.name, "monthly_value": bed.monthly_value, "occupied": occupant is not None, "client_name": occupant.name if occupant else None, "client_id": occupant.id if occupant else None})
        room_clients = db.query(Client).filter(Client.room_id == room.id, Client.bed_id == None, Client.status == "ativo").all()
        capacity = max(room.num_beds, len(room.beds))
        occupied = len([b for b in beds_data if b["occupied"]]) + len(room_clients)
        rooms_data.append({"id": room.id, "name": room.name, "room_type": room.room_type.value, "monthly_value": room.monthly_value, "capacity": capacity, "occupied": occupied, "available": capacity - occupied, "beds": beds_data, "room_clients": [{"id": c.id, "name": c.name} for c in room_clients]})
    profile.rooms = rooms_data

    # Remarks
    remarks = db.query(PropertyRemark).filter(PropertyRemark.property_id == prop.id).order_by(PropertyRemark.created_at.desc()).all()
    profile.remarks = [{"id": r.id, "text": r.text, "created_by": r.created_by, "created_at": str(r.created_at) if r.created_at else None} for r in remarks]

    return profile


# ── Property Remarks ──────────────────────────────────
@router.get("/{property_id}/remarks")
def list_property_remarks(property_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(PropertyRemark).filter(PropertyRemark.property_id == property_id).order_by(PropertyRemark.created_at.desc()).all()


@router.post("/{property_id}/remarks")
def create_property_remark(property_id: int, data: RemarkCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    remark = PropertyRemark(property_id=property_id, text=data.text, created_by=current_user.name)
    db.add(remark)
    db.commit()
    db.refresh(remark)
    return remark


@router.delete("/{property_id}/remarks/{remark_id}")
def delete_property_remark(property_id: int, remark_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    r = db.query(PropertyRemark).filter(PropertyRemark.id == remark_id, PropertyRemark.property_id == property_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Observacao nao encontrada")
    db.delete(r)
    db.commit()
    return {"detail": "Observacao removida"}


@router.post("", response_model=PropertyOut)
def create_property(
    data: PropertyCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    from main import _generate_property_code
    prop = Property(**data.model_dump())
    prop.code = _generate_property_code(db)
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop


@router.put("/{property_id}", response_model=PropertyOut)
def update_property(
    property_id: int,
    data: PropertyUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Propriedade nao encontrada")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(prop, key, val)
    db.commit()
    db.refresh(prop)
    return prop


@router.delete("/{property_id}")
def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Propriedade nao encontrada")
    db.delete(prop)
    db.commit()
    return {"detail": "Propriedade removida"}
