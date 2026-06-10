from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import TransactionIn, TransactionOut, Property, Client, User, UserRole
from auth import get_current_user
from typing import Optional
from datetime import date
import io

router = APIRouter(prefix="/reports", tags=["Reports"])


def _check_financial(user):
    if user.role not in (UserRole.ADMIN, UserRole.FINANCEIRO):
        raise HTTPException(status_code=403, detail="Acesso restrito")


@router.get("/financial-pdf")
def financial_report_pdf(
    year: int = 2026,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_financial(current_user)
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Ferri Sistem - Relatorio Financeiro", styles['Title']))
    period = f"Ano: {year}" + (f" | Mes: {month}" if month else " | Anual")
    elements.append(Paragraph(period, styles['Normal']))
    elements.append(Spacer(1, 20))

    q_in = db.query(TransactionIn).filter(TransactionIn.competencia_year == year)
    q_out = db.query(TransactionOut).filter(TransactionOut.competencia_year == year)
    if month:
        q_in = q_in.filter(TransactionIn.competencia_month == month)
        q_out = q_out.filter(TransactionOut.competencia_month == month)

    all_in = q_in.all()
    all_out = q_out.all()

    receita = sum(t.amount for t in all_in)
    deposits = 0
    total_opex = 0
    pro_labore = 0
    capex = 0
    cat_totals = {}
    for t in all_out:
        cat = (t.category or "Outros").strip()
        cat_lower = cat.lower()
        if "pro-labore" in cat_lower or "pro labore" in cat_lower:
            pro_labore += t.total_paid
        elif "capex" in cat_lower:
            capex += t.total_paid
        else:
            total_opex += t.total_paid
            cat_totals[cat] = cat_totals.get(cat, 0) + t.total_paid

    ebitda = receita - total_opex
    fcf = ebitda - pro_labore - capex

    # Summary table
    summary_data = [
        ["Indicador", "Valor (EUR)"],
        ["Receita Bruta", f"{receita:,.2f}"],
        ["Depositos", f"{deposits:,.2f}"],
        ["Total OPEX", f"{total_opex:,.2f}"],
        ["EBITDA", f"{ebitda:,.2f}"],
        ["Pro-Labore", f"{pro_labore:,.2f}"],
        ["CAPEX", f"{capex:,.2f}"],
        ["Free Cash Flow", f"{fcf:,.2f}"],
        ["Margem EBITDA", f"{(ebitda/receita*100):.1f}%" if receita > 0 else "0%"],
    ]
    t = Table(summary_data, colWidths=[250, 200])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a5f')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f4f8')]),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))

    # OPEX by category
    if cat_totals:
        elements.append(Paragraph("Despesas por Categoria", styles['Heading2']))
        cat_data = [["Categoria", "Valor (EUR)"]]
        for cat, val in sorted(cat_totals.items(), key=lambda x: -x[1]):
            cat_data.append([cat, f"{val:,.2f}"])
        t2 = Table(cat_data, colWidths=[250, 200])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d5a87')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(t2)

    # Revenue by property
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("Receita por Propriedade", styles['Heading2']))
    props = db.query(Property).filter(Property.status == "ativo").all()
    prop_data = [["Propriedade", "Receita", "Despesas", "Resultado"]]
    for p in props:
        p_in = sum(t.amount for t in all_in if t.property_id == p.id)
        p_out = sum(t.total_paid for t in all_out if t.property_id == p.id)
        prop_data.append([p.name, f"{p_in:,.2f}", f"{p_out:,.2f}", f"{p_in - p_out:,.2f}"])
    t3 = Table(prop_data, colWidths=[150, 100, 100, 100])
    t3.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d5a87')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(t3)

    doc.build(elements)
    buf.seek(0)
    filename = f"relatorio_financeiro_{year}{'_' + str(month) if month else ''}.pdf"
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})


@router.get("/occupancy-pdf")
def occupancy_report_pdf(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Ferri Sistem - Relatorio de Ocupacao", styles['Title']))
    elements.append(Paragraph(f"Data: {date.today().strftime('%d/%m/%Y')}", styles['Normal']))
    elements.append(Spacer(1, 20))

    props = db.query(Property).filter(Property.status == "ativo").all()
    from models import Room, Bed
    data = [["Propriedade", "Quartos", "Camas", "Ocupadas", "Taxa"]]
    for p in props:
        rooms = db.query(Room).filter(Room.property_id == p.id).all()
        total_beds = sum(db.query(Bed).filter(Bed.room_id == r.id).count() for r in rooms)
        occupied = db.query(Client).filter(Client.property_id == p.id, Client.status == "ativo").count()
        rate = f"{occupied/total_beds*100:.0f}%" if total_beds > 0 else "N/A"
        data.append([p.name, str(len(rooms)), str(total_beds), str(occupied), rate])

    t = Table(data, colWidths=[150, 70, 70, 70, 70])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a5f')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(t)

    # Client list
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("Clientes Ativos", styles['Heading2']))
    clients = db.query(Client).filter(Client.status == "ativo").all()
    cl_data = [["Nome", "Propriedade", "Check-in", "Check-out", "Valor/Mes"]]
    for c in clients:
        prop = db.query(Property).filter(Property.id == c.property_id).first()
        cl_data.append([
            c.name, prop.name if prop else "-",
            c.check_in.strftime('%d/%m/%Y') if c.check_in else "-",
            c.check_out.strftime('%d/%m/%Y') if c.check_out else "-",
            f"{c.monthly_value:,.2f}"
        ])
    t2 = Table(cl_data, colWidths=[120, 100, 80, 80, 80])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d5a87')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
    ]))
    elements.append(t2)

    doc.build(elements)
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=relatorio_ocupacao.pdf"})


@router.get("/excel")
def export_excel(
    year: int = 2026,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_financial(current_user)
    import csv
    buf = io.StringIO()
    writer = csv.writer(buf)

    # Entradas
    writer.writerow(["=== ENTRADAS ==="])
    writer.writerow(["Data", "Descricao", "Metodo", "Amount", "Categoria", "Propriedade", "Cliente"])
    entries = db.query(TransactionIn).filter(TransactionIn.competencia_year == year).all()
    for t in entries:
        prop = db.query(Property).filter(Property.id == t.property_id).first()
        client = db.query(Client).filter(Client.id == t.client_id).first()
        writer.writerow([
            t.date.strftime('%d/%m/%Y') if t.date else "", t.description or "", t.method or "",
            t.amount, t.category or "",
            prop.name if prop else "", client.name if client else ""
        ])

    writer.writerow([])
    writer.writerow(["=== SAIDAS ==="])
    writer.writerow(["Data", "Descricao", "Metodo", "Total", "Categoria", "Propriedade"])
    exits = db.query(TransactionOut).filter(TransactionOut.competencia_year == year).all()
    for t in exits:
        prop = db.query(Property).filter(Property.id == t.property_id).first()
        writer.writerow([
            t.date.strftime('%d/%m/%Y') if t.date else "", t.description or "", t.method or "",
            t.total_paid, t.category or "", prop.name if prop else ""
        ])

    content = buf.getvalue()
    return StreamingResponse(
        io.BytesIO(content.encode('utf-8-sig')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=ferri_sistem_{year}.csv"}
    )


@router.get("/delinquency-pdf")
def delinquency_report_pdf(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _check_financial(current_user)
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Ferri Sistem - Relatorio de Inadimplencia", styles['Title']))
    elements.append(Paragraph(f"Data: {date.today().strftime('%d/%m/%Y')}", styles['Normal']))
    elements.append(Spacer(1, 20))

    # Get delinquency data
    active_clients = db.query(Client).filter(Client.status == "ativo").all()
    today = date.today()
    delinquents = []

    for cl in active_clients:
        if not cl.monthly_value or cl.monthly_value <= 0:
            continue
        if not cl.check_in:
            continue

        total_expected = 0
        total_received = 0
        y, m = cl.check_in.year, cl.check_in.month
        while (y, m) <= (today.year, today.month):
            if cl.check_out and (y, m) > (cl.check_out.year, cl.check_out.month):
                break
            total_expected += cl.monthly_value
            payments = db.query(TransactionIn).filter(
                TransactionIn.client_id == cl.id,
                TransactionIn.competencia_month == m,
                TransactionIn.competencia_year == y
            ).all()
            total_received += sum(t.amount for t in payments)
            m += 1
            if m > 12:
                m = 1
                y += 1

        debt = total_expected - total_received
        if debt > 0:
            prop_name = cl.property.name if cl.property else "N/A"
            delinquents.append((cl.name, prop_name, cl.monthly_value, debt))

    delinquents.sort(key=lambda x: -x[3])

    data = [["Cliente", "Propriedade", "Valor/Mes", "Divida Total"]]
    for name, prop, monthly, debt in delinquents:
        data.append([name, prop, f"{monthly:,.2f}", f"{debt:,.2f}"])

    data.append(["", "", "TOTAL", f"{sum(d[3] for d in delinquents):,.2f}"])

    t = Table(data, colWidths=[140, 120, 90, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#8b0000')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#fff0f0')]),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#ffeeee')),
    ]))
    elements.append(t)

    doc.build(elements)
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=relatorio_inadimplencia.pdf"})
