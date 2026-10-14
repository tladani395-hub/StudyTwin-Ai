"""
Email Service for Aanvi
Supports Mailpit local mail catcher (port 1025) in development,
standard SMTP in production, and local outbox file inspection.
"""

import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Optional, List, Dict

OUTBOX_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "scratch", "mailpit_outbox.json")
_IN_MEMORY_OUTBOX: List[Dict] = []


def _save_to_local_outbox(entry: dict):
    _IN_MEMORY_OUTBOX.append(entry)
    try:
        os.makedirs(os.path.dirname(OUTBOX_FILE), exist_ok=True)
        current = []
        if os.path.exists(OUTBOX_FILE):
            with open(OUTBOX_FILE, "r", encoding="utf-8") as f:
                try:
                    current = json.load(f)
                except Exception:
                    current = []
        current.append(entry)
        with open(OUTBOX_FILE, "w", encoding="utf-8") as f:
            json.dump(current, f, indent=2)
    except Exception as e:
        print(f"[EmailService] Failed to persist outbox entry: {e}")


def get_sent_emails() -> List[Dict]:
    """Returns all sent emails captured during this runtime session."""
    return list(_IN_MEMORY_OUTBOX)


def clear_sent_emails():
    """Clears captured outbox emails for test isolation."""
    global _IN_MEMORY_OUTBOX
    _IN_MEMORY_OUTBOX = []
    if os.path.exists(OUTBOX_FILE):
        try:
            with open(OUTBOX_FILE, "w", encoding="utf-8") as f:
                json.dump([], f)
        except Exception:
            pass


def send_email(to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
    """
    Sends an email using SMTP or Mailpit. If SMTP connection fails or is unavailable,
    saves the email to the local outbox file for dev/testing inspection.
    """
    smtp_host = os.getenv("SMTP_HOST", "localhost")
    smtp_port = int(os.getenv("SMTP_PORT", "1025"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    from_email = os.getenv("SMTP_FROM", "support@aanvi.ai")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Aanvi AI Study Companion <{from_email}>"
    msg["To"] = to_email

    if text_content:
        msg.attach(MIMEText(text_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    record = {
        "timestamp": datetime.utcnow().isoformat(),
        "to": to_email,
        "from": from_email,
        "subject": subject,
        "html_preview": html_content[:300],
        "content": html_content
    }

    try:
        # Attempt delivery via Mailpit / SMTP
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=2.0)
        if smtp_user and smtp_pass:
            server.login(smtp_user, smtp_pass)
        server.sendmail(from_email, [to_email], msg.as_string())
        server.quit()
        record["delivered_via"] = f"SMTP ({smtp_host}:{smtp_port})"
    except Exception as exc:
        record["delivered_via"] = f"Local Mail Catcher Log ({exc.__class__.__name__})"

    _save_to_local_outbox(record)
    return True


def send_guardian_consent_email(guardian_email: str, student_name: str, consent_token: str) -> bool:
    subject = f"Parental Consent Request for {student_name}'s Aanvi Study Companion Account"
    confirm_url = f"http://localhost:3000/parent-zone?consent_token={consent_token}"
    html = f"""
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 16px;">
        <h2 style="color: #6366F1; margin-top: 0;">Aanvi Child Privacy & Guardian Consent</h2>
        <p>Hello Guardian,</p>
        <p><strong>{student_name}</strong> (under 16) has registered for an Aanvi AI Study Companion account in <em>Explorer Mode</em>.</p>
        <p>In compliance with COPPA and global child digital safety regulations, parental consent is required before accessing interactive AI study features.</p>
        <div style="margin: 24px 0;">
            <a href="{confirm_url}" style="background-color: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Approve & Grant Consent
            </a>
        </div>
        <p style="font-size: 12px; color: #64748B;">Token: <code>{consent_token}</code></p>
        <p style="font-size: 12px; color: #94A3B8;">If you did not authorize this registration, you can ignore this email and the temporary account will remain restricted.</p>
    </div>
    """
    return send_email(guardian_email, subject, html)


def send_password_reset_email(to_email: str, raw_token: str) -> bool:
    subject = "Reset Your Aanvi Password"
    reset_url = f"http://localhost:3000/forgot-password?token={raw_token}"
    html = f"""
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 16px;">
        <h2 style="color: #6366F1; margin-top: 0;">Password Reset Request</h2>
        <p>We received a request to reset the password for your Aanvi account ({to_email}).</p>
        <p>This single-use link is valid for <strong>30 minutes</strong>:</p>
        <div style="margin: 24px 0;">
            <a href="{reset_url}" style="background-color: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Reset Password
            </a>
        </div>
        <p style="font-size: 12px; color: #64748B;">Reset Token: <code>{raw_token}</code></p>
        <p style="font-size: 12px; color: #94A3B8;">If you did not request a password reset, please ignore this email. Your current password remains unchanged.</p>
    </div>
    """
    return send_email(to_email, subject, html)


def send_password_changed_notification(to_email: str) -> bool:
    subject = "Security Notice: Your Aanvi Password Was Changed"
    html = f"""
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 16px;">
        <h2 style="color: #10B981; margin-top: 0;">Security Alert: Password Updated</h2>
        <p>The password for your Aanvi account ({to_email}) was successfully changed.</p>
        <p>All previous sessions and devices have been automatically logged out for your protection.</p>
        <p style="font-size: 12px; color: #EF4444; margin-top: 16px;">If you did not make this change, please contact security immediately at support@aanvi.ai.</p>
    </div>
    """
    return send_email(to_email, subject, html)
