"""
Email service for Ferri Sistem Management System.
Uses Resend API (recommended for Railway/cloud hosting).

Required env vars:
  RESEND_API_KEY – API key from resend.com
  EMAIL_SENDER   – verified sender email (e.g. info@ferrisystem.com)
"""

import os
import base64
from typing import Optional

# Resend config
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
EMAIL_SENDER = os.getenv("EMAIL_SENDER", os.getenv("SMTP_USER", "info@ferrisystem.com"))

# Backward compat alias used by contracts.py
EMAIL_PASSWORD = RESEND_API_KEY or os.getenv("SMTP_PASSWORD", "")


def send_email(
    to: str,
    subject: str,
    html_body: str,
    attachment_bytes: Optional[bytes] = None,
    attachment_filename: Optional[str] = None,
    cc: Optional[str] = None,
) -> dict:
    """
    Send an email via Resend API.
    Returns {"success": True} or {"success": False, "error": "..."}.
    """
    print(f"[EMAIL] Sending to={to}, subject={subject[:60]}...")
    print(f"[EMAIL] RESEND_API_KEY={'SET(' + str(len(RESEND_API_KEY)) + ' chars)' if RESEND_API_KEY else 'NOT SET'}, EMAIL_SENDER={EMAIL_SENDER}")

    if not RESEND_API_KEY:
        print("[EMAIL] ERROR: RESEND_API_KEY not configured!")
        return {"success": False, "error": "Email nao configurado. Defina RESEND_API_KEY nas variaveis de ambiente do Railway."}

    try:
        import httpx

        payload: dict = {
            "from": f"Ferri Sistem <{EMAIL_SENDER}>",
            "to": [to],
            "subject": subject,
            "html": html_body,
        }

        if cc:
            payload["cc"] = [cc]

        if attachment_bytes and attachment_filename:
            b64_content = base64.b64encode(attachment_bytes).decode("utf-8")
            payload["attachments"] = [{"filename": attachment_filename, "content": b64_content}]

        print(f"[EMAIL] Sending via Resend API from={EMAIL_SENDER}...")
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
            json=payload,
            timeout=30,
        )

        print(f"[EMAIL] Resend response: status={response.status_code}, body={response.text[:200]}")

        if response.status_code in (200, 201):
            return {"success": True, "id": response.json().get("id")}
        else:
            return {"success": False, "error": f"Resend API error {response.status_code}: {response.text}"}

    except Exception as e:
        print(f"[EMAIL] Resend exception: {e}")
        return {"success": False, "error": str(e)}
