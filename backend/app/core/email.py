import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from email.utils import formataddr
from typing import Tuple, Optional
from app.core.config import settings

def _build_email_html(code: str, username: str = "", purpose: str = "registration") -> str:
    purpose_title = "Tasdiqlash kodi / Код подтверждения" if purpose == "registration" else "Parolni tiklash / Сброс пароля"
    action_text_uz = "profilni ro'yxatdan o'tkazish" if purpose == "registration" else "akkaunt parolini tiklash"
    action_text_ru = "подтверждения регистрации аккаунта" if purpose == "registration" else "восстановления доступа к аккаунту"
    
    return f"""<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{purpose_title} Venstogram</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #020617; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background: linear-gradient(180deg, #0f172a 0%, #020617 100%); border: 1px solid #1e293b; border-radius: 24px; padding: 36px 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          <!-- Logo & Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="display: inline-block; width: 68px; height: 68px; border-radius: 22px; background: linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #f59e0b 100%); line-height: 68px; text-align: center; font-size: 34px; font-weight: 900; color: #ffffff; box-shadow: 0 10px 25px -5px rgba(236, 72, 153, 0.5);">
                V
              </div>
              <h1 style="margin: 16px 0 4px 0; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                VENSTOGRAM
              </h1>
              <p style="margin: 0; font-size: 13px; color: #94a3b8; font-weight: 500;">
                Yangi avlod ijtimoiy media platformasi • Платформа нового поколения
              </p>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding: 16px 0 24px 0; border-top: 1px solid #1e293b; border-bottom: 1px solid #1e293b;">
              <p style="margin: 0 0 12px 0; font-size: 17px; font-weight: 800; color: #ffffff; letter-spacing: -0.2px;">
                Venstogram jamoasidan / От команды Venstogram
              </p>
              <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Siz <b>Venstogram</b> ilovasida {action_text_uz} uchun ushbu xatni oldingiz.<br>
                Вы получили это письмо для {action_text_ru} в приложении <b>Venstogram</b>.
              </p>
              
              <!-- Code Card -->
              <div style="background: #020617; border: 2px solid #ec4899; border-radius: 18px; padding: 20px; text-align: center; margin: 24px 0; box-shadow: 0 0 30px rgba(236, 72, 153, 0.15);">
                <span style="font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace; font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #f43f5e; display: inline-block;">
                  {code}
                </span>
              </div>

              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                ⏱ Kod amal qilish muddati: <b>15 daqiqa</b> • Код действителен: <b>15 минут</b>.
              </p>
            </td>
          </tr>

          <!-- Security Caution -->
          <tr>
            <td style="padding-top: 24px;">
              <div style="background-color: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 14px; padding: 14px 16px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #fca5a5;">
                  ⚠️ <b>Xavfsizlik / Безопасность:</b> Ushbu kodni hech kimga bermang. Venstogram xodimlari hech qachon kod so'ramaydi.<br>
                  Никому не сообщайте этот код. Сотрудники никогда не запрашивают код.
                </p>
              </div>
              <p style="margin: 20px 0 0 0; font-size: 11px; line-height: 1.5; color: #64748b; text-align: center;">
                Agar siz bu so'rovni yubormagan bo'lsangiz, ushbu xatni e'tiborsiz qoldiring.<br>
                © 2026 Venstogram Security Team. Barcha huquqlar himoyalangan.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

def _send_sync_smtp(to_email: str, subject: str, html_body: str, plain_body: str) -> Tuple[bool, str]:
    smtp_user = settings.SMTP_USER or "venstogram@gmail.com"
    smtp_password = settings.SMTP_PASSWORD or "puqbadqkgkbshauz"
    smtp_host = settings.SMTP_HOST or "smtp.gmail.com"

    if not smtp_user or not smtp_password:
        return False, "SMTP sozlamalari mavjud emas (SMTP_USER yoki SMTP_PASSWORD bo'sh)"

    from_addr = formataddr((str(Header(settings.EMAILS_FROM_NAME or "Venstogram Security", 'utf-8')), settings.EMAILS_FROM_EMAIL or smtp_user))

    msg = MIMEMultipart("alternative")
    msg["Subject"] = Header(subject, 'utf-8')
    msg["From"] = from_addr
    msg["To"] = to_email
    msg["X-Priority"] = "1"
    msg["Importance"] = "high"
    msg["Auto-Submitted"] = "auto-generated"

    msg.attach(MIMEText(plain_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))
    msg_str = msg.as_string()

    # Attempt 1: Port 465 SSL
    ssl_err = None
    try:
        with smtplib.SMTP_SSL(smtp_host, 465, timeout=6) as server:
            server.login(smtp_user, smtp_password)
            server.sendmail(settings.EMAILS_FROM_EMAIL or smtp_user, [to_email], msg_str)
        return True, "Email successfully sent via SSL (465)"
    except Exception as e:
        ssl_err = str(e)
        print(f"[EMAIL DISPATCHER] Port 465 SSL failed: {e}. Trying fallback to port 587 STARTTLS...")

    # Attempt 2: Fallback to Port 587 TLS
    try:
        with smtplib.SMTP(smtp_host, 587, timeout=6) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(settings.EMAILS_FROM_EMAIL or smtp_user, [to_email], msg_str)
        return True, "Email successfully sent via TLS (587)"
    except Exception as e:
        tls_err = str(e)
        print(f"[EMAIL DISPATCHER] Port 587 TLS also failed: {e}")
        return False, f"SMTP Error: SSL (465) failed: {ssl_err}; TLS (587) failed: {tls_err}"

async def send_verification_email(
    to_email: str,
    code: str,
    username: str = "",
    purpose: str = "registration"
) -> Tuple[bool, str]:
    """
    Sends a branded HTML verification code email via SMTP asynchronously.
    Returns (success, message).
    """
    clean_email = to_email.strip().lower()
    if purpose == "registration":
        subject = f"Venstogram tasdiqlash kodi: {code} / Код подтверждения"
        plain_body = f"Salom!\n\nVenstogram tasdiqlash kodi: {code}\nKod 15 daqiqa amal qiladi. Hech kimga bermang!\n\nЗдравствуйте!\nКод подтверждения Venstogram: {code}\nДействителен 15 минут."
    else:
        subject = f"Venstogram parolni tiklash kodi: {code} / Сброс пароля"
        plain_body = f"Salom!\n\nVenstogram parolni tiklash kodi: {code}\nKod 15 daqiqa amal qiladi.\n\nЗдравствуйте!\nКод сброса пароля: {code}"

    html_body = _build_email_html(code, username, purpose)

    print(f"\n[EMAIL DISPATCHER] Sending {purpose} security code {code} to {clean_email} via SMTP...")

    success, err_msg = await asyncio.to_thread(_send_sync_smtp, clean_email, subject, html_body, plain_body)
    
    if success:
        print(f"[EMAIL DISPATCHER] ✓ Email delivered to {clean_email} successfully: {err_msg}\n")
    else:
        print(f"[EMAIL DISPATCHER] ✕ Failed to send email to {clean_email}: {err_msg}\n")

    return success, err_msg
