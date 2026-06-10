from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Setting, UserRole
from auth import get_current_user, require_roles
from typing import List, Dict
from pydantic import BaseModel

router = APIRouter(prefix="/settings", tags=["Settings"])

class SettingItem(BaseModel):
    key: str
    value: str
    category: str

class SettingOut(BaseModel):
    id: int
    key: str
    value: str
    category: str
    class Config:
        from_attributes = True


@router.get("", response_model=List[SettingOut])
def list_settings(category: str = None, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    q = db.query(Setting)
    if category:
        q = q.filter(Setting.category == category)
    return q.all()


@router.get("/categories-in", response_model=List[str])
def get_categories_in(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    items = db.query(Setting).filter(Setting.category == "categories_in").all()
    return [s.value for s in items]


@router.get("/categories-out", response_model=List[str])
def get_categories_out(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    items = db.query(Setting).filter(Setting.category == "categories_out").all()
    return [s.value for s in items]


@router.get("/payment-methods", response_model=List[str])
def get_payment_methods(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    items = db.query(Setting).filter(Setting.category == "payment_methods").all()
    return [s.value for s in items]


@router.post("")
def create_setting(
    item: SettingItem,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    s = Setting(key=item.key, value=item.value, category=item.category)
    db.add(s)
    db.commit()
    return {"detail": "Configuracao criada"}


@router.delete("/{setting_id}")
def delete_setting(
    setting_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    s = db.query(Setting).filter(Setting.id == setting_id).first()
    if s:
        db.delete(s)
        db.commit()
    return {"detail": "Configuracao removida"}
