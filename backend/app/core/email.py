import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from email.utils import formataddr
from typing import Tuple, Optional
from app.core.config import settings

def _build_email_html(code: str, username: str = "", purpose: str = "регистрации") -> str:
    purpose_title = "Код подтверждения" if purpose == "registration" else "Сброс пароля"
    action_text = "подтверждения регистрации аккаунта" if purpose == "registration" else "восстановления доступа к аккаунту"
    user_greeting = f"Привет, @{username}!" if username else "Здравствуйте!"
    
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{purpose_title} Venstogram</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #020617; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background: linear-gradient(180deg, #0f172a 0%, #020617 100%); border: 1px solid #1e293b; border-radius: 24px; padding: 36px 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          <!-- Logo & Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="display: inline-block; width: 64px; height: 64px; border-radius: 20px; background: linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #f59e0b 100%); line-height: 64px; text-align: center; font-size: 32px; font-weight: 900; color: #ffffff; box-shadow: 0 10px 25px -5px rgba(236, 72, 153, 0.5);">
                V
              </div>
              <h1 style="margin: 16px 0 4px 0; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                VENSTOGRAM
              </h1>
              <p style="margin: 0; font-size: 13px; color: #94a3b8; font-weight: 500;">
                Платформа нового поколения
              </p>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding: 16px 0 24px 0; border-top: 1px solid #1e293b; border-bottom: 1px solid #1e293b;">
              <p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 700; color: #ffffff;">
                {user_greeting}
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Вы получили это письмо для {action_text} в приложении <b>Venstogram</b>. Используйте следующий 6-значный код безопасности:
              </p>
              
              <!-- Code Card -->
              <div style="background: #020617; border: 2px solid #ec4899; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #f43f5e; display: inline-block;">
                  {code}
                </span>
              </div>

              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                ⏱ Код действителен в течение <b>15 минут</b>.
              </p>
            </td>
          </tr>

          <!-- Security Caution -->
          <tr>
            <td style="padding-top: 24px;">
              <div style="background-color: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 14px; padding: 14px 16px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #fca5a5;">
                  ⚠️ <b>Безопасность:</b> Никому не сообщайте этот код. Сотрудники Venstogram никогда не запрашивают код подтверждения.
                </p>
              </div>
              <p style="margin: 20px 0 0 0; font-size: 11px; line-height: 1.5; color: #64748b; text-align: center;">
                Если вы не совершали этот запрос, просто проигнорируйте данное письмо.<br>
                Служба заботы Venstogram: {settings.SUPPORT_TELEGRAM} • {settings.SUPPORT_PHONE}
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
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return False, "SMTP_USER или SMTP_PASSWORD не настроены в .env файле"

    from_addr = formataddr((str(Header(settings.EMAILS_FROM_NAME, 'utf-8')), settings.EMAILS_FROM_EMAIL))

    msg = MIMEMultipart("alternative")
    msg["Subject"] = Header(subject, 'utf-8')
    msg["From"] = from_addr
    msg["To"] = to_email

    msg.attach(MIMEText(plain_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        if settings.SMTP_USE_SSL or settings.SMTP_PORT == 465:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12) as server:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAILS_FROM_EMAIL, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12) as server:
                if settings.SMTP_USE_TLS or settings.SMTP_PORT == 587:
                    server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAILS_FROM_EMAIL, [to_email], msg.as_string())

        return True, "Email successfully sent"
    except Exception as exc:
        return False, str(exc)

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
    subject = f"Ваш код подтверждения Venstogram: {code}" if purpose == "registration" else f"Код для сброса пароля Venstogram: {code}"
    plain_body = f"Здравствуйте!\n\nВаш 6-значный код безопасности Venstogram: {code}\nКод действителен 15 минут. Никому не сообщайте этот код."
    html_body = _build_email_html(code, username, purpose)

    print(f"\n[EMAIL DISPATCHER] Sending {purpose} security code {code} to {clean_email} via SMTP ({settings.SMTP_HOST}:{settings.SMTP_PORT})...")

    success, err_msg = await asyncio.to_thread(_send_sync_smtp, clean_email, subject, html_body, plain_body)
    
    if success:
        print(f"[EMAIL DISPATCHER] ✓ Email delivered to {clean_email} successfully!\n")
    else:
        print(f"[EMAIL DISPATCHER] ✕ Failed to send email to {clean_email}: {err_msg}")
        print(f"[EMAIL DISPATCHER] -> Note: Make sure SMTP_USER and SMTP_PASSWORD are valid in .env.\n")

    return success, err_msg
