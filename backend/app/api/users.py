import re
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, and_
from typing import List, Optional
from app.database.session import get_db
from app.models.entities import User, Follow, Post, Reel, UsernameListing
from app.api.deps import get_current_user

router = APIRouter(prefix="/users", tags=["Users & Search"])

@router.get("/check-username")
async def check_username(
    username: str = Query(..., min_length=1, max_length=64),
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    cleaned = username.strip().lower()
    if cleaned.startswith("@"):
        cleaned = cleaned[1:]

    if not re.match(r"^[a-zA-Z0-9_]{3,32}$", cleaned):
        return {
            "available": False,
            "username": cleaned,
            "message": "Никнейм должен быть от 3 до 32 символов (латинские буквы, цифры и _)",
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

    # Check users table
    u_stmt = select(User.id).where(func.lower(User.username) == cleaned)
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
    query = select(User).where(User.is_banned == False)
    if q.strip():
        term = f"%{q.strip().lower()}%"
        query = query.where(
            or_(
                func.lower(User.username).like(term),
                func.lower(User.first_name).like(term),
                func.lower(User.last_name).like(term),
                func.lower(User.bio).like(term)
            )
        )
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
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

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


@router.post("/{user_id}/follow")
async def toggle_follow(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    res = await db.execute(
        select(Follow).where(Follow.follower_id == current_user.id, Follow.following_id == user_id)
    )
    existing = res.scalars().first()
    if existing:
        await db.delete(existing)
        is_following = False
    else:
        new_follow = Follow(follower_id=current_user.id, following_id=user_id)
        db.add(new_follow)
        is_following = True

    await db.commit()
    followers_count = (await db.execute(select(func.count(Follow.id)).where(Follow.following_id == user_id))).scalar() or 0
    return {"status": "ok", "is_following": is_following, "followers_count": followers_count}


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

    # Targets defined by Founder
    TARGET_REFERRALS = 50
    TARGET_FOLLOWERS = 500
    TARGET_CONTENT = 10
    TARGET_VIEWS = 5000

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
    post_views = sum(posts_res.scalars().all())

    reels_res = await db.execute(select(Reel.views_count).where(Reel.user_id == current_user.id))
    reel_views = sum(reels_res.scalars().all())

    total_views = post_views + reel_views

    is_director = getattr(current_user, "role", "") == "director" or current_user.telegram_id in settings.ADMIN_TELEGRAM_IDS

    if not is_director and (referrals_count < 50 or followers_count < 500 or total_views < 5000):
        raise HTTPException(
            status_code=400,
            detail="Вы еще не выполнили все условия Испытания Основателя! Продолжайте привлекать друзей и создавать контент."
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
