from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Alert, Contract, Client, Property, TransactionIn, AlertType, AlertSeverity, UserRole
from schemas import AlertOut
from auth import get_current_user
from typing import List, Optional
from datetime import date, timedelta

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=List[AlertOut])
def list_alerts(
    unread_only: bool = False,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = db.query(Alert)
    if unread_only:
        q = q.filter(Alert.read == False)
    if severity:
        q = q.filter(Alert.severity == severity)
    return q.order_by(Alert.created_at.desc()).all()


@router.put("/{alert_id}/read")
def mark_alert_read(alert_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta nao encontrado")
    alert.read = True
    db.commit()
    return {"detail": "Alerta marcado como lido"}


@router.put("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    db.query(Alert).filter(Alert.read == False).update({"read": True})
    db.commit()
    return {"detail": "Todos os alertas marcados como lidos"}


@router.post("/generate")
def generate_alerts(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Generate alerts based on current data state."""
    today = date.today()
    new_alerts = []

    # 1. Contratos vencendo em 30, 15, 7 dias
    for days in [30, 15, 7]:
        target = today + timedelta(days=days)
        contracts = db.query(Contract).filter(
            Contract.status == "vigente",
            Contract.end_date == target
        ).all()
        for c in contracts:
            prop_name = c.property.name if c.property else "N/A"
            client_name = c.client.name if c.client else "N/A"
            new_alerts.append(Alert(
                type=AlertType.CONTRATO_VENCENDO,
                severity=AlertSeverity.WARNING if days > 7 else AlertSeverity.CRITICAL,
                message=f"Contrato de {client_name} ({prop_name}) vence em {days} dias ({target})",
                entity_type="contract", entity_id=c.id
            ))

    # 2. Check-out proximo (30, 15, 7 dias)
    checkout_clients = db.query(Client).filter(
        Client.status == "ativo",
        Client.check_out != None,
        Client.check_out >= today,
        Client.check_out <= today + timedelta(days=30)
    ).all()
    for cl in checkout_clients:
        days_left = (cl.check_out - today).days
        if days_left <= 7:
            sev = AlertSeverity.CRITICAL
        elif days_left <= 15:
            sev = AlertSeverity.WARNING
        else:
            sev = AlertSeverity.INFO
        prop_name = cl.property.name if cl.property else "N/A"
        new_alerts.append(Alert(
            type=AlertType.CHECKOUT_PROXIMO,
            severity=sev,
            message=f"Check-out de {cl.name} em {days_left} dias ({cl.check_out}) - {prop_name}",
            entity_type="client", entity_id=cl.id
        ))

    # 3. Propriedades vazias (sem cliente ativo)
    properties = db.query(Property).filter(Property.status == "ativo").all()
    for prop in properties:
        active_count = db.query(Client).filter(
            Client.property_id == prop.id,
            Client.status == "ativo"
        ).count()
        if active_count == 0:
            new_alerts.append(Alert(
                type=AlertType.PROPRIEDADE_VAZIA,
                severity=AlertSeverity.INFO,
                message=f"Propriedade {prop.name} sem cliente ativo",
                entity_type="property", entity_id=prop.id
            ))

    # 4. Clientes sem contrato vigente
    active_clients = db.query(Client).filter(Client.status == "ativo").all()
    for cl in active_clients:
        has_contract = db.query(Contract).filter(
            Contract.client_id == cl.id,
            Contract.status == "vigente"
        ).count()
        if not has_contract:
            new_alerts.append(Alert(
                type=AlertType.DOCUMENTO_PENDENTE,
                severity=AlertSeverity.WARNING,
                message=f"Cliente {cl.name} sem contrato vigente",
                entity_type="client", entity_id=cl.id
            ))

    # 5. ALUGUEL FIXO PENDENTE - contratos de aluguel das propriedades a vencer
    for prop in properties:
        if prop.contract_end and prop.contract_end >= today:
            days_left = (prop.contract_end - today).days
            if days_left <= 30:
                sev = AlertSeverity.CRITICAL if days_left <= 7 else AlertSeverity.WARNING
                new_alerts.append(Alert(
                    type=AlertType.ALUGUEL_FIXO_PENDENTE,
                    severity=sev,
                    message=f"Contrato de aluguel de {prop.name} vence em {days_left} dias ({prop.contract_end}) - {prop.owner_name or 'Proprietario'}",
                    entity_type="property", entity_id=prop.id
                ))

    # 6. PAGAMENTO ATRASADO - clientes ativos sem pagamento no mes corrente
    current_month = today.month
    current_year = today.year
    if today.day > 10:
        for cl in active_clients:
            if not cl.monthly_value or cl.monthly_value <= 0:
                continue
            if cl.check_in:
                if (current_year, current_month) < (cl.check_in.year, cl.check_in.month):
                    continue

            payments = db.query(TransactionIn).filter(
                TransactionIn.client_id == cl.id,
                TransactionIn.competencia_month == current_month,
                TransactionIn.competencia_year == current_year
            ).all()
            received = sum(t.amount for t in payments)

            if received < cl.monthly_value:
                missing = cl.monthly_value - received
                prop_name = cl.property.name if cl.property else "N/A"
                if received == 0:
                    msg = f"Pagamento de {cl.name} ({prop_name}) nao recebido este mes - EUR {cl.monthly_value:.2f} pendente"
                else:
                    msg = f"Pagamento parcial de {cl.name} ({prop_name}) - faltam EUR {missing:.2f}"
                new_alerts.append(Alert(
                    type=AlertType.PAGAMENTO_ATRASADO,
                    severity=AlertSeverity.CRITICAL if today.day > 20 else AlertSeverity.WARNING,
                    message=msg,
                    entity_type="client", entity_id=cl.id
                ))

    # Clear old unread alerts and add new ones
    db.query(Alert).filter(Alert.read == False).delete()
    for a in new_alerts:
        db.add(a)
    db.commit()

    return {"detail": f"{len(new_alerts)} alertas gerados"}
