from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Contract, Client, UserRole, contract_clients
from schemas import ContractCreate, ContractUpdate, ContractOut, ContractClientOut
from auth import get_current_user, require_roles
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/contracts", tags=["Contracts"])


def _enrich_contract(c: Contract) -> ContractOut:
    """Build ContractOut with shared clients info."""
    out = ContractOut.model_validate(c)
    if c.client:
        out.client_name = c.client.name
    if c.property:
        out.property_name = c.property.name
    # Populate shared clients
    shared = c.clients or []
    out.client_ids = [cl.id for cl in shared]
    out.client_names = [cl.name for cl in shared]
    out.clients = [ContractClientOut(id=cl.id, name=cl.name, email=cl.email) for cl in shared]
    # If no shared clients but has primary client, include it
    if not out.client_ids and c.client_id and c.client:
        out.client_ids = [c.client_id]
        out.client_names = [c.client.name]
        out.clients = [ContractClientOut(id=c.client.id, name=c.client.name, email=c.client.email)]
    return out


@router.get("", response_model=List[ContractOut])
def list_contracts(
    status: Optional[str] = None,
    type: Optional[str] = None,
    property_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = db.query(Contract)
    if status:
        q = q.filter(Contract.status == status)
    if type:
        q = q.filter(Contract.type == type)
    if property_id:
        q = q.filter(Contract.property_id == property_id)

    contracts = q.order_by(Contract.end_date.asc()).all()
    return [_enrich_contract(c) for c in contracts]


@router.get("/{contract_id}", response_model=ContractOut)
def get_contract(contract_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    c = db.query(Contract).filter(Contract.id == contract_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contrato nao encontrado")
    return _enrich_contract(c)


@router.post("", response_model=ContractOut)
def create_contract(
    data: ContractCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    payload = data.model_dump(exclude={"client_ids"})
    c = Contract(**payload)

    # If client_ids provided, set the many-to-many + primary client
    client_ids = data.client_ids or []
    if client_ids:
        clients = db.query(Client).filter(Client.id.in_(client_ids)).all()
        if len(clients) != len(client_ids):
            raise HTTPException(status_code=400, detail="Um ou mais clientes nao encontrados")
        c.clients = clients
        # Set primary client_id to the first one if not explicitly set
        if not c.client_id:
            c.client_id = client_ids[0]
    elif data.client_id:
        # Single client (backward compatible) - also add to shared list
        client = db.query(Client).filter(Client.id == data.client_id).first()
        if client:
            c.clients = [client]

    db.add(c)
    db.commit()
    db.refresh(c)
    return _enrich_contract(c)


@router.put("/{contract_id}", response_model=ContractOut)
def update_contract(
    contract_id: int,
    data: ContractUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    c = db.query(Contract).filter(Contract.id == contract_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contrato nao encontrado")

    update_data = data.model_dump(exclude_unset=True, exclude={"client_ids"})
    for key, val in update_data.items():
        setattr(c, key, val)

    # Update shared clients if provided
    if data.client_ids is not None:
        clients = db.query(Client).filter(Client.id.in_(data.client_ids)).all()
        if len(clients) != len(data.client_ids):
            raise HTTPException(status_code=400, detail="Um ou mais clientes nao encontrados")
        c.clients = clients
        # Update primary client_id
        if data.client_ids:
            c.client_id = data.client_ids[0]

    db.commit()
    db.refresh(c)
    return _enrich_contract(c)


class SignatureRequest(BaseModel):
    signature_licensee: Optional[str] = None
    signature_licensor: Optional[str] = None


@router.put("/{contract_id}/signature")
def save_signature(
    contract_id: int,
    data: SignatureRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    c = db.query(Contract).filter(Contract.id == contract_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contrato nao encontrado")
    if data.signature_licensee is not None:
        c.signature_licensee = data.signature_licensee
    if data.signature_licensor is not None:
        c.signature_licensor = data.signature_licensor
    if c.signature_licensee and c.signature_licensor:
        c.signed = True
    db.commit()
    db.refresh(c)
    return {"detail": "Assinatura salva", "signed": c.signed}


class SendEmailRequest(BaseModel):
    to_email: Optional[str] = None
    subject: Optional[str] = None
    message: Optional[str] = None


@router.post("/{contract_id}/send-email")
def send_contract_email(
    contract_id: int,
    data: SendEmailRequest = SendEmailRequest(),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    """Send contract PDF via email to all clients on the contract."""
    from routers.contract_pdf import _generate_contract_pdf
    from services.email_service import send_email, EMAIL_PASSWORD
    import secrets

    c = db.query(Contract).filter(Contract.id == contract_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contrato nao encontrado")

    # Get primary client and property
    client = c.client
    if not client and c.clients:
        client = c.clients[0]
    prop = c.property

    # Collect emails for sending
    client_emails = []
    if c.clients:
        for cl in c.clients:
            if cl.email:
                client_emails.append(cl.email)
    if not client_emails and client and client.email:
        client_emails = [client.email]

    if not client_emails:
        raise HTTPException(status_code=400, detail="Nenhum email de cliente encontrado neste contrato")

    # Generate PDF using the original contract template
    buf = _generate_contract_pdf(c, client, prop, db)
    pdf_bytes = buf.read()

    # Generate sign link if not already present
    sign_link = None
    if not c.sign_token:
        c.sign_token = secrets.token_urlsafe(32)
        db.commit()
    frontend_base = "https://ferri-sistem.vercel.app"
    sign_link = f"{frontend_base}/sign/{c.sign_token}"

    # Override recipient if provided
    if data.to_email:
        client_emails = [data.to_email]

    # Build email
    client_names = []
    if c.clients:
        client_names = [cl.name for cl in c.clients]
    elif client:
        client_names = [client.name]
    prop_name = prop.name if prop else "N/A"
    names_str = " & ".join(client_names)
    type_label = {
        "aluguel": "Aluguel",
        "hospedagem": "Hospedagem",
        "parceria": "Parceria",
    }.get(c.type.value if c.type else "", "Contrato")

    subject = data.subject or f"Ferri Sistem - Licence Agreement - {prop_name}"
    custom_message = data.message or ""

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Ferri Sistem</h1>
            <p style="color: #cccccc; margin: 5px 0 0; font-size: 14px;">Property Management</p>
        </div>
        <div style="padding: 30px 20px;">
            <p>Dear <b>{names_str}</b>,</p>
            {f'<p>{custom_message}</p>' if custom_message else ''}
            <p>Please find attached your Licence Agreement for the property <b>{prop_name}</b>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: #f5f5f5;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><b>Property</b></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">{prop_name}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;"><b>Monthly Rent</b></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">€{c.value or 0:,.2f}</td>
                </tr>
                <tr style="background: #f5f5f5;">
                    <td style="padding: 10px; border: 1px solid #ddd;"><b>Period</b></td>
                    <td style="padding: 10px; border: 1px solid #ddd;">{c.start_date.strftime('%d/%m/%Y') if c.start_date else 'TBC'} - {c.end_date.strftime('%d/%m/%Y') if c.end_date else 'TBC'}</td>
                </tr>
            </table>
            <p>To sign your contract digitally, please click the button below:</p>
            <div style="text-align: center; margin: 25px 0;">
                <a href="{sign_link}" style="background-color: #1a1a1a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Sign Contract Online
                </a>
            </div>
            <p style="font-size: 12px; color: #888;">Or copy this link: {sign_link}</p>
            <p>If you have any questions, please do not hesitate to contact us.</p>
            <p>Best regards,<br><b>Ferri Sistem</b></p>
        </div>
        <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            Ferri Sistem | info@ferrisystem.com
        </div>
    </div>
    """

    # If SMTP not configured, return PDF URL and sign link for manual sending
    if not EMAIL_PASSWORD:
        return {
            "success": False,
            "message": "SMTP nao configurado. Use o PDF e link abaixo para envio manual.",
            "email_sent": False,
            "pdf_url": f"/contracts/{contract_id}/pdf",
            "sign_link": sign_link,
        }

    # Send to each client email
    results = []
    for email_addr in client_emails:
        result = send_email(
            to=email_addr,
            subject=subject,
            html_body=html_body,
            attachment_bytes=pdf_bytes,
            attachment_filename=f"Licence_Agreement_{prop_name.replace(' ', '_')}.pdf",
        )
        results.append({"email": email_addr, **result})

    all_success = all(r["success"] for r in results)

    return {
        "success": all_success,
        "message": f"Contrato enviado para {', '.join(client_emails)}" if all_success else "Erro ao enviar alguns emails",
        "email_sent": all_success,
        "pdf_url": f"/contracts/{contract_id}/pdf",
        "sign_link": sign_link,
        "results": results,
    }


@router.get("/{contract_id}/pdf")
def download_contract_pdf(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Download contract as PDF."""
    from fastapi.responses import StreamingResponse
    from routers.contract_pdf import _generate_contract_pdf

    c = db.query(Contract).filter(Contract.id == contract_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contrato nao encontrado")

    # Get primary client and property
    client = c.client
    if not client and c.clients:
        client = c.clients[0]
    prop = c.property

    # Generate PDF using the original contract template
    buf = _generate_contract_pdf(c, client, prop, db)
    client_name = client.name.replace(' ', '_') if client else 'contrato'
    filename = f"Licence_Agreement_{client_name}.pdf"

    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.delete("/{contract_id}")
def delete_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    c = db.query(Contract).filter(Contract.id == contract_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contrato nao encontrado")
    db.delete(c)
    db.commit()
    return {"detail": "Contrato removido"}
