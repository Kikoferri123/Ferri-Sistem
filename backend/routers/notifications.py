from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Client, Contract, ContractStatus, User, UserRole
from auth import get_current_user
from datetime import date, timedelta
import os, smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def _send_email(to_email: str, subject: str, body: str) -> bool:
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")
    if not smtp_user or not smtp_pass:
        return False
    try:
        msg = MIMEMultipart()
        msg["From"] = smtp_user
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        return True
    except Exception:
        return False


@router.post("/send-reminders")
def send_reminders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    results = {"checkout_reminders": 0, "contract_expiring": 0, "payment_overdue": 0, "errors": []}

    # Check-out in 3 days
    soon = today + timedelta(days=3)
    checkouts = db.query(Client).filter(Client.status == "ativo", Client.check_out == soon).all()
    for c in checkouts:
        if c.email:
            sent = _send_email(c.email, "Ferri Sistem - Lembrete de Check-out",
                f"<h2>Ola {c.name},</h2><p>Seu check-out esta marcado para <b>{c.check_out.strftime('%d/%m/%Y')}</b>.</p><p>Por favor, entre em contato conosco caso precise de mais informacoes.</p><p>Equipe Ferri Sistem</p>")
            if sent:
                results["checkout_reminders"] += 1

    # Contracts expiring in 7 days
    exp_date = today + timedelta(days=7)
    contracts = db.query(Contract).filter(Contract.status == ContractStatus.VIGENTE, Contract.end_date <= exp_date, Contract.end_date >= today).all()
    for ct in contracts:
        client = ct.client
        if client and client.email:
            sent = _send_email(client.email, "Ferri Sistem - Contrato Expirando",
                f"<h2>Ola {client.name},</h2><p>Seu contrato expira em <b>{ct.end_date.strftime('%d/%m/%Y')}</b>.</p><p>Entre em contato para renovacao.</p><p>Equipe Ferri Sistem</p>")
            if sent:
                results["contract_expiring"] += 1

    # Payment overdue
    from models import TransactionIn
    if today.day >= 10:
        active_clients = db.query(Client).filter(Client.status == "ativo", Client.monthly_value > 0).all()
        for c in active_clients:
            paid = sum(t.amount for t in db.query(TransactionIn).filter(
                TransactionIn.client_id == c.id,
                TransactionIn.competencia_month == today.month,
                TransactionIn.competencia_year == today.year
            ).all())
            if paid < c.monthly_value and c.email:
                sent = _send_email(c.email, "Ferri Sistem - Lembrete de Pagamento",
                    f"<h2>Ola {c.name},</h2><p>Identificamos que seu pagamento de <b>{today.strftime('%m/%Y')}</b> ainda nao foi registrado.</p><p>Valor esperado: EUR {c.monthly_value:,.2f}</p><p>Valor recebido: EUR {paid:,.2f}</p><p>Equipe Ferri Sistem</p>")
                if sent:
                    results["payment_overdue"] += 1

    smtp_configured = bool(os.getenv("SMTP_USER"))
    results["smtp_configured"] = smtp_configured
    if not smtp_configured:
        results["message"] = "SMTP nao configurado. Configure SMTP_USER e SMTP_PASS para enviar emails."
    else:
        results["message"] = f"Enviados: {results['checkout_reminders']} check-out, {results['contract_expiring']} contrato, {results['payment_overdue']} pagamento"
    return results
