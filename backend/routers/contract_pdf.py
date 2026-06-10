from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Contract, Client, Property, User
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional
import io, os, smtplib, uuid, base64 as b64, httpx
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

router = APIRouter(prefix="/contracts", tags=["Contract PDF"])
public_router = APIRouter(prefix="/public/contract", tags=["Public Contract Signing"])


class EmailRequest(BaseModel):
    to_email: str
    subject: Optional[str] = "Ferri Sistem - Licence Agreement"
    message: Optional[str] = None


def _generate_contract_pdf(contract, client, prop, db) -> io.BytesIO:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm, cm
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak, Image
    from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
    import base64

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm, leftMargin=2.5*cm, rightMargin=2.5*cm)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle('ContractTitle', parent=styles['Title'], fontSize=16, fontName='Helvetica-Bold', spaceAfter=6)
    heading_style = ParagraphStyle('ContractHeading', parent=styles['Heading2'], fontSize=10, spaceBefore=12, spaceAfter=6)
    body_style = ParagraphStyle('ContractBody', parent=styles['Normal'], fontSize=9, leading=13, alignment=TA_JUSTIFY, spaceAfter=6)
    bold_style = ParagraphStyle('ContractBold', parent=body_style, fontName='Helvetica-Bold')
    bold_italic_style = ParagraphStyle('ContractBoldItalic', parent=body_style, fontName='Helvetica-BoldOblique', fontSize=9, leading=13, alignment=TA_JUSTIFY)
    small_style = ParagraphStyle('ContractSmall', parent=body_style, fontSize=9, leading=12, leftIndent=20)
    center_style = ParagraphStyle('ContractCenter', parent=body_style, alignment=TA_CENTER)
    center_bold_style = ParagraphStyle('ContractCenterBold', parent=center_style, fontName='Helvetica-Bold')

    elements = []

    # Format dates
    def fmt_date(d):
        return d.strftime('%d/%m/%Y') if d else 'XX/XX/XXXX'

    # Get client data
    client_name = client.name if client else ''
    client_email = client.email or ''
    client_phone = client.phone or ''
    client_doc = client.document_id or ''
    client_dob = ''
    if client and hasattr(client, 'date_of_birth') and client.date_of_birth:
        client_dob = fmt_date(client.date_of_birth)
    client_address = ''
    if client and hasattr(client, 'address') and client.address:
        client_address = client.address

    prop_name = prop.name if prop else 'N/A'
    prop_address = prop.address if prop else ''
    start_date = fmt_date(contract.start_date)
    end_date = fmt_date(contract.end_date)
    value = f"{contract.value:,.2f}" if contract.value else 'XXXX'
    deposit_value = f"{contract.value:,.2f}" if contract.value else 'XXXX'

    # Tenant reference
    tenant_ref = client.code if client and hasattr(client, 'code') and client.code else f"DA-{client.id:04d}" if client else "XXXXX"

    # Get second licensee from shared clients
    client2 = None
    if contract.clients and len(contract.clients) > 1:
        for cl in contract.clients:
            if cl.id != (client.id if client else None):
                client2 = cl
                break

    # === PAGE 1 - Header & Parties ===
    elements.append(Paragraph("<b>Ferri Sistem</b>", title_style))
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("This Agreement is made between <b>Ferri Sistem</b>, mentioned as the Licensor, and (below) as the Licensees or he/his, together referred to as the Parties.", body_style))
    elements.append(Spacer(1, 16))

    # Licensor info
    elements.append(Paragraph("<b>Licensor: Ferri Sistem</b>", bold_style))
    elements.append(Paragraph("<b>Email: info@ferrisystem.com</b>", bold_style))
    elements.append(Spacer(1, 16))

    # Licensee info
    elements.append(Paragraph(f"<b>Licensee:</b> {client_name}", bold_style))
    elements.append(Paragraph(f"<b>Passport:</b> {client_doc}", body_style))
    elements.append(Paragraph(f"<b>Address:</b> {client_address or prop_address or prop_name}", body_style))
    elements.append(Paragraph(f"<b>Email:</b> {client_email}", body_style))
    elements.append(Paragraph(f"<b>Phone number:</b> {client_phone}", body_style))

    # === PAGE 2+ - Terms ===
    elements.append(PageBreak())

    elements.append(Paragraph("The Parties agree that the Licensee/s shall use a portion of the premises managed by the Licensor, on the following terms:", body_style))
    elements.append(Spacer(1, 8))

    # Clause 1
    elements.append(Paragraph("<b>1. Licensee to Occupy.</b>", heading_style))
    elements.append(Paragraph(f"The Licensor permits the Licensee to occupy the house and to use the Furniture and Furnishings under the property rules. This licence commences on: <b>{start_date}</b> and terminates on <b>{end_date}</b>.", body_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(f"The Licensee must provide <b>a minimum of 1 month written notice</b> via email to <b>info@ferrisystem.com</b> in case of termination or extension of this agreement.", body_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("<b>This notice is mandatory even if the Licensee intends to leave on the contract end date.</b>", bold_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("If the Licensee decides to leave before the end date, they remain responsible for the rent until the contract expiry date, unless a suitable replacement is found.", body_style))

    # Clause 2
    elements.append(Paragraph("<b>2. Licensee fee.</b>", heading_style))
    elements.append(Paragraph(f"The total amount to be paid monthly is <b>\u20ac{value}</b> payable <b>between the 28th and 30th of each month</b>.", body_style))
    elements.append(Spacer(1, 4))

    bank_data = [
        ["Account Name:", "Ferri Sistem"],
        ["IBAN:", "IE 44AIB K9363 83812 00067"],
        ["Tenant reference number:", tenant_ref],
        ["", "Please send us a copy of the bank transfer\nas soon as it is done"],
    ]
    bt = Table(bank_data, colWidths=[140, 310])
    bt.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(bt)
    elements.append(Spacer(1, 6))

    elements.append(Paragraph("<b><i>For both online and in-person payments at the bank or our office, PLEASE use your personal tenant reference number in order to identify the payment of your rent. In the absence of your reference, you may receive unwanted charges/fees from us and warnings.</i></b>", bold_italic_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("A fixed penalty of <b>\u20ac50</b> will be applied if payment is not made within <b>3 working days after the stipulated payment date</b>.", body_style))
    elements.append(Paragraph("If payment is not received after <b>7 days</b>, the Licensor reserves the right to repossess the room and remove belongings unless otherwise agreed.", body_style))
    elements.append(Paragraph("Licensor has the right to share the common areas (i.e. living room, kitchen, bathrooms) equally with the other licensees.", body_style))

    # Clause 3
    elements.append(Paragraph("<b>3. Deposit.</b>", heading_style))
    elements.append(Paragraph(f"Licensee must pay <b>\u20ac{deposit_value}</b> to Ferri Sistem as a security deposit for any liabilities that may occur during his/her stay, including the house inspection for any breakage or misconduct of the house rules. If the booking is cancelled this will not be returned under any circumstances.", body_style))
    elements.append(Paragraph("During the term mentioned in point one, this deposit will become a security deposit against any liabilities that may occur during the length of this agreement. Deductions permitted by Irish law are made from the security deposit and the remaining amount, if any, shall be returned to the Licensee within a week after the termination of the agreement, by bank transfer, unless agreed differently in written form among the parties.", body_style))
    elements.append(Paragraph("Unclaimed deposits will not be returned after 90 days. No interest will be payable to the Licensee in respect of the deposit monies.", body_style))

    # Clause 4
    elements.append(Paragraph("<b>4. End of agreement.</b>", heading_style))
    elements.append(Paragraph("The right to occupy the premises will terminate on the date specified in Clause 1, unless otherwise agreed in writing by both the Licensor and the Licensee in advance. The Licensee must provide a minimum of 1 month written notice to <b>info@ferrisystem.com</b> in case of termination or extension of this agreement. This notice is mandatory in all circumstances, including when the Licensee intends to leave on the exact contract end date. If the Licensee leaves before the end date specified in Clause 1, all <b>rent paid is non-refundable, and the Licensee remains responsible for the rent until the end of the agreed term unless otherwise agreed in writing</b>. If the full amount due under Clause 2 has not been paid, early termination may result in a penalty charge equivalent to the amount of the security deposit, in addition to any further action deemed necessary.", body_style))

    # Clause 5
    elements.append(Paragraph("<b>5. Nature of this agreement.</b>", heading_style))
    elements.append(Paragraph("This Agreement is not intended to confer exclusive possession on the Licensee or to create the relationship of landlord and tenant between the parties. The Licensee shall not be entitled to a tenancy, or to be an assured shorthold or assured tenancy, or to any statutory protection under the Housing Act 1988 or to any other statutory security of tenure now or when this Licence ends.", body_style))
    elements.append(Paragraph("This Agreement is personal to the Licensee and is not assignable to any other person. The Licence will immediately terminate without notice upon the Licensee not living at the property and on one-week arrears of the licence fee arising.", body_style))

    # Clause 6
    elements.append(Paragraph("<b>6. Access and Use of Facilities.</b>", heading_style))
    elements.append(Paragraph("For so long as the Licensee occupies the Room under this Licence, they shall have the right to use the front door, entrance hall, staircase and landings of the House, and to use the kitchen for cooking, eating and storage of food, as well as the bathroom and toilet facilities in common with the Licensor and/or other Licensees.", body_style))
    elements.append(Paragraph("<b>6.1</b> The Licensee shall use the House as a private residence only and will not run any business from the property.", small_style))
    elements.append(Paragraph("<b>6.2</b> The Licensee will not let, share, or permit any other person to occupy the Room or any part of the House without prior written consent from the Licensor.", small_style))
    elements.append(Paragraph("<b>6.3</b> The Licensee will not have exclusive possession of the Room. The Licensor may access the Room <b>only at a time previously agreed with the Licensee</b>, except in emergency situations.", small_style))
    elements.append(Paragraph('<b>6.4</b> The Licensee will comply with any "House Rules" either attached to this Licence Agreement or displayed in the House.', small_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("<b>6.5 Pets</b>", small_style))
    elements.append(Paragraph("Pets are not allowed in the property under any circumstances.", small_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("<b>6.6 Keys</b>", small_style))
    elements.append(Paragraph("The Licensor will issue keys to the Licensee. If the Licensee loses or damages a key, they will be responsible for the full cost of replacement, including any associated costs such as lock replacement if required. The Licensor will retain a set of keys and may access the Room in accordance with this agreement, only with the prior authorization of the Licensee and at a date and time previously agreed, except in emergency situations.", small_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("<b>6.7 Furniture and Furnishings</b>", small_style))
    elements.append(Paragraph("The Licensee must keep all furniture and furnishings, and any items listed in the inventory, in good condition and must not remove them from the Room. The Licensee must repair or replace any damaged items with items of similar kind and value, as reasonably requested by the Licensor. The Licensor will insure the House and the items listed in the inventory (if any). The Licensee is responsible for insuring their own personal belongings.", small_style))

    # Clause 7
    elements.append(Paragraph("<b>7. Cleaning.</b>", heading_style))
    elements.append(Paragraph("It is the responsibility of all <b>Tenants</b> to contribute to daily household chores in order to maintain, at all times, an acceptable standard of cleanliness and order", body_style))

    # Clause 8
    elements.append(Paragraph("<b>8. Overnight Guests.</b>", heading_style))
    elements.append(Paragraph("Overnight guests are not allowed. Any breach of this rule will result in a <b>first written warning</b>, followed by a <b>1-month termination notice if the behaviour persists</b>.", body_style))

    # Clause 9
    elements.append(Paragraph("<b>9. Utility Bills.</b>", heading_style))
    elements.append(Paragraph("The Licensee shall be responsible for paying for all gas, electricity and telephone costs consumed or supplied in the Room during the Licensee's occupation as recorded by the separate meter in the Room if a separate meter is not fitted and/or for an equal proportion of the gas, electricity, telephone consumed and televisual costs consumed or supplied in the shared parts of the House used by the Licensee during the Licensee's occupation of the Room to be assessed by the Licensor accordingly to estimated use or on some other reasonable basis from accounts to be produced to the Licensee on request.", body_style))

    # Clause 10
    elements.append(Paragraph("<b>10. Noise Level.</b>", heading_style))
    elements.append(Paragraph("The tenants must maintain a noise level that will not affect the quality of life of any neighbours. In the interest of common quietness, any noise should be strictly avoided from 10:00 pm to 8.00 am. <b>No house parties are allowed.</b>", body_style))

    # Clause 11
    elements.append(Paragraph("<b>11. Smoking.</b>", heading_style))
    elements.append(Paragraph("Smoking is strictly not allowed inside the premises. Outdoor smoking areas are available. Any breach of this clause will result in a first written warning, followed by a 1-month termination notice if the behaviour persists. The possession and use of illicit drugs is strictly forbidden and will be treated as a serious breach of this Agreement (see Clause 21).", body_style))

    # Clause 12
    elements.append(Paragraph("<b>12. Code of Conduct.</b>", heading_style))
    elements.append(Paragraph("The Licensee must use their best endeavours to share use of the Room and property amicably and peacefully with the Licensor and other Licensees. The Licensee must not do or omit to do anything in the Room or House which may cause or is likely to cause nuisance, annoyance, or disturbance to the Licensor, other occupants, or neighbouring properties, or which may affect the insurance of the House or increase the insurance premium. The Licensee will be liable for the conduct of and any damage caused by their guests or visitors. <b>Any anti-social behaviour reported by any tenant will result in a first written warning, followed by a 1-month termination notice if the behaviour persists.</b> Anti-social behaviour includes violence, intimidation, coercion, harassment, obstruction, threats, or any behaviour that interferes with the peaceful occupation of the property or surrounding area.", body_style))

    # Clause 13
    elements.append(Paragraph("<b>13. Condition of the Premises.</b>", heading_style))
    elements.append(Paragraph("The Licensee acknowledges that he/she has examined the premises and that they are in good condition. Upon termination of this Agreement for any reason, the Licensee agrees to leave the premises in the same good condition. The Licensee is responsible for repairing or paying for any damage caused to the property as a result of negligence, accident, or misuse. <b>If the room is not left clean and in good condition at the end of the agreement, a cleaning fee of \u20ac100 will be charged and may be deducted from the security deposit.</b>", body_style))

    # Clause 14
    elements.append(Paragraph("<b>14. Early termination.</b>", heading_style))
    elements.append(Paragraph("The Licence may be ended:", body_style))
    elements.append(Paragraph("<b>14.1</b> By the Licensor without notice in the event of non-payment of the licence fee or if the Licensee is in breach of any of the terms of this Agreement;", small_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("<b>14.2</b> By either party giving not less than <b>1 month written notice</b>, sent to <b>info@ferrisystem.com</b>.", small_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("<b>This notice period is mandatory in all circumstances, including when the Licensee intends to leave on the exact contract expiry date.</b>", bold_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("Should the Licensee terminate the agreement before the fixed term expiry, they will lose their deposit, unless the Licensee secures a suitable replacement to take over the remaining term of the agreement (subject to the Licensor's prior consent).", body_style))

    # Clause 15
    elements.append(Paragraph("<b>15. Subletting and Assignment.</b>", heading_style))
    elements.append(Paragraph("Licensee may not lease, sublease, or assign the premises with/to other people. Tenants are not allowed to change bedrooms assigned or replace your place without first seeking approval from Ferri Sistem.", body_style))

    # Clause 16
    elements.append(Paragraph("<b>16. Rubbish.</b>", heading_style))
    elements.append(Paragraph("The Licensee must ensure that all rubbish is disposed of properly and placed in the designated bins, in accordance with local waste and recycling regulations.", body_style))

    # Clause 17
    elements.append(Paragraph("<b>17. Property Maintenance.</b>", heading_style))
    elements.append(Paragraph("Our representatives may access the property for inspection or to carry out essential repair or maintenance work, including inside the room, only at a time previously agreed with the tenants, except in emergency situations. The Licensee has an obligation to report immediately any damage, loss, or broken items requiring maintenance by submitting a request through the maintenance platform:", body_style))

    # Property Maintenance box
    elements.append(Spacer(1, 8))
    maint_data = [
        [Paragraph("<b>PROPERTY MAINTENANCE</b>", center_bold_style)],
        [Paragraph("Maintenance requests will only be accepted through the following link:", center_style)],
        [Paragraph("<a href='https://ferrisystem.com/maintenance' color='blue'>ferrisystem.com/maintenance</a>", center_style)],
        [Paragraph("<b>Emergency \u2013 Evening after 5 pm/Weekends/Holidays</b>", center_bold_style)],
        [Paragraph("<a href='mailto:info@ferrisystem.com' color='blue'>info@ferrisystem.com</a>", center_style)],
        [Paragraph("Please quote your tenant reference number and address in all\ncontact made to us. This will assist our team to ensure and review your\nquery in a timely manner.", center_style)],
    ]
    mt = Table(maint_data, colWidths=[450])
    mt.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.black),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(mt)
    elements.append(Spacer(1, 12))

    # Customer Service Contact
    elements.append(Paragraph("<b>CUSTOMER SERVICE \u2013 CONTACT</b>", center_bold_style))
    elements.append(Paragraph("Business hours: Monday to Friday, 9:00 AM \u2013 5:00 PM (excluding public holidays)", center_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("<b>+353 85 266 2455</b>", center_bold_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("<a href='mailto:info@ferrisystem.com' color='blue'>info@ferrisystem.com</a>", center_style))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph("Please contact us by writing if you want to: extend the period of this contract, change the licensee(s), and give 1 month leave notification.", center_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph("<b>Requests made by mobile message, WhatsApp, or any social media, won\u2019t be accepted.</b>", center_bold_style))
    elements.append(Spacer(1, 8))

    # Clause 18
    elements.append(Paragraph("<b>18. Contact information.</b> It is the responsibility of the tenants to provide their updated contact phone number and email, in cases of emergencies.", body_style))

    # Clause 19
    elements.append(Paragraph("<b>19. Personal Safety and Belongings.</b> Ferri Sistem cannot be held liable for any personal injury inside premises, loss or damage to personal effects whatsoever that may happen at the accommodation. To cover any risks, we strongly recommend subscribing to an insurance company.", body_style))

    # Clause 20
    elements.append(Paragraph("<b>20. Breach of Agreement.</b>", heading_style))
    elements.append(Paragraph("If the Licensee fails to comply with any term or condition of this Agreement, the Licensor reserves the right to take appropriate action. In the event of a breach, the Licensee will receive a <b>first written warning</b> outlining the issue. If the breach is not resolved or is repeated, the Licensor may issue a <b>1-month termination notice</b>, after which the Licensee will be required to vacate the property. In cases of <b>serious breach</b>, including but not limited to <b>non-payment of rent</b>, illegal activity or significant damage to the property, the Licensor reserves the right to <b>terminate the agreement immediately without notice</b>. Any costs resulting from a breach of this Agreement may be deducted from the <b>security deposit</b> or charged separately.", body_style))

    # Clause 21
    elements.append(Paragraph("<b>21. Binding Agreement.</b> This agreement will not be enforceable until signed by both Parties. Any modification to this Agreement must be in writing, including an email agreed from both parties.", body_style))

    # === SIGNATURE PAGE ===
    elements.append(Spacer(1, 16))
    elements.append(Paragraph("We, the Parties, agree to the above-stated terms.", body_style))
    elements.append(Spacer(1, 16))

    elements.append(Paragraph("<b>Licensor: Ferri Sistem</b>", bold_style))
    elements.append(Spacer(1, 6))
    # Licensor signature
    _licensor_sig_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "signature_licensor.png")
    if os.path.exists(_licensor_sig_path):
        try:
            sig_img = Image(_licensor_sig_path, width=180, height=75)
            elements.append(Paragraph("Signature:", body_style))
            elements.append(sig_img)
        except Exception:
            elements.append(Paragraph("Signature: ___________________________________", body_style))
    elif contract.signature_licensor:
        try:
            sig_data = contract.signature_licensor
            if sig_data.startswith('data:'):
                sig_data = sig_data.split(',', 1)[1]
            sig_bytes = base64.b64decode(sig_data)
            sig_buf = io.BytesIO(sig_bytes)
            sig_img = Image(sig_buf, width=180, height=60)
            elements.append(Paragraph("Signature:", body_style))
            elements.append(sig_img)
        except Exception:
            elements.append(Paragraph("Signature: ___________________________________", body_style))
    else:
        elements.append(Paragraph("Signature: ___________________________________", body_style))
    elements.append(Spacer(1, 20))

    # Licensee 1 signature
    elements.append(Paragraph(f"<b>Licensee 1:</b> {client_name}", bold_style))
    elements.append(Paragraph(f"<b>Passport:</b> {client_doc}", body_style))
    elements.append(Spacer(1, 6))
    if contract.signature_licensee:
        try:
            sig_data = contract.signature_licensee
            if sig_data.startswith('data:'):
                sig_data = sig_data.split(',', 1)[1]
            sig_bytes = base64.b64decode(sig_data)
            sig_buf = io.BytesIO(sig_bytes)
            sig_img = Image(sig_buf, width=180, height=60)
            elements.append(Paragraph("Signature:", body_style))
            elements.append(sig_img)
        except Exception:
            elements.append(Paragraph("Signature: ___________________________________", body_style))
    else:
        elements.append(Paragraph("Signature: ___________________________________", body_style))
    elements.append(Paragraph("Date: _______________________________________", body_style))
    elements.append(Spacer(1, 16))

    # Licensee 2 signature
    elements.append(Paragraph("<b>Licensee 2:</b>", bold_style))
    elements.append(Paragraph("<b>Passport:</b>", body_style))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph("Signature: ___________________________________", body_style))
    elements.append(Paragraph("Date: _______________________________________", body_style))

    # Page numbering
    def add_page_number(canvas_obj, doc_obj):
        canvas_obj.saveState()
        canvas_obj.setFont('Helvetica', 8)
        canvas_obj.setFillColor(colors.HexColor('#666666'))
        canvas_obj.drawCentredString(A4[0]/2, 1.5*cm, f"Page {doc_obj.page} - Ferri Sistem Licence Agreement")
        canvas_obj.restoreState()

    doc.build(elements, onFirstPage=add_page_number, onLaterPages=add_page_number)
    buf.seek(0)
    return buf


@router.get("/{contract_id}/pdf")
def download_contract_pdf(contract_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato nao encontrado")
    client = db.query(Client).filter(Client.id == contract.client_id).first()
    prop = db.query(Property).filter(Property.id == contract.property_id).first()
    buf = _generate_contract_pdf(contract, client, prop, db)
    client_name = client.name.replace(' ', '_') if client else 'contrato'
    filename = f"Licence_Agreement_{client_name}.pdf"
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})


@router.post("/{contract_id}/generate-sign-link")
def generate_sign_link(contract_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Gera um token unico para link de assinatura publica."""
    try:
        contract = db.query(Contract).filter(Contract.id == contract_id).first()
        if not contract:
            raise HTTPException(status_code=404, detail="Contrato nao encontrado")
        if not contract.sign_token:
            contract.sign_token = uuid.uuid4().hex
            db.commit()
            db.refresh(contract)
        return {"sign_token": contract.sign_token}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao gerar link: {str(e)}")


@router.post("/{contract_id}/send-email")
def send_contract_email(contract_id: int, data: EmailRequest, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato nao encontrado")
    client = db.query(Client).filter(Client.id == contract.client_id).first()
    prop = db.query(Property).filter(Property.id == contract.property_id).first()

    # Gerar sign_token se nao existir
    if not contract.sign_token:
        contract.sign_token = uuid.uuid4().hex
        db.commit()
        db.refresh(contract)

    # Construir link de assinatura
    frontend_url = os.getenv("FRONTEND_URL", "")
    if not frontend_url:
        # Tentar inferir do request
        origin = request.headers.get("origin", "")
        if origin:
            frontend_url = origin
        else:
            frontend_url = "http://localhost:5173"
    sign_link = f"{frontend_url}/sign/{contract.sign_token}"

    buf = _generate_contract_pdf(contract, client, prop, db)
    pdf_bytes = buf.read()

    from services.email_service import send_email, EMAIL_PASSWORD

    if not EMAIL_PASSWORD:
        return {
            "success": False,
            "message": f"Email nao configurado. Link de assinatura: {sign_link}",
            "sign_link": sign_link,
            "sign_token": contract.sign_token
        }

    try:
        client_name = client.name.replace(' ', '_') if client else 'contrato'

        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1e3a5f; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Ferri Sistem</h1>
                <p style="color: #aec6e8; margin: 5px 0 0;">Property Management</p>
            </div>
            <div style="padding: 30px 20px;">
                <p>Dear <b>{client.name if client else 'Client'}</b>,</p>
                <p>Please find attached your Licence Agreement with Ferri Sistem.</p>
                <p>To sign your contract digitally, please click the button below:</p>
                <div style="text-align: center; margin: 25px 0;">
                    <a href="{sign_link}" style="background-color: #1e3a5f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Sign Contract Online
                    </a>
                </div>
                <p style="font-size: 12px; color: #888;">Or copy this link: {sign_link}</p>
                <p>Best regards,<br><b>Ferri Sistem</b></p>
            </div>
        </div>
        """

        result = send_email(
            to=data.to_email,
            subject=data.subject or "Ferri Sistem - Licence Agreement",
            html_body=html_body,
            attachment_bytes=pdf_bytes,
            attachment_filename=f"Licence_Agreement_{client_name}.pdf",
        )

        if result["success"]:
            return {"success": True, "message": f"Email enviado para {data.to_email}", "sign_link": sign_link}
        else:
            return {"success": False, "message": f"Erro ao enviar: {result.get('error', 'Unknown')}", "sign_link": sign_link}
    except Exception as e:
        return {"success": False, "message": f"Erro ao enviar: {str(e)}", "sign_link": sign_link}


# === PUBLIC ENDPOINTS (sem auth) - para cliente assinar ===

class PublicSignatureRequest(BaseModel):
    signature: str  # base64 PNG


@public_router.get("/{token}")
def get_contract_for_signing(token: str, db: Session = Depends(get_db)):
    """Endpoint publico: retorna dados do contrato para o cliente assinar."""
    contract = db.query(Contract).filter(Contract.sign_token == token).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato nao encontrado ou link invalido")
    client = db.query(Client).filter(Client.id == contract.client_id).first()
    prop = db.query(Property).filter(Property.id == contract.property_id).first()
    return {
        "id": contract.id,
        "client_name": client.name if client else "N/A",
        "client_email": client.email if client else "",
        "property_name": prop.name if prop else "N/A",
        "property_address": prop.address if prop else "",
        "start_date": str(contract.start_date) if contract.start_date else None,
        "end_date": str(contract.end_date) if contract.end_date else None,
        "value": contract.value,
        "signed": contract.signed,
        "has_licensee_signature": bool(contract.signature_licensee),
        "has_licensor_signature": bool(contract.signature_licensor),
    }


@public_router.put("/{token}")
def sign_contract_public(token: str, data: PublicSignatureRequest, db: Session = Depends(get_db)):
    """Endpoint publico: cliente envia sua assinatura."""
    contract = db.query(Contract).filter(Contract.sign_token == token).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato nao encontrado ou link invalido")
    # Allow re-signing (clear old signature if present)
    contract.signature_licensee = data.signature
    contract.signed = True
    db.commit()

    # Send notification email to Ferri Sistem
    try:
        from services.email_service import send_email, EMAIL_PASSWORD
        if EMAIL_PASSWORD:
            client = db.query(Client).filter(Client.id == contract.client_id).first()
            prop = db.query(Property).filter(Property.id == contract.property_id).first()
            client_name = client.name if client else "N/A"
            client_email = client.email if client else "N/A"
            prop_name = prop.name if prop else "N/A"
            start_date = contract.start_date.strftime('%d/%m/%Y') if contract.start_date else 'N/A'
            end_date = contract.end_date.strftime('%d/%m/%Y') if contract.end_date else 'N/A'
            value = f"€{contract.value:,.2f}" if contract.value else 'N/A'

            notification_html = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Contract Signed!</h1>
                    <p style="color: #cccccc; margin: 5px 0 0;">Ferri Sistem - Notification</p>
                </div>
                <div style="padding: 30px 20px;">
                    <p>A contract has just been <b>signed by the client</b>.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr style="background: #f5f5f5;">
                            <td style="padding: 10px; border: 1px solid #ddd;"><b>Client</b></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">{client_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;"><b>Email</b></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">{client_email}</td>
                        </tr>
                        <tr style="background: #f5f5f5;">
                            <td style="padding: 10px; border: 1px solid #ddd;"><b>Property</b></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">{prop_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;"><b>Period</b></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">{start_date} - {end_date}</td>
                        </tr>
                        <tr style="background: #f5f5f5;">
                            <td style="padding: 10px; border: 1px solid #ddd;"><b>Monthly Rent</b></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">{value}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #ddd;"><b>Contract ID</b></td>
                            <td style="padding: 10px; border: 1px solid #ddd;">#{contract.id}</td>
                        </tr>
                    </table>
                    <p style="color: #1a1a1a; font-weight: bold;">Please review the signed contract in the system.</p>
                </div>
                <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #888;">
                    Ferri Sistem - Automated Notification
                </div>
            </div>
            """

            send_email(
                to="info@ferrisystem.com",
                subject=f"Contract Signed - {client_name} - {prop_name}",
                html_body=notification_html,
            )
    except Exception as e:
        print(f"[EMAIL] Failed to send signature notification: {e}")

    return {"detail": "Assinatura registrada com sucesso!", "signed": contract.signed}


@public_router.get("/{token}/pdf")
def download_contract_public(token: str, db: Session = Depends(get_db)):
    """Endpoint publico: cliente pode baixar o PDF do contrato."""
    contract = db.query(Contract).filter(Contract.sign_token == token).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato nao encontrado")
    client = db.query(Client).filter(Client.id == contract.client_id).first()
    prop = db.query(Property).filter(Property.id == contract.property_id).first()
    buf = _generate_contract_pdf(contract, client, prop, db)
    client_name = client.name.replace(' ', '_') if client else 'contrato'
    filename = f"Licence_Agreement_{client_name}.pdf"
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})
