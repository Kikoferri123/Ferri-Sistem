from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from pydantic import EmailStr
from typing import Optional, List
from database import get_db
from models import (
    User, Client, Contract, MaintenanceRequest, Document, TransactionIn,
    Alert, Property, Room, Bed, UserRole, Message, News, RewardPoints, RewardTransaction,
    CheckInOut, Review, FAQ, Referral
)
from schemas import (
    Token, UserOut, ClientOut, ContractOut, DocumentOut,
    AlertOut, TransactionInOut
)
from auth import verify_password, get_password_hash, create_access_token, get_current_user
import os
import uuid
import time
from collections import defaultdict
import datetime as _dt

router = APIRouter(prefix="/mobile", tags=["Mobile Client"])

# ── Rate limiting ──────────────────────────────────────
_register_attempts: dict[str, list[float]] = defaultdict(list)
_RATE_LIMIT_WINDOW = 3600  # 1 hour
_MAX_REGISTER_ATTEMPTS = 5  # max registration attempts per hour


def _check_registration_rate_limit(ip: str):
    """Block if too many registration attempts from same IP."""
    now = time.time()
    _register_attempts[ip] = [t for t in _register_attempts[ip] if now - t < _RATE_LIMIT_WINDOW]
    if len(_register_attempts[ip]) >= _MAX_REGISTER_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Muitas tentativas de registro. Tente novamente em uma hora."
        )
    _register_attempts[ip].append(now)


# ── File upload config ──────────────────────────────────
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)


def _generate_client_code(db: Session) -> str:
    """Generate next CLI-XXX code."""
    last = db.query(Client).filter(Client.code != None).order_by(Client.code.desc()).first()
    if last and last.code and last.code.startswith("CLI-"):
        try:
            num = int(last.code.split("-")[1]) + 1
        except (ValueError, IndexError):
            num = 1
    else:
        num = 1
    return f"CLI-{str(num).zfill(3)}"


def _get_client_from_user(db: Session, user: User) -> Client:
    """Get the Client record linked to a User by email. Auto-creates if missing."""
    client = db.query(Client).filter(Client.email == user.email).first()
    if not client:
        # Auto-create Client record for users with CLIENTE role
        code = _generate_client_code(db)
        client = Client(
            code=code,
            name=user.name,
            email=user.email,
            status="ativo",
            monthly_value=0
        )
        db.add(client)
        db.commit()
        db.refresh(client)
    return client


# ── Request/Response Schemas ───────────────────────────

class MobileRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    nationality: Optional[str] = None
    birth_date: Optional[_dt.date] = None


class MobileLoginRequest(BaseModel):
    email: EmailStr
    password: str


class MobileSocialLoginRequest(BaseModel):
    provider: str  # "google" or "apple"
    id_token: str
    name: str
    email: EmailStr


class MobileProfileUpdate(BaseModel):
    phone: Optional[str] = None
    nationality: Optional[str] = None
    emergency_contact: Optional[str] = None
    profile_photo_url: Optional[str] = None


class MaintenanceRequestCreate(BaseModel):
    title: str
    description: str
    priority: str = ""  # "baixa", "media", "alta", "urgente"
    category: str = "maintenance"  # "maintenance", "cleaning", "plumbing", "electrical", "other"
    urgency: str = "normal"  # "low", "normal", "high", "urgent"
    photos: List[str] = []  # list of URLs


class MobileClientProfileOut(ClientOut):
    property: Optional[dict] = None
    rooms: List[dict] = []
    beds: List[dict] = []
    user: Optional[UserOut] = None
    contract: Optional[dict] = None
    my_room: Optional[dict] = None
    my_bed: Optional[dict] = None


# ────────────────────────────────────────────────────────
# 1. POST /mobile/register - Client self-registration
# ────────────────────────────────────────────────────────

@router.post("/register", response_model=Token)
def register(
    req: MobileRegisterRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Register a new client. Creates both User and Client records.
    Links them via email.
    """
    client_ip = request.client.host if request.client else "unknown"
    _check_registration_rate_limit(client_ip)

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email já cadastrado"
        )

    # Check if client already exists
    existing_client = db.query(Client).filter(Client.email == req.email).first()
    if existing_client:
        raise HTTPException(
            status_code=400,
            detail="Clientela já cadastrada com este email"
        )

    try:
        # Create User with CLIENTE role
        user = User(
            name=req.name,
            email=req.email,
            password_hash=get_password_hash(req.password),
            role=UserRole.CLIENTE,
            active=True
        )
        db.add(user)
        db.flush()

        # Create Client linked by email
        code = _generate_client_code(db)
        client = Client(
            code=code,
            name=req.name,
            email=req.email,
            phone=req.phone,
            nationality=req.nationality,
            birth_date=req.birth_date,
            status="ativo",
            monthly_value=0
        )
        db.add(client)
        db.commit()
        db.refresh(user)

        # Generate token
        token = create_access_token(data={"sub": str(user.id)})
        return Token(
            access_token=token,
            token_type="bearer",
            user=UserOut.model_validate(user)
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao registrar: {str(e)}"
        )


# ────────────────────────────────────────────────────────
# 2. POST /mobile/login - Client login (email+password)
# ────────────────────────────────────────────────────────

@router.post("/login", response_model=Token)
def login(
    req: MobileLoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Login with email and password. Only for CLIENTE role.
    Returns token and user profile.
    """
    user = db.query(User).filter(User.email == req.email).first()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Email ou senha incorretos"
        )

    if not user.active:
        raise HTTPException(
            status_code=403,
            detail="Usuário desativado"
        )

    # Only allow CLIENTE role
    if user.role != UserRole.CLIENTE:
        raise HTTPException(
            status_code=403,
            detail="Acesso restrito a clientes"
        )

    token = create_access_token(data={"sub": str(user.id)})
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )


# ────────────────────────────────────────────────────────
# 3. POST /mobile/login/social - Social login
# ────────────────────────────────────────────────────────

@router.post("/login/social", response_model=Token)
def social_login(
    req: MobileSocialLoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Social login (Google/Apple). Creates account if doesn't exist.
    """
    if req.provider not in ["google", "apple"]:
        raise HTTPException(
            status_code=400,
            detail="Provider deve ser 'google' ou 'apple'"
        )

    # Check if user already exists by email
    user = db.query(User).filter(User.email == req.email).first()

    if not user:
        client_ip = request.client.host if request.client else "unknown"
        _check_registration_rate_limit(client_ip)

        try:
            # Create new user for social login
            user = User(
                name=req.name,
                email=req.email,
                password_hash=get_password_hash(""),  # No password for social-only
                role=UserRole.CLIENTE,
                active=True,
                social_provider=req.provider,
                social_id=req.id_token
            )
            db.add(user)
            db.flush()

            # Create linked Client
            client = Client(
                name=req.name,
                email=req.email,
                status="ativo"
            )
            db.add(client)
            db.commit()
            db.refresh(user)
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Erro ao criar conta: {str(e)}"
            )
    else:
        if not user.active:
            raise HTTPException(
                status_code=403,
                detail="Usuário desativado"
            )

    token = create_access_token(data={"sub": str(user.id)})
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )


# ────────────────────────────────────────────────────────
# 4. GET /mobile/profile - Get own client profile
# ────────────────────────────────────────────────────────

@router.get("/profile")
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the current client's profile including property and room/bed info.
    """
    import traceback as _tb

    # Verify user is a cliente
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(
            status_code=403,
            detail="Apenas clientes podem acessar este endpoint"
        )

    try:
        # Get client record
        client = _get_client_from_user(db, current_user)

        # Build response manually to avoid model_validate issues
        result = {
            "id": client.id,
            "code": client.code,
            "name": client.name,
            "email": client.email,
            "phone": client.phone,
            "nationality": client.nationality,
            "birth_date": str(client.birth_date) if client.birth_date else None,
            "document_id": client.document_id,
            "referencia": client.referencia,
            "status": client.status.value if hasattr(client.status, 'value') else str(client.status),
            "property_id": client.property_id,
            "property_name": None,
            "room_id": client.room_id,
            "room_name": None,
            "bed_id": client.bed_id,
            "bed_name": None,
            "check_in": str(client.check_in) if client.check_in else None,
            "check_out": str(client.check_out) if client.check_out else None,
            "monthly_value": client.monthly_value or 0,
            "payment_method": client.payment_method,
            "notes": client.notes,
            "created_at": client.created_at.isoformat() if client.created_at else None,
            "property": None,
            "rooms": [],
            "beds": [],
            "user": {
                "id": current_user.id,
                "name": current_user.name,
                "email": current_user.email,
                "role": current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
                "active": current_user.active,
            },
            "contract": None,
            "my_room": None,
            "my_bed": None,
        }
        # Add property info if client has one
        if client.property_id:
            prop = db.query(Property).filter(Property.id == client.property_id).first()
            if prop:
                result["property"] = {
                    "id": prop.id,
                    "code": prop.code,
                    "name": prop.name,
                    "address": prop.address,
                    "type": prop.type,
                }
                result["property_name"] = prop.name

        # Add the client's specific room and bed info
        if client.room_id:
            room = db.query(Room).filter(Room.id == client.room_id).first()
            if room:
                result["my_room"] = {
                    "id": room.id,
                    "name": room.name,
                    "type": room.room_type,
                    "monthly_value": room.monthly_value,
                }
                result["room_name"] = room.name

        if client.bed_id:
            bed = db.query(Bed).filter(Bed.id == client.bed_id).first()
            if bed:
                result["my_bed"] = {
                    "id": bed.id,
                    "name": bed.name,
                    "monthly_value": bed.monthly_value,
                }
                result["bed_name"] = bed.name

        # Add active contract info
        if client.id:
            active_contract = db.query(Contract).filter(
                Contract.client_id == client.id,
                Contract.status.in_(["vigente", "pendente"])
            ).order_by(Contract.created_at.desc()).first()
            if active_contract:
                result["contract"] = {
                    "id": active_contract.id,
                    "type": active_contract.type.value if active_contract.type else None,
                    "start_date": str(active_contract.start_date) if active_contract.start_date else None,
                    "end_date": str(active_contract.end_date) if active_contract.end_date else None,
                    "value": active_contract.value,
                    "status": active_contract.status.value if active_contract.status else None,
                    "signed": active_contract.signed,
                    "file_url": active_contract.file_url,
                }

        # Keep rooms/beds for backward compatibility
        if client.property_id:
            rooms = db.query(Room).filter(Room.property_id == client.property_id).all()
            for room in rooms:
                room_data = {
                    "id": room.id,
                    "name": room.name,
                    "type": room.room_type,
                    "num_beds": room.num_beds,
                    "monthly_value": room.monthly_value,
                    "beds": []
                }
                beds_in_room = db.query(Bed).filter(Bed.room_id == room.id).all()
                for bed in beds_in_room:
                    bed_data = {
                        "id": bed.id,
                        "name": bed.name,
                        "monthly_value": bed.monthly_value
                    }
                    room_data["beds"].append(bed_data)
                result["rooms"].append(room_data)

        return result

    except HTTPException:
        raise
    except Exception as e:
        print(f"[PROFILE ERROR] {e}")
        _tb.print_exc()
        raise HTTPException(status_code=500, detail=f"Profile error: {str(e)}")


# ────────────────────────────────────────────────────────
# 5. PUT /mobile/profile - Update own profile
# ────────────────────────────────────────────────────────

@router.put("/profile", response_model=MobileClientProfileOut)
def update_profile(
    req: MobileProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update the current client's profile.
    Can update: phone, nationality, emergency_contact, profile_photo_url
    """
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(
            status_code=403,
            detail="Apenas clientes podem acessar este endpoint"
        )

    client = _get_client_from_user(db, current_user)

    # Update allowed fields
    if req.phone is not None:
        client.phone = req.phone
    if req.nationality is not None:
        client.nationality = req.nationality
    if req.emergency_contact is not None:
        client.notes = req.emergency_contact  # Store in notes field as fallback
    if req.profile_photo_url is not None:
        # Store profile photo URL (could extend Client model with this field)
        pass

    db.commit()
    db.refresh(client)

    result = MobileClientProfileOut.model_validate(client)
    result.user = UserOut.model_validate(current_user)
    return result


# ────────────────────────────────────────────────────────
# 5b. PUT /mobile/change-password - Change password
# ────────────────────────────────────────────────────────

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.put("/change-password")
def change_password(
    req: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Change the current user's password."""
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(status_code=403, detail="Apenas clientes podem acessar este endpoint")

    # Validate current password
    if not current_user.password_hash or not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")

    # Validate new password strength
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="A nova senha deve ter pelo menos 6 caracteres")

    current_user.password_hash = get_password_hash(req.new_password)
    db.commit()
    return {"message": "Senha alterada com sucesso"}


# ────────────────────────────────────────────────────────
# 6. GET /mobile/contracts - List my contracts
# ────────────────────────────────────────────────────────

@router.get("/contracts", response_model=List[ContractOut])
def list_my_contracts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all contracts for the logged-in client.
    """
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(
            status_code=403,
            detail="Apenas clientes podem acessar este endpoint"
        )

    client = _get_client_from_user(db, current_user)
    contracts = db.query(Contract).filter(Contract.client_id == client.id).order_by(
        Contract.created_at.desc()
    ).all()

    result = []
    for contract in contracts:
        out = ContractOut.model_validate(contract)
        if contract.client:
            out.client_name = contract.client.name
        if contract.property:
            out.property_name = contract.property.name
        result.append(out)

    return result


# ────────────────────────────────────────────────────────
# 7. GET /mobile/contracts/{contract_id} - Contract detail
# ────────────────────────────────────────────────────────

@router.get("/contracts/{contract_id}", response_model=ContractOut)
def get_contract_detail(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific contract's details with PDF URL.
    """
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(
            status_code=403,
            detail="Apenas clientes podem acessar este endpoint"
        )

    client = _get_client_from_user(db, current_user)
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.client_id == client.id
    ).first()

    if not contract:
        raise HTTPException(
            status_code=404,
            detail="Contrato não encontrado"
        )

    result = ContractOut.model_validate(contract)
    if contract.client:
        result.client_name = contract.client.name
    if contract.property:
        result.property_name = contract.property.name

    return result


# ────────────────────────────────────────────────────────
# 8. PUT /mobile/contracts/{contract_id}/sign - Sign contract
# ────────────────────────────────────────────────────────

class ContractSignRequest(BaseModel):
    signature: str  # base64 PNG


@router.put("/contracts/{contract_id}/sign")
def sign_contract(
    contract_id: int,
    req: ContractSignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sign a contract by uploading a base64-encoded PNG signature.
    """
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(
            status_code=403,
            detail="Apenas clientes podem acessar este endpoint"
        )

    client = _get_client_from_user(db, current_user)
    contract = db.query(Contract).filter(
        Contract.id == contract_id,
        Contract.client_id == client.id
    ).first()

    if not contract:
        raise HTTPException(
            status_code=404,
            detail="Contrato não encontrado"
        )

    # Validate signature format
    if not req.signature or not req.signature.startswith("data:image/png;base64,"):
        raise HTTPException(
            status_code=400,
            detail="Assinatura deve ser base64 PNG"
        )

    try:
        # Store the signature
        contract.signature_licensee = req.signature
        contract.signed = True
        contract.updated_at = _dt.datetime.utcnow()
        db.commit()

        return {
            "status": "success",
            "message": "Contrato assinado com sucesso",
            "contract_id": contract.id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao assinar contrato: {str(e)}"
        )


# ────────────────────────────────────────────────────────
# 9. GET /mobile/requests - List my maintenance requests
# ────────────────────────────────────────────────────────

@router.get("/requests")
def list_my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all maintenance requests for the client's property.
    """
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(
            status_code=403,
            detail="Apenas clientes podem acessar este endpoint"
        )

    client = _get_client_from_user(db, current_user)

    if not client.property_id:
        return []

    requests = db.query(MaintenanceRequest).filter(
        MaintenanceRequest.property_id == client.property_id
    ).order_by(MaintenanceRequest.created_at.desc()).all()

    return [
        {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "status": r.status,
            "priority": r.priority,
            "cost": r.cost,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
            "resolved_at": r.resolved_at
        }
        for r in requests
    ]


# ────────────────────────────────────────────────────────
# 10. POST /mobile/requests - Create maintenance request
# ────────────────────────────────────────────────────────

@router.post("/requests")
def create_request(
    req: MaintenanceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new maintenance request for the client's property.
    """
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(
            status_code=403,
            detail="Apenas clientes podem acessar este endpoint"
        )

    client = _get_client_from_user(db, current_user)

    # Map urgency from frontend to priority for DB
    urgency_map = {"low": "baixa", "normal": "media", "high": "alta", "urgent": "urgente"}
    effective_priority = req.priority if req.priority else urgency_map.get(req.urgency, "media")

    try:
        maintenance_req = MaintenanceRequest(
            property_id=client.property_id if client.property_id else None,
            title=req.title,
            description=f"[{req.category}] {req.description}" if req.category else req.description,
            priority=effective_priority,
            status="aberto",
            created_by=current_user.name
        )
        db.add(maintenance_req)
        db.commit()
        db.refresh(maintenance_req)

        return {
            "id": maintenance_req.id,
            "title": maintenance_req.title,
            "description": maintenance_req.description,
            "status": maintenance_req.status,
            "priority": maintenance_req.priority,
            "category": req.category,
            "created_at": maintenance_req.created_at,
            "message": "Solicitação criada com sucesso"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar solicitação: {str(e)}"
        )


# ────────────────────────────────────────────────────────
# 11. GET /mobile/alerts - My alerts
# ────────────────────────────────────────────────────────

@router.get("/alerts", response_model=List[AlertOut])
def get_my_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get alerts related to the client.
    (Implementation depends on alert architecture - this is a placeholder)
    """
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(
            status_code=403,
            detail="Apenas clientes podem acessar este endpoint"
        )

    client = _get_client_from_user(db, current_user)

    # Get alerts for the client's property
    alerts = []
    if client.property_id:
        alerts = db.query(Alert).filter(
            Alert.entity_type == "property",
            Alert.entity_id == client.property_id
        ).order_by(Alert.created_at.desc()).all()

    return [AlertOut.model_validate(a) for a in alerts]


# ────────────────────────────────────────────────────────
# 12. POST /mobile/documents/upload - Upload document
# ────────────────────────────────────────────────────────

@router.post("/documents/upload", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form("Documento"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a document (payment receipt, photos, etc).
    """
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(
            status_code=403,
            detail="Apenas clientes podem acessar este endpoint"
        )

    client = _get_client_from_user(db, current_user)

    # Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de arquivo não permitido. Permitidos: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read file content
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Arquivo muito grande (max 10MB)"
        )

    try:
        _ensure_upload_dir()
        subfolder = f"client_{client.id}"
        folder = os.path.join(UPLOAD_DIR, subfolder)
        os.makedirs(folder, exist_ok=True)

        # Generate unique filename
        unique_name = f"{uuid.uuid4().hex[:8]}_{file.filename}"
        file_path = os.path.join(folder, unique_name)

        # Save file
        with open(file_path, "wb") as f:
            f.write(content)

        # Save to database
        relative_url = f"/uploads/{subfolder}/{unique_name}"
        doc = Document(
            name=file.filename or "documento",
            type=ext.lstrip(".").lower(),
            category=category,
            file_url=relative_url,
            file_size=len(content),
            client_id=client.id
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

        result = DocumentOut.model_validate(doc)
        result.client_name = client.name
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao fazer upload: {str(e)}"
        )


# ────────────────────────────────────────────────────────
# 13. GET /mobile/documents - List my documents
# ────────────────────────────────────────────────────────

@router.get("/documents", response_model=List[DocumentOut])
def list_my_documents(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all documents uploaded by the client.
    """
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(
            status_code=403,
            detail="Apenas clientes podem acessar este endpoint"
        )

    client = _get_client_from_user(db, current_user)

    q = db.query(Document).filter(Document.client_id == client.id)
    if category:
        q = q.filter(Document.category == category)

    docs = q.order_by(Document.uploaded_at.desc()).all()

    result = []
    for d in docs:
        out = DocumentOut.model_validate(d)
        out.client_name = client.name
        result.append(out)

    return result


# ────────────────────────────────────────────────────────
# 14. GET /mobile/payments - My payment history
# ────────────────────────────────────────────────────────

@router.get("/payments", response_model=List[TransactionInOut])
def get_my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get payment history (TransactionIn records) for the client.
    """
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(
            status_code=403,
            detail="Apenas clientes podem acessar este endpoint"
        )

    client = _get_client_from_user(db, current_user)

    transactions = db.query(TransactionIn).filter(
        TransactionIn.client_id == client.id
    ).order_by(TransactionIn.date.desc()).all()

    result = []
    for t in transactions:
        out = TransactionInOut.model_validate(t)
        if t.property:
            out.property_name = t.property.name
        if t.client:
            out.client_name = t.client.name
        if t.room:
            out.room_name = t.room.name
        if t.bed:
            out.bed_name = t.bed.name
        result.append(out)

    return result


# ────────────────────────────────────────────────────────
# 15. GET /mobile/property - My property details
# ────────────────────────────────────────────────────────

@router.get("/property")
def get_my_property(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get full property details including rooms, beds, and amenities.
    """
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(
            status_code=403,
            detail="Apenas clientes podem acessar este endpoint"
        )

    client = _get_client_from_user(db, current_user)

    if not client.property_id:
        raise HTTPException(
            status_code=404,
            detail="Cliente não tem propriedade associada"
        )

    prop = db.query(Property).filter(Property.id == client.property_id).first()
    if not prop:
        raise HTTPException(
            status_code=404,
            detail="Propriedade não encontrada"
        )

    # Build property response with all related data
    property_data = {
        "id": prop.id,
        "code": prop.code,
        "name": prop.name,
        "address": prop.address,
        "type": prop.type,
        "monthly_rent": prop.monthly_rent,
        "owner_name": prop.owner_name,
        "owner_contact": prop.owner_contact,
        "status": prop.status,
        "notes": prop.notes,
        "created_at": prop.created_at,
        "rooms": []
    }

    # Add rooms and beds
    rooms = db.query(Room).filter(Room.property_id == prop.id).all()
    for room in rooms:
        room_data = {
            "id": room.id,
            "name": room.name,
            "type": room.room_type,
            "num_beds": room.num_beds,
            "monthly_value": room.monthly_value,
            "notes": room.notes,
            "beds": []
        }

        beds = db.query(Bed).filter(Bed.room_id == room.id).all()
        for bed in beds:
            bed_data = {
                "id": bed.id,
                "name": bed.name,
                "monthly_value": bed.monthly_value,
                "notes": bed.notes
            }
            room_data["beds"].append(bed_data)

        property_data["rooms"].append(room_data)

    return property_data


# ── Messages ──────────────────────────────────────────

class MessageCreate(BaseModel):
    subject: Optional[str] = None
    body: str

@router.get("/messages")
def list_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(status_code=403, detail="Apenas clientes")
    client = _get_client_from_user(db, current_user)
    messages = db.query(Message).filter(
        Message.client_id == client.id
    ).order_by(Message.created_at.desc()).all()
    return [
        {
            "id": m.id,
            "sender_type": m.sender_type,
            "sender_name": m.sender_name,
            "subject": m.subject,
            "body": m.body,
            "read": m.read,
            "created_at": m.created_at
        }
        for m in messages
    ]

@router.post("/messages")
def send_message(
    req: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(status_code=403, detail="Apenas clientes")
    client = _get_client_from_user(db, current_user)
    msg = Message(
        client_id=client.id,
        sender_type="client",
        sender_name=current_user.name,
        subject=req.subject,
        body=req.body,
        read=False
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {
        "id": msg.id,
        "sender_type": msg.sender_type,
        "sender_name": msg.sender_name,
        "subject": msg.subject,
        "body": msg.body,
        "read": msg.read,
        "created_at": msg.created_at,
        "message": "Mensagem enviada com sucesso"
    }

@router.put("/messages/{message_id}/read")
def mark_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(status_code=403, detail="Apenas clientes")
    client = _get_client_from_user(db, current_user)
    msg = db.query(Message).filter(Message.id == message_id, Message.client_id == client.id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Mensagem não encontrada")
    msg.read = True
    db.commit()
    return {"status": "ok"}


# ── News ──────────────────────────────────────────────

@router.get("/news")
def list_news(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(status_code=403, detail="Apenas clientes")
    q = db.query(News).filter(News.published == True)
    if category:
        q = q.filter(News.category == category)
    items = q.order_by(News.created_at.desc()).all()
    return [
        {
            "id": n.id,
            "title": n.title,
            "body": n.body,
            "category": n.category,
            "image_url": n.image_url,
            "created_at": n.created_at
        }
        for n in items
    ]


# ── Rewards ──────────────────────────────────────────

@router.get("/rewards")
def get_my_rewards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(status_code=403, detail="Apenas clientes")
    client = _get_client_from_user(db, current_user)

    # Get or create reward points
    rp = db.query(RewardPoints).filter(RewardPoints.client_id == client.id).first()
    if not rp:
        rp = RewardPoints(client_id=client.id, total_points=0, level="Bronze", streak_months=0)
        db.add(rp)
        db.commit()
        db.refresh(rp)

    # Get reward transactions
    transactions = db.query(RewardTransaction).filter(
        RewardTransaction.client_id == client.id
    ).order_by(RewardTransaction.created_at.desc()).limit(50).all()

    # Level thresholds
    level_info = {
        "Bronze": {"min": 0, "next": "Silver", "next_at": 500},
        "Silver": {"min": 500, "next": "Gold", "next_at": 1500},
        "Gold": {"min": 1500, "next": "Platinum", "next_at": 5000},
        "Platinum": {"min": 5000, "next": None, "next_at": None},
    }
    current_level = level_info.get(rp.level, level_info["Bronze"])

    return {
        "total_points": rp.total_points,
        "level": rp.level,
        "streak_months": rp.streak_months,
        "next_level": current_level.get("next"),
        "points_to_next_level": (current_level.get("next_at") or rp.total_points) - rp.total_points,
        "transactions": [
            {
                "id": t.id,
                "points": t.points,
                "type": t.type,
                "description": t.description,
                "created_at": t.created_at
            }
            for t in transactions
        ]
    }


# ── Invoice ──────────────────────────────────────────

@router.get("/payments/{payment_id}/invoice")
def get_payment_invoice(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(status_code=403, detail="Apenas clientes")
    client = _get_client_from_user(db, current_user)

    payment = db.query(TransactionIn).filter(
        TransactionIn.id == payment_id,
        TransactionIn.client_id == client.id
    ).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")

    # Build invoice data
    prop = db.query(Property).filter(Property.id == payment.property_id).first() if payment.property_id else None

    return {
        "invoice_number": f"INV-{payment.id:06d}",
        "date": payment.date,
        "client_name": client.name,
        "client_email": client.email,
        "property_name": prop.name if prop else None,
        "property_address": prop.address if prop else None,
        "description": payment.description,
        "category": payment.category,
        "method": payment.method,
        "amount": payment.amount,
        "competencia_month": payment.competencia_month,
        "competencia_year": payment.competencia_year,
        "status": "paid",
        "created_at": payment.created_at
    }


# ── Check-in / Check-out ──────────────────────────────

class CheckInOutCreate(BaseModel):
    type: str  # "check_in" or "check_out"
    notes: Optional[str] = None

@router.post("/checkin")
def do_checkin(
    req: CheckInOutCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(status_code=403, detail="Apenas clientes")
    client = _get_client_from_user(db, current_user)
    if not client.property_id:
        raise HTTPException(status_code=400, detail="Cliente sem propriedade associada")

    record = CheckInOut(
        client_id=client.id,
        property_id=client.property_id,
        type=req.type,
        notes=req.notes
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {
        "id": record.id,
        "type": record.type,
        "date": record.date,
        "notes": record.notes,
        "confirmed": record.confirmed_by_admin,
        "message": f"{'Check-in' if req.type == 'check_in' else 'Check-out'} registado com sucesso"
    }

@router.get("/checkin/history")
def checkin_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(status_code=403, detail="Apenas clientes")
    client = _get_client_from_user(db, current_user)
    records = db.query(CheckInOut).filter(
        CheckInOut.client_id == client.id
    ).order_by(CheckInOut.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "type": r.type,
            "date": r.date,
            "notes": r.notes,
            "confirmed": r.confirmed_by_admin,
            "created_at": r.created_at
        }
        for r in records
    ]


# ── Reviews ──────────────────────────────────────────

class ReviewCreate(BaseModel):
    rating: int
    comment: Optional[str] = None
    category: Optional[str] = "geral"

@router.post("/reviews")
def create_review(
    req: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(status_code=403, detail="Apenas clientes")
    client = _get_client_from_user(db, current_user)
    if not client.property_id:
        raise HTTPException(status_code=400, detail="Cliente sem propriedade associada")
    if req.rating < 1 or req.rating > 5:
        raise HTTPException(status_code=400, detail="Rating deve ser entre 1 e 5")

    review = Review(
        client_id=client.id,
        property_id=client.property_id,
        rating=req.rating,
        comment=req.comment,
        category=req.category or "geral"
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return {
        "id": review.id,
        "rating": review.rating,
        "comment": review.comment,
        "category": review.category,
        "created_at": review.created_at,
        "message": "Avaliação enviada com sucesso"
    }

@router.get("/reviews")
def list_my_reviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(status_code=403, detail="Apenas clientes")
    client = _get_client_from_user(db, current_user)
    reviews = db.query(Review).filter(Review.client_id == client.id).order_by(Review.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "rating": r.rating,
            "comment": r.comment,
            "category": r.category,
            "created_at": r.created_at
        }
        for r in reviews
    ]


# ── FAQ ──────────────────────────────────────────────

@router.get("/faq")
def list_faq(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(status_code=403, detail="Apenas clientes")
    q = db.query(FAQ).filter(FAQ.published == True)
    if category:
        q = q.filter(FAQ.category == category)
    items = q.order_by(FAQ.order, FAQ.id).all()
    return [
        {
            "id": f.id,
            "question": f.question,
            "answer": f.answer,
            "category": f.category
        }
        for f in items
    ]


# ── Referrals ──────────────────────────────────────────

class ReferralCreate(BaseModel):
    referred_name: str
    referred_email: Optional[str] = None
    referred_phone: Optional[str] = None

@router.post("/referrals")
def create_referral(
    req: ReferralCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(status_code=403, detail="Apenas clientes")
    client = _get_client_from_user(db, current_user)

    referral = Referral(
        referrer_client_id=client.id,
        referred_name=req.referred_name,
        referred_email=req.referred_email,
        referred_phone=req.referred_phone,
        status="pending"
    )
    db.add(referral)
    db.commit()
    db.refresh(referral)

    # Award referral points
    rp = db.query(RewardPoints).filter(RewardPoints.client_id == client.id).first()
    if not rp:
        rp = RewardPoints(client_id=client.id, total_points=0)
        db.add(rp)
        db.flush()

    rp.total_points += 50  # 50 points for referral
    rt = RewardTransaction(
        client_id=client.id,
        points=50,
        type="referral",
        description=f"Indicação de {req.referred_name}"
    )
    db.add(rt)
    db.commit()

    return {
        "id": referral.id,
        "referred_name": referral.referred_name,
        "status": referral.status,
        "points_earned": 50,
        "message": "Indicação registada! Ganhou 50 pontos."
    }

@router.get("/referrals")
def list_referrals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.CLIENTE:
        raise HTTPException(status_code=403, detail="Apenas clientes")
    client = _get_client_from_user(db, current_user)
    referrals = db.query(Referral).filter(Referral.referrer_client_id == client.id).order_by(Referral.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "referred_name": r.referred_name,
            "referred_email": r.referred_email,
            "status": r.status,
            "bonus_points": r.bonus_points,
            "created_at": r.created_at
        }
        for r in referrals
    ]
