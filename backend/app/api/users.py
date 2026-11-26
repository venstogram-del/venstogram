import re
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from app.database.session import get_db
from app.models.entities import User, Follow, Post, Reel, UsernameListing, PostLike, ReelLike, SavedItem, Notification
from app.schemas.all_schemas import GiftThemeRequest
from app.api.deps import get_current_user, get_current_user_optional

FOUNDER_RESERVED_USERNAMES = {
    "uzbekiston", "uzbekistan", "venstogram", "director", "admin", "yuksak", "yuksak_it", "official"
}

def is_sacred_username(username: str) -> bool:
    norm = re.sub(r'[^a-zA-Z0-9]', '', (username or '').lower())
    sacred_roots = [
        "allah", "alloh", "allokh", "qaba", "kaaba", "kabah", "kaabah",
        "muhammad", "mukhammad", "muhammed", "mohammed", "rasululloh",
        "rasulullah", "paygambar", "paygamber", "sallallahu", "alayhiwasallam"
    ]
    for root in sacred_roots:
        if root in norm:
            return True
    return False

router = APIRouter(prefix="/users", tags=["Users & Search"])

@router.get("/check-username")
async def check_username(
    username: str = Query(..., min_length=1, max_length=64),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    cleaned = username.strip().lower()
    if cleaned.startswith("@"):
        cleaned = cleaned[1:]

    if cleaned.isdigit():
        return {
            "available": False,
            "username": cleaned,
            "message": "Числовые никнеймы (1, 2, 7...) эксклюзивны и доступны только на Маркетплейсе!",
            "is_current": False,
            "suggestions": []
        }

    if not re.match(r"^[a-zA-Z][a-zA-Z0-9_]{2,31}$", cleaned):
        return {
            "available": False,
            "username": cleaned,
            "message": "Никнейм должен начинаться с буквы и содержать от 3 до 32 символов (латинские буквы, цифры и _)",
            "is_current": False,
            "suggestions": []
        }

    # Sacred Religious Names Blacklist
    if is_sacred_username(cleaned):
        return {
            "available": False,
            "username": cleaned,
            "message": "Никнейм содержит священное религиозное имя и запрещён к регистрации из уважения к чувствам верующих.",
            "is_current": False,
            "suggestions": []
        }

    if current_user and current_user.username and current_user.username.lower() == cleaned:
        return {
            "available": True,
            "username": cleaned,
            "message": "Это ваш текущий никнейм ✓",
            "is_current": True,
            "suggestions": []
        }

    # Reserved by Founder
    if cleaned in FOUNDER_RESERVED_USERNAMES:
        return {
            "available": False,
            "username": cleaned,
            "message": f"Никнейм @{cleaned} зарезервирован Основателем платформы. Выдаётся лично Директором.",
            "is_current": False,
            "suggestions": [f"{cleaned}1", f"{cleaned}2", f"{cleaned}_1", f"{cleaned}77"]
        }

    # Check users table (only active/verified accounts take usernames)
    u_stmt = select(User.id).where(
        func.lower(User.username) == cleaned,
        or_(User.telegram_id < 9000000000, User.is_email_verified == True)
    )
    if current_user:
        u_stmt = u_stmt.where(User.id != current_user.id)
    u_res = await db.execute(u_stmt)
    is_taken_user = u_res.scalars().first() is not None

    # Check marketplace listings
    m_res = await db.execute(
        select(UsernameListing.id).where(
            func.lower(UsernameListing.username) == cleaned,
            UsernameListing.is_sold == False
        )
    )
    is_taken_market = m_res.scalars().first() is not None

    if not is_taken_user and not is_taken_market:
        return {
            "available": True,
            "username": cleaned,
            "message": f"Никнейм @{cleaned} свободен! ✓",
            "is_current": False,
            "suggestions": []
        }

    # Generate suggestions if taken:
    # e.g. instagram -> instagram1, instagram2, instagram_1, instagram77
    candidate_suffixes = ["1", "2", "3", "7", "_1", "77", "99", "_uz"]
    suggestions = []
    for sfx in candidate_suffixes:
        cand = f"{cleaned}{sfx}"[:32]
        cu = await db.execute(select(User.id).where(func.lower(User.username) == cand))
        cm = await db.execute(select(UsernameListing.id).where(func.lower(UsernameListing.username) == cand, UsernameListing.is_sold == False))
        if cu.scalars().first() is None and cm.scalars().first() is None:
            suggestions.append(cand)
        if len(suggestions) >= 4:
            break

    return {
        "available": False,
        "username": cleaned,
        "message": f"Никнейм @{cleaned} уже занят. Свободные варианты с цифрой:",
        "is_current": False,
        "suggestions": suggestions
    }

@router.get("/search")
async def search_users(
    q: str = Query("", description="Search term for username or name"),
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Search users by @username, first name, last name, or bio (Лупа / поиск друзей).
    """
    from app.core.config import settings as _cfg
    is_requester_admin = (current_user.role in ("admin", "director") or current_user.telegram_id in _cfg.ADMIN_TELEGRAM_IDS)
    
    # Only show verified registered users
    reg_filter = or_(
        User.is_registered == True,
        User.birth_year != None,
        and_(User.first_name != "", User.username != None, ~User.username.startswith("user_"))
    )
    query = select(User).where(
        User.is_banned == False,
        reg_filter
    )
    if not is_requester_admin:
        # Hide admin/director profiles from search results
        query = query.where(~User.role.in_(["admin", "director"]), ~User.telegram_id.in_(_cfg.ADMIN_TELEGRAM_IDS))
    raw_q = q.strip()
    if raw_q:
        clean_q = raw_q.lower().lstrip("@")
        term = f"%{clean_q}%"
        conditions = [
            func.lower(User.username).like(term),
            func.lower(User.first_name).like(term),
            func.lower(User.last_name).like(term),
            func.lower(User.bio).like(term)
        ]
        if clean_q.isdigit():
            val = int(clean_q)
            conditions.append(User.id == val)
            conditions.append(User.telegram_id == val)
        query = query.where(or_(*conditions))
    query = query.order_by(User.is_verified.desc(), User.last_active.desc()).limit(limit)
    res = await db.execute(query)
    users = res.scalars().all()

    # Get users current_user follows
    user_ids = [u.id for u in users]
    following_ids = set()
    if user_ids:
        f_res = await db.execute(
            select(Follow.following_id).where(
                Follow.follower_id == current_user.id,
                Follow.following_id.in_(user_ids)
            )
        )
        following_ids = set(f_res.scalars().all())

    output = []
    for u in users:
        # Count followers
        f_count = (await db.execute(select(func.count(Follow.id)).where(Follow.following_id == u.id))).scalar() or 0
        output.append({
            "id": u.id,
            "username": u.username,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "avatar_url": u.avatar_url,
            "bio": u.bio,
            "telegram_channel": u.telegram_channel or "",
            "is_verified": u.is_verified,
            "followers_count": f_count,
            "is_following": u.id in following_ids,
            "is_me": u.id == current_user.id
        })
    return output


@router.get("/{user_id}/profile")
async def get_user_public_profile(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(User).where(User.id == user_id))
    u = res.scalars().first()
    if not u or (u.telegram_id >= 9000000000 and not u.is_email_verified):
        raise HTTPException(status_code=404, detail="Profil topilmadi yoki tasdiqlanmagan / Пользователь не найден")

    # Block regular users from viewing admin/director profiles
    from app.core.config import settings as _settings
    is_target_admin = (u.role in ("admin", "director") or u.telegram_id in _settings.ADMIN_TELEGRAM_IDS)
    is_requester_admin = (current_user.role in ("admin", "director") or current_user.telegram_id in _settings.ADMIN_TELEGRAM_IDS)
    if is_target_admin and not is_requester_admin and u.id != current_user.id:
        raise HTTPException(status_code=403, detail="Этот профиль недоступен / Bu profil mavjud emas")

    posts_count = (await db.execute(select(func.count(Post.id)).where(Post.user_id == u.id))).scalar() or 0
    reels_count = (await db.execute(select(func.count(Reel.id)).where(Reel.user_id == u.id))).scalar() or 0
    followers_count = (await db.execute(select(func.count(Follow.id)).where(Follow.following_id == u.id))).scalar() or 0
    following_count = (await db.execute(select(func.count(Follow.id)).where(Follow.follower_id == u.id))).scalar() or 0

    is_following_res = await db.execute(
        select(Follow).where(Follow.follower_id == current_user.id, Follow.following_id == u.id)
    )
    is_following = bool(is_following_res.scalars().first())

    # Get recent posts
    p_res = await db.execute(select(Post).where(Post.user_id == u.id).order_by(Post.created_at.desc()).limit(12))
    posts = p_res.scalars().all()

    return {
        "id": u.id,
        "username": u.username,
        "first_name": u.first_name,
        "last_name": u.last_name,
        "avatar_url": u.avatar_url,
        "bio": u.bio,
        "website": u.website,
        "telegram_channel": u.telegram_channel or "",
        "is_verified": u.is_verified,
        "posts_count": posts_count,
        "reels_count": reels_count,
        "followers_count": followers_count,
        "following_count": following_count,
        "is_following": is_following,
        "is_me": u.id == current_user.id,
        "posts": [
            {
                "id": p.id,
                "media_url": p.media_urls[0] if p.media_urls else "",
                "caption": p.caption,
                "likes_count": p.likes_count
            }
            for p in posts
        ]
    }


@router.get("/{user_id}/posts")
async def get_user_posts_full(
    user_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Post)
        .options(selectinload(Post.author))
        .where(Post.user_id == user_id, Post.moderation_status != "rejected")
        .order_by(Post.created_at.desc())
    )
    posts = res.scalars().all()

    liked_ids = set()
    if current_user and posts:
        likes_res = await db.execute(
            select(PostLike.post_id).where(
                PostLike.user_id == current_user.id,
                PostLike.post_id.in_([p.id for p in posts])
            )
        )
        liked_ids = set(likes_res.scalars().all())

    return [
        {
            "id": p.id,
            "caption": p.caption,
            "media_urls": p.media_urls or [],
            "media_type": p.media_type,
            "location": getattr(p, "location", None),
            "likes_count": p.likes_count,
            "views_count": p.views_count,
            "comments_count": p.comments_count,
            "is_liked": p.id in liked_ids,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "author": {
                "id": p.author.id,
                "username": p.author.username,
                "first_name": p.author.first_name,
                "last_name": p.author.last_name,
                "avatar_url": p.author.avatar_url,
                "is_verified": p.author.is_verified,
                "badge_type": getattr(p.author, "badge_type", "blue")
            } if p.author else None
        }
        for p in posts
    ]


@router.get("/{user_id}/reels")
async def get_user_reels_full(
    user_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Reel)
        .options(selectinload(Reel.author))
        .where(Reel.user_id == user_id, Reel.is_flagged == False)
        .order_by(Reel.created_at.desc())
    )
    reels = res.scalars().all()

    liked_ids = set()
    if current_user and reels:
        likes_res = await db.execute(
            select(ReelLike.reel_id).where(
                ReelLike.user_id == current_user.id,
                ReelLike.reel_id.in_([r.id for r in reels])
            )
        )
        liked_ids = set(likes_res.scalars().all())

    return [
        {
            "id": r.id,
            "caption": r.caption,
            "video_url": r.video_url,
            "thumbnail_url": r.thumbnail_url or "",
            "media_urls": [r.video_url] if r.video_url else [],
            "media_type": "video",
            "likes_count": r.likes_count,
            "views_count": r.views_count,
            "comments_count": r.comments_count,
            "is_liked": r.id in liked_ids,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "author": {
                "id": r.author.id,
                "username": r.author.username,
                "first_name": r.author.first_name,
                "last_name": r.author.last_name,
                "avatar_url": r.author.avatar_url,
                "is_verified": r.author.is_verified,
                "badge_type": getattr(r.author, "badge_type", "blue")
            } if r.author else None
        }
        for r in reels
    ]


@router.get("/suggested")
async def get_suggested_users(
    limit: int = 8,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns verified & active users to follow, excluding current user and already followed users.
    """
    cur_id = current_user.id if current_user else 0
    
    # IDs already followed + self
    excluded_ids = set()
    if cur_id:
        excluded_ids.add(cur_id)
        f_res = await db.execute(select(Follow.following_id).where(Follow.follower_id == cur_id))
        excluded_ids.update(f_res.scalars().all())
    
    from app.core.config import settings as _cfg
    is_req_admin = current_user and (current_user.role in ("admin", "director") or current_user.telegram_id in _cfg.ADMIN_TELEGRAM_IDS)

    # Exclude admins/directors from public suggestions if viewer is regular user
    admin_exclude = []
    if not is_req_admin:
        admin_res = await db.execute(select(User.id).where(or_(User.role.in_(["admin", "director"]), User.telegram_id.in_(_cfg.ADMIN_TELEGRAM_IDS))))
        admin_exclude = admin_res.scalars().all()
        excluded_ids.update(admin_exclude)

    reg_filter = or_(
        User.is_registered == True,
        User.birth_year != None,
        and_(User.first_name != "", User.username != None, ~User.username.startswith("user_"))
    )

    stmt = (
        select(User)
        .where(
            User.id.notin_(list(excluded_ids) if excluded_ids else [0]),
            User.is_banned == False,
            reg_filter
        )
        .order_by(User.is_verified.desc(), User.last_active.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    users = res.scalars().all()
    
    output = []
    for u in users:
        f_count = (await db.execute(select(func.count(Follow.id)).where(Follow.following_id == u.id))).scalar() or 0
        output.append({
            "id": u.id,
            "username": u.username or f"user_{u.id}",
            "name": f"{u.first_name} {u.last_name or ''}".strip() or u.username or "Vensto User",
            "first_name": u.first_name,
            "last_name": u.last_name,
            "avatar_url": u.avatar_url,
            "is_verified": u.is_verified,
            "badge_type": getattr(u, "badge_type", "blue"),
            "followers_count": f_count,
            "is_following": False,
            "is_me": False
        })
    return output


@router.post("/{user_id}/follow")
async def toggle_follow(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="O'zingizga obuna bo'la olmaysiz / Cannot follow yourself")

    target_res = await db.execute(select(User).where(User.id == user_id))
    target_u = target_res.scalars().first()
    if not target_u or (target_u.telegram_id >= 9000000000 and not target_u.is_email_verified):
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi yoki tasdiqlanmagan / Пользователь не найден")

    res = await db.execute(
        select(Follow).where(Follow.follower_id == current_user.id, Follow.following_id == user_id)
    )
    existing = res.scalars().first()
    actor_name = current_user.first_name or current_user.username or "Пользователь"
    if existing:
        await db.delete(existing)
        is_following = False
        notif = Notification(
            user_id=user_id,
            actor_id=current_user.id,
            type="unfollow",
            message=f"{actor_name} отписался(лась) от вас"
        )
        db.add(notif)
    else:
        new_follow = Follow(follower_id=current_user.id, following_id=user_id)
        db.add(new_follow)
        is_following = True
        notif = Notification(
            user_id=user_id,
            actor_id=current_user.id,
            type="follow",
            message=f"{actor_name} подписался(лась) на вас"
        )
        db.add(notif)

    await db.commit()
    followers_count = (await db.execute(select(func.count(Follow.id)).where(Follow.following_id == user_id))).scalar() or 0
    return {"status": "ok", "is_following": is_following, "followers_count": followers_count}


@router.get("/{user_id}/followers")
async def get_user_followers(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(User)
        .join(Follow, Follow.follower_id == User.id)
        .where(
            Follow.following_id == user_id,
            or_(User.telegram_id < 9000000000, User.is_email_verified == True)
        )
        .limit(100)
    )
    res = await db.execute(stmt)
    followers = res.scalars().all()

    following_stmt = select(Follow.following_id).where(
        Follow.follower_id == current_user.id,
        Follow.following_id.in_([u.id for u in followers] if followers else [0])
    )
    my_follows = set((await db.execute(following_stmt)).scalars().all())

    return [
        {
            "id": u.id,
            "username": u.username,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "avatar_url": u.avatar_url,
            "is_verified": u.is_verified,
            "is_following": u.id in my_follows,
            "is_me": u.id == current_user.id
        }
        for u in followers
    ]


@router.get("/{user_id}/following")
async def get_user_following(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(User)
        .join(Follow, Follow.following_id == User.id)
        .where(
            Follow.follower_id == user_id,
            or_(User.telegram_id < 9000000000, User.is_email_verified == True)
        )
        .limit(100)
    )
    res = await db.execute(stmt)
    followings = res.scalars().all()

    following_stmt = select(Follow.following_id).where(
        Follow.follower_id == current_user.id,
        Follow.following_id.in_([u.id for u in followings] if followings else [0])
    )
    my_follows = set((await db.execute(following_stmt)).scalars().all())

    return [
        {
            "id": u.id,
            "username": u.username,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "avatar_url": u.avatar_url,
            "is_verified": u.is_verified,
            "is_following": u.id in my_follows,
            "is_me": u.id == current_user.id
        }
        for u in followings
    ]


# ============================================================================
# Founder's League Challenge (Игра Основателя на Золотую Галочку и Никнейм)
# ============================================================================

@router.get("/founder-quest")
async def get_founder_quest(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.core.config import settings

    # 1. Referral count
    referrals_count = (await db.execute(select(func.count(User.id)).where(User.referred_by_id == current_user.id))).scalar() or 0

    # 2. Followers count
    followers_count = (await db.execute(select(func.count(Follow.id)).where(Follow.following_id == current_user.id))).scalar() or 0

    # 3. Posts & Reels counts and total views
    posts_res = await db.execute(select(Post.views_count).where(Post.user_id == current_user.id))
    post_views = sum(posts_res.scalars().all())

    reels_res = await db.execute(select(Reel.views_count).where(Reel.user_id == current_user.id))
    reel_views = sum(reels_res.scalars().all())

    posts_count = (await db.execute(select(func.count(Post.id)).where(Post.user_id == current_user.id))).scalar() or 0
    reels_count = (await db.execute(select(func.count(Reel.id)).where(Reel.user_id == current_user.id))).scalar() or 0

    total_content = posts_count + reels_count
    total_views = post_views + reel_views

    # Super Hard Targets defined by Founder
    TARGET_REFERRALS = 1000
    TARGET_FOLLOWERS = 30000
    TARGET_CONTENT = 40
    TARGET_VIEWS = 100000

    is_completed = (
        referrals_count >= TARGET_REFERRALS and
        followers_count >= TARGET_FOLLOWERS and
        total_content >= TARGET_CONTENT and
        total_views >= TARGET_VIEWS
    )

    referral_link = f"https://t.me/{settings.BOT_USERNAME}?start=ref_{current_user.id}"

    return {
        "status": "ok",
        "current_user_id": current_user.id,
        "badge_type": getattr(current_user, "badge_type", "blue"),
        "is_golden_winner": getattr(current_user, "badge_type", "blue") == "gold_founder",
        "is_eligible": is_completed or (getattr(current_user, "role", "") == "director" or current_user.telegram_id in settings.ADMIN_TELEGRAM_IDS),
        "is_eligible_for_claim": is_completed or (getattr(current_user, "role", "") == "director" or current_user.telegram_id in settings.ADMIN_TELEGRAM_IDS),
        "has_claimed": getattr(current_user, "badge_type", "blue") == "gold_founder",
        "referrals_count": referrals_count,
        "followers_count": followers_count,
        "posts_count": total_content,
        "views_count": total_views,
        "targets": {
            "referrals": TARGET_REFERRALS,
            "followers": TARGET_FOLLOWERS,
            "posts": TARGET_CONTENT,
            "views": TARGET_VIEWS
        },
        "referral_link": referral_link,
        "progress": {
            "referrals": {
                "current": referrals_count,
                "target": TARGET_REFERRALS,
                "percent": min(100, int((referrals_count / TARGET_REFERRALS) * 100))
            },
            "followers": {
                "current": followers_count,
                "target": TARGET_FOLLOWERS,
                "percent": min(100, int((followers_count / TARGET_FOLLOWERS) * 100))
            },
            "content": {
                "current": total_content,
                "target": TARGET_CONTENT,
                "percent": min(100, int((total_content / TARGET_CONTENT) * 100))
            },
            "views": {
                "current": total_views,
                "target": TARGET_VIEWS,
                "percent": min(100, int((total_views / TARGET_VIEWS) * 100))
            }
        },
        "rewards": {
            "badge": "👑 Золотая Галочка Лиги Основателя (5x алгоритмический буст в топ)",
            "username": "Бесплатный эксклюзивный никнейм в подарок от Основателя"
        }
    }


@router.post("/founder-quest/claim")
async def claim_founder_quest_reward(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.bot.bot import send_bot_push_notification
    from app.core.config import settings

    # Re-verify milestones
    referrals_count = (await db.execute(select(func.count(User.id)).where(User.referred_by_id == current_user.id))).scalar() or 0
    followers_count = (await db.execute(select(func.count(Follow.id)).where(Follow.following_id == current_user.id))).scalar() or 0

    posts_res = await db.execute(select(Post.views_count).where(Post.user_id == current_user.id))
    post_views_list = posts_res.scalars().all()
    posts_count = len(post_views_list)
    post_views = sum(post_views_list)

    reels_res = await db.execute(select(Reel.views_count).where(Reel.user_id == current_user.id))
    reel_views_list = reels_res.scalars().all()
    reels_count = len(reel_views_list)
    reel_views = sum(reel_views_list)

    total_content = posts_count + reels_count
    total_views = post_views + reel_views

    is_director = getattr(current_user, "role", "") == "director" or current_user.telegram_id in settings.ADMIN_TELEGRAM_IDS

    if not is_director and (referrals_count < 1000 or followers_count < 30000 or total_content < 40 or total_views < 100000):
        raise HTTPException(
            status_code=400,
            detail="Вы еще не выполнили все условия Испытания Основателя! Пригласите 1 000 друзей, наберите 30 000 подписчиков, опубликуйте 40 постов/рилсов и наберите 100 000 просмотров."
        )

    current_user.is_verified = True
    current_user.badge_type = "gold_founder"
    await db.commit()

    await send_bot_push_notification(
        telegram_id=current_user.telegram_id,
        text=f"👑 <b>ПОЗДРАВЛЯЕМ! ВЫ ВЫИГРАЛИ ИСПЫТАНИЕ ОСНОВАТЕЛЯ!</b>\n\nВы доказали преданность платформе и выполнили все состязания. Вам присвоена <b>Золотая Галочка Основателя</b> и максимальный 5x приоритет во всех рекомендациях!",
        button_text="Открыть профиль"
    )

    return {
        "status": "ok",
        "badge_type": current_user.badge_type,
        "message": "Поздравляем! Золотая Галочка Основателя и максимальный 5x буст активированы!"
    }


# ============================================================================
# Saved Publications & Reels (Bookmarks)
# ============================================================================

@router.get("/me/saved")
async def get_my_saved_items(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    saved_res = await db.execute(
        select(SavedItem)
        .where(SavedItem.user_id == current_user.id)
        .order_by(SavedItem.created_at.desc())
        .limit(100)
    )
    saved_items = saved_res.scalars().all()
    
    post_ids = [s.item_id for s in saved_items if s.item_type == "post"]
    reel_ids = [s.item_id for s in saved_items if s.item_type == "reel"]
    
    posts_map = {}
    if post_ids:
        p_res = await db.execute(
            select(Post).options(selectinload(Post.author)).where(Post.id.in_(post_ids))
        )
        for p in p_res.scalars().all():
            posts_map[p.id] = p
            
    reels_map = {}
    if reel_ids:
        r_res = await db.execute(
            select(Reel).options(selectinload(Reel.author)).where(Reel.id.in_(reel_ids))
        )
        for r in r_res.scalars().all():
            reels_map[r.id] = r
            
    output = []
    for s in saved_items:
        if s.item_type == "post" and s.item_id in posts_map:
            p = posts_map[s.item_id]
            output.append({
                "id": p.id,
                "item_type": "post",
                "caption": p.caption,
                "media_urls": p.media_urls or [],
                "media_type": p.media_type,
                "likes_count": p.likes_count,
                "views_count": p.views_count,
                "comments_count": p.comments_count,
                "is_saved": True,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "author": {
                    "id": p.author.id,
                    "username": p.author.username,
                    "first_name": p.author.first_name,
                    "last_name": p.author.last_name,
                    "avatar_url": p.author.avatar_url,
                    "is_verified": p.author.is_verified,
                    "badge_type": getattr(p.author, "badge_type", "blue")
                } if p.author else None
            })
        elif s.item_type == "reel" and s.item_id in reels_map:
            r = reels_map[s.item_id]
            output.append({
                "id": r.id,
                "item_type": "reel",
                "caption": r.caption,
                "video_url": r.video_url,
                "thumbnail_url": r.thumbnail_url or "",
                "media_urls": [r.video_url] if r.video_url else [],
                "media_type": "video",
                "likes_count": r.likes_count,
                "views_count": r.views_count,
                "comments_count": r.comments_count,
                "is_saved": True,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "author": {
                    "id": r.author.id,
                    "username": r.author.username,
                    "first_name": r.author.first_name,
                    "last_name": r.author.last_name,
                    "avatar_url": r.author.avatar_url,
                    "is_verified": r.author.is_verified,
                    "badge_type": getattr(r.author, "badge_type", "blue")
                } if r.author else None
            })
    return output


# ============================================================================
# Notifications & Activity Center
# ============================================================================

@router.get("/notifications")
async def get_my_notifications(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Notification)
        .options(selectinload(Notification.actor))
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    notifs = res.scalars().all()

    unread_count = (await db.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
    )).scalar() or 0

    return {
        "unread_count": unread_count,
        "notifications": [
            {
                "id": n.id,
                "type": n.type,
                "target_id": n.target_id,
                "message": n.message,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
                "actor": {
                    "id": n.actor.id,
                    "username": n.actor.username,
                    "first_name": n.actor.first_name,
                    "last_name": n.actor.last_name,
                    "avatar_url": n.actor.avatar_url,
                    "is_verified": n.actor.is_verified,
                    "badge_type": getattr(n.actor, "badge_type", "blue")
                } if n.actor else None
            }
            for n in notifs
        ]
    }


@router.post("/notifications/read-all")
async def mark_notifications_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import update
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
    return {"status": "ok"}


# ============================================================================
# Gift VIP Design / Theme (Director Privilege)
# ============================================================================

@router.post("/{user_id}/gift-theme")
async def gift_vip_theme(
    user_id: int,
    req: GiftThemeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.core.config import settings
    is_director = getattr(current_user, "role", "") == "director" or current_user.telegram_id in settings.ADMIN_TELEGRAM_IDS
    if not is_director:
        raise HTTPException(status_code=403, detail="Только Основатель / Директор может дарить VIP темы оформления.")

    target_res = await db.execute(select(User).where(User.id == user_id))
    target_u = target_res.scalars().first()
    if not target_u:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    target_u.profile_theme = req.theme
    
    theme_names = {
        "gold_founder": "👑 Золотой Основатель (VIP Gold)",
        "cyber_neon": "💎 Неоновый Киберпанк (Cyber Neon)",
        "royal_emerald": "🌿 Королевский Изумруд (Royal Emerald)",
        "ruby_luxury": "🍷 Рубиновый Люкс (Ruby Luxury)",
        "default": "Стандартная темная"
    }
    t_name = theme_names.get(req.theme, req.theme)
    
    actor_name = current_user.first_name or "Основатель"
    notif = Notification(
        user_id=target_u.id,
        actor_id=current_user.id,
        type="gift_theme",
        message=f"👑 {actor_name} подарил вам эксклюзивный VIP дизайн: {t_name}!"
    )
    db.add(notif)
    await db.commit()
    return {
        "status": "ok",
        "message": f"VIP тема '{t_name}' успешно установлена для @{target_u.username}!"
    }

