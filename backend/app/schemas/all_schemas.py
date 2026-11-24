from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

# --- Auth ---
class TelegramAuthRequest(BaseModel):
    init_data: str
    device_fingerprint: Optional[str] = None

class DevAuthRequest(BaseModel):
    telegram_id: int
    username: Optional[str] = "vensto_user"
    first_name: Optional[str] = "Vensto"
    last_name: Optional[str] = "User"

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class EmailRegisterRequest(BaseModel):
    email: str
    password: str
    username: str
    first_name: str
    last_name: Optional[str] = ""
    middle_name: Optional[str] = ""
    birth_year: Optional[int] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = "Мужской"

class EmailVerifyCodeRequest(BaseModel):
    email: str
    code: str

class EmailLoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str

# --- User ---
class UserProfileUpdate(BaseModel):
    bio: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    website: Optional[str] = None
    telegram_channel: Optional[str] = None
    language_code: Optional[str] = None
    wallet_pin: Optional[str] = None
    biometric_enabled: Optional[bool] = None

class UsernameOrderCreate(BaseModel):
    listing_id: Optional[int] = None
    screenshot_url: Optional[str] = None
    receipt_url: Optional[str] = None
    notes: Optional[str] = None

class ApproveOrderRequest(BaseModel):
    order_id: int
    action: str = "approve" # approve, reject
    admin_notes: Optional[str] = None

# --- Posts ---
class PostCreate(BaseModel):
    caption: str = ""
    media_urls: List[str]
    media_type: str = "image" # image, video, carousel
    location: Optional[str] = None
    hashtags: Optional[List[str]] = None

class CommentCreate(BaseModel):
    text: str
    parent_id: Optional[int] = None
    sticker_url: Optional[str] = None

# --- Stories ---
class StoryCreate(BaseModel):
    media_url: str
    media_type: str = "image"
    caption: Optional[str] = ""

class StoryReactionCreate(BaseModel):
    reaction: str = "❤️"

# --- Reels ---
class ReelCreate(BaseModel):
    video_url: str
    thumbnail_url: Optional[str] = ""
    caption: str = ""
    audio_title: Optional[str] = "Original Sound - Venstogram"
    audio_author: Optional[str] = "Vensto Music"

class ReelCommentCreate(BaseModel):
    text: str

# --- Battles & Gifts ---
class BattleInviteCreate(BaseModel):
    guest_id: int
    penalty_task: str = "30 приседаний в прямом эфире"
    duration_seconds: int = 300

class SendGiftRequest(BaseModel):
    battle_id: int
    recipient_id: int
    gift_code: str # rose, heart, fire, car, plane, lion, crown

# --- Chat ---
class SendMessageRequest(BaseModel):
    recipient_id: int
    content: Optional[str] = ""
    media_url: Optional[str] = None
    media_type: str = "text"
    shared_entity_id: Optional[int] = None

# --- Wallet & Payments ---
class TopUpRequest(BaseModel):
    amount_coins: int
    payment_method: str = "click" # click, payme, uzum, stars

class WithdrawRequest(BaseModel):
    amount_uzs: float
    card_number: str
    recipient_name: str
    pin: str

class VerifyPinRequest(BaseModel):
    pin: str

# --- Marketplace ---
class CreateListingRequest(BaseModel):
    username: str
    current_price_coins: int
    buyout_price_coins: int
    category: str = "premium"
    duration_days: int = 7

class PlaceBidRequest(BaseModel):
    bid_coins: int

class BuyVerifiedRequest(BaseModel):
    months: int = 1 # 1, 3, 12

# --- Admin & Reports ---
class ReportCreate(BaseModel):
    target_type: str
    target_id: int
    reason: str

class ModerateActionRequest(BaseModel):
    report_id: int
    action: str # approve, ban_content, ban_user
    ban_reason: Optional[str] = None
