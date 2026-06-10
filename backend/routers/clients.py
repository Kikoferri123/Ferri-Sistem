from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Client, Property, Contract, Document, TransactionIn, TransactionOut, UserRole, ClientRemark
from schemas import ClientCreate, ClientUpdate, ClientOut, RemarkCreate, RemarkOut
from auth import get_current_user, require_roles
from typing import List, Optional
from collections import defaultdict

router = APIRouter(prefix="/clients", tags=["Clients"])

MONTH_NAMES = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
               "Jul", "Ago", "Set", "Out", "Nov", "Dez"]


@router.get("", response_model=List[ClientOut])
def list_clients(
    status: Optional[str] = None,
    property_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = db.query(Client)
    if status:
        q = q.filter(Client.status == status)
    if property_id:
        q = q.filter(Client.property_id == property_id)
    if search:
        from sqlalchemy import or_
        q = q.filter(or_(
            Client.name.ilike(f"%{search}%"),
            Client.code.ilike(f"%{search}%"),
            Client.referencia.ilike(f"%{search}%"),
            Client.email.ilike(f"%{search}%"),
            Client.phone.ilike(f"%{search}%"),
        ))
    clients = q.order_by(Client.name).all()

    result = []
    for c in clients:
        out = ClientOut.model_validate(c)
        if c.property:
            out.property_name = c.property.name
        if c.room:
            out.room_name = c.room.name
        if c.bed:
            out.bed_name = c.bed.name
        result.append(out)
    return result


@router.get("/{client_id}/profile")
def get_client_profile(
    client_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente nao encontrado")

    # Basic client data
    profile = {
        "id": client.id,
        "code": client.code,
        "name": client.name,
        "email": client.email,
        "phone": client.phone,
        "nationality": client.nationality,
        "birth_date": str(client.birth_date) if client.birth_date else None,
        "document_id": client.document_id,
        "status": client.status.value if client.status else "ativo",
        "property_id": client.property_id,
        "property_name": client.property.name if client.property else None,
        "room_id": client.room_id,
        "room_name": client.room.name if client.room else None,
        "bed_id": client.bed_id,
        "bed_name": client.bed.name if client.bed else None,
        "check_in": str(client.check_in) if client.check_in else None,
        "check_out": str(client.check_out) if client.check_out else None,
        "monthly_value": client.monthly_value or 0,
        "payment_method": client.payment_method,
        "referencia": client.referencia,
        "notes": client.notes,
        "created_at": client.created_at.isoformat() if client.created_at else None,
    }

    # Contracts
    contracts = db.query(Contract).filter(Contract.client_id == client_id).all()
    contracts_list = []
    for ct in contracts:
        contracts_list.append({
            "id": ct.id,
            "type": ct.type.value if ct.type else None,
            "property_id": ct.property_id,
            "property_name": ct.property.name if ct.property else None,
            "start_date": str(ct.start_date) if ct.start_date else None,
            "end_date": str(ct.end_date) if ct.end_date else None,
            "value": ct.value,
            "status": ct.status.value if ct.status else None,
            "signed": ct.signed,
            "notes": ct.notes,
        })
    profile["contracts"] = contracts_list

    # Documents
    documents = db.query(Document).filter(Document.client_id == client_id).all()
    docs_list = []
    for d in documents:
        docs_list.append({
            "id": d.id,
            "name": d.name,
            "type": d.type,
            "category": d.category,
            "file_url": d.file_url,
            "file_size": d.file_size,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
        })
    profile["documents"] = docs_list

    # Remarks
    remarks = db.query(ClientRemark).filter(
        ClientRemark.client_id == client_id
    ).order_by(ClientRemark.created_at.desc()).all()
    remarks_list = []
    for r in remarks:
        remarks_list.append({
            "id": r.id,
            "text": r.text,
            "created_by": r.created_by,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    profile["remarks"] = remarks_list

    # Financial data - ONLY payments linked to this client
    total_revenue = 0
    monthly_data = defaultdict(lambda: {
        "revenue": 0,
        "total_revenue": 0
    })

    # Get transactions linked directly to this client
    txns_in = db.query(TransactionIn).filter(
        TransactionIn.client_id == client_id
    ).all()

    payments_list = []
    for t in txns_in:
        rev = t.amount or 0
        total_revenue += rev

        m = t.competencia_month or t.date.month
        y = t.competencia_year or t.date.year
        key = (y, m)
        monthly_data[key]["revenue"] += t.amount or 0
        monthly_data[key]["total_revenue"] += rev

        payments_list.append({
            "id": t.id,
            "date": str(t.date),
            "description": t.description,
            "method": t.method,
            "amount": t.amount or 0,
            "total": rev,
            "category": t.category,
            "competencia_month": m,
            "competencia_year": y,
            "invoice": t.invoice,
        })

    profile["payments"] = payments_list

    # Build monthly summary
    financial_by_month = []
    for (y, m) in sorted(monthly_data.keys()):
        d = monthly_data[(y, m)]
        label = f"{MONTH_NAMES[m]}/{y}" if 1 <= m <= 12 else f"{m}/{y}"
        financial_by_month.append({
            "month": m, "year": y, "label": label, **d
        })

    # Expected vs received
    expected_total = 0
    if client.monthly_value and client.check_in and client.check_out:
        from dateutil.relativedelta import relativedelta
        months_diff = (client.check_out.year - client.check_in.year) * 12 + (client.check_out.month - client.check_in.month)
        if months_diff < 1:
            months_diff = 1
        expected_total = client.monthly_value * months_diff

    profile["total_received"] = round(total_revenue, 2)
    profile["total_expected"] = round(expected_total, 2)
    profile["balance"] = round(total_revenue - expected_total, 2)
    profile["financial_by_month"] = financial_by_month

    return profile


# Remarks endpoints
@router.get("/{client_id}/remarks", response_model=List[RemarkOut])
def list_remarks(
    client_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return db.query(ClientRemark).filter(
        ClientRemark.client_id == client_id
    ).order_by(ClientRemark.created_at.desc()).all()


@router.post("/{client_id}/remarks", response_model=RemarkOut)
def create_remark(
    client_id: int,
    data: RemarkCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente nao encontrado")

    remark = ClientRemark(
        client_id=client_id,
        text=data.text,
        created_by=current_user.name
    )
    db.add(remark)
    db.commit()
    db.refresh(remark)
    return remark


@router.delete("/{client_id}/remarks/{remark_id}")
def delete_remark(
    client_id: int,
    remark_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    remark = db.query(ClientRemark).filter(
        ClientRemark.id == remark_id,
        ClientRemark.client_id == client_id
    ).first()
    if not remark:
        raise HTTPException(status_code=404, detail="Observacao nao encontrada")
    db.delete(remark)
    db.commit()
    return {"detail": "Observacao removida"}


# Send contract by email
@router.post("/{client_id}/send-contract")
def send_contract_email(
    client_id: int,
    contract_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente nao encontrado")
    if not client.email:
        raise HTTPException(status_code=400, detail="Cliente nao tem email cadastrado")

    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.client_id == client_id
    ).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato nao encontrado para este cliente")

    # For now, mark contract as sent and return mailto link
    # In production, integrate with SMTP service
    prop_name = contract.property.name if contract.property else "N/A"
    subject = f"Contrato Ferri Sistem - {prop_name}"
    body = f"""Ola {client.name},

Segue o contrato para assinatura referente a propriedade {prop_name}.

Tipo: {contract.type.value if contract.type else 'N/A'}
Periodo: {contract.start_date} a {contract.end_date}
Valor: EUR {contract.value}

Por favor, revise e assine o contrato.

Atenciosamente,
Ferri Sistem Property Management
"""

    import urllib.parse
    mailto_link = f"mailto:{client.email}?subject={urllib.parse.quote(subject)}&body={urllib.parse.quote(body)}"

    return {
        "detail": "Link de email gerado",
        "mailto_link": mailto_link,
        "to": client.email,
        "subject": subject,
    }


@router.get("/{client_id}", response_model=ClientOut)
def get_client(client_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente nao encontrado")
    out = ClientOut.model_validate(client)
    if client.property:
        out.property_name = client.property.name
    return out


def _enrich_client(c, out):
    if c.property:
        out.property_name = c.property.name
    if c.room:
        out.room_name = c.room.name
    if c.bed:
        out.bed_name = c.bed.name
    return out


@router.post("", response_model=ClientOut)
def create_client(
    data: ClientCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    from main import _generate_client_code
    client = Client(**data.model_dump())
    client.code = _generate_client_code(db)
    db.add(client)
    db.commit()
    db.refresh(client)
    return _enrich_client(client, ClientOut.model_validate(client))


@router.put("/{client_id}", response_model=ClientOut)
def update_client(
    client_id: int,
    data: ClientUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente nao encontrado")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(client, key, val)
    db.commit()
    db.refresh(client)
    return _enrich_client(client, ClientOut.model_validate(client))


@router.delete("/{client_id}")
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente nao encontrado")
    db.delete(client)
    db.commit()
    return {"detail": "Cliente removido"}
