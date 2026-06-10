from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Client, TransactionIn, Property, Room, Bed
from auth import get_current_user
from typing import Optional, List
from datetime import date, timedelta
from collections import defaultdict

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("")
def list_payments(
    status: Optional[str] = None,  # all, due, paid, overdue, partial
    property_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    For each active client, for the requested month/year:
    - expected = client.monthly_value
    - received = sum of TransactionIn for that competencia
    - status: paid (received >= expected), partial (0 < received < expected),
              overdue (past due date, received < expected), due (not yet due)
    """
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    # Get active clients (and recently inactive for the period)
    q = db.query(Client).filter(Client.status.in_(["ativo", "encerrado"]))
    if property_id:
        q = q.filter(Client.property_id == property_id)

    clients = q.all()
    results = []

    for c in clients:
        # Skip clients without monthly value
        if not c.monthly_value or c.monthly_value <= 0:
            continue

        # Skip if client wasn't active during this period
        if c.check_in:
            ci_year, ci_month = c.check_in.year, c.check_in.month
            if (target_year, target_month) < (ci_year, ci_month):
                continue
        if c.check_out:
            co_year, co_month = c.check_out.year, c.check_out.month
            if (target_year, target_month) > (co_year, co_month):
                continue

        expected = c.monthly_value

        # Sum TransactionIn for this client & competencia
        payments = db.query(TransactionIn).filter(
            TransactionIn.client_id == c.id,
            TransactionIn.competencia_month == target_month,
            TransactionIn.competencia_year == target_year
        ).all()

        received = sum(t.amount for t in payments)

        # Determine status
        if received >= expected:
            pay_status = "paid"
        elif received > 0:
            pay_status = "partial"
        elif (target_year, target_month) < (today.year, today.month):
            pay_status = "overdue"
        elif (target_year, target_month) == (today.year, today.month) and today.day > 10:
            pay_status = "overdue"
        else:
            pay_status = "due"

        # Filter by status if requested
        if status and status != "all" and pay_status != status:
            continue

        prop_name = c.property.name if c.property else "N/A"
        room_name = c.room.name if c.room else None
        bed_name = c.bed.name if c.bed else None

        results.append({
            "client_id": c.id,
            "client_name": c.name,
            "property_id": c.property_id,
            "property_name": prop_name,
            "room_name": room_name,
            "bed_name": bed_name,
            "competencia_month": target_month,
            "competencia_year": target_year,
            "expected": round(expected, 2),
            "received": round(received, 2),
            "balance": round(received - expected, 2),
            "status": pay_status,
            "payment_count": len(payments),
            "last_payment_date": max((t.date for t in payments), default=None)
        })

    # Sort: overdue first, then due, partial, paid
    order = {"overdue": 0, "due": 1, "partial": 2, "paid": 3}
    results.sort(key=lambda x: (order.get(x["status"], 9), x["client_name"]))

    return results


@router.get("/summary")
def payment_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Summary KPIs for the payment tracking page."""
    today = date.today()
    target_month = month or today.month
    target_year = year or today.year

    clients = db.query(Client).filter(
        Client.status == "ativo",
        Client.monthly_value > 0
    ).all()

    total_expected = 0
    total_received = 0
    count_paid = 0
    count_overdue = 0
    count_partial = 0
    count_due = 0

    for c in clients:
        if c.check_in:
            ci_year, ci_month = c.check_in.year, c.check_in.month
            if (target_year, target_month) < (ci_year, ci_month):
                continue
        if c.check_out:
            co_year, co_month = c.check_out.year, c.check_out.month
            if (target_year, target_month) > (co_year, co_month):
                continue

        expected = c.monthly_value
        total_expected += expected

        payments = db.query(TransactionIn).filter(
            TransactionIn.client_id == c.id,
            TransactionIn.competencia_month == target_month,
            TransactionIn.competencia_year == target_year
        ).all()
        received = sum(t.amount for t in payments)
        total_received += received

        if received >= expected:
            count_paid += 1
        elif received > 0:
            count_partial += 1
        elif (target_year, target_month) < (today.year, today.month):
            count_overdue += 1
        elif (target_year, target_month) == (today.year, today.month) and today.day > 10:
            count_overdue += 1
        else:
            count_due += 1

    return {
        "month": target_month,
        "year": target_year,
        "total_expected": round(total_expected, 2),
        "total_received": round(total_received, 2),
        "total_pending": round(total_expected - total_received, 2),
        "count_paid": count_paid,
        "count_overdue": count_overdue,
        "count_partial": count_partial,
        "count_due": count_due,
        "collection_rate": round((total_received / total_expected * 100) if total_expected > 0 else 0, 1)
    }
