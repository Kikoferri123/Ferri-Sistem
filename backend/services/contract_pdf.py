"""
Generate a contract PDF using ReportLab.
"""

import io
from datetime import date
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image
)


PRIMARY_COLOR = HexColor("#1B5E20")
GREY = HexColor("#666666")


def generate_contract_pdf(
    contract_id: int,
    contract_type: str,
    client_names: list[str],
    client_emails: list[str],
    property_name: str,
    property_address: str,
    room_name: str | None,
    bed_name: str | None,
    start_date: date | None,
    end_date: date | None,
    value: float,
    status: str,
    signed: bool,
    notes: str | None = None,
) -> bytes:
    """Generate a professional contract PDF and return bytes."""

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        leftMargin=2.5 * cm,
        rightMargin=2.5 * cm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    styles.add(ParagraphStyle(
        "Title2",
        parent=styles["Title"],
        fontSize=22,
        textColor=PRIMARY_COLOR,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        "Subtitle2",
        parent=styles["Normal"],
        fontSize=11,
        textColor=GREY,
        alignment=TA_CENTER,
        spaceAfter=20,
    ))
    styles.add(ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontSize=13,
        textColor=PRIMARY_COLOR,
        spaceBefore=16,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        "BodyJustify",
        parent=styles["Normal"],
        fontSize=10,
        alignment=TA_JUSTIFY,
        leading=14,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        "SmallGrey",
        parent=styles["Normal"],
        fontSize=8,
        textColor=GREY,
        alignment=TA_CENTER,
    ))

    elements = []

    # ── Header ──
    elements.append(Paragraph("FERRI SISTEM", styles["Title2"]))
    elements.append(Paragraph("Property Management", styles["Subtitle2"]))
    elements.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_COLOR))
    elements.append(Spacer(1, 16))

    # ── Contract Title ──
    type_label = {
        "aluguel": "Contrato de Aluguel",
        "hospedagem": "Contrato de Hospedagem",
        "parceria": "Contrato de Parceria",
    }.get(contract_type, f"Contrato - {contract_type}")

    elements.append(Paragraph(type_label, styles["Heading1"]))
    elements.append(Paragraph(f"Contrato #{contract_id}", styles["SmallGrey"]))
    elements.append(Spacer(1, 12))

    # ── Parties ──
    elements.append(Paragraph("1. Partes", styles["SectionHeader"]))
    elements.append(Paragraph(
        f"<b>Licenciante (Licensor):</b> Ferri Sistem Ltd.",
        styles["BodyJustify"],
    ))
    for i, (name, email) in enumerate(zip(client_names, client_emails)):
        label = "Licenciado (Licensee)" if i == 0 else f"Licenciado {i + 1}"
        elements.append(Paragraph(
            f"<b>{label}:</b> {name} ({email})",
            styles["BodyJustify"],
        ))
    elements.append(Spacer(1, 8))

    # ── Property Details ──
    elements.append(Paragraph("2. Propriedade", styles["SectionHeader"]))

    detail_data = [
        ["Propriedade:", property_name],
        ["Endereço:", property_address or "N/A"],
    ]
    if room_name:
        detail_data.append(["Quarto:", room_name])
    if bed_name:
        detail_data.append(["Cama:", bed_name])

    detail_table = Table(detail_data, colWidths=[4 * cm, 12 * cm])
    detail_table.setStyle(TableStyle([
        ("FONT", (0, 0), (0, -1), "Helvetica-Bold", 10),
        ("FONT", (1, 0), (1, -1), "Helvetica", 10),
        ("TEXTCOLOR", (0, 0), (0, -1), GREY),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(detail_table)
    elements.append(Spacer(1, 8))

    # ── Terms ──
    elements.append(Paragraph("3. Termos", styles["SectionHeader"]))

    def fmt_date(d):
        if not d:
            return "A definir"
        return d.strftime("%d/%m/%Y")

    terms_data = [
        ["Data de Início:", fmt_date(start_date)],
        ["Data de Fim:", fmt_date(end_date)],
        ["Valor Mensal:", f"€{value:,.2f}"],
        ["Status:", status.capitalize()],
    ]
    terms_table = Table(terms_data, colWidths=[4 * cm, 12 * cm])
    terms_table.setStyle(TableStyle([
        ("FONT", (0, 0), (0, -1), "Helvetica-Bold", 10),
        ("FONT", (1, 0), (1, -1), "Helvetica", 10),
        ("TEXTCOLOR", (0, 0), (0, -1), GREY),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(terms_table)
    elements.append(Spacer(1, 8))

    # ── Conditions ──
    elements.append(Paragraph("4. Condições Gerais", styles["SectionHeader"]))
    conditions = [
        "O pagamento deve ser realizado até o dia 5 de cada mês via transferência bancária.",
        "O período mínimo de estadia é conforme estipulado nas datas acima.",
        "O licenciado é responsável pela manutenção e limpeza do espaço designado.",
        "Ferri Sistem reserva-se o direito de rescindir o contrato em caso de incumprimento das regras da casa.",
        "Qualquer dano causado ao imóvel ou mobiliário será de responsabilidade do licenciado.",
        "É proibido subarrendar ou ceder o espaço a terceiros sem autorização prévia.",
    ]
    for i, cond in enumerate(conditions, 1):
        elements.append(Paragraph(
            f"<b>{i}.</b> {cond}",
            styles["BodyJustify"],
        ))
    elements.append(Spacer(1, 8))

    # ── Notes ──
    if notes:
        elements.append(Paragraph("5. Observações", styles["SectionHeader"]))
        elements.append(Paragraph(notes, styles["BodyJustify"]))
        elements.append(Spacer(1, 8))

    # ── Signatures ──
    elements.append(Spacer(1, 20))
    elements.append(HRFlowable(width="100%", thickness=1, color=GREY))
    elements.append(Spacer(1, 16))

    sig_data = [
        ["Ferri Sistem Ltd.", client_names[0] if client_names else "Licenciado"],
        ["(Licensor)", "(Licensee)"],
        ["", ""],
        ["_________________________", "_________________________"],
        ["Assinatura", "Assinatura"],
    ]
    if signed:
        sig_data[2] = ["✓ Assinado digitalmente", "✓ Assinado digitalmente"]

    sig_table = Table(sig_data, colWidths=[8 * cm, 8 * cm])
    sig_table.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, -1), "Helvetica", 10),
        ("FONT", (0, 0), (1, 0), "Helvetica-Bold", 11),
        ("TEXTCOLOR", (0, 1), (-1, 1), GREY),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(sig_table)

    # ── Footer ──
    elements.append(Spacer(1, 30))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=GREY))
    elements.append(Paragraph(
        "Ferri Sistem Ltd. | info@ferrisystem.com | ferrisystem.com",
        styles["SmallGrey"],
    ))
    elements.append(Paragraph(
        f"Documento gerado automaticamente em {date.today().strftime('%d/%m/%Y')}",
        styles["SmallGrey"],
    ))

    doc.build(elements)
    return buf.getvalue()
