from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, case
from sqlalchemy.orm import selectinload
from typing import Optional
from app.database.session import get_db
from app.models.entities import User, Reel, ReelLike, ReelComment, Follow
from app.schemas.all_schemas import ReelCreate, ReelCommentCreate
from app.api.deps import get_current_user

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
    if reel_ids:
        likes_res = await db.execute(
            select(ReelLike.reel_id).where(
                ReelLike.reel_id.in_(reel_ids),
                ReelLike.user_id == current_user.id
            )
        )
        liked_ids = set(likes_res.scalars().all())

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

    return {"status": "ok", "reel_id": reel.id}


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

    await db.commit()
    return {"liked": liked, "likes_count": reel.likes_count}


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
    Deletes a Reel. Allowed for Reel author or Director/Moderator.
    """
    res = await db.execute(select(Reel).where(Reel.id == reel_id))
    reel = res.scalars().first()
    if not reel:
        raise HTTPException(status_code=404, detail="Reel не найден")

    if reel.user_id != current_user.id and current_user.role not in ("director", "moderator"):
        raise HTTPException(status_code=403, detail="Вы можете удалять только свои Reels")

    await db.delete(reel)
    await db.commit()
    return {"status": "ok", "message": "Reels успешно удален"}


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

