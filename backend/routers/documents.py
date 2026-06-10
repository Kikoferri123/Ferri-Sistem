from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import Document, Property, Client, UserRole
from schemas import DocumentOut
from auth import get_current_user, require_roles
from typing import List, Optional
import os
import uuid
import shutil

router = APIRouter(prefix="/documents", tags=["Documents"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".doc", ".docx"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


def _ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("", response_model=List[DocumentOut])
def list_documents(
    property_id: Optional[int] = None,
    client_id: Optional[int] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    q = db.query(Document)
    if property_id:
        q = q.filter(Document.property_id == property_id)
    if client_id:
        q = q.filter(Document.client_id == client_id)
    if category:
        q = q.filter(Document.category == category)
    docs = q.order_by(Document.uploaded_at.desc()).all()
    result = []
    for d in docs:
        out = DocumentOut.model_validate(d)
        if d.property:
            out.property_name = d.property.name
        if d.client:
            out.client_name = d.client.name
        result.append(out)
    return result


@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    property_id: Optional[int] = Form(None),
    client_id: Optional[int] = Form(None),
    category: str = Form("Documento"),
    doc_type: str = Form("Documento"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if not property_id and not client_id:
        raise HTTPException(400, "Informe property_id ou client_id")

    # Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Tipo de arquivo nao permitido. Permitidos: {', '.join(ALLOWED_EXTENSIONS)}")

    # Read file content
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(400, "Arquivo muito grande (max 20MB)")

    # Determine subfolder
    if property_id:
        subfolder = f"property_{property_id}"
    else:
        subfolder = f"client_{client_id}"

    _ensure_upload_dir()
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
        type=doc_type,
        category=category,
        file_url=relative_url,
        file_size=len(content),
        property_id=property_id,
        client_id=client_id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    out = DocumentOut.model_validate(doc)
    if doc.property:
        out.property_name = doc.property.name
    if doc.client:
        out.client_name = doc.client.name
    return out


@router.delete("/{doc_id}")
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN, UserRole.OPERACIONAL))
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(404, "Documento nao encontrado")

    # Delete file from disk
    if doc.file_url:
        file_path = os.path.join(os.path.dirname(UPLOAD_DIR), doc.file_url.lstrip("/"))
        if os.path.exists(file_path):
            os.remove(file_path)

    db.delete(doc)
    db.commit()
    return {"detail": "Documento removido"}
