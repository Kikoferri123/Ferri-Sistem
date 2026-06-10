"""Client History Timeline - aggregates all events for a client."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Client, Contract, TransactionIn, Document, ClientRemark
from auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/clients", tags=["Client History"])


@router.get("/{client_id}/history")
def get_client_history(
    client_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get timeline of all events for a client."""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente nao encontrado")

    events = []

    # Client creation
    if client.created_at:
        events.append({
            "type": "criacao",
            "icon": "user-plus",
            "color": "blue",
            "title": "Cliente cadastrado",
            "description": f"{client.name} foi adicionado ao sistema",
            "date": client.created_at.isoformat(),
            "timestamp": client.created_at.timestamp()
        })

    # Check-in
    if client.check_in:
        prop_name = client.property.name if client.property else ''
        room_name = client.room.name if client.room else ''
        bed_name = client.bed.name if client.bed else ''
        location = ' - '.join(filter(None, [prop_name, room_name, bed_name]))
        events.append({
            "type": "checkin",
            "icon": "log-in",
            "color": "green",
            "title": "Check-in realizado",
            "description": f"Entrada em {location}" if location else "Check-in",
            "date": datetime.combine(client.check_in, datetime.min.time()).isoformat(),
            "timestamp": datetime.combine(client.check_in, datetime.min.time()).timestamp()
        })

    # Check-out (scheduled)
    if client.check_out:
        events.append({
            "type": "checkout",
            "icon": "log-out",
            "color": "orange",
            "title": "Check-out previsto",
            "description": f"Saida programada",
            "date": datetime.combine(client.check_out, datetime.min.time()).isoformat(),
            "timestamp": datetime.combine(client.check_out, datetime.min.time()).timestamp()
        })

    # Contracts
    contracts = db.query(Contract).filter(Contract.client_id == client_id).all()
    for c in contracts:
        prop_name = c.property.name if c.property else ''
        status_labels = {'vigente': 'Vigente', 'pendente': 'Pendente', 'expirado': 'Expirado', 'cancelado': 'Cancelado'}
        events.append({
            "type": "contrato",
            "icon": "file-signature",
            "color": "purple",
            "title": f"Contrato {status_labels.get(c.status, c.status)}",
            "description": f"{c.type.capitalize()} - {prop_name} - EUR {c.value:,.2f}" + (f" (assinado)" if c.signed else " (pendente assinatura)"),
            "date": c.created_at.isoformat() if c.created_at else None,
            "timestamp": c.created_at.timestamp() if c.created_at else 0,
            "entity_id": c.id,
            "entity_type": "contract"
        })

    # Payments
    payments = db.query(TransactionIn).filter(TransactionIn.client_id == client_id).order_by(TransactionIn.date.desc()).all()
    for p in payments:
        total = p.amount
        comp = f"{p.competencia_month}/{p.competencia_year}" if p.competencia_month else ''
        events.append({
            "type": "pagamento",
            "icon": "dollar-sign",
            "color": "green",
            "title": f"Pagamento recebido - EUR {total:,.2f}",
            "description": f"{p.description or p.method or 'Pagamento'}" + (f" (comp. {comp})" if comp else ''),
            "date": datetime.combine(p.date, datetime.min.time()).isoformat(),
            "timestamp": datetime.combine(p.date, datetime.min.time()).timestamp(),
            "entity_id": p.id,
            "entity_type": "payment"
        })

    # Documents
    docs = db.query(Document).filter(Document.client_id == client_id).all()
    for d in docs:
        events.append({
            "type": "documento",
            "icon": "file",
            "color": "slate",
            "title": f"Documento adicionado",
            "description": f"{d.name} ({d.category or d.type or 'Geral'})",
            "date": d.uploaded_at.isoformat() if d.uploaded_at else None,
            "timestamp": d.uploaded_at.timestamp() if d.uploaded_at else 0,
            "entity_id": d.id,
            "entity_type": "document"
        })

    # Remarks
    remarks = db.query(ClientRemark).filter(ClientRemark.client_id == client_id).all()
    for r in remarks:
        events.append({
            "type": "observacao",
            "icon": "message-circle",
            "color": "yellow",
            "title": "Observacao",
            "description": r.text[:200],
            "date": r.created_at.isoformat() if r.created_at else None,
            "timestamp": r.created_at.timestamp() if r.created_at else 0,
            "created_by": r.created_by
        })

    # Sort by timestamp descending (newest first)
    events.sort(key=lambda e: e.get('timestamp', 0), reverse=True)

    return {
        "client_id": client_id,
        "client_name": client.name,
        "total_events": len(events),
        "events": events
    }
