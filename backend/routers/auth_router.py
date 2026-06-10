from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from models import User, UserRole
from schemas import LoginRequest, RegisterRequest, Token, UserOut, UserUpdate
from auth import verify_password, get_password_hash, create_access_token, get_current_user, require_roles
import time
from collections import defaultdict

router = APIRouter(prefix="/auth", tags=["Auth"])

# ── Simple in-memory rate limiter ──────────────────────────
_login_attempts: dict[str, list[float]] = defaultdict(list)
_RATE_LIMIT_WINDOW = 300  # 5 minutes
_MAX_ATTEMPTS = 10  # max attempts per window


def _check_rate_limit(ip: str):
    """Block if too many login attempts from same IP."""
    now = time.time()
    # Prune old entries
    _login_attempts[ip] = [t for t in _login_attempts[ip] if now - t < _RATE_LIMIT_WINDOW]
    if len(_login_attempts[ip]) >= _MAX_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Muitas tentativas de login. Tente novamente em alguns minutos."
        )
    _login_attempts[ip].append(now)


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


@router.post("/login", response_model=Token)
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    _check_rate_limit(client_ip)

    import logging
    logger = logging.getLogger(__name__)
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not user.password_hash or not verify_password(req.password, user.password_hash):
        logger.warning(f"Failed login attempt for {req.email} from {client_ip}")
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    if not user.active:
        raise HTTPException(status_code=403, detail="Usuario desativado")
    token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))


@router.post("/register", response_model=UserOut)
def register(req: RegisterRequest, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.ADMIN))):
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email ja cadastrado")
    user = User(name=req.name, email=req.email, password_hash=get_password_hash(req.password), role=req.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_profile(data: ProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.name:
        current_user.name = data.name
    if data.email and data.email != current_user.email:
        existing = db.query(User).filter(User.email == data.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email ja em uso")
        current_user.email = data.email
    if data.new_password:
        if not data.current_password:
            raise HTTPException(status_code=400, detail="Senha atual obrigatoria para alterar senha")
        if not verify_password(data.current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Senha atual incorreta")
        current_user.password_hash = get_password_hash(data.new_password)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.ADMIN))):
    return db.query(User).all()


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(UserRole.ADMIN))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado")
    # Only allow safe fields to prevent mass assignment
    ALLOWED_FIELDS = {"name", "email", "active", "role"}
    for key, val in data.model_dump(exclude_unset=True).items():
        if key in ALLOWED_FIELDS:
            setattr(user, key, val)
    db.commit()
    db.refresh(user)
    return user
