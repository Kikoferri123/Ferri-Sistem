from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import TransactionIn, TransactionOut, Property, Client, User, UserRole
from schemas import DashboardKPIs, PnLRow, DepositSummary, DepositSummaryRow
from auth import get_current_user
from typing import List, Optional
from collections import defaultdict

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _check_financial_access(user: User):
    if user.role not in (UserRole.ADMIN, UserRole.FINANCEIRO):
        raise HTTPException(status_code=403, detail="Acesso restrito a dados financeiros")


@router.get("/kpis", response_model=DashboardKPIs)
def get_kpis(year: Optional[int] = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _check_financial_access(current_user)
    from sqlalchemy import func

    # Categories for classification
    CAPEX_CATEGORIES = ("House - Deposit", "Furniture", "Household Appliances")
    PROLABORE_CATEGORIES = ("Partners - Commission", "Third Parties - Commission")
    EXCLUDED_CATEGORIES = ("Revenue",)

    # Revenue IN: single aggregation query (use competencia_year for consistency with IN page)
    q_in = db.query(func.coalesce(func.sum(TransactionIn.amount), 0))
    if year:
        q_in = q_in.filter(TransactionIn.competencia_year == year)
    receita_bruta = float(q_in.scalar())

    # Expenses OUT: single query with conditional aggregation (use competencia_year)
    q_out_base = db.query(TransactionOut.category, func.sum(TransactionOut.total_paid))
    if year:
        q_out_base = q_out_base.filter(TransactionOut.competencia_year == year)
    cat_totals = q_out_base.group_by(TransactionOut.category).all()

    total_opex = 0
    pro_labore = 0
    capex = 0
    for cat_name, cat_total in cat_totals:
        cat_lower = (cat_name or "").lower().strip()
        amount = float(cat_total or 0)
        if cat_lower in {c.lower() for c in CAPEX_CATEGORIES}:
            capex += amount
        elif cat_lower in {c.lower() for c in EXCLUDED_CATEGORIES}:
            pass
        else:
            total_opex += amount
            if cat_lower in {c.lower() for c in PROLABORE_CATEGORIES}:
                pro_labore += amount

    ebitda = receita_bruta - total_opex
    resultado = ebitda - pro_labore
    free_cash_flow = resultado - capex
    margem_ebitda = (ebitda / receita_bruta * 100) if receita_bruta > 0 else 0
    margem_fcf = (free_cash_flow / receita_bruta * 100) if receita_bruta > 0 else 0
    total_properties = db.query(func.count(Property.id)).filter(Property.status == "ativo").scalar()
    total_clients = db.query(func.count(Client.id)).filter(Client.status == "ativo").scalar()
    aluguel_fixo = db.query(func.coalesce(func.sum(Property.monthly_rent), 0)).filter(Property.status == "ativo").scalar()
    return DashboardKPIs(
        receita_bruta=round(receita_bruta, 2), total_opex=round(total_opex, 2),
        ebitda=round(ebitda, 2), pro_labore=round(pro_labore, 2), resultado=round(resultado, 2),
        capex=round(capex, 2), free_cash_flow=round(free_cash_flow, 2),
        margem_ebitda_pct=round(margem_ebitda, 1), margem_fcf_pct=round(margem_fcf, 1),
        total_properties=total_properties, total_clients=total_clients, aluguel_fixo_total=round(float(aluguel_fixo), 2)
    )


@router.get("/kpis-ops")
def get_kpis_ops(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Operational KPIs for OPS users."""
    from datetime import date, timedelta
    from models import Contract, ContractStatus
    today = date.today()

    # Auto-expire contracts whose end_date has passed
    expired = db.query(Contract).filter(
        Contract.status == ContractStatus.VIGENTE,
        Contract.end_date != None,
        Contract.end_date < today
    ).all()
    for c in expired:
        c.status = ContractStatus.EXPIRADO
    if expired:
        db.commit()

    total_properties = db.query(Property).filter(Property.status == "ativo").count()
    total_clients = db.query(Client).filter(Client.status == "ativo").count()
    checkouts_soon = db.query(Client).filter(
        Client.status == "ativo",
        Client.check_out != None,
        Client.check_out <= today + timedelta(days=7),
        Client.check_out >= today
    ).count()
    contracts_active = db.query(Contract).filter(Contract.status == ContractStatus.VIGENTE).count()
    contracts_pending = db.query(Contract).filter(Contract.status == ContractStatus.PENDENTE).count()
    from models import MaintenanceRequest, MaintenanceStatus  # noqa: E402
    maint_open = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.status.in_([MaintenanceStatus.ABERTO, MaintenanceStatus.EM_ANDAMENTO])
    ).count()
    from models import Alert
    alerts_unread = db.query(Alert).filter(Alert.read == False).count()
    # Occupancy
    from models import Room, Bed
    total_beds = db.query(Bed).count()
    occupied_beds = db.query(Client).filter(Client.status == "ativo", Client.bed_id != None).count()
    occupancy_rate = round(occupied_beds / total_beds * 100, 1) if total_beds > 0 else 0
    return {
        "total_properties": total_properties,
        "total_clients": total_clients,
        "checkouts_soon": checkouts_soon,
        "contracts_active": contracts_active,
        "contracts_pending": contracts_pending,
        "maintenance_open": maint_open,
        "alerts_unread": alerts_unread,
        "total_beds": total_beds,
        "occupied_beds": occupied_beds,
        "occupancy_rate": occupancy_rate
    }


@router.get("/occupancy-trend")
def get_occupancy_trend(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Monthly occupancy data for charts."""
    from datetime import date, timedelta
    from models import Bed
    total_beds = db.query(Bed).count() or 1
    data = []
    today = date.today()
    for i in range(11, -1, -1):
        d = today.replace(day=1) - timedelta(days=i * 30)
        month_start = d.replace(day=1)
        occupied = db.query(Client).filter(
            Client.status.in_(["ativo", "encerrado"]),
            Client.check_in <= month_start,
            (Client.check_out == None) | (Client.check_out >= month_start)
        ).count()
        month_names = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
        data.append({
            "label": f"{month_names[month_start.month]}/{month_start.year}",
            "occupied": occupied,
            "total": total_beds,
            "rate": round(occupied / total_beds * 100, 1)
        })
    return data


def func_sum(col):
    from sqlalchemy import func
    return func.coalesce(func.sum(col), 0)


@router.get("/pnl/caixa", response_model=List[PnLRow])
def get_pnl_caixa(year: Optional[int] = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _check_financial_access(current_user)
    return _build_pnl(db, year, by_competencia=False)

@router.get("/pnl/competencia", response_model=List[PnLRow])
def get_pnl_competencia(year: Optional[int] = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    _check_financial_access(current_user)
    return _build_pnl(db, year, by_competencia=True)


def _build_pnl(db: Session, year: Optional[int], by_competencia: bool) -> List[PnLRow]:
    from sqlalchemy import func, extract as sa_extract

    # Categories classification
    CAPEX_CATS = {"house - deposit", "furniture", "household appliances"}
    PROLABORE_CATS = {"partners - commission", "third parties - commission"}
    EXCLUDED_CATS = {"revenue"}

    # Choose grouping columns based on competencia vs caixa
    if by_competencia:
        in_year_col = TransactionIn.competencia_year
        in_month_col = TransactionIn.competencia_month
        out_year_col = TransactionOut.competencia_year
        out_month_col = TransactionOut.competencia_month
    else:
        in_year_col = sa_extract('year', TransactionIn.date)
        in_month_col = sa_extract('month', TransactionIn.date)
        out_year_col = sa_extract('year', TransactionOut.date)
        out_month_col = sa_extract('month', TransactionOut.date)

    # Revenue IN: aggregated by month — single query
    q_in = db.query(
        in_year_col.label("yr"),
        in_month_col.label("mo"),
        func.coalesce(func.sum(TransactionIn.amount), 0)
    )
    if year:
        if by_competencia:
            q_in = q_in.filter(TransactionIn.competencia_year == year)
        else:
            q_in = q_in.filter(sa_extract('year', TransactionIn.date) == year)
    rev_rows = q_in.group_by("yr", "mo").all()

    # Expenses OUT: aggregated by month + category — single query
    q_out = db.query(
        out_year_col.label("yr"),
        out_month_col.label("mo"),
        TransactionOut.category,
        func.coalesce(func.sum(TransactionOut.total_paid), 0)
    )
    if year:
        if by_competencia:
            q_out = q_out.filter(TransactionOut.competencia_year == year)
        else:
            q_out = q_out.filter(sa_extract('year', TransactionOut.date) == year)
    exp_rows = q_out.group_by("yr", "mo", TransactionOut.category).all()

    # Build month data from aggregated results
    months_data = defaultdict(lambda: {"receita": 0, "opex_by_category": defaultdict(float), "pro_labore": 0, "capex": 0})

    for yr, mo, total in rev_rows:
        if yr and mo:
            months_data[(int(yr), int(mo))]["receita"] += float(total)

    for yr, mo, cat_name, total in exp_rows:
        if not yr or not mo:
            continue
        key = (int(yr), int(mo))
        cat = (cat_name or "Outros").strip()
        cat_lower = cat.lower().strip()
        amount = float(total)
        if cat_lower in CAPEX_CATS:
            months_data[key]["capex"] += amount
        elif cat_lower in EXCLUDED_CATS:
            pass
        else:
            months_data[key]["opex_by_category"][cat] += amount
            if cat_lower in PROLABORE_CATS:
                months_data[key]["pro_labore"] += amount

    month_names = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    rows = []
    for (y, m), data in sorted(months_data.items()):
        total_rev = data["receita"]
        total_opex = sum(data["opex_by_category"].values())
        ebitda = total_rev - total_opex
        resultado = ebitda - data["pro_labore"]
        fcf = resultado - data["capex"]
        rows.append(PnLRow(month=m, year=y, label=f"{month_names[m]}/{y}",
            receita=round(data["receita"], 2), total_revenue=round(total_rev, 2),
            opex_by_category=dict(data["opex_by_category"]), total_opex=round(total_opex, 2),
            ebitda=round(ebitda, 2), pro_labore=round(data["pro_labore"], 2), resultado=round(resultado, 2),
            capex=round(data["capex"], 2), free_cash_flow=round(fcf, 2),
            margem_ebitda_pct=round(ebitda / total_rev * 100, 1) if total_rev > 0 else 0,
            margem_fcf_pct=round(fcf / total_rev * 100, 1) if total_rev > 0 else 0))
    return rows


@router.get("/deposits/summary", response_model=DepositSummary)
def get_deposits_summary(
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    _check_financial_access(current_user)

    # Deposits received (TransactionIn with category Deposit)
    q_in = db.query(TransactionIn).filter(
        TransactionIn.category.ilike("%deposit%")
    )
    if year:
        q_in = q_in.filter(TransactionIn.competencia_year == year)
    deposits_in = q_in.all()

    # Deposits returned (TransactionOut with category Deposit)
    q_out = db.query(TransactionOut).filter(
        TransactionOut.category.ilike("%deposit%")
    )
    if year:
        q_out = q_out.filter(TransactionOut.competencia_year == year)
    deposits_out = q_out.all()

    # Get all properties for names
    props = {p.id: p.name for p in db.query(Property).all()}

    # Aggregate by property
    received_by_prop = defaultdict(float)
    returned_by_prop = defaultdict(float)

    for t in deposits_in:
        if t.property_id:
            received_by_prop[t.property_id] += t.amount or 0

    for t in deposits_out:
        if t.property_id:
            returned_by_prop[t.property_id] += t.total_paid or 0

    # Build rows for all properties that have any deposit activity
    all_prop_ids = set(received_by_prop.keys()) | set(returned_by_prop.keys())
    rows = []
    total_received = 0
    total_returned = 0

    for pid in sorted(all_prop_ids):
        rec = round(received_by_prop[pid], 2)
        ret = round(returned_by_prop[pid], 2)
        total_received += rec
        total_returned += ret
        rows.append(DepositSummaryRow(
            property_id=pid,
            property_name=props.get(pid, f"Prop #{pid}"),
            deposits_received=rec,
            deposits_returned=ret,
            net_balance=round(rec - ret, 2)
        ))

    # Sort by net_balance descending
    rows.sort(key=lambda r: r.net_balance, reverse=True)

    return DepositSummary(
        total_received=round(total_received, 2),
        total_returned=round(total_returned, 2),
        total_balance=round(total_received - total_returned, 2),
        rows=rows
    )


@router.get("/contract-alerts")
def get_contract_alerts(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get contracts expiring soon for dashboard widget."""
    from datetime import date, timedelta
    from models import Contract, ContractStatus
    today = date.today()

    # Auto-expire contracts whose end_date has passed
    expired = db.query(Contract).filter(
        Contract.status == ContractStatus.VIGENTE,
        Contract.end_date != None,
        Contract.end_date < today
    ).all()
    for c in expired:
        c.status = ContractStatus.EXPIRADO
    if expired:
        db.commit()

    # Contracts expiring in next 60 days
    expiring = db.query(Contract).filter(
        Contract.status == ContractStatus.VIGENTE,
        Contract.end_date != None,
        Contract.end_date >= today,
        Contract.end_date <= today + timedelta(days=60)
    ).order_by(Contract.end_date).all()

    result = []
    for c in expiring:
        days_left = (c.end_date - today).days
        # Show all shared client names (e.g. couples)
        shared_names = [cl.name for cl in c.clients] if c.clients else []
        if not shared_names and c.client:
            shared_names = [c.client.name]
        client_display = " & ".join(shared_names) if shared_names else "N/A"
        result.append({
            "id": c.id,
            "client_name": client_display,
            "client_id": c.client_id,
            "client_names": shared_names,
            "property_name": c.property.name if c.property else "N/A",
            "property_id": c.property_id,
            "end_date": str(c.end_date),
            "days_left": days_left,
            "value": c.value,
            "severity": "critical" if days_left <= 7 else "warning" if days_left <= 30 else "info"
        })

    # Recently expired contracts (last 30 days)
    recently_expired = db.query(Contract).filter(
        Contract.status == ContractStatus.EXPIRADO,
        Contract.end_date != None,
        Contract.end_date >= today - timedelta(days=30),
        Contract.end_date < today
    ).order_by(Contract.end_date.desc()).all()

    expired_result = []
    for c in recently_expired:
        days_ago = (today - c.end_date).days
        shared_names = [cl.name for cl in c.clients] if c.clients else []
        if not shared_names and c.client:
            shared_names = [c.client.name]
        client_display = " & ".join(shared_names) if shared_names else "N/A"
        expired_result.append({
            "id": c.id,
            "client_name": client_display,
            "client_id": c.client_id,
            "client_names": shared_names,
            "property_name": c.property.name if c.property else "N/A",
            "property_id": c.property_id,
            "end_date": str(c.end_date),
            "days_ago": days_ago,
            "value": c.value,
            "severity": "expired"
        })

    # Property contracts expiring
    properties_expiring = []
    props = db.query(Property).filter(Property.status == "ativo", Property.contract_end != None).all()
    for p in props:
        if p.contract_end and p.contract_end >= today and p.contract_end <= today + timedelta(days=60):
            days_left = (p.contract_end - today).days
            properties_expiring.append({
                "id": p.id,
                "property_name": p.name,
                "landlord_name": p.landlord.name if p.landlord else p.owner_name or "N/A",
                "end_date": str(p.contract_end),
                "days_left": days_left,
                "monthly_rent": p.monthly_rent,
                "severity": "critical" if days_left <= 7 else "warning" if days_left <= 30 else "info"
            })
    properties_expiring.sort(key=lambda x: x["days_left"])

    return {
        "client_contracts": result,
        "expired_contracts": expired_result,
        "property_contracts": properties_expiring
    }


@router.get("/delinquency")
def get_delinquency_report(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Get clients with overdue payments.

    For couples on a shared contract, payments from both are summed together
    and compared against the contract total. If the combined payments cover the
    contract value, neither partner is flagged as delinquent.
    """
    _check_financial_access(current_user)
    from datetime import date
    from sqlalchemy import func
    from models import Contract, ContractStatus, contract_clients
    today = date.today()
    current_month = today.month
    current_year = today.year

    # Get all clients with monthly_value > 0 and a check_in date
    all_clients = db.query(Client).filter(
        Client.monthly_value > 0,
        Client.check_in != None,
        Client.status.in_(["ativo", "encerrado"]),
    ).all()

    if not all_clients:
        return {"total_delinquents": 0, "total_debt": 0, "delinquents": []}

    clients_by_id = {cl.id: cl for cl in all_clients}
    all_client_ids = list(clients_by_id.keys())

    # Build partner map from shared contracts:
    # If client A and client B are on the same contract, they are partners
    partner_map = {}  # client_id -> set of partner client_ids (including self)
    contract_value_map = {}  # client_id -> contract value (total for the group)

    shared_contracts = db.query(Contract).filter(
        Contract.status.in_([ContractStatus.VIGENTE, ContractStatus.EXPIRADO]),
        Contract.value > 0,
    ).all()

    for ct in shared_contracts:
        ct_client_ids = [cl.id for cl in ct.clients] if ct.clients else []
        if not ct_client_ids and ct.client_id:
            ct_client_ids = [ct.client_id]
        # Only process if at least one client is in our active list
        relevant = [cid for cid in ct_client_ids if cid in clients_by_id]
        if len(relevant) < 1:
            continue
        # Link all clients in this contract as partners
        group = set(ct_client_ids)
        for cid in ct_client_ids:
            if cid in partner_map:
                partner_map[cid] = partner_map[cid] | group
            else:
                partner_map[cid] = set(group)
            contract_value_map[cid] = ct.value

    # Batch-load ALL payments grouped by (client_id, year, month)
    payment_rows = db.query(
        TransactionIn.client_id,
        TransactionIn.competencia_year,
        TransactionIn.competencia_month,
        func.coalesce(func.sum(TransactionIn.amount), 0)
    ).filter(
        TransactionIn.client_id.in_(all_client_ids)
    ).group_by(
        TransactionIn.client_id,
        TransactionIn.competencia_year,
        TransactionIn.competencia_month
    ).all()

    payments_map = {}
    for cid, yr, mo, total in payment_rows:
        if yr and mo:
            payments_map[(cid, int(yr), int(mo))] = float(total)

    # Load properties for display
    props = {p.id: p.name for p in db.query(Property).all()}

    # Track which clients we already processed (to avoid duplicating couples)
    processed = set()
    delinquents = []

    for cl in all_clients:
        if cl.id in processed:
            continue

        # Get partner group
        group_ids = partner_map.get(cl.id, {cl.id})
        # Mark all in group as processed
        processed.update(group_ids)

        # Get all group members that are in our active clients list
        group_clients = [clients_by_id[cid] for cid in group_ids if cid in clients_by_id]
        if not group_clients:
            continue

        # Expected: sum of all monthly_values in the group
        # OR use contract value if available
        if cl.id in contract_value_map and len(group_ids) > 1:
            expected_total = contract_value_map[cl.id]
        else:
            expected_total = sum(c.monthly_value for c in group_clients)

        # Use the earliest check_in and latest check_out from the group
        start = min(c.check_in for c in group_clients if c.check_in)
        end_dates = [c.check_out for c in group_clients if c.check_out]
        end_date = max(end_dates) if end_dates else None

        # Check each month
        months_overdue = []
        y, m = start.year, start.month

        while (y, m) <= (current_year, current_month):
            if end_date and (y, m) > (end_date.year, end_date.month):
                break

            # Sum payments from ALL partners for this month
            received = sum(
                payments_map.get((cid, y, m), 0)
                for cid in group_ids
            )

            # Only flag past months
            if received < expected_total and (y, m) < (current_year, current_month):
                months_overdue.append({
                    "month": m, "year": y,
                    "expected": round(expected_total, 2),
                    "received": round(received, 2),
                    "missing": round(expected_total - received, 2),
                })

            m += 1
            if m > 12:
                m = 1
                y += 1

        if months_overdue:
            total_debt = sum(mo["missing"] for mo in months_overdue)
            # Display names: join all group members
            display_name = " & ".join(c.name for c in group_clients)
            first_client = group_clients[0]
            delinquents.append({
                "client_id": first_client.id,
                "client_name": display_name,
                "client_code": first_client.code,
                "client_ids": [c.id for c in group_clients],
                "is_couple": len(group_clients) > 1,
                "property_name": props.get(first_client.property_id, "N/A"),
                "property_id": first_client.property_id,
                "monthly_value": round(expected_total, 2),
                "total_debt": round(total_debt, 2),
                "months_overdue_count": len(months_overdue),
                "months_overdue": months_overdue[-6:],
                "oldest_debt_month": months_overdue[0]["month"],
                "oldest_debt_year": months_overdue[0]["year"],
                "check_in": str(start),
                "check_out": str(end_date) if end_date else None,
                "status": first_client.status.value if first_client.status else "ativo",
            })

    delinquents.sort(key=lambda x: x["total_debt"], reverse=True)
    total_debt_all = sum(d["total_debt"] for d in delinquents)

    return {
        "total_delinquents": len(delinquents),
        "total_debt": round(total_debt_all, 2),
        "delinquents": delinquents
    }


@router.get("/revenue-projection")
def get_revenue_projection(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Project future revenue based on active contracts and clients."""
    _check_financial_access(current_user)
    from datetime import date
    today = date.today()

    active_clients = db.query(Client).filter(Client.status == "ativo").all()

    # Monthly projection for next 12 months
    projections = []
    month_names = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

    for i in range(12):
        m = (today.month + i - 1) % 12 + 1
        y = today.year + (today.month + i - 1) // 12

        monthly_revenue = 0
        client_count = 0

        for cl in active_clients:
            if not cl.monthly_value or cl.monthly_value <= 0:
                continue
            if cl.check_in and (y, m) < (cl.check_in.year, cl.check_in.month):
                continue
            if cl.check_out and (y, m) > (cl.check_out.year, cl.check_out.month):
                continue
            monthly_revenue += cl.monthly_value
            client_count += 1

        label = f"{month_names[m]}/{y}"
        projections.append({
            "month": m, "year": y, "label": label,
            "projected_revenue": round(monthly_revenue, 2),
            "client_count": client_count
        })

    # Total rent cost (landlords)
    active_props = db.query(Property).filter(Property.status == "ativo").all()
    total_rent = sum(p.monthly_rent for p in active_props)

    return {
        "projections": projections,
        "current_monthly_revenue": projections[0]["projected_revenue"] if projections else 0,
        "total_monthly_rent": round(total_rent, 2),
        "projected_annual_revenue": round(sum(p["projected_revenue"] for p in projections), 2),
        "projected_annual_rent": round(total_rent * 12, 2),
    }


@router.get("/month-comparison")
def get_month_comparison(
    year: int = 2026,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Month-over-month comparison of key metrics."""
    _check_financial_access(current_user)
    from sqlalchemy import func

    month_names = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

    # Current year revenue by month — single query
    rev_rows = db.query(
        TransactionIn.competencia_month,
        func.coalesce(func.sum(TransactionIn.amount), 0)
    ).filter(
        TransactionIn.competencia_year == year
    ).group_by(TransactionIn.competencia_month).all()
    rev_map = {int(m): float(s) for m, s in rev_rows}

    # Current year expenses by month — single query
    exp_rows = db.query(
        TransactionOut.competencia_month,
        func.coalesce(func.sum(TransactionOut.total_paid), 0)
    ).filter(
        TransactionOut.competencia_year == year
    ).group_by(TransactionOut.competencia_month).all()
    exp_map = {int(m): float(s) for m, s in exp_rows}

    # Previous year revenue by month — single query
    prev_rev_rows = db.query(
        TransactionIn.competencia_month,
        func.coalesce(func.sum(TransactionIn.amount), 0)
    ).filter(
        TransactionIn.competencia_year == year - 1
    ).group_by(TransactionIn.competencia_month).all()
    prev_rev_map = {int(m): float(s) for m, s in prev_rev_rows}

    months = []
    for m in range(1, 13):
        rev = rev_map.get(m, 0)
        exp = exp_map.get(m, 0)
        prev_rev = prev_rev_map.get(m, 0)
        profit = rev - exp
        growth = round((rev - prev_rev) / prev_rev * 100, 1) if prev_rev > 0 else 0

        months.append({
            "month": m, "label": month_names[m],
            "revenue": round(rev, 2),
            "expenses": round(exp, 2),
            "profit": round(profit, 2),
            "margin": round(profit / rev * 100, 1) if rev > 0 else 0,
            "prev_year_revenue": round(prev_rev, 2),
            "yoy_growth": growth,
        })

    return {"year": year, "months": months}
