from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, case, delete
from sqlalchemy.orm import selectinload
from typing import Optional
from app.database.session import get_db
from app.models.entities import User, Reel, ReelLike, ReelComment, Follow, SavedItem, Notification, Post, PostLike, PostComment
from app.schemas.all_schemas import ReelCreate, ReelCommentCreate
from app.api.deps import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/reels", tags=["Reels & Shorts"])

@router.get("")
async def get_reels(
    offset: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Prioritize reels from friends / creators the user follows + own reels
    following_res = await db.execute(
        select(Follow.following_id).where(Follow.follower_id == current_user.id)
    )
    following_ids = set(following_res.scalars().all())
    priority_ids = following_ids.union({current_user.id})
    friend_priority = case((Reel.user_id.in_(priority_ids), 1), else_=0) if priority_ids else 0

    query = (
        select(Reel)
        .options(selectinload(Reel.author))
        .where(Reel.is_flagged == False)
        .join(User)
        .order_by(desc(friend_priority), desc(User.is_verified), desc(Reel.likes_count), desc(Reel.created_at))
        .offset(offset)
        .limit(limit)
    )
    res = await db.execute(query)
    reels = res.scalars().all()

    reel_ids = [r.id for r in reels]
    liked_ids = set()
    saved_ids = set()
    if reel_ids:
        likes_res = await db.execute(
            select(ReelLike.reel_id).where(
                ReelLike.reel_id.in_(reel_ids),
                ReelLike.user_id == current_user.id
            )
        )
        liked_ids = set(likes_res.scalars().all())

        saved_res = await db.execute(
            select(SavedItem.item_id).where(
                SavedItem.user_id == current_user.id,
                SavedItem.item_type == "reel",
                SavedItem.item_id.in_(reel_ids)
            )
        )
        saved_ids = set(saved_res.scalars().all())

    output = []
    for r in reels:
        r.views_count += 1
        output.append({
            "id": r.id,
            "video_url": r.video_url,
            "thumbnail_url": r.thumbnail_url,
            "caption": r.caption,
            "audio_title": r.audio_title,
            "audio_author": r.audio_author,
            "likes_count": r.likes_count,
            "views_count": r.views_count,
            "comments_count": r.comments_count,
            "shares_count": r.shares_count,
            "is_liked": r.id in liked_ids,
            "is_saved": r.id in saved_ids,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "analytics": {
                "views": r.views_count,
                "top_age_group": "18–24 года (46%)",
                "age_demographics": [
                    {"label": "18–24 года", "percent": 46},
                    {"label": "25–34 года", "percent": 34},
                    {"label": "35–44 года", "percent": 14},
                    {"label": "Младше 18 лет", "percent": 6}
                ],
                "gender": {"male": 52, "female": 48},
                "avg_watch_time": "19.2 сек"
            },
            "author": {
                "id": r.author.id,
                "username": r.author.username,
                "first_name": r.author.first_name,
                "avatar_url": r.author.avatar_url,
                "is_verified": r.author.is_verified
            }
        })

    await db.commit()
    return output


@router.post("")
async def create_reel(
    req: ReelCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    reel = Reel(
        user_id=current_user.id,
        video_url=req.video_url,
        thumbnail_url=req.thumbnail_url or "",
        caption=req.caption,
        audio_title=req.audio_title or "Original Sound - Venstogram",
        audio_author=req.audio_author or current_user.first_name
    )
    db.add(reel)
    await db.commit()
    await db.refresh(reel)

    reel_data = {
        "id": reel.id,
        "video_url": reel.video_url,
        "thumbnail_url": reel.thumbnail_url or "",
        "caption": reel.caption or "",
        "audio_title": reel.audio_title,
        "audio_author": reel.audio_author,
        "likes_count": reel.likes_count,
        "views_count": reel.views_count,
        "comments_count": reel.comments_count,
        "shares_count": reel.shares_count,
        "is_liked": False,
        "is_saved": False,
        "created_at": reel.created_at.isoformat() if reel.created_at else None,
        "author": {
            "id": current_user.id,
            "username": current_user.username,
            "first_name": current_user.first_name,
            "avatar_url": current_user.avatar_url,
            "is_verified": current_user.is_verified
        }
    }

    # Real-time WebSocket broadcast so everyone sees the new reel immediately without reloading
    try:
        from app.websocket.manager import ws_manager
        await ws_manager.broadcast({"event": "new_reel", "reel": reel_data})
    except Exception as e:
        print(f"[WebSocket Reel Broadcast Error] {e}")

    return {"status": "ok", "reel_id": reel.id, "reel": reel_data}


@router.post("/{reel_id}/like")
async def toggle_like_reel(
    reel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Reel).where(Reel.id == reel_id))
    reel = res.scalars().first()
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")

    like_res = await db.execute(
        select(ReelLike).where(ReelLike.reel_id == reel_id, ReelLike.user_id == current_user.id)
    )
    existing_like = like_res.scalars().first()

    if existing_like:
        await db.delete(existing_like)
        reel.likes_count = max(0, reel.likes_count - 1)
        liked = False
    else:
        new_like = ReelLike(reel_id=reel_id, user_id=current_user.id)
        db.add(new_like)
        reel.likes_count += 1
        liked = True
        if reel.user_id != current_user.id:
            actor_name = current_user.first_name or current_user.username or "Пользователь"
            notif = Notification(
                user_id=reel.user_id,
                actor_id=current_user.id,
                type="like_reel",
                target_id=reel.id,
                message=f"{actor_name} оценил(а) ваш Reels"
            )
            db.add(notif)

    await db.commit()
    return {"liked": liked, "likes_count": reel.likes_count}


@router.post("/{reel_id}/save")
async def toggle_save_reel(
    reel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Reel).where(Reel.id == reel_id))
    reel = res.scalars().first()
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")

    saved_res = await db.execute(
        select(SavedItem).where(
            SavedItem.user_id == current_user.id,
            SavedItem.item_type == "reel",
            SavedItem.item_id == reel_id
        )
    )
    existing_saved = saved_res.scalars().first()
    if existing_saved:
        await db.delete(existing_saved)
        is_saved = False
    else:
        new_saved = SavedItem(user_id=current_user.id, item_type="reel", item_id=reel_id)
        db.add(new_saved)
        is_saved = True

    await db.commit()
    return {"status": "ok", "is_saved": is_saved}



@router.get("/{reel_id}/comments")
async def get_reel_comments(
    reel_id: int,
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(ReelComment)
        .options(selectinload(ReelComment.author))
        .where(ReelComment.reel_id == reel_id)
        .order_by(ReelComment.created_at.asc())
    )
    comments = res.scalars().all()
    return [
        {
            "id": c.id,
            "text": c.text,
            "parent_id": getattr(c, "parent_id", None),
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


@router.post("/{reel_id}/comments")
async def add_reel_comment(
    reel_id: int,
    req: ReelCommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Reel).where(Reel.id == reel_id))
    reel = res.scalars().first()
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")

    comment = ReelComment(
        reel_id=reel_id,
        user_id=current_user.id,
        parent_id=req.parent_id,
        text=req.text
    )
    db.add(comment)
    reel.comments_count += 1
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


@router.post("/{reel_id}/share")
async def share_reel(
    reel_id: int,
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Reel).where(Reel.id == reel_id))
    reel = res.scalars().first()
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")
    reel.shares_count += 1
    await db.commit()
    return {"status": "ok", "shares_count": reel.shares_count}


@router.delete("/{reel_id}")
async def delete_reel(
    reel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deletes a Reel (or Post). Allowed for Reel author or Director/Moderator/Admin.
    """
    is_admin = (
        current_user.role in ("director", "moderator", "admin", "it_admin", "developer") or
        current_user.telegram_id in settings.ADMIN_TELEGRAM_IDS
    )

    res = await db.execute(select(Reel).where(Reel.id == reel_id))
    reel = res.scalars().first()

    if not reel:
        # Fallback to Post if id belongs to a Post
        post_res = await db.execute(select(Post).where(Post.id == reel_id))
        post = post_res.scalars().first()
        if not post:
            raise HTTPException(status_code=404, detail="Reel не найден")

        if post.user_id != current_user.id and not is_admin:
            raise HTTPException(status_code=403, detail="Вы можете удалять только свои публикации")

        await db.execute(delete(PostComment).where(PostComment.post_id == post.id))
        await db.execute(delete(PostLike).where(PostLike.post_id == post.id))
        await db.execute(delete(SavedItem).where(SavedItem.item_type == "post", SavedItem.item_id == post.id))
        await db.execute(delete(Notification).where(Notification.target_id == post.id))
        await db.delete(post)
        await db.commit()
        return {"status": "ok", "message": "Публикация успешно удалена", "deleted_id": reel_id}

    if reel.user_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Вы можете удалять только свои Reels")

    # Also clean up any Post created with this video URL
    if reel.video_url:
        synced_posts_res = await db.execute(
            select(Post).where(
                Post.user_id == reel.user_id,
                Post.media_type == "video"
            )
        )
        for sp in synced_posts_res.scalars().all():
            if sp.media_urls and reel.video_url in sp.media_urls:
                await db.execute(delete(PostComment).where(PostComment.post_id == sp.id))
                await db.execute(delete(PostLike).where(PostLike.post_id == sp.id))
                await db.execute(delete(SavedItem).where(SavedItem.item_type == "post", SavedItem.item_id == sp.id))
                await db.delete(sp)

    await db.execute(delete(ReelComment).where(ReelComment.reel_id == reel.id))
    await db.execute(delete(ReelLike).where(ReelLike.reel_id == reel.id))
    await db.execute(delete(SavedItem).where(SavedItem.item_type == "reel", SavedItem.item_id == reel.id))
    await db.execute(delete(Notification).where(Notification.target_id == reel.id))

    await db.delete(reel)
    await db.commit()
    return {"status": "ok", "message": "Reels успешно удален", "deleted_id": reel_id}


@router.delete("/{reel_id}/comments/{comment_id}")
async def delete_reel_comment(
    reel_id: int,
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deletes a comment on a Reel. Allowed for comment author, Reel author, or Director/Moderator.
    """
    res = await db.execute(select(ReelComment).where(ReelComment.id == comment_id, ReelComment.reel_id == reel_id))
    comment = res.scalars().first()
    if not comment:
        raise HTTPException(status_code=404, detail="Комментарий не найден")

    reel_res = await db.execute(select(Reel).where(Reel.id == reel_id))
    reel = reel_res.scalars().first()

    is_author = comment.user_id == current_user.id
    is_reel_owner = reel and reel.user_id == current_user.id
    is_admin = current_user.role in ("director", "moderator")

    if not (is_author or is_reel_owner or is_admin):
        raise HTTPException(status_code=403, detail="Нет прав для удаления этого комментария")

    await db.delete(comment)
    if reel:
        reel.comments_count = max(0, reel.comments_count - 1)
    await db.commit()
    return {"status": "ok", "message": "Комментарий успешно удален"}

