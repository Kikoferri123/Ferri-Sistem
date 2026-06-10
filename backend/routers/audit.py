from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from models import AuditLog, UserRole
from auth import get_current_user, require_roles
from typing import Optional
from jose import jwt
import os, re, json

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/logs")
def list_audit_logs(
    entity_type: Optional[str] = None,
    user_name: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    q = db.query(AuditLog)
    if entity_type:
        q = q.filter(AuditLog.entity_type == entity_type)
    if user_name:
        q = q.filter(AuditLog.user_name.ilike(f"%{user_name}%"))
    if action:
        q = q.filter(AuditLog.action == action)
    total = q.count()
    logs = q.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
    return {
        "total": total,
        "logs": [{
            "id": l.id,
            "user_name": l.user_name,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "details": l.details,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        } for l in logs]
    }


def log_action(db: Session, user, action: str, entity_type: str, entity_id: int = None, details: str = ""):
    """Helper to log an audit action. Uses flush instead of commit to work within existing transactions."""
    try:
        log = AuditLog(
            user_id=user.id if user else None,
            user_name=user.name if user else "Sistema",
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details
        )
        db.add(log)
        db.flush()
    except Exception:
        pass


# ---- Route-to-entity mapping for automatic audit logging ----
ROUTE_ENTITY_MAP = {
    "/properties": "property",
    "/clients": "client",
    "/contracts": "contract",
    "/transactions/in": "transaction_in",
    "/transactions/out": "transaction_out",
    "/rooms": "room",
    "/landlords": "landlord",
    "/employees": "employee",
    "/maintenance": "maintenance",
    "/documents": "document",
    "/users": "user",
}

METHOD_ACTION_MAP = {
    "POST": "create",
    "PUT": "update",
    "DELETE": "delete",
}


def _get_entity_type(path: str) -> Optional[str]:
    """Determine entity type from the request path."""
    for route_prefix, entity in ROUTE_ENTITY_MAP.items():
        if path.startswith(route_prefix):
            return entity
    return None


def _extract_entity_id(path: str) -> Optional[int]:
    """Extract entity ID from path like /clients/42 or /transactions/in/15."""
    match = re.search(r'/(\d+)(?:/|$)', path)
    if match:
        return int(match.group(1))
    return None


def _get_user_from_token(request: Request):
    """Extract user info from JWT token in request headers."""
    from models import User
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:]
    try:
        secret = os.getenv("SECRET_KEY", "ferri-sistem-secret-key-change-in-production-2026")
        payload = jwt.decode(token, secret, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            return None
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == int(user_id)).first()
            return user
        finally:
            db.close()
    except Exception:
        return None


async def audit_middleware(request: Request, call_next):
    """Middleware that automatically logs POST/PUT/DELETE actions."""
    method = request.method
    path = request.url.path

    # Only log mutating operations
    if method not in METHOD_ACTION_MAP:
        return await call_next(request)

    # Skip auth, import, audit, health, and other non-entity routes
    skip_prefixes = ["/auth", "/import", "/audit", "/health", "/docs", "/openapi", "/uploads"]
    if any(path.startswith(p) for p in skip_prefixes):
        return await call_next(request)

    entity_type = _get_entity_type(path)
    if not entity_type:
        return await call_next(request)

    # Execute the actual request
    response = await call_next(request)

    # Only log if the request was successful (2xx)
    if 200 <= response.status_code < 300:
        action = METHOD_ACTION_MAP[method]
        entity_id = _extract_entity_id(path)
        user = _get_user_from_token(request)

        # Build details
        details = f"{action.upper()} {entity_type}"
        if entity_id:
            details += f" #{entity_id}"

        db = SessionLocal()
        try:
            log = AuditLog(
                user_id=user.id if user else None,
                user_name=user.name if user else "Desconhecido",
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                details=details,
            )
            db.add(log)
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    return response
