from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import MaintenanceRequest, MaintenanceStatus, MaintenancePriority, Property, User
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


class MaintenanceCreate(BaseModel):
    property_id: int
    title: str
    description: Optional[str] = None
    priority: MaintenancePriority = MaintenancePriority.MEDIA
    cost: float = 0

class MaintenanceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[MaintenanceStatus] = None
    priority: Optional[MaintenancePriority] = None
    cost: Optional[float] = None

class MaintenanceOut(BaseModel):
    id: int
    property_id: int
    property_name: Optional[str] = None
    title: str
    description: Optional[str]
    status: MaintenanceStatus
    priority: MaintenancePriority
    cost: float
    created_by: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    resolved_at: Optional[datetime]
    class Config:
        from_attributes = True


@router.get("", response_model=List[MaintenanceOut])
def list_maintenance(
    property_id: Optional[int] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(MaintenanceRequest)
    if property_id:
        q = q.filter(MaintenanceRequest.property_id == property_id)
    if status:
        q = q.filter(MaintenanceRequest.status == status)
    if priority:
        q = q.filter(MaintenanceRequest.priority == priority)
    items = q.order_by(MaintenanceRequest.created_at.desc()).all()
    result = []
    for m in items:
        prop = db.query(Property).filter(Property.id == m.property_id).first()
        out = MaintenanceOut.model_validate(m)
        out.property_name = prop.name if prop else None
        result.append(out)
    return result


@router.get("/summary")
def maintenance_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total = db.query(MaintenanceRequest).count()
    aberto = db.query(MaintenanceRequest).filter(MaintenanceRequest.status == MaintenanceStatus.ABERTO).count()
    em_andamento = db.query(MaintenanceRequest).filter(MaintenanceRequest.status == MaintenanceStatus.EM_ANDAMENTO).count()
    concluido = db.query(MaintenanceRequest).filter(MaintenanceRequest.status == MaintenanceStatus.CONCLUIDO).count()
    total_cost = sum(m.cost for m in db.query(MaintenanceRequest).filter(MaintenanceRequest.status == MaintenanceStatus.CONCLUIDO).all())
    return {"total": total, "aberto": aberto, "em_andamento": em_andamento, "concluido": concluido, "total_cost": round(total_cost, 2)}


@router.post("", response_model=MaintenanceOut)
def create_maintenance(data: MaintenanceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    m = MaintenanceRequest(
        property_id=data.property_id, title=data.title, description=data.description,
        priority=data.priority, cost=data.cost, created_by=current_user.name
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    prop = db.query(Property).filter(Property.id == m.property_id).first()
    out = MaintenanceOut.model_validate(m)
    out.property_name = prop.name if prop else None
    return out


@router.put("/{mid}", response_model=MaintenanceOut)
def update_maintenance(mid: int, data: MaintenanceUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    m = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == mid).first()
    if not m:
        raise HTTPException(status_code=404, detail="Manutencao nao encontrada")
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(m, key, val)
    if data.status == MaintenanceStatus.CONCLUIDO and not m.resolved_at:
        m.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(m)
    prop = db.query(Property).filter(Property.id == m.property_id).first()
    out = MaintenanceOut.model_validate(m)
    out.property_name = prop.name if prop else None
    return out


@router.delete("/{mid}")
def delete_maintenance(mid: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    m = db.query(MaintenanceRequest).filter(MaintenanceRequest.id == mid).first()
    if not m:
        raise HTTPException(status_code=404, detail="Manutencao nao encontrada")
    db.delete(m)
    db.commit()
    return {"ok": True}
