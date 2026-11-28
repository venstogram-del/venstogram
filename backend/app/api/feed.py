from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, case, delete, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timezone
from app.database.session import get_db
from app.models.entities import User, Post, PostLike, PostComment, Follow, SavedItem, Notification, Reel, ReelLike, ReelComment
from app.schemas.all_schemas import PostCreate, CommentCreate
from app.api.deps import get_current_user
from app.core.ai_moderator import ai_moderator
from app.core.config import settings

router = APIRouter(prefix="/posts", tags=["Feed & Posts"])

@router.get("")
async def get_feed(
    offset: int = 0,
    limit: int = 20,
    hashtag: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Prioritize posts from users current_user follows + own posts
    following_res = await db.execute(
        select(Follow.following_id).where(Follow.follower_id == current_user.id)
    )
    following_ids = set(following_res.scalars().all())
    priority_ids = following_ids.union({current_user.id})
    friend_priority = case((Post.user_id.in_(priority_ids), 1), else_=0) if priority_ids else 0

    query = (
        select(Post)
        .options(selectinload(Post.author))
        .join(User, Post.user_id == User.id)
        .where(
            Post.moderation_status != "rejected",
            User.is_registered == True,
            User.is_banned == False
        )
        .order_by(desc(friend_priority), desc(User.is_verified), desc(Post.created_at))
        .offset(offset)
        .limit(limit)
    )
    res = await db.execute(query)
    posts = res.scalars().all()

    # Get user's liked and saved posts
    post_ids = [p.id for p in posts]
    liked_post_ids = set()
    saved_post_ids = set()
    if post_ids:
        likes_res = await db.execute(
            select(PostLike.post_id).where(
                PostLike.post_id.in_(post_ids),
                PostLike.user_id == current_user.id
            )
        )
        liked_post_ids = set(likes_res.scalars().all())

        saved_res = await db.execute(
            select(SavedItem.item_id).where(
                SavedItem.user_id == current_user.id,
                SavedItem.item_type == "post",
                SavedItem.item_id.in_(post_ids)
            )
        )
        saved_post_ids = set(saved_res.scalars().all())

    output = []
    for p in posts:
        # Do NOT increment views on feed list — views only counted on individual post open
        output.append({
            "id": p.id,
            "caption": p.caption,
            "media_urls": p.media_urls,
            "media_type": p.media_type,
            "location": p.location,
            "hashtags": p.hashtags,
            "likes_count": p.likes_count,
            "views_count": p.views_count,
            "comments_count": p.comments_count,
            "is_liked": p.id in liked_post_ids,
            "is_saved": p.id in saved_post_ids,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "author": {
                "id": p.author.id,
                "username": p.author.username,
                "first_name": p.author.first_name,
                "last_name": p.author.last_name,
                "avatar_url": p.author.avatar_url,
                "is_verified": p.author.is_verified
            }
        })
    await db.commit()
    return output


@router.post("")
async def create_post(
    req: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Run AI content moderation on caption
    is_safe, threat_score, flags = ai_moderator.analyze_text(req.caption)
    
    post = Post(
        user_id=current_user.id,
        caption=req.caption,
        media_urls=req.media_urls,
        media_type=req.media_type,
        location=req.location or "",
        hashtags=req.hashtags or [],
        is_flagged=False,
        threat_score=threat_score,
        moderation_status="approved",
        moderation_reason=", ".join(flags) if flags else None
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)

    return {
        "status": "ok",
        "post_id": post.id,
        "moderation_status": "approved",
        "message": "Post created successfully"
    }


@router.post("/{post_id}/like")
async def toggle_like_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Post).where(Post.id == post_id))
    post = res.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    like_res = await db.execute(
        select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == current_user.id)
    )
    existing_like = like_res.scalars().first()

    if existing_like:
        await db.delete(existing_like)
        post.likes_count = max(0, post.likes_count - 1)
        liked = False
    else:
        new_like = PostLike(post_id=post_id, user_id=current_user.id)
        db.add(new_like)
        post.likes_count += 1
        liked = True
        if post.user_id != current_user.id:
            actor_name = current_user.first_name or current_user.username or "Пользователь"
            notif = Notification(
                user_id=post.user_id,
                actor_id=current_user.id,
                type="like_post",
                target_id=post.id,
                message=f"{actor_name} оценил(а) вашу публикацию"
            )
            db.add(notif)

    await db.commit()
    return {"liked": liked, "likes_count": post.likes_count}


@router.post("/{post_id}/save")
async def toggle_save_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Post).where(Post.id == post_id))
    post = res.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    saved_res = await db.execute(
        select(SavedItem).where(
            SavedItem.user_id == current_user.id,
            SavedItem.item_type == "post",
            SavedItem.item_id == post_id
        )
    )
    existing_saved = saved_res.scalars().first()
    if existing_saved:
        await db.delete(existing_saved)
        is_saved = False
    else:
        new_saved = SavedItem(user_id=current_user.id, item_type="post", item_id=post_id)
        db.add(new_saved)
        is_saved = True

    await db.commit()
    return {"status": "ok", "is_saved": is_saved}



@router.get("/{post_id}/comments")
async def get_post_comments(
    post_id: int,
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(PostComment)
        .options(selectinload(PostComment.author))
        .where(PostComment.post_id == post_id)
        .order_by(PostComment.created_at.asc())
    )
    comments = res.scalars().all()
    
    return [
        {
            "id": c.id,
            "text": c.text,
            "parent_id": c.parent_id,
            "sticker_url": c.sticker_url,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "author": {
                "id": c.author.id,
                "username": c.author.username,
                "first_name": c.author.first_name,
                "avatar_url": c.author.avatar_url,
                "is_verified": c.author.is_verified
            }
        }
        for c in comments
    ]


@router.post("/{post_id}/comments")
async def add_post_comment(
    post_id: int,
    req: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Post).where(Post.id == post_id))
    post = res.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = PostComment(
        post_id=post_id,
        user_id=current_user.id,
        text=req.text,
        parent_id=req.parent_id,
        sticker_url=req.sticker_url
    )
    db.add(comment)
    post.comments_count += 1
    await db.commit()
    await db.refresh(comment)

    return {
        "id": comment.id,
        "text": comment.text,
        "parent_id": comment.parent_id,
        "created_at": comment.created_at.isoformat(),
        "author": {
            "id": current_user.id,
            "username": current_user.username,
            "first_name": current_user.first_name,
            "avatar_url": current_user.avatar_url,
            "is_verified": current_user.is_verified
        }
    }


_VIEWED_POSTS = set()

@router.get("/{post_id}")
async def get_single_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Post).options(selectinload(Post.author)).where(Post.id == post_id)
    )
    post = res.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Only count unique views per user, and ensure views cannot exceed real registered user count
    view_key = (post.id, current_user.id)
    if view_key not in _VIEWED_POSTS:
        _VIEWED_POSTS.add(view_key)
        post.views_count += 1

    # Cap views by real registered user count so numbers are 100% realistic
    total_users_res = await db.execute(select(func.count(User.id)).where(User.is_banned == False))
    total_users = total_users_res.scalar() or 1
    if post.views_count > total_users:
        post.views_count = total_users

    await db.commit()

    like_check = await db.execute(
        select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == current_user.id)
    )
    is_liked = bool(like_check.scalars().first())

    return {
        "id": post.id,
        "caption": post.caption,
        "media_urls": post.media_urls,
        "media_type": post.media_type,
        "location": post.location,
        "hashtags": post.hashtags,
        "likes_count": post.likes_count,
        "views_count": post.views_count,
        "comments_count": post.comments_count,
        "reposts_count": getattr(post, "reposts_count", 0),
        "is_liked": is_liked,
        "created_at": post.created_at.isoformat() if post.created_at else None,
        "author": {
            "id": post.author.id,
            "username": post.author.username,
            "first_name": post.author.first_name,
            "last_name": post.author.last_name,
            "avatar_url": post.author.avatar_url,
            "is_verified": post.author.is_verified
        }
    }


@router.get("/{post_id}/likers")
async def get_post_likers(
    post_id: int,
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(User)
        .join(PostLike, PostLike.user_id == User.id)
        .where(PostLike.post_id == post_id)
        .limit(50)
    )
    likers = res.scalars().all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "first_name": u.first_name,
            "avatar_url": u.avatar_url,
            "is_verified": u.is_verified
        }
        for u in likers
    ]


@router.post("/{post_id}/share")
async def share_post(
    post_id: int,
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Post).where(Post.id == post_id))
    post = res.scalars().first()
    if post:
        if hasattr(post, "reposts_count"):
            post.reposts_count += 1
        await db.commit()
    return {"status": "ok", "message": "Post shared"}


@router.post("/{post_id}/report")
async def report_post(
    post_id: int,
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.entities import ContentReport
    reason = req.get("reason", "Запрещенный контент / Нарушение законов РУз")
    report = ContentReport(
        reporter_id=current_user.id,
        target_type="post",
        target_id=post_id,
        reason=reason,
        status="pending"
    )
    db.add(report)
    await db.commit()
    return {"status": "ok", "message": "Жалоба принята. Модераторы и Директор рассмотрят публикацию."}


@router.delete("/{post_id}")
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deletes a publication (or Reel). Allowed for the author of the post or Director/Moderator/Admin.
    """
    # Only the actual author or official Director can delete
    is_director = (
        current_user.role == "director" or
        current_user.telegram_id in settings.ADMIN_TELEGRAM_IDS
    )

    # 1. Try finding Post
    res = await db.execute(select(Post).where(Post.id == post_id))
    post = res.scalars().first()

    if not post:
        # Check if this ID is a Reel
        reel_res = await db.execute(select(Reel).where(Reel.id == post_id))
        reel = reel_res.scalars().first()
        if not reel:
            raise HTTPException(status_code=404, detail="Публикация не найдена")

        if reel.user_id != current_user.id and not is_director:
            raise HTTPException(status_code=403, detail="Вы можете удалять только свои собственные публикации")

        await db.execute(delete(ReelComment).where(ReelComment.reel_id == reel.id))
        await db.execute(delete(ReelLike).where(ReelLike.reel_id == reel.id))
        await db.execute(delete(SavedItem).where(SavedItem.item_type == "reel", SavedItem.item_id == reel.id))
        await db.execute(delete(Notification).where(Notification.target_id == reel.id))
        await db.delete(reel)
        await db.commit()
        return {"status": "ok", "message": "Публикация успешно удалена", "deleted_id": post_id}

    # Post found - check permission
    if post.user_id != current_user.id and not is_director:
        raise HTTPException(status_code=403, detail="Вы можете удалять только свои собственные публикации")

    # Also clean up any Reel that was synced from this video post
    if post.media_urls:
        synced_reels_res = await db.execute(
            select(Reel).where(
                Reel.user_id == post.user_id,
                Reel.video_url.in_(post.media_urls)
            )
        )
        for synced_r in synced_reels_res.scalars().all():
            await db.execute(delete(ReelComment).where(ReelComment.reel_id == synced_r.id))
            await db.execute(delete(ReelLike).where(ReelLike.reel_id == synced_r.id))
            await db.execute(delete(SavedItem).where(SavedItem.item_type == "reel", SavedItem.item_id == synced_r.id))
            await db.delete(synced_r)

    # Clean up post comments, likes, saved items, notifications
    await db.execute(delete(PostComment).where(PostComment.post_id == post.id))
    await db.execute(delete(PostLike).where(PostLike.post_id == post.id))
    await db.execute(delete(SavedItem).where(SavedItem.item_type == "post", SavedItem.item_id == post.id))
    await db.execute(delete(Notification).where(Notification.target_id == post.id))

    await db.delete(post)
    await db.commit()
    return {"status": "ok", "message": "Публикация успешно удалена", "deleted_id": post_id}


@router.delete("/{post_id}/comments/{comment_id}")
async def delete_post_comment(
    post_id: int,
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deletes a comment. Allowed for comment author, post owner, or Director/Moderator.
    """
    res = await db.execute(select(PostComment).where(PostComment.id == comment_id, PostComment.post_id == post_id))
    comment = res.scalars().first()
    if not comment:
        raise HTTPException(status_code=404, detail="Комментарий не найден")

    post_res = await db.execute(select(Post).where(Post.id == post_id))
    post = post_res.scalars().first()

    is_author = comment.user_id == current_user.id
    is_post_owner = post and post.user_id == current_user.id
    is_admin = current_user.role in ("director", "moderator")

    if not (is_author or is_post_owner or is_admin):
        raise HTTPException(status_code=403, detail="Нет прав для удаления этого комментария")

    await db.delete(comment)
    if post:
        post.comments_count = max(0, post.comments_count - 1)
    await db.commit()
    return {"status": "ok", "message": "Комментарий успешно удален"}


# ============================================================================
# Sponsored Commercial Ads for Feed & Reels
# ============================================================================

@router.get("/ads/active")
async def get_active_sponsored_ads(db: AsyncSession = Depends(get_db)):
    from app.models.entities import SponsoredAd
    res = await db.execute(
        select(SponsoredAd).where(SponsoredAd.status == "active").order_by(desc(SponsoredAd.created_at)).limit(10)
    )
    ads = res.scalars().all()
    for a in ads:
        a.views_count += 1
    await db.commit()
    return [
        {
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "media_url": a.media_url,
            "cta_text": a.cta_text,
            "target_url": a.target_url,
            "placement": a.placement,
            "advertiser_name": a.advertiser_name,
            "views_count": a.views_count
        }
        for a in ads
    ]


@router.post("/ads/{ad_id}/click")
async def click_sponsored_ad(ad_id: int, db: AsyncSession = Depends(get_db)):
    from app.models.entities import SponsoredAd
    res = await db.execute(select(SponsoredAd).where(SponsoredAd.id == ad_id))
    ad = res.scalars().first()
    if ad:
        ad.clicks_count += 1
        await db.commit()
    return {"status": "ok"}



