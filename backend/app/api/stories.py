from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta, timezone
from app.database.session import get_db
from app.models.entities import User, Story, StoryView
from app.schemas.all_schemas import StoryCreate, StoryReactionCreate
from app.api.deps import get_current_user

router = APIRouter(prefix="/stories", tags=["Stories"])

@router.get("")
async def get_active_stories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    res = await db.execute(
        select(Story)
        .options(selectinload(Story.author))
        .where(Story.expires_at > now)
        .order_by(desc(Story.created_at))
    )
    stories = res.scalars().all()

    # Get user views
    story_ids = [s.id for s in stories]
    viewed_ids = set()
    if story_ids:
        views_res = await db.execute(
            select(StoryView.story_id).where(
                StoryView.story_id.in_(story_ids),
                StoryView.user_id == current_user.id
            )
        )
        viewed_ids = set(views_res.scalars().all())

    # Group stories by author
    users_dict = {}
    for s in stories:
        uid = s.author.id
        if uid not in users_dict:
            users_dict[uid] = {
                "user": {
                    "id": s.author.id,
                    "username": s.author.username,
                    "first_name": s.author.first_name,
                    "avatar_url": s.author.avatar_url,
                    "is_verified": s.author.is_verified
                },
                "has_unseen": False,
                "stories": []
            }
        
        is_seen = s.id in viewed_ids
        if not is_seen:
            users_dict[uid]["has_unseen"] = True
            
        users_dict[uid]["stories"].append({
            "id": s.id,
            "media_url": s.media_url,
            "media_type": s.media_type,
            "caption": s.caption,
            "is_close_friends": getattr(s, "is_close_friends", False),
            "views_count": s.views_count,
            "is_seen": is_seen,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "expires_at": s.expires_at.isoformat() if s.expires_at else None
        })

    # Sort users: unseen stories first
    result = list(users_dict.values())
    result.sort(key=lambda x: not x["has_unseen"])
    return result


@router.post("")
async def create_story(
    req: StoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    story = Story(
        user_id=current_user.id,
        media_url=req.media_url,
        media_type=req.media_type,
        caption=req.caption or "",
        is_close_friends=req.is_close_friends,
        expires_at=now + timedelta(hours=24)
    )
    db.add(story)
    await db.commit()
    await db.refresh(story)

    return {"status": "ok", "story_id": story.id}


@router.post("/{story_id}/view")
async def view_story(
    story_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Story).where(Story.id == story_id))
    story = res.scalars().first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    view_check = await db.execute(
        select(StoryView).where(StoryView.story_id == story_id, StoryView.user_id == current_user.id)
    )
    if not view_check.scalars().first():
        view = StoryView(story_id=story_id, user_id=current_user.id)
        db.add(view)
        story.views_count += 1
        await db.commit()

    return {"status": "ok"}


@router.post("/{story_id}/react")
async def react_story(
    story_id: int,
    req: StoryReactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Story).where(Story.id == story_id))
    story = res.scalars().first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    view_check = await db.execute(
        select(StoryView).where(StoryView.story_id == story_id, StoryView.user_id == current_user.id)
    )
    existing_view = view_check.scalars().first()
    if existing_view:
        existing_view.reaction = req.reaction
    else:
        view = StoryView(story_id=story_id, user_id=current_user.id, reaction=req.reaction)
        db.add(view)
        story.views_count += 1

    await db.commit()
    return {"status": "ok", "reaction": req.reaction}
