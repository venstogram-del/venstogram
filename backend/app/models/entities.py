from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import (
    Column, Integer, BigInteger, String, Text, Boolean, Float,
    DateTime, ForeignKey, JSON, Enum, Index
)
from sqlalchemy.orm import relationship
from app.database.session import Base

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, index=True, nullable=False)
    username = Column(String(64), unique=True, index=True, nullable=True)
    first_name = Column(String(128), default="")
    last_name = Column(String(128), default="")
    avatar_url = Column(String(512), default="")
    bio = Column(Text, default="")
    website = Column(String(256), default="")
    telegram_channel = Column(String(256), default="")
    language_code = Column(String(16), default="ru")
    
    # Verification & Role
    is_verified = Column(Boolean, default=False)
    verified_until = Column(DateTime, nullable=True)
    badge_type = Column(String(32), default="blue") # blue (standard verified), gold_founder (Founder League Winner)
    role = Column(String(32), default="user") # user, moderator, it_admin, director, developer
    
    # Financials
    wallet_coins = Column(Integer, default=0) # Only Director has bonus coins; regular users start at 0
    wallet_uzs = Column(Float, default=0.0)
    wallet_pin = Column(String(64), nullable=True)
    biometric_enabled = Column(Boolean, default=False)
    
    # Email, Identity & Profile Details
    email = Column(String(128), unique=True, index=True, nullable=True)
    password_hash = Column(String(256), nullable=True)
    middle_name = Column(String(64), nullable=True) # Отчество
    birth_year = Column(Integer, nullable=True) # Год рождения
    birth_date = Column(String(32), nullable=True) # Полная дата рождения
    gender = Column(String(16), nullable=True) # Пол (Мужской / Женский)
    email_verification_code = Column(String(16), nullable=True)
    email_code_expires_at = Column(DateTime, nullable=True)
    is_email_verified = Column(Boolean, default=False)
    
    # Founder Quest & Referrals
    referred_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    referral_code = Column(String(32), nullable=True, index=True)

    # Security, 3-Strikes System & Ban
    is_banned = Column(Boolean, default=False)
    ban_reason = Column(String(256), nullable=True)
    warnings_count = Column(Integer, default=0) # 3 strikes rule
    warnings_history = Column(JSON, default=list) # List of warning details
    device_fingerprint = Column(String(128), nullable=True)
    last_ip = Column(String(64), nullable=True)
    
    created_at = Column(DateTime, default=utcnow)
    last_active = Column(DateTime, default=utcnow)

    # Relationships
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    stories = relationship("Story", back_populates="author", cascade="all, delete-orphan")
    reels = relationship("Reel", back_populates="author", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")


class Follow(Base):
    __tablename__ = "follows"

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    following_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow)


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    caption = Column(Text, default="")
    media_urls = Column(JSON, default=list) # List of image/video URLs
    media_type = Column(String(32), default="image") # image, video, carousel
    location = Column(String(128), default="")
    hashtags = Column(JSON, default=list)
    
    views_count = Column(Integer, default=0)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    
    # AI Moderation
    is_flagged = Column(Boolean, default=False)
    threat_score = Column(Integer, default=0)
    moderation_status = Column(String(32), default="approved") # approved, pending, rejected
    moderation_reason = Column(String(256), nullable=True)
    
    created_at = Column(DateTime, default=utcnow, index=True)

    author = relationship("User", back_populates="posts")
    comments = relationship("PostComment", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")


class PostLike(Base):
    __tablename__ = "post_likes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow)

    post = relationship("Post", back_populates="likes")


class PostComment(Base):
    __tablename__ = "post_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("post_comments.id", ondelete="CASCADE"), nullable=True)
    text = Column(Text, default="")
    sticker_url = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=utcnow)

    post = relationship("Post", back_populates="comments")
    author = relationship("User")


class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    media_url = Column(String(512), nullable=False)
    media_type = Column(String(32), default="image") # image, video
    caption = Column(String(256), default="")
    views_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)

    author = relationship("User", back_populates="stories")


class StoryView(Base):
    __tablename__ = "story_views"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reaction = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=utcnow)


class Reel(Base):
    __tablename__ = "reels"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    video_url = Column(String(512), nullable=False)
    thumbnail_url = Column(String(512), default="")
    caption = Column(Text, default="")
    audio_title = Column(String(128), default="Original Sound - Venstogram")
    audio_author = Column(String(128), default="Vensto Music")
    
    likes_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    
    is_flagged = Column(Boolean, default=False)
    threat_score = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=utcnow, index=True)

    author = relationship("User", back_populates="reels")
    comments = relationship("ReelComment", back_populates="reel", cascade="all, delete-orphan")
    likes = relationship("ReelLike", back_populates="reel", cascade="all, delete-orphan")


class ReelLike(Base):
    __tablename__ = "reel_likes"

    id = Column(Integer, primary_key=True, index=True)
    reel_id = Column(Integer, ForeignKey("reels.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow)

    reel = relationship("Reel", back_populates="likes")


class ReelComment(Base):
    __tablename__ = "reel_comments"

    id = Column(Integer, primary_key=True, index=True)
    reel_id = Column(Integer, ForeignKey("reels.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    text = Column(Text, default="")
    created_at = Column(DateTime, default=utcnow)

    reel = relationship("Reel", back_populates="comments")
    author = relationship("User")


class LiveBattle(Base):
    __tablename__ = "live_battles"

    id = Column(Integer, primary_key=True, index=True)
    host_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    guest_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    
    title = Column(String(128), default="Live PK Battle")
    status = Column(String(32), default="waiting") # waiting, active, finished, cancelled
    duration_seconds = Column(Integer, default=300) # 5 minutes default
    penalty_task = Column(Text, default="Приседания 30 раз или спеть песню")
    
    host_score = Column(Integer, default=0)
    guest_score = Column(Integer, default=0)
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    host = relationship("User", foreign_keys=[host_id])
    guest = relationship("User", foreign_keys=[guest_id])
    gifts = relationship("BattleGift", back_populates="battle", cascade="all, delete-orphan")


class BattleGift(Base):
    __tablename__ = "battle_gifts"

    id = Column(Integer, primary_key=True, index=True)
    battle_id = Column(Integer, ForeignKey("live_battles.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    gift_code = Column(String(32), nullable=False) # rose, heart, fire, car, plane, lion, crown
    gift_name = Column(String(64), nullable=False)
    cost_coins = Column(Integer, nullable=False)
    streamer_share = Column(Integer, nullable=False) # 40%
    platform_share = Column(Integer, nullable=False) # 60%
    
    created_at = Column(DateTime, default=utcnow)

    battle = relationship("LiveBattle", back_populates="gifts")
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    content = Column(Text, default="")
    media_url = Column(String(512), nullable=True)
    media_type = Column(String(32), default="text") # text, image, video, post_share, reel_share
    shared_entity_id = Column(Integer, nullable=True)
    
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow, index=True)

    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])


class CallSession(Base):
    __tablename__ = "call_sessions"

    id = Column(Integer, primary_key=True, index=True)
    caller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    call_type = Column(String(16), default="video") # audio, video
    status = Column(String(32), default="ringing") # ringing, accepted, rejected, ended, missed
    duration_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)

    caller = relationship("User", foreign_keys=[caller_id], lazy="joined")
    receiver = relationship("User", foreign_keys=[receiver_id], lazy="joined")


class UsernameListing(Base):
    __tablename__ = "username_listings"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    current_price_coins = Column(Integer, default=500)
    buyout_price_coins = Column(Integer, default=2000)
    price_usd = Column(Integer, default=500)
    price_uzs = Column(Float, default=6500000.0)
    highest_bidder_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    is_sold = Column(Boolean, default=False)
    category = Column(String(32), default="uzbek_names") # uzbek_names ($500), brands ($10k-$20k), cities ($10k-$20k)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    seller = relationship("User", foreign_keys=[seller_id])
    highest_bidder = relationship("User", foreign_keys=[highest_bidder_id])


class UsernameOrder(Base):
    __tablename__ = "username_orders"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("username_listings.id", ondelete="CASCADE"), nullable=False)
    username = Column(String(64), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    price_usd = Column(Integer, default=500)
    price_uzs = Column(Float, default=6500000.0)
    screenshot_url = Column(String(512), nullable=False) # Attached payment receipt
    status = Column(String(32), default="pending") # pending, approved, rejected
    admin_notes = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    listing = relationship("UsernameListing")
    buyer = relationship("User", foreign_keys=[buyer_id])


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(32), nullable=False) # deposit, withdrawal, gift_sent, gift_received, username_buy, verified_sub
    amount_coins = Column(Integer, default=0)
    amount_uzs = Column(Float, default=0.0)
    payment_method = Column(String(32), default="balance") # click, payme, uzum, stars, balance
    status = Column(String(32), default="completed") # pending, completed, cancelled
    description = Column(String(256), default="")
    created_at = Column(DateTime, default=utcnow, index=True)

    user = relationship("User", back_populates="transactions")


class ContentReport(Base):
    __tablename__ = "content_reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    target_type = Column(String(32), nullable=False) # post, reel, story, user, battle
    target_id = Column(Integer, nullable=False, index=True)
    reason = Column(String(256), nullable=False)
    status = Column(String(32), default="pending") # pending, reviewed, dismissed, banned
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utcnow)


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(128), nullable=False)
    details = Column(JSON, default=dict)
    ip_address = Column(String(64), default="")
    created_at = Column(DateTime, default=utcnow)


class PlatformPolicy(Base):
    __tablename__ = "platform_policies"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(64), unique=True, index=True, nullable=False) # username_terms, general_rules, director_authority
    title = Column(String(256), nullable=False)
    content = Column(Text, nullable=False)
    updated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    updated_by = relationship("User", foreign_keys=[updated_by_id])


class SponsoredAd(Base):
    __tablename__ = "sponsored_ads"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(256), nullable=False)
    description = Column(Text, default="")
    media_url = Column(String(512), nullable=False)
    cta_text = Column(String(64), default="Подробнее")
    target_url = Column(String(512), nullable=False) # Telegram channel or Website
    placement = Column(String(32), default="feed") # feed, stories, reels
    status = Column(String(32), default="active") # active, paused, completed
    advertiser_name = Column(String(128), default="Venstogram Partner")
    budget_uzs = Column(Float, default=0.0)
    views_count = Column(Integer, default=0)
    clicks_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utcnow)


