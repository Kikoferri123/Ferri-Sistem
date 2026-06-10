from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Setting, UserRole
from auth import get_current_user, require_roles
from typing import Dict, Any
from pydantic import BaseModel

router = APIRouter(prefix="/branding", tags=["Branding"])

# Default branding configuration
BRANDING_DEFAULTS = {
    "company_name": "Ferri Sistem",
    "company_logo_url": "",
    "primary_color": "#1B4D3E",
    "accent_color": "#E8B931",
    "background_color": "#F5F5F0",
    "contact_email": "",
    "contact_phone": "",
    "contact_address": "",
    "welcome_message": "Bem-vindo ao seu portal de gestão de propriedades",
    "app_description": "Sistema de gestão de propriedades",
    "footer_text": "© 2026 Ferri Sistem. Todos os direitos reservados."
}

class BrandingUpdate(BaseModel):
    """Request model for updating branding settings - accepts any subset of keys"""
    company_name: str = None
    company_logo_url: str = None
    primary_color: str = None
    accent_color: str = None
    background_color: str = None
    contact_email: str = None
    contact_phone: str = None
    contact_address: str = None
    welcome_message: str = None
    app_description: str = None
    footer_text: str = None

    class Config:
        from_attributes = True


def _get_all_branding_config(db: Session) -> Dict[str, Any]:
    """
    Retrieve all branding settings from database.
    Returns defaults for any missing settings.
    """
    config = {}
    for key, default_value in BRANDING_DEFAULTS.items():
        setting = db.query(Setting).filter(
            Setting.key == key,
            Setting.category == "branding"
        ).first()
        config[key] = setting.value if setting else default_value
    return config


@router.get("/config")
def get_branding_config_public(db: Session = Depends(get_db)):
    """
    PUBLIC ENDPOINT - No authentication required
    Returns all branding settings as a flat JSON object.
    Called by mobile app on startup to configure itself.
    If a setting doesn't exist yet, returns the default value.
    """
    config = _get_all_branding_config(db)
    return config


@router.get("")
def get_branding_config(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Requires authentication.
    Returns all branding settings as a flat JSON object.
    Used by admin panel.
    """
    config = _get_all_branding_config(db)
    return config


@router.put("")
def update_branding_config(
    update_data: BrandingUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.ADMIN))
):
    """
    Admin only endpoint.
    Accepts a JSON body with any subset of the branding keys.
    Creates or updates each setting in the database.
    Returns the updated full config.
    """
    # Filter out None values - only update keys that were provided
    updates = {k: v for k, v in update_data.dict().items() if v is not None}

    for key, value in updates.items():
        # Validate that key is in allowed branding keys
        if key not in BRANDING_DEFAULTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid branding key: {key}"
            )

        # Check if setting exists
        setting = db.query(Setting).filter(
            Setting.key == key,
            Setting.category == "branding"
        ).first()

        if setting:
            setting.value = value
        else:
            setting = Setting(key=key, value=value, category="branding")
            db.add(setting)

    db.commit()

    # Return the full updated config
    config = _get_all_branding_config(db)
    return config
