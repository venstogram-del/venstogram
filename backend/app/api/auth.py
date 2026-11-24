from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone, timedelta
import random
import re
from app.database.session import get_db
from app.core.security import validate_telegram_init_data, create_access_token, hash_password, verify_password
from app.models.entities import User, UsernameListing
from app.schemas.all_schemas import (
    TelegramAuthRequest, DevAuthRequest, AuthResponse, UserProfileUpdate,
    EmailRegisterRequest, EmailVerifyCodeRequest, EmailLoginRequest,
    ForgotPasswordRequest, ResetPasswordRequest
)
from app.api.deps import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/telegram", response_model=AuthResponse)
async def auth_telegram(req: TelegramAuthRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """
    Validates Telegram WebApp initData HMAC-SHA256 signature and logs in or creates user.
    """
    validated = validate_telegram_init_data(req.init_data)
    if not validated:
        # If in debug mode and user sent dummy initData, give a helpful error
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Telegram initData signature."
        )

    tg_user = validated.get("user", {})
    tg_id = tg_user.get("id")
    if not tg_id:
        raise HTTPException(status_code=400, detail="Telegram user ID missing.")

    client_ip = request.client.host if request.client else None

    # Check if user already exists
    res = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = res.scalars().first()

    now = datetime.now(timezone.utc)
    is_admin_id = tg_id in settings.ADMIN_TELEGRAM_IDS

    raw_username = (tg_user.get("username") or f"user_{tg_id}").lower()
    if not is_admin_id and raw_username:
        # Check if username is reserved in marketplace
        chk_listing = await db.execute(
            select(UsernameListing).where(UsernameListing.username == raw_username, UsernameListing.is_sold == False)
        )
        if chk_listing.scalars().first():
            raw_username = f"user_{tg_id}"

    if not user:
        user = User(
            telegram_id=tg_id,
            username=raw_username,
            first_name=tg_user.get("first_name", ""),
            last_name=tg_user.get("last_name", ""),
            language_code=tg_user.get("language_code", "ru"),
            role="director" if is_admin_id else "user",
            is_verified=True if is_admin_id else False,
            device_fingerprint=req.device_fingerprint,
            last_ip=client_ip,
            last_active=now,
            wallet_coins=100000 if is_admin_id else 0 # 0 coins for regular users; only Director has coins
        )
        db.add(user)
    else:
        # Update user info
        if tg_id in settings.ADMIN_TELEGRAM_IDS:
            user.role = "director"
            user.is_verified = True
        if tg_user.get("first_name"):
            user.first_name = tg_user.get("first_name")
        if tg_user.get("last_name"):
            user.last_name = tg_user.get("last_name")
        if not user.username or user.username.startswith("user_"):
            if raw_username:
                user.username = raw_username
        user.last_active = now
        if client_ip:
            user.last_ip = client_ip
        if req.device_fingerprint:
            user.device_fingerprint = req.device_fingerprint

    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.telegram_id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "telegram_id": user.telegram_id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "avatar_url": user.avatar_url,
            "bio": user.bio,
            "role": user.role,
            "is_verified": user.is_verified,
            "wallet_coins": user.wallet_coins,
            "wallet_uzs": user.wallet_uzs,
            "language_code": user.language_code
        }
    }


@router.post("/dev-login", response_model=AuthResponse)
async def dev_login(req: DevAuthRequest, db: AsyncSession = Depends(get_db)):
    """
    Login endpoint for local development, web browser testing, and demo accounts.
    """
    res = await db.execute(select(User).where(User.telegram_id == req.telegram_id))
    user = res.scalars().first()
    if not user:
        user = User(
            telegram_id=req.telegram_id,
            username=req.username,
            first_name=req.first_name,
            last_name=req.last_name,
            wallet_coins=100000 if req.telegram_id in settings.ADMIN_TELEGRAM_IDS else 0
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token({"sub": str(user.telegram_id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "telegram_id": user.telegram_id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "avatar_url": user.avatar_url,
            "bio": user.bio,
            "role": user.role,
            "is_verified": user.is_verified,
            "wallet_coins": user.wallet_coins,
            "wallet_uzs": user.wallet_uzs,
            "language_code": user.language_code
        }
    }


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "telegram_id": current_user.telegram_id,
        "username": current_user.username,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "avatar_url": current_user.avatar_url,
        "bio": current_user.bio,
        "website": current_user.website,
        "telegram_channel": current_user.telegram_channel or "",
        "role": current_user.role,
        "is_verified": current_user.is_verified,
        "badge_type": getattr(current_user, "badge_type", "blue"),
        "verified_until": current_user.verified_until,
        "wallet_coins": current_user.wallet_coins,
        "wallet_uzs": current_user.wallet_uzs,
        "language_code": current_user.language_code,
        "biometric_enabled": current_user.biometric_enabled,
        "has_pin": bool(current_user.wallet_pin),
        "email": current_user.email,
        "is_email_verified": getattr(current_user, "is_email_verified", False),
        "warnings_count": getattr(current_user, "warnings_count", 0),
        "warnings_history": getattr(current_user, "warnings_history", []) or []
    }


@router.patch("/me")
async def update_profile(
    req: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if req.username is not None:
        new_username = req.username.strip().lower()
        if new_username.startswith("@"):
            new_username = new_username[1:]

        if not re.match(r"^[a-zA-Z0-9_]{3,32}$", new_username):
            raise HTTPException(
                status_code=400,
                detail="Никнейм может содержать только латинские буквы, цифры и символ подчеркивания _ (от 3 до 32 символов)."
            )

        if not current_user.username or current_user.username.lower() != new_username:
            u_res = await db.execute(
                select(User.id).where(func.lower(User.username) == new_username, User.id != current_user.id)
            )
            if u_res.scalars().first() is not None:
                suggestions = []
                for sfx in ["1", "2", "3", "7", "_1", "77", "99"]:
                    cand = f"{new_username}{sfx}"[:32]
                    cu = await db.execute(select(User.id).where(func.lower(User.username) == cand))
                    cm = await db.execute(select(UsernameListing.id).where(func.lower(UsernameListing.username) == cand, UsernameListing.is_sold == False))
                    if cu.scalars().first() is None and cm.scalars().first() is None:
                        suggestions.append(cand)
                    if len(suggestions) >= 3:
                        break
                sug_str = ", ".join(f"@{s}" for s in suggestions)
                msg = f"Никнейм @{new_username} уже занят."
                if suggestions:
                    msg += f" Свободные варианты: {sug_str}"
                raise HTTPException(status_code=400, detail=msg)

            m_res = await db.execute(
                select(UsernameListing.id).where(
                    func.lower(UsernameListing.username) == new_username,
                    UsernameListing.is_sold == False
                )
            )
            if m_res.scalars().first() is not None:
                raise HTTPException(status_code=400, detail=f"Никнейм @{new_username} зарезервирован на бирже юзернеймов.")

            current_user.username = new_username

    if req.bio is not None:
        current_user.bio = req.bio
    if req.avatar_url is not None:
        current_user.avatar_url = req.avatar_url
    if req.telegram_channel is not None:
        current_user.telegram_channel = req.telegram_channel
    if req.first_name is not None:
        current_user.first_name = req.first_name
    if req.last_name is not None:
        current_user.last_name = req.last_name
    if req.website is not None:
        current_user.website = req.website
    if req.language_code is not None:
        current_user.language_code = req.language_code
    if req.wallet_pin is not None:
        current_user.wallet_pin = req.wallet_pin
    if req.biometric_enabled is not None:
        current_user.biometric_enabled = req.biometric_enabled

    await db.commit()
    await db.refresh(current_user)
    return {
        "status": "ok",
        "id": current_user.id,
        "telegram_id": current_user.telegram_id,
        "username": current_user.username,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "avatar_url": current_user.avatar_url,
        "bio": current_user.bio,
        "website": current_user.website,
        "telegram_channel": current_user.telegram_channel or "",
        "role": current_user.role,
        "is_verified": current_user.is_verified,
        "wallet_coins": current_user.wallet_coins
    }


# ============================================================================
# Email Registration, SMS/Email Code Verification & Password Recovery
# ============================================================================

@router.post("/register-email")
async def register_email(req: EmailRegisterRequest, db: AsyncSession = Depends(get_db)):
    """
    Step 1 of Email Registration:
    Validates username availability (free & not in reserved list),
    checks email uniqueness, stores details, and generates a 6-digit confirmation code.
    """
    clean_username = req.username.lower().strip().replace("@", "")
    if len(clean_username) < 3:
        raise HTTPException(status_code=400, detail="Никнейм должен содержать минимум 3 символа.")

    # 1. Check if username is in reserved marketplace listings
    res_listing = await db.execute(
        select(UsernameListing).where(UsernameListing.username == clean_username, UsernameListing.is_sold == False)
    )
    if res_listing.scalars().first():
        raise HTTPException(
            status_code=400,
            detail=f"Никнейм @{clean_username} зарезервирован платформой Venstogram и продается в Маркетплейсе за $500! Пожалуйста, придумайте свободный никнейм."
        )

    # 2. Check if username is already taken by another user
    res_user = await db.execute(select(User).where(User.username == clean_username))
    existing_user_by_name = res_user.scalars().first()
    if existing_user_by_name:
        raise HTTPException(
            status_code=400,
            detail=f"Никнейм @{clean_username} уже занят. Выберите другой никнейм."
        )

    # 3. Check if email is already in use
    clean_email = req.email.lower().strip()
    res_email = await db.execute(select(User).where(User.email == clean_email))
    existing_by_email = res_email.scalars().first()
    if existing_by_email and existing_by_email.is_email_verified:
        raise HTTPException(
            status_code=400,
            detail="Пользователь с таким Email уже зарегистрирован. Войдите через форму входа."
        )

    # 4. Generate 6-digit verification code
    code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    now = datetime.now(timezone.utc)

    if existing_by_email:
        # Update existing unverified user
        user = existing_by_email
        user.username = clean_username
        user.password_hash = hash_password(req.password)
        user.first_name = req.first_name
        user.last_name = req.last_name or ""
        user.middle_name = req.middle_name or ""
        user.birth_year = req.birth_year
        user.birth_date = req.birth_date or (str(req.birth_year) if req.birth_year else "")
        user.gender = req.gender or "Мужской"
        user.email_verification_code = code
        user.email_code_expires_at = expires_at
    else:
        # Create new user staged for verification
        virtual_tg_id = random.randint(9000000000, 9999999999)
        user = User(
            telegram_id=virtual_tg_id,
            email=clean_email,
            password_hash=hash_password(req.password),
            username=clean_username,
            first_name=req.first_name,
            last_name=req.last_name or "",
            middle_name=req.middle_name or "",
            birth_year=req.birth_year,
            birth_date=req.birth_date or (str(req.birth_year) if req.birth_year else ""),
            gender=req.gender or "Мужской",
            role="user",
            wallet_coins=0, # No free coins for regular users
            email_verification_code=code,
            email_code_expires_at=expires_at,
            is_email_verified=False,
            created_at=now,
            last_active=now
        )
        db.add(user)

    await db.commit()
    print(f"\n[OFFICIAL EMAIL SERVICE: {settings.OFFICIAL_EMAIL}] Sent security code {code} to {clean_email} for user @{clean_username}\n")

    return {
        "status": "code_sent",
        "email": clean_email,
        "from_email": settings.OFFICIAL_EMAIL,
        "message": f"Код подтверждения отправлен с официальной почты {settings.OFFICIAL_EMAIL} на адрес {clean_email}.",
        "debug_code": code if settings.DEBUG else None
    }


@router.post("/verify-email-code", response_model=AuthResponse)
async def verify_email_code(req: EmailVerifyCodeRequest, db: AsyncSession = Depends(get_db)):
    """
    Step 2 of Email Registration:
    Validates the 6-digit confirmation code and logs the user in.
    """
    clean_email = req.email.lower().strip()
    res = await db.execute(select(User).where(User.email == clean_email))
    user = res.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь с таким Email не найден.")

    if not user.email_verification_code or user.email_verification_code != req.code.strip():
        raise HTTPException(status_code=400, detail="Неверный код подтверждения из письма.")

    # Check expiration
    if user.email_code_expires_at:
        now = datetime.now(timezone.utc)
        expires = user.email_code_expires_at.replace(tzinfo=timezone.utc) if user.email_code_expires_at.tzinfo is None else user.email_code_expires_at
        if now > expires:
            raise HTTPException(status_code=400, detail="Срок действия кода истек. Запросите новый код.")

    # Activate user
    user.is_email_verified = True
    user.email_verification_code = None
    user.email_code_expires_at = None
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.telegram_id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "telegram_id": user.telegram_id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "birth_year": user.birth_year,
            "gender": user.gender,
            "avatar_url": user.avatar_url,
            "bio": user.bio,
            "role": user.role,
            "is_verified": user.is_verified,
            "wallet_coins": user.wallet_coins,
            "wallet_uzs": user.wallet_uzs,
            "language_code": user.language_code
        }
    }


@router.post("/login-email", response_model=AuthResponse)
async def login_email(req: EmailLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Login with Email and Password.
    """
    clean_email = req.email.lower().strip()
    res = await db.execute(select(User).where(User.email == clean_email))
    user = res.scalars().first()

    if not user or not user.password_hash or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный Email или пароль.")

    token = create_access_token({"sub": str(user.telegram_id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "telegram_id": user.telegram_id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "birth_year": user.birth_year,
            "gender": user.gender,
            "avatar_url": user.avatar_url,
            "bio": user.bio,
            "role": user.role,
            "is_verified": user.is_verified,
            "wallet_coins": user.wallet_coins,
            "wallet_uzs": user.wallet_uzs,
            "language_code": user.language_code
        }
    }


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Generates a 6-digit recovery code for password reset.
    """
    clean_email = req.email.lower().strip()
    res = await db.execute(select(User).where(User.email == clean_email))
    user = res.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь с таким Email не зарегистрирован.")

    code = f"{random.randint(100000, 999999)}"
    user.email_verification_code = code
    user.email_code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    await db.commit()

    print(f"\n[PASSWORD RESET] Sent code {code} to {clean_email}\n")
    return {
        "status": "ok",
        "message": f"Код для сброса пароля отправлен на {clean_email}.",
        "debug_code": code if settings.DEBUG else None
    }


@router.post("/reset-password", response_model=AuthResponse)
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Resets password using the 6-digit email code and returns active session.
    """
    clean_email = req.email.lower().strip()
    res = await db.execute(select(User).where(User.email == clean_email))
    user = res.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден.")

    if not user.email_verification_code or user.email_verification_code != req.code.strip():
        raise HTTPException(status_code=400, detail="Неверный код восстановления.")

    # Check expiration
    if user.email_code_expires_at:
        now = datetime.now(timezone.utc)
        expires = user.email_code_expires_at.replace(tzinfo=timezone.utc) if user.email_code_expires_at.tzinfo is None else user.email_code_expires_at
        if now > expires:
            raise HTTPException(status_code=400, detail="Срок действия кода истек.")

    user.password_hash = hash_password(req.new_password)
    user.email_verification_code = None
    user.email_code_expires_at = None
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.telegram_id), "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "telegram_id": user.telegram_id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "avatar_url": user.avatar_url,
            "role": user.role,
            "wallet_coins": user.wallet_coins
        }
    }

