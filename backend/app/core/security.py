import hmac
import hashlib
import json
import urllib.parse
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security_bearer = HTTPBearer(auto_error=False)

def validate_telegram_init_data(init_data: str, bot_token: str = settings.BOT_TOKEN) -> Optional[Dict[str, Any]]:
    """
    Validates initData received from Telegram Web App using HMAC-SHA256.
    Returns parsed user dictionary if valid, None otherwise.
    """
    if not init_data:
        return None
        
    try:
        parsed_data = dict(urllib.parse.parse_qsl(init_data, keep_blank_values=True))
        if "hash" not in parsed_data:
            return None
            
        received_hash = parsed_data.pop("hash")
        
        # Sort keys alphabetically and prepare check string
        sorted_keys = sorted(parsed_data.keys())
        data_check_string = "\n".join(f"{k}={parsed_data[k]}" for k in sorted_keys)
        
        # Telegram secret key derivation: HMAC-SHA256("WebAppData", bot_token)
        secret_key = hmac.new(b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()
        
        if hmac.compare_digest(calculated_hash, received_hash):
            user_raw = parsed_data.get("user")
            user_data = json.loads(user_raw) if user_raw else {}
            return {
                "user": user_data,
                "auth_date": int(parsed_data.get("auth_date", 0)),
                "query_id": parsed_data.get("query_id"),
                "start_param": parsed_data.get("start_param")
            }
        return None
    except Exception as e:
        if settings.DEBUG:
            print(f"[Security] initData validation error: {e}")
        return None


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None


def hash_password(password: str) -> str:
    salt = settings.SECRET_KEY[:16]
    return hashlib.sha256((password + salt).encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    return hmac.compare_digest(hash_password(plain_password), hashed_password)

