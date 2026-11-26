from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional, List, Dict, Any
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
from app.api.deps import get_current_user, get_current_user_optional
from app.core.config import settings
from app.core.email import send_verification_email
from app.api.users import is_sacred_username

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
            "birth_year": user.birth_year,
            "birth_date": user.birth_date,
            "is_registered": bool(user.is_registered or user.birth_year or (user.username and not user.username.startswith("user_"))),
            "wallet_coins": user.wallet_coins,
            "wallet_uzs": user.wallet_uzs,
            "language_code": user.language_code
        }
    }


@router.post("/dev-login", response_model=AuthResponse)
async def dev_login(req: DevAuthRequest, db: AsyncSession = Depends(get_db)):
    """
    Login endpoint for local development, web browser testing, and demo accounts.
    Admin/Director IDs are strictly protected from dev-login.
    """
    if req.telegram_id in settings.ADMIN_TELEGRAM_IDS or req.username == "oqyolai":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вход под учётной записью Администратора через dev-login строго запрещён."
        )

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
            "birth_year": user.birth_year,
            "birth_date": user.birth_date,
            "is_registered": bool(user.is_registered or user.birth_year or (user.username and not user.username.startswith("user_"))),
            "wallet_coins": user.wallet_coins,
            "wallet_uzs": user.wallet_uzs,
            "language_code": user.language_code
        }
    }


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models.entities import Follow, Post, Reel
    followers_count = (await db.execute(select(func.count(Follow.id)).where(Follow.following_id == current_user.id))).scalar() or 0
    following_count = (await db.execute(select(func.count(Follow.id)).where(Follow.follower_id == current_user.id))).scalar() or 0
    posts_count = (await db.execute(select(func.count(Post.id)).where(Post.user_id == current_user.id))).scalar() or 0
    reels_count = (await db.execute(select(func.count(Reel.id)).where(Reel.user_id == current_user.id))).scalar() or 0

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
        "profile_theme": getattr(current_user, "profile_theme", "gold_founder" if getattr(current_user, "role", "") == "director" else "default") or ("gold_founder" if getattr(current_user, "role", "") == "director" else "default"),
        "verified_until": current_user.verified_until,
        "wallet_coins": current_user.wallet_coins,
        "wallet_uzs": current_user.wallet_uzs,
        "birth_year": current_user.birth_year,
        "birth_date": current_user.birth_date,
        "is_registered": bool(current_user.is_registered or current_user.birth_year or (current_user.username and not current_user.username.startswith("user_"))),
        "language_code": current_user.language_code,
        "biometric_enabled": current_user.biometric_enabled,
        "has_pin": bool(current_user.wallet_pin),
        "email": current_user.email,
        "is_email_verified": getattr(current_user, "is_email_verified", False),
        "allow_calls": getattr(current_user, "allow_calls", "all") or "all",
        "followers_count": followers_count,
        "following_count": following_count,
        "posts_count": posts_count,
        "reels_count": reels_count,
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

        if new_username.isdigit():
            raise HTTPException(
                status_code=400,
                detail="Числовые никнеймы (1, 2, 3...) эксклюзивны и доступны только для покупки на Маркетплейсе!"
            )

        if not re.match(r"^[a-zA-Z][a-zA-Z0-9_]{2,31}$", new_username):
            raise HTTPException(
                status_code=400,
                detail="Никнейм должен начинаться с буквы и содержать от 3 до 32 символов (латинские буквы, цифры и _)."
            )

        if is_sacred_username(new_username):
            raise HTTPException(
                status_code=400,
                detail="Этот никнейм содержит священное религиозное имя (Аллах, Кааба, Мухаммад и др.) и запрещён к использованию из уважения к чувствам верующих."
            )

        if not current_user.username or current_user.username.lower() != new_username:
            founder_reserved = {
                "uzbekiston", "uzbekistan", "venstogram", "director", "admin", "yuksak", "yuksak_it", "official"
            }
            if new_username in founder_reserved and current_user.role != "director" and current_user.telegram_id not in settings.ADMIN_TELEGRAM_IDS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Никнейм @{new_username} зарезервирован Основателем платформы. Выдаётся лично Директором."
                )
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
    if req.birth_year is not None:
        current_user.birth_year = req.birth_year
    if req.birth_date is not None:
        current_user.birth_date = req.birth_date
    if req.is_registered is not None:
        current_user.is_registered = req.is_registered
    else:
        # Auto-mark registered if first_name and username are present
        if current_user.first_name and current_user.username and not current_user.username.startswith("user_"):
            current_user.is_registered = True
    if req.website is not None:
        current_user.website = req.website
    if req.language_code is not None:
        current_user.language_code = req.language_code
    if req.wallet_pin is not None:
        current_user.wallet_pin = req.wallet_pin
    if req.biometric_enabled is not None:
        current_user.biometric_enabled = req.biometric_enabled
    if req.is_incognito is not None:
        current_user.is_incognito = req.is_incognito
    if req.is_private is not None:
        current_user.is_private = req.is_private
    if req.profile_theme is not None:
        current_user.profile_theme = req.profile_theme
    if req.allow_calls is not None:
        if req.allow_calls in ["all", "followers", "none"]:
            current_user.allow_calls = req.allow_calls
    if req.email is not None:
        clean_email = req.email.lower().strip()
        if clean_email and "@" in clean_email:
            current_user.email = clean_email
    if req.password is not None and len(req.password.strip()) >= 4:
        current_user.password_hash = hash_password(req.password.strip())

    await db.commit()
    await db.refresh(current_user)
    return {
        "status": "ok",
        "id": current_user.id,
        "telegram_id": current_user.telegram_id,
        "username": current_user.username,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "birth_year": current_user.birth_year,
        "birth_date": current_user.birth_date,
        "is_registered": bool(current_user.is_registered),
        "avatar_url": current_user.avatar_url,
        "bio": current_user.bio,
        "website": current_user.website,
        "telegram_channel": current_user.telegram_channel or "",
        "role": current_user.role,
        "profile_theme": getattr(current_user, "profile_theme", "default"),
        "is_verified": current_user.is_verified,
        "wallet_coins": current_user.wallet_coins
    }


# ============================================================================
# Email Registration, SMS/Email Code Verification & Password Recovery
# ============================================================================

@router.post("/send-verification")
async def send_verification(
    req: dict,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Sends a 6-digit confirmation code to email.
    If called by an authenticated user (e.g. from RegistrationModal in WebApp),
    links the pending verification directly to their current account so NO phantom
    virtual accounts are spawned.
    """
    raw_email = req.get("email", "")
    clean_email = str(raw_email).lower().strip()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="To'g'ri email manzilini kiriting / Укажите корректный email.")

    # Check if another verified user already has this email
    chk_res = await db.execute(select(User).where(User.email == clean_email, User.is_email_verified == True))
    other_verified = chk_res.scalars().first()
    if other_verified and (not current_user or other_verified.id != current_user.id):
        raise HTTPException(
            status_code=400,
            detail="Ushbu email bilan boshqa foydalanuvchi ro'yxatdan o'tgan / Пользователь с таким Email уже зарегистрирован."
        )

    code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    now = datetime.now(timezone.utc)

    # Send verification email FIRST
    email_sent, email_err = await send_verification_email(
        to_email=clean_email,
        code=code,
        username=current_user.username if current_user else req.get("username", "foydalanuvchi"),
        purpose="registration"
    )

    if not email_sent:
        raise HTTPException(
            status_code=400,
            detail=f"Emailga tasdiqlash kodi yuborilmadi: {email_err}. Iltimos, pochtangiz to'g'riligini tekshiring."
        )

    if current_user:
        current_user.email = clean_email
        current_user.email_verification_code = code
        current_user.email_code_expires_at = expires_at
        current_user.is_email_verified = False
        await db.commit()
    else:
        # Check existing unverified user by email
        res_email = await db.execute(select(User).where(User.email == clean_email))
        user = res_email.scalars().first()
        if user:
            user.email_verification_code = code
            user.email_code_expires_at = expires_at
        else:
            virtual_tg_id = random.randint(9000000000, 9999999999)
            user = User(
                telegram_id=virtual_tg_id,
                email=clean_email,
                username=req.get("username", f"u_{int(now.timestamp())}").lower().strip().replace("@", "")[:32],
                first_name=req.get("first_name", "User"),
                last_name=req.get("last_name", ""),
                birth_year=req.get("birth_year", 2000),
                password_hash=hash_password(req.get("password", "VenstoPassword2026!")),
                role="user",
                wallet_coins=0,
                email_verification_code=code,
                email_code_expires_at=expires_at,
                is_email_verified=False,
                is_registered=False,
                created_at=now,
                last_active=now
            )
            db.add(user)
        await db.commit()

    return {
        "status": "code_sent",
        "email": clean_email,
        "message": f"Tasdiqlash kodi {clean_email} pochtasiga yuborildi. Kod 15 daqiqa amal qiladi.",
        "email_delivered": True
    }


@router.post("/register-email")
@router.post("/send-code")
@router.post("/email-code")
async def register_email(
    req: EmailRegisterRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Step 1 of Email Registration:
    Validates username availability, checks email uniqueness, sends 6-digit confirmation code.
    If user already authenticated in WebApp, delegates safely without spawning ghost account.
    """
    clean_username = req.username.lower().strip().replace("@", "")
    if len(clean_username) < 3:
        raise HTTPException(status_code=400, detail="Nikneym kamida 3 ta belgidan iborat bo'lishi kerak / Никнейм должен содержать минимум 3 символа.")

    if is_sacred_username(clean_username):
        raise HTTPException(
            status_code=400,
            detail="Этот никнейм содержит священное религиозное имя (Аллах, Кааба, Мухаммад и др.) и запрещён к использованию из уважения к чувствам верующих."
        )

    # 1. Check if username is in reserved marketplace listings
    res_listing = await db.execute(
        select(UsernameListing).where(UsernameListing.username == clean_username, UsernameListing.is_sold == False)
    )
    if res_listing.scalars().first():
        raise HTTPException(
            status_code=400,
            detail=f"@{clean_username} nikneymi Venstogram platformasida zaxiraga olingan va Marketpleysda sotiladi! / Никнейм @{clean_username} зарезервирован платформой Venstogram."
        )

    clean_email = req.email.lower().strip()

    # 2. Check if username is already taken by another active/verified user
    res_user = await db.execute(
        select(User).where(
            User.username == clean_username,
            or_(User.telegram_id < 9000000000, User.is_email_verified == True)
        )
    )
    existing_user_by_name = res_user.scalars().first()
    if existing_user_by_name and (not current_user or existing_user_by_name.id != current_user.id):
        raise HTTPException(
            status_code=400,
            detail=f"@{clean_username} nikneymi allaqachon band. Boshqa nikneym tanlang / Никнейм @{clean_username} уже занят."
        )

    # 3. Check if email is already in use by a verified user
    res_email = await db.execute(select(User).where(User.email == clean_email, User.is_email_verified == True))
    existing_by_email = res_email.scalars().first()
    if existing_by_email and (not current_user or existing_by_email.id != current_user.id):
        raise HTTPException(
            status_code=400,
            detail="Ushbu Email bilan allaqachon ro'yxatdan o'tilgan. Kirish oynasi orqali kiring / Пользователь с таким Email уже зарегистрирован."
        )

    # 4. Generate 6-digit verification code
    code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    now = datetime.now(timezone.utc)

    # 5. Send verification email BEFORE committing to avoid phantom accounts on failure
    email_sent, email_err = await send_verification_email(
        to_email=clean_email,
        code=code,
        username=clean_username,
        purpose="registration"
    )

    if not email_sent:
        raise HTTPException(
            status_code=400,
            detail=f"Emailga tasdiqlash kodi yuborilmadi: {email_err}. Iltimos, emailingizni to'g'ri kiritganingizni tekshiring."
        )

    # If current Telegram/authenticated user is completing registration:
    if current_user:
        current_user.email = clean_email
        current_user.username = clean_username
        current_user.email_verification_code = code
        current_user.email_code_expires_at = expires_at
        current_user.is_email_verified = False
        await db.commit()
    else:
        # Check existing unverified user by email
        res_unverified = await db.execute(select(User).where(User.email == clean_email))
        unverified_user = res_unverified.scalars().first()

        if unverified_user:
            user = unverified_user
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
            user.is_email_verified = False
            user.is_registered = False
        else:
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
                wallet_coins=0,
                email_verification_code=code,
                email_code_expires_at=expires_at,
                is_email_verified=False,
                is_registered=False,
                created_at=now,
                last_active=now
            )
            db.add(user)

        await db.commit()

    return {
        "status": "code_sent",
        "email": clean_email,
        "from_email": settings.EMAILS_FROM_EMAIL or settings.OFFICIAL_EMAIL,
        "message": f"Tasdiqlash kodi {clean_email} pochtasiga yuborildi. Kod 15 daqiqa amal qiladi.",
        "email_delivered": True,
        "debug_code": code if settings.DEBUG else None
    }


@router.post("/verify-email-code", response_model=AuthResponse)
@router.post("/verify-code", response_model=AuthResponse)
async def verify_email_code(
    req: EmailVerifyCodeRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Step 2 of Email Registration:
    Validates the 6-digit confirmation code and activates the account.
    """
    clean_email = req.email.lower().strip()
    user = None

    if current_user and current_user.email and current_user.email.lower() == clean_email:
        user = current_user
    else:
        res = await db.execute(select(User).where(User.email == clean_email))
        user = res.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="Ushbu Email bilan foydalanuvchi topilmadi / Пользователь с таким Email не найден.")

    if not user.email_verification_code or user.email_verification_code.strip() != req.code.strip():
        raise HTTPException(status_code=400, detail="Xatdagi tasdiqlash kodi noto'g'ri / Неверный код подтверждения из письма.")

    # Check expiration
    if user.email_code_expires_at:
        now = datetime.now(timezone.utc)
        expires = user.email_code_expires_at.replace(tzinfo=timezone.utc) if user.email_code_expires_at.tzinfo is None else user.email_code_expires_at
        if now > expires:
            raise HTTPException(status_code=400, detail="Kod amal qilish muddati tugagan. Yangi kod so'rang / Срок действия кода истек.")

    # Activate user and set password if provided
    if req.password and len(req.password.strip()) >= 4:
        user.password_hash = hash_password(req.password.strip())

    user.is_email_verified = True
    user.is_registered = True
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
            "birth_year": user.birth_year,
            "birth_date": user.birth_date,
            "is_registered": True,
            "wallet_coins": user.wallet_coins,
            "wallet_uzs": user.wallet_uzs,
            "language_code": user.language_code
        }
    }


@router.post("/login-email", response_model=AuthResponse)
async def login_email(req: EmailLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Login with Email or Username and Password.
    Allows login from any device or phone with either email or @username.
    """
    raw_login = req.email.strip().lower()
    clean_username = raw_login.lstrip("@")
    res = await db.execute(
        select(User).where(
            or_(
                func.lower(User.email) == raw_login,
                func.lower(User.username) == clean_username,
                func.lower(User.username) == raw_login
            )
        )
    )
    user = res.scalars().first()

    if not user or not user.password_hash or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный логин (Email / @username) или пароль.")

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
            "birth_year": user.birth_year,
            "birth_date": user.birth_date,
            "is_registered": bool(user.is_registered or user.birth_year or (user.username and not user.username.startswith("user_"))),
            "wallet_coins": user.wallet_coins,
            "wallet_uzs": user.wallet_uzs,
            "language_code": user.language_code
        }
    }


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Generates a 6-digit recovery code for password reset.
    Accepts either Email or Username.
    """
    clean_target = req.email.lower().strip().replace("@", "")
    res = await db.execute(
        select(User).where(
            or_(func.lower(User.email) == clean_target, func.lower(User.username) == clean_target)
        )
    )
    user = res.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь с таким Email или никнеймом не зарегистрирован.")

    if not user.email or "@" not in user.email:
        raise HTTPException(status_code=400, detail="К данному аккаунту не привязан подтвержденный Email адрес.")

    clean_email = user.email.lower().strip()
    code = f"{random.randint(100000, 999999)}"
    user.email_verification_code = code
    user.email_code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    await db.commit()

    email_sent, email_err = await send_verification_email(
        to_email=clean_email,
        code=code,
        username=user.username or "",
        purpose="password_reset"
    )

    if user.telegram_id and user.telegram_id < 9000000000:
        try:
            from app.bot.bot import send_bot_push_notification
            await send_bot_push_notification(
                telegram_id=user.telegram_id,
                text=f"🔐 <b>Сброс пароля Venstogram</b>: <code>{code}</code>\n\nКод отправлен на вашу почту: {clean_email}.",
                button_text="Сбросить пароль",
                start_param="reset_pass"
            )
        except Exception:
            pass

    msg_text = f"Код для сброса пароля отправлен на {clean_email}." if email_sent else (
        f"Код сгенерирован: {code}. (Для отправки проверьте настройки почты)"
        if settings.DEBUG else f"Код отправлен на {clean_email}."
    )

    return {
        "status": "ok",
        "email": clean_email,
        "message": msg_text,
        "email_delivered": email_sent,
        "debug_code": code if (settings.DEBUG or not email_sent) else None
    }


@router.post("/reset-password", response_model=AuthResponse)
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Resets password using the 6-digit email code and returns active session.
    Accepts either Email or Username.
    """
    clean_target = req.email.lower().strip().replace("@", "")
    res = await db.execute(
        select(User).where(
            or_(func.lower(User.email) == clean_target, func.lower(User.username) == clean_target)
        )
    )
    user = res.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден.")

    if not user.email_verification_code or user.email_verification_code.strip() != req.code.strip():
        raise HTTPException(status_code=400, detail="Неверный код восстановления из письма.")

    # Check expiration
    if user.email_code_expires_at:
        now = datetime.now(timezone.utc)
        expires = user.email_code_expires_at.replace(tzinfo=timezone.utc) if user.email_code_expires_at.tzinfo is None else user.email_code_expires_at
        if now > expires:
            raise HTTPException(status_code=400, detail="Срок действия кода истек. Запросите новый код.")

    user.password_hash = hash_password(req.new_password)
    user.email_verification_code = None
    user.email_code_expires_at = None
    user.is_email_verified = True
    user.is_registered = True
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

