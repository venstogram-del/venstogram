from typing import Optional
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.core.security import decode_access_token
from app.models.entities import User
from app.core.config import settings

security_scheme = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required"
        )
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token"
        )
    
    telegram_id = int(payload["sub"])
    res = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    if user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is suspended: {user.ban_reason or 'Terms of service violation'}"
        )
    return user

async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Security(security_scheme),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None
    try:
        telegram_id = int(payload["sub"])
    except (ValueError, TypeError):
        return None
    res = await db.execute(select(User).where(User.telegram_id == telegram_id))
    user = res.scalars().first()
    return user

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    is_admin_id = current_user.telegram_id == 1477103854 or current_user.telegram_id in settings.ADMIN_TELEGRAM_IDS
    if not is_admin_id or current_user.role not in ("moderator", "it_admin", "director", "developer"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Admin privileges required"
        )
    return current_user
