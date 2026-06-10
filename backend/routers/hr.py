from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Employee, Timesheet, Payroll, TimeOff, EmployeeDocument, EmployeeRemark, Property, UserRole
from schemas import (
    EmployeeCreate, EmployeeUpdate, EmployeeOut,
    TimesheetCreate, TimesheetOut,
    PayrollCreate, PayrollOut,
    TimeOffCreate, TimeOffUpdate, TimeOffOut
)
from auth import get_current_user, require_roles
from typing import List, Optional
from schemas import RemarkCreate

router = APIRouter(prefix="/hr", tags=["HR"])

MONTH_NAMES = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
               "Jul", "Ago", "Set", "Out", "Nov", "Dez"]


# ── Employees ─────────────────────────────────────────
@router.get("/employees", response_model=List[EmployeeOut])
def list_employees(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = db.query(Employee)
    if status:
        q = q.filter(Employee.status == status)
    if search:
        q = q.filter(Employee.name.ilike(f"%{search}%"))
    return q.order_by(Employee.name).all()


@router.get("/employees/{employee_id}")
def get_employee_profile(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Funcionario nao encontrado")

    # Timesheets
    timesheets = db.query(Timesheet).filter(
        Timesheet.employee_id == employee_id
    ).order_by(Timesheet.date.desc()).limit(100).all()

    ts_list = []
    for t in timesheets:
        ts_list.append({
            "id": t.id,
            "date": str(t.date),
            "hours": t.hours,
            "property_id": t.property_id,
            "property_name": t.property.name if t.property else None,
            "description": t.description,
        })

    # Total hours this month
    from datetime import date
    today = date.today()
    hours_this_month = db.query(func.coalesce(func.sum(Timesheet.hours), 0)).filter(
        Timesheet.employee_id == employee_id,
        func.extract('month', Timesheet.date) == today.month,
        func.extract('year', Timesheet.date) == today.year
    ).scalar()

    total_hours = db.query(func.coalesce(func.sum(Timesheet.hours), 0)).filter(
        Timesheet.employee_id == employee_id
    ).scalar()

    # Payrolls
    payrolls = db.query(Payroll).filter(
        Payroll.employee_id == employee_id
    ).order_by(Payroll.year.desc(), Payroll.month.desc()).all()

    pay_list = []
    for p in payrolls:
        label = f"{MONTH_NAMES[p.month]}/{p.year}" if 1 <= p.month <= 12 else f"{p.month}/{p.year}"
        pay_list.append({
            "id": p.id,
            "month": p.month,
            "year": p.year,
            "label": label,
            "base_salary": p.base_salary,
            "hours_worked": p.hours_worked,
            "hourly_amount": p.hourly_amount,
            "bonus": p.bonus,
            "deductions": p.deductions,
            "total_paid": p.total_paid,
            "paid": p.paid,
            "paid_date": str(p.paid_date) if p.paid_date else None,
            "notes": p.notes,
        })

    total_paid = sum(p.total_paid for p in payrolls if p.paid)

    # Time offs (vacation + sick days)
    time_offs = db.query(TimeOff).filter(
        TimeOff.employee_id == employee_id
    ).order_by(TimeOff.start_date.desc()).all()

    time_off_list = [{
        "id": to.id,
        "type": to.type.value if to.type else "ferias",
        "status": to.status.value if to.status else "pendente",
        "start_date": str(to.start_date),
        "end_date": str(to.end_date),
        "days": to.days,
        "reason": to.reason,
        "approved_by": to.approved_by,
        "created_at": to.created_at.isoformat() if to.created_at else None,
    } for to in time_offs]

    # Vacation balance
    vacation_allowance = emp.vacation_days_year or 22
    vacation_used = sum(to.days for to in time_offs if to.type.value == "ferias" and to.status.value == "aprovado" and to.start_date.year == today.year)
    sick_days_used = sum(to.days for to in time_offs if to.type.value == "sick_day" and to.start_date.year == today.year)
    vacation_balance = vacation_allowance - vacation_used

    # Documents
    docs = db.query(EmployeeDocument).filter(
        EmployeeDocument.employee_id == employee_id
    ).order_by(EmployeeDocument.uploaded_at.desc()).all()
    docs_list = [{
        "id": d.id, "name": d.name, "type": d.type,
        "file_url": d.file_url, "file_size": d.file_size,
        "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
    } for d in docs]

    # Remarks
    remarks = db.query(EmployeeRemark).filter(
        EmployeeRemark.employee_id == employee_id
    ).order_by(EmployeeRemark.created_at.desc()).all()
    remarks_list = [{
        "id": r.id, "text": r.text, "created_by": r.created_by,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    } for r in remarks]

    # Performance reviews
    from models import PerformanceReview
    reviews = db.query(PerformanceReview).filter(
        PerformanceReview.employee_id == employee_id
    ).order_by(PerformanceReview.created_at.desc()).all()
    reviews_list = [{
        "id": r.id, "period": r.period, "rating": r.rating,
        "punctuality": r.punctuality, "quality": r.quality,
        "teamwork": r.teamwork, "communication": r.communication,
        "reviewer_name": r.reviewer_name, "notes": r.notes,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    } for r in reviews]

    avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else None

    return {
        "id": emp.id,
        "code": emp.code,
        "name": emp.name,
        "email": emp.email,
        "phone": emp.phone,
        "role_title": emp.role_title,
        "status": emp.status.value if emp.status else "ativo",
        "hire_date": str(emp.hire_date) if emp.hire_date else None,
        "hourly_rate": emp.hourly_rate,
        "monthly_salary": emp.monthly_salary,
        "vacation_days_year": emp.vacation_days_year or 22,
        "document_id": emp.document_id,
        "iban": emp.iban,
        "notes": emp.notes,
        "created_at": emp.created_at.isoformat() if emp.created_at else None,
        "timesheets": ts_list,
        "payrolls": pay_list,
        "time_offs": time_off_list,
        "documents": docs_list,
        "remarks": remarks_list,
        "reviews": reviews_list,
        "avg_rating": avg_rating,
        "hours_this_month": float(hours_this_month),
        "total_hours": float(total_hours),
        "total_paid": round(total_paid, 2),
        "vacation_allowance": vacation_allowance,
        "vacation_used": vacation_used,
        "vacation_balance": vacation_balance,
        "sick_days_used": sick_days_used,
    }


@router.post("/employees", response_model=EmployeeOut)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    from main import _generate_employee_code
    from models import EmployeeStatus
    d = data.model_dump()
    # Convert status string to enum
    if isinstance(d.get("status"), str):
        try:
            d["status"] = EmployeeStatus(d["status"])
        except ValueError:
            d["status"] = EmployeeStatus.ATIVO
    emp = Employee(**d)
    emp.code = _generate_employee_code(db)
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp


@router.put("/employees/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    from models import EmployeeStatus
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Funcionario nao encontrado")
    for key, val in data.model_dump(exclude_unset=True).items():
        if key == "status" and isinstance(val, str):
            try:
                val = EmployeeStatus(val)
            except ValueError:
                val = EmployeeStatus.ATIVO
        setattr(emp, key, val)
    db.commit()
    db.refresh(emp)
    return emp


@router.delete("/employees/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Funcionario nao encontrado")
    db.delete(emp)
    db.commit()
    return {"detail": "Funcionario removido"}


# ── Timesheets ────────────────────────────────────────
@router.get("/timesheets", response_model=List[TimesheetOut])
def list_timesheets(
    employee_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = db.query(Timesheet)
    if employee_id:
        q = q.filter(Timesheet.employee_id == employee_id)
    if month:
        q = q.filter(func.extract('month', Timesheet.date) == month)
    if year:
        q = q.filter(func.extract('year', Timesheet.date) == year)
    entries = q.order_by(Timesheet.date.desc()).limit(500).all()
    result = []
    for t in entries:
        out = TimesheetOut.model_validate(t)
        out.employee_name = t.employee.name if t.employee else None
        out.property_name = t.property.name if t.property else None
        result.append(out)
    return result


@router.post("/timesheets", response_model=TimesheetOut)
def create_timesheet(
    data: TimesheetCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    ts = Timesheet(**data.model_dump())
    db.add(ts)
    db.commit()
    db.refresh(ts)
    out = TimesheetOut.model_validate(ts)
    out.employee_name = ts.employee.name if ts.employee else None
    out.property_name = ts.property.name if ts.property else None
    return out


@router.delete("/timesheets/{timesheet_id}")
def delete_timesheet(
    timesheet_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    ts = db.query(Timesheet).filter(Timesheet.id == timesheet_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Registro nao encontrado")
    db.delete(ts)
    db.commit()
    return {"detail": "Registro removido"}


# ── Payroll ───────────────────────────────────────────
@router.get("/payroll", response_model=List[PayrollOut])
def list_payroll(
    employee_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.FINANCEIRO))
):
    q = db.query(Payroll)
    if employee_id:
        q = q.filter(Payroll.employee_id == employee_id)
    if month:
        q = q.filter(Payroll.month == month)
    if year:
        q = q.filter(Payroll.year == year)
    entries = q.order_by(Payroll.year.desc(), Payroll.month.desc()).all()
    result = []
    for p in entries:
        out = PayrollOut.model_validate(p)
        out.employee_name = p.employee.name if p.employee else None
        result.append(out)
    return result


@router.post("/payroll", response_model=PayrollOut)
def create_payroll(
    data: PayrollCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    pay = Payroll(**data.model_dump())
    db.add(pay)
    db.commit()
    db.refresh(pay)
    out = PayrollOut.model_validate(pay)
    out.employee_name = pay.employee.name if pay.employee else None
    return out


@router.put("/payroll/{payroll_id}", response_model=PayrollOut)
def update_payroll(
    payroll_id: int,
    data: PayrollCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    pay = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not pay:
        raise HTTPException(status_code=404, detail="Folha nao encontrada")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(pay, key, val)
    db.commit()
    db.refresh(pay)
    out = PayrollOut.model_validate(pay)
    out.employee_name = pay.employee.name if pay.employee else None
    return out


@router.delete("/payroll/{payroll_id}")
def delete_payroll(
    payroll_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    pay = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not pay:
        raise HTTPException(status_code=404, detail="Folha nao encontrada")
    db.delete(pay)
    db.commit()
    return {"detail": "Folha removida"}


# ── Time Off (Ferias / Sick Days) ─────────────────────
@router.get("/time-offs", response_model=List[TimeOffOut])
def list_time_offs(
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = db.query(TimeOff)
    if employee_id:
        q = q.filter(TimeOff.employee_id == employee_id)
    if status:
        q = q.filter(TimeOff.status == status)
    entries = q.order_by(TimeOff.start_date.desc()).limit(200).all()
    result = []
    for t in entries:
        out = TimeOffOut.model_validate(t)
        out.employee_name = t.employee.name if t.employee else None
        result.append(out)
    return result


@router.post("/time-offs", response_model=TimeOffOut)
def create_time_off(
    data: TimeOffCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    to = TimeOff(**data.model_dump())
    db.add(to)
    db.commit()
    db.refresh(to)
    out = TimeOffOut.model_validate(to)
    out.employee_name = to.employee.name if to.employee else None
    return out


@router.put("/time-offs/{time_off_id}", response_model=TimeOffOut)
def update_time_off(
    time_off_id: int,
    data: TimeOffUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    to = db.query(TimeOff).filter(TimeOff.id == time_off_id).first()
    if not to:
        raise HTTPException(status_code=404, detail="Registro nao encontrado")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(to, key, val)
    db.commit()
    db.refresh(to)
    out = TimeOffOut.model_validate(to)
    out.employee_name = to.employee.name if to.employee else None
    return out


@router.delete("/time-offs/{time_off_id}")
def delete_time_off(
    time_off_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    to = db.query(TimeOff).filter(TimeOff.id == time_off_id).first()
    if not to:
        raise HTTPException(status_code=404, detail="Registro nao encontrado")
    db.delete(to)
    db.commit()
    return {"detail": "Registro removido"}


# ── Employee Documents ───────────────────────────────
from pydantic import BaseModel as PydanticBase

class DocCreateBody(PydanticBase):
    name: str
    type: str = ""
    file_url: str = ""

class RemarkCreateBody(PydanticBase):
    text: str
    created_by: str = ""


@router.post("/employees/{employee_id}/docs")
def add_employee_doc(
    employee_id: int,
    body: DocCreateBody,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Funcionario nao encontrado")
    doc = EmployeeDocument(
        employee_id=employee_id, name=body.name,
        type=body.type, file_url=body.file_url
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {
        "id": doc.id, "name": doc.name, "type": doc.type,
        "file_url": doc.file_url, "file_size": doc.file_size,
        "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None,
    }


@router.delete("/employees/{employee_id}/docs/{doc_id}")
def delete_employee_doc(
    employee_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    doc = db.query(EmployeeDocument).filter(
        EmployeeDocument.id == doc_id,
        EmployeeDocument.employee_id == employee_id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Documento nao encontrado")
    db.delete(doc)
    db.commit()
    return {"detail": "Documento removido"}


# ── Employee Remarks ─────────────────────────────────
@router.post("/employees/{employee_id}/remarks")
def add_employee_remark(
    employee_id: int,
    body: RemarkCreateBody,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Funcionario nao encontrado")
    remark = EmployeeRemark(
        employee_id=employee_id, text=body.text,
        created_by=body.created_by or (current_user.name if current_user else "")
    )
    db.add(remark)
    db.commit()
    db.refresh(remark)
    return {
        "id": remark.id, "text": remark.text, "created_by": remark.created_by,
        "created_at": remark.created_at.isoformat() if remark.created_at else None,
    }


@router.delete("/employees/{employee_id}/remarks/{remark_id}")
def delete_employee_remark(
    employee_id: int,
    remark_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    remark = db.query(EmployeeRemark).filter(
        EmployeeRemark.id == remark_id,
        EmployeeRemark.employee_id == employee_id
    ).first()
    if not remark:
        raise HTTPException(status_code=404, detail="Observacao nao encontrada")
    db.delete(remark)
    db.commit()
    return {"detail": "Observacao removida"}


# ── Team Calendar ────────────────────────────────────
@router.get("/team-calendar")
def get_team_calendar(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get team vacation/time-off calendar for a given month."""
    from datetime import date as dt
    today = dt.today()
    m = month or today.month
    y = year or today.year

    # Get all time-offs that overlap with this month
    month_start = dt(y, m, 1)
    if m == 12:
        month_end = dt(y + 1, 1, 1)
    else:
        month_end = dt(y, m + 1, 1)

    time_offs = db.query(TimeOff).filter(
        TimeOff.status.in_(["aprovado", "pendente"]),
        TimeOff.start_date < month_end,
        TimeOff.end_date >= month_start
    ).all()

    entries = []
    for to in time_offs:
        entries.append({
            "id": to.id,
            "employee_id": to.employee_id,
            "employee_name": to.employee.name if to.employee else "N/A",
            "type": to.type.value if to.type else "ferias",
            "status": to.status.value if to.status else "pendente",
            "start_date": str(to.start_date),
            "end_date": str(to.end_date),
            "days": to.days,
            "reason": to.reason,
        })

    # Get all employees for reference
    employees = db.query(Employee).filter(Employee.status == "ativo").all()
    emp_list = [{"id": e.id, "name": e.name, "role_title": e.role_title} for e in employees]

    return {
        "month": m, "year": y,
        "entries": entries,
        "employees": emp_list
    }


# ── Performance Reviews ──────────────────────────────
@router.get("/employees/{employee_id}/reviews")
def list_reviews(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    from models import PerformanceReview
    reviews = db.query(PerformanceReview).filter(
        PerformanceReview.employee_id == employee_id
    ).order_by(PerformanceReview.created_at.desc()).all()
    return [{
        "id": r.id, "period": r.period, "rating": r.rating,
        "punctuality": r.punctuality, "quality": r.quality,
        "teamwork": r.teamwork, "communication": r.communication,
        "reviewer_name": r.reviewer_name, "notes": r.notes,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    } for r in reviews]


from pydantic import BaseModel as PydanticBase

class ReviewCreateBody(PydanticBase):
    period: str = ""
    rating: int = 3
    punctuality: int = 3
    quality: int = 3
    teamwork: int = 3
    communication: int = 3
    notes: str = ""


@router.post("/employees/{employee_id}/reviews")
def add_review(
    employee_id: int,
    body: ReviewCreateBody,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    from models import PerformanceReview
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Funcionario nao encontrado")
    review = PerformanceReview(
        employee_id=employee_id,
        reviewer_name=current_user.name if current_user else "",
        period=body.period, rating=body.rating,
        punctuality=body.punctuality, quality=body.quality,
        teamwork=body.teamwork, communication=body.communication,
        notes=body.notes
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return {
        "id": review.id, "period": review.period, "rating": review.rating,
        "reviewer_name": review.reviewer_name, "notes": review.notes,
        "created_at": review.created_at.isoformat() if review.created_at else None,
    }


@router.delete("/employees/{employee_id}/reviews/{review_id}")
def delete_review(
    employee_id: int,
    review_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    from models import PerformanceReview
    review = db.query(PerformanceReview).filter(
        PerformanceReview.id == review_id,
        PerformanceReview.employee_id == employee_id
    ).first()
    if not review:
        raise HTTPException(status_code=404, detail="Avaliacao nao encontrada")
    db.delete(review)
    db.commit()
    return {"detail": "Avaliacao removida"}


# ── HR Dashboard/Summary ─────────────────────────────
@router.get("/summary")
def hr_summary(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.FINANCEIRO))
):
    total_employees = db.query(Employee).filter(Employee.status == "ativo").count()
    total_salary = db.query(func.coalesce(func.sum(Employee.monthly_salary), 0)).filter(
        Employee.status == "ativo"
    ).scalar()

    from datetime import date
    today = date.today()
    hours_this_month = db.query(func.coalesce(func.sum(Timesheet.hours), 0)).filter(
        func.extract('month', Timesheet.date) == today.month,
        func.extract('year', Timesheet.date) == today.year
    ).scalar()

    payroll_this_month = db.query(func.coalesce(func.sum(Payroll.total_paid), 0)).filter(
        Payroll.month == today.month,
        Payroll.year == today.year,
        Payroll.paid == True
    ).scalar()

    return {
        "total_employees": total_employees,
        "total_monthly_salary": float(total_salary),
        "hours_this_month": float(hours_this_month),
        "payroll_this_month": float(payroll_this_month),
    }
