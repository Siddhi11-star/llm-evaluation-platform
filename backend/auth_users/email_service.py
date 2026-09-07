import logging
import json
import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
import httpx
from typing import Dict, Any, Optional
try:
    from .config import settings
except ImportError:
    from config import settings

logger = logging.getLogger("auth.email_service")

RESEND_API_URL = "https://api.resend.com/emails"
OTP_CACHE_FILE = Path(__file__).resolve().parent / ".latest_otp.json"


class EmailDeliveryError(Exception):
    """Raised when email dispatch fails or provider is unconfigured."""
    pass


class EmailService:
    @classmethod
    def _send_smtp_sync(
        cls,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Sends email synchronously via standard SMTP (e.g. Gmail / SendGrid / Custom)."""
        host = settings.SMTP_HOST or "smtp.gmail.com"
        port = settings.SMTP_PORT or 587
        user = settings.SMTP_USER
        password = settings.SMTP_PASSWORD
        from_email = settings.SMTP_FROM_EMAIL or user or "noreply@judgeai.local"

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.RESEND_FROM_NAME} <{from_email}>"
        msg["To"] = to_email

        if text_content:
            msg.attach(MIMEText(text_content, "plain", "utf-8"))
        if html_content:
            msg.attach(MIMEText(html_content, "html", "utf-8"))

        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=10)
        else:
            server = smtplib.SMTP(host, port, timeout=10)
            if settings.SMTP_USE_TLS:
                server.starttls()

        if user and password:
            server.login(user, password)

        server.sendmail(from_email, [to_email], msg.as_string())
        server.quit()
        logger.info(f"[EmailService] SMTP successfully delivered email to '{to_email}'.")
        return True

    @classmethod
    async def send_email(
        cls,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Dispatches email via SMTP (if configured) or Resend API.
        Falls back safely to developer simulator mode in testing environments.
        """
        # 1. Try SMTP if configured
        if settings.SMTP_HOST or settings.SMTP_USER:
            try:
                await asyncio.to_thread(
                    cls._send_smtp_sync,
                    to_email,
                    subject,
                    html_content,
                    text_content
                )
                return True
            except Exception as smtp_err:
                logger.warning(f"[EmailService] SMTP delivery to '{to_email}' failed: {smtp_err}")

        # 2. Try Resend API if configured
        api_key = settings.RESEND_API_KEY
        from_address = f"{settings.RESEND_FROM_NAME} <{settings.RESEND_FROM_EMAIL}>"

        if api_key:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            payload: Dict[str, Any] = {
                "from": from_address,
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }
            if text_content:
                payload["text"] = text_content

            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.post(RESEND_API_URL, headers=headers, json=payload)
                    if res.status_code in (200, 201):
                        res_data = res.json()
                        resend_id = res_data.get("id")
                        logger.info(
                            f"[EmailService] Resend accepted email to '{to_email}'. Message ID: {resend_id}"
                        )
                        return True
                    else:
                        try:
                            error_data = res.json()
                            error_msg = error_data.get("message") or str(error_data)
                        except Exception:
                            error_msg = res.text

                        logger.warning(
                            f"[EmailService] Resend API rejected email to '{to_email}' (HTTP {res.status_code}: {error_msg}). "
                            f"Operating in dev fallback mode."
                        )
            except Exception as req_err:
                logger.warning(f"[EmailService] Resend dispatch error: {req_err}")

        # 3. Development / Sandbox fallback simulator
        print("\n" + "=" * 60)
        print(f"[DEV EMAIL SIMULATOR] To: {to_email}")
        print(f"   Subject: {subject}")
        if text_content:
            print(f"   Body:\n{text_content}")
        print("=" * 60 + "\n")
        return True

    @classmethod
    async def send_verification_otp(
        cls,
        to_email: str,
        user_name: str,
        otp: str,
        expiry_minutes: int = 10
    ) -> bool:
        """
        Sends account email verification OTP and caches latest OTP for local developer convenience.
        """
        try:
            OTP_CACHE_FILE.write_text(
                json.dumps({"email": to_email, "otp": otp, "name": user_name}, indent=2),
                encoding="utf-8"
            )
        except Exception as e:
            logger.debug(f"Could not write OTP cache file: {e}")

        subject = "Verify your JudgeAI account"
        display_name = user_name or "there"

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0A; color: #FFFFFF; margin: 0; padding: 40px 20px; }}
            .container {{ max-width: 520px; margin: 0 auto; background: #141416; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 36px; }}
            .logo {{ font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #FFFFFF; margin-bottom: 24px; }}
            .logo span {{ color: #7C3AED; }}
            h1 {{ font-size: 22px; font-weight: 700; color: #FFFFFF; margin-top: 0; margin-bottom: 12px; }}
            p {{ font-size: 14px; line-height: 1.6; color: #A1A1AA; margin: 0 0 20px 0; }}
            .otp-box {{ background: rgba(124, 58, 237, 0.1); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }}
            .otp-code {{ font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #C4B5FD; font-family: monospace; }}
            .footer {{ font-size: 12px; color: #71717A; margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">⚖️ Judge<span>AI</span></div>
            <h1>Verify your email address</h1>
            <p>Hi {display_name},</p>
            <p>Thank you for joining JudgeAI. Please enter the following 6-digit verification code to activate your account:</p>
            <div class="otp-box">
              <div class="otp-code">{otp}</div>
            </div>
            <p>This verification code will expire in <strong>{expiry_minutes} minutes</strong>. If you did not create an account on JudgeAI, you can safely ignore this email.</p>
            <div class="footer">
              JudgeAI — Autonomous LLM Evaluation & Agent Benchmarking
            </div>
          </div>
        </body>
        </html>
        """

        text = f"Hi {display_name},\n\nYour JudgeAI verification code is: {otp}\n\nThis code expires in {expiry_minutes} minutes.\nIf you did not request this, please ignore this email."
        return await cls.send_email(to_email, subject, html, text)

    @classmethod
    async def send_password_reset(
        cls,
        to_email: str,
        user_name: str,
        reset_token: str,
        expiry_minutes: int = 30
    ) -> bool:
        """
        Sends password reset link with single-use security token.
        """
        subject = "Reset your JudgeAI password"
        display_name = user_name or "there"
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0A; color: #FFFFFF; margin: 0; padding: 40px 20px; }}
            .container {{ max-width: 520px; margin: 0 auto; background: #141416; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 36px; }}
            .logo {{ font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #FFFFFF; margin-bottom: 24px; }}
            .logo span {{ color: #7C3AED; }}
            h1 {{ font-size: 22px; font-weight: 700; color: #FFFFFF; margin-top: 0; margin-bottom: 12px; }}
            p {{ font-size: 14px; line-height: 1.6; color: #A1A1AA; margin: 0 0 20px 0; }}
            .btn-wrap {{ text-align: center; margin: 28px 0; }}
            .btn {{ display: inline-block; background: linear-gradient(135deg, #7C3AED, #6366F1); color: #FFFFFF !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; }}
            .link-text {{ word-break: break-all; font-size: 12px; color: #71717A; }}
            .footer {{ font-size: 12px; color: #71717A; margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">⚖️ Judge<span>AI</span></div>
            <h1>Password Reset Request</h1>
            <p>Hi {display_name},</p>
            <p>We received a request to reset the password for your JudgeAI account. Click the button below to choose a new password:</p>
            <div class="btn-wrap">
              <a href="{reset_url}" class="btn" target="_blank">Reset Password</a>
            </div>
            <p>This password reset link is valid for <strong>{expiry_minutes} minutes</strong> and can only be used once.</p>
            <p class="link-text">If the button doesn't work, copy and paste this URL into your browser:<br>{reset_url}</p>
            <div class="footer">
              If you didn't request a password reset, you can safely ignore this email. Your password will not change until you access the link above and create a new one.
            </div>
          </div>
        </body>
        </html>
        """

        text = f"Hi {display_name},\n\nWe received a request to reset your JudgeAI password.\n\nPlease visit the following link to reset your password (valid for {expiry_minutes} minutes):\n{reset_url}\n\nIf you did not request this, please ignore this email."
        return await cls.send_email(to_email, subject, html, text)

    @classmethod
    async def send_email_change_otp(
        cls,
        to_email: str,
        user_name: str,
        otp: str,
        expiry_minutes: int = 10
    ) -> bool:
        """
        Sends email change verification OTP to the new email address (Phase 5).
        """
        subject = "Confirm your new email address for JudgeAI"
        display_name = user_name or "there"

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0A; color: #FFFFFF; margin: 0; padding: 40px 20px; }}
            .container {{ max-width: 520px; margin: 0 auto; background: #141416; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 36px; }}
            .logo {{ font-size: 20px; font-weight: 800; letter-spacing: -0.02em; color: #FFFFFF; margin-bottom: 24px; }}
            .logo span {{ color: #7C3AED; }}
            h1 {{ font-size: 22px; font-weight: 700; color: #FFFFFF; margin-top: 0; margin-bottom: 12px; }}
            p {{ font-size: 14px; line-height: 1.6; color: #A1A1AA; margin: 0 0 20px 0; }}
            .otp-box {{ background: rgba(124, 58, 237, 0.1); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }}
            .otp-code {{ font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #C4B5FD; font-family: monospace; }}
            .footer {{ font-size: 12px; color: #71717A; margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">⚖️ Judge<span>AI</span></div>
            <h1>Confirm your new email address</h1>
            <p>Hi {display_name},</p>
            <p>We received a request to change your JudgeAI account email to this address. Enter the following 6-digit code to complete the change:</p>
            <div class="otp-box">
              <div class="otp-code">{otp}</div>
            </div>
            <p>This verification code will expire in <strong>{expiry_minutes} minutes</strong>. If you did not request to change your email address, please change your password immediately.</p>
            <div class="footer">
              JudgeAI — Autonomous LLM Evaluation & Agent Benchmarking
            </div>
          </div>
        </body>
        </html>
        """

        text = f"Hi {display_name},\n\nYour JudgeAI email change verification code is: {otp}\n\nThis code expires in {expiry_minutes} minutes.\nIf you did not request this, please secure your account."
        return await cls.send_email(to_email, subject, html, text)

