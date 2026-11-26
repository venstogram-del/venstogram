from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from app.database.session import get_db
from app.models.entities import User, Message, CallSession
from app.schemas.all_schemas import SendMessageRequest
from app.api.deps import get_current_user

router = APIRouter(prefix="/chats", tags=["Direct Messages & Calls"])

@router.get("/dialogs")
async def get_dialogs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch distinct users the current_user exchanged messages with
    stmt = (
        select(Message)
        .options(selectinload(Message.sender), selectinload(Message.recipient))
        .where(or_(Message.sender_id == current_user.id, Message.recipient_id == current_user.id))
        .order_by(desc(Message.created_at))
    )
    res = await db.execute(stmt)
    all_msgs = res.scalars().all()

    dialog_partners = {}
    for m in all_msgs:
        partner_id = m.recipient_id if m.sender_id == current_user.id else m.sender_id
        if partner_id not in dialog_partners:
            partner = m.recipient if m.sender_id == current_user.id else m.sender
            if not partner:
                continue
            dialog_partners[partner_id] = {
                "partner": {
                    "id": partner.id,
                    "username": partner.username or f"user{partner.id}",
                    "first_name": partner.first_name or "Пользователь",
                    "last_name": partner.last_name or "",
                    "avatar_url": partner.avatar_url,
                    "is_verified": bool(getattr(partner, "is_verified", False)),
                    "last_active": partner.last_active.isoformat() if partner.last_active else None
                },
                "last_message": {
                    "id": m.id,
                    "content": m.content,
                    "media_type": m.media_type,
                    "is_mine": m.sender_id == current_user.id,
                    "is_read": m.is_read,
                    "created_at": m.created_at.isoformat() if m.created_at else None
                },
                "unread_count": 0,
                "is_archived": False
            }
        elif m.recipient_id == current_user.id and not m.is_read:
            if partner_id in dialog_partners:
                dialog_partners[partner_id]["unread_count"] += 1

    # Check which partners are archived by current user
    from app.models.entities import ArchivedChat
    arch_res = await db.execute(select(ArchivedChat.partner_id).where(ArchivedChat.user_id == current_user.id))
    archived_ids = set(arch_res.scalars().all())
    for pid, d in dialog_partners.items():
        if pid in archived_ids:
            d["is_archived"] = True

    return list(dialog_partners.values())


@router.post("/{partner_id}/archive")
async def archive_dialog(
    partner_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.entities import ArchivedChat
    chk = await db.execute(
        select(ArchivedChat).where(ArchivedChat.user_id == current_user.id, ArchivedChat.partner_id == partner_id)
    )
    if not chk.scalars().first():
        db.add(ArchivedChat(user_id=current_user.id, partner_id=partner_id))
        await db.commit()
    return {"status": "ok", "partner_id": partner_id, "is_archived": True}


@router.post("/{partner_id}/unarchive")
async def unarchive_dialog(
    partner_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.entities import ArchivedChat
    chk = await db.execute(
        select(ArchivedChat).where(ArchivedChat.user_id == current_user.id, ArchivedChat.partner_id == partner_id)
    )
    row = chk.scalars().first()
    if row:
        await db.delete(row)
        await db.commit()
    return {"status": "ok", "partner_id": partner_id, "is_archived": False}


@router.get("/{partner_id}/messages")
async def get_messages(
    partner_id: int,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Message)
        .where(
            or_(
                and_(Message.sender_id == current_user.id, Message.recipient_id == partner_id),
                and_(Message.sender_id == partner_id, Message.recipient_id == current_user.id)
            )
        )
        .order_by(Message.created_at.asc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    messages = res.scalars().all()

    # Mark incoming as read
    for m in messages:
        if m.recipient_id == current_user.id and not m.is_read:
            m.is_read = True
    await db.commit()

    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "recipient_id": m.recipient_id,
            "content": m.content,
            "media_url": m.media_url,
            "media_type": m.media_type,
            "shared_entity_id": m.shared_entity_id,
            "is_read": m.is_read,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in messages
    ]


@router.post("/send")
async def send_message(
    req: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    rec_res = await db.execute(select(User).where(User.id == req.recipient_id))
    recipient = rec_res.scalars().first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    msg = Message(
        sender_id=current_user.id,
        recipient_id=recipient.id,
        content=req.content or "",
        media_url=req.media_url,
        media_type=req.media_type,
        shared_entity_id=req.shared_entity_id
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    # Deliver via WebSocket if active inside Web App
    from app.websocket.manager import ws_manager
    msg_dict = {
        "id": msg.id,
        "sender_id": current_user.id,
        "recipient_id": recipient.id,
        "content": msg.content,
        "media_url": msg.media_url,
        "media_type": msg.media_type,
        "created_at": msg.created_at.isoformat(),
        "is_read": False,
        "sender": {
            "id": current_user.id,
            "username": current_user.username,
            "first_name": current_user.first_name,
            "avatar_url": current_user.avatar_url
        }
    }
    msg_event = {
        "event": "new_message",
        "message": msg_dict
    }
    delivered = await ws_manager.send_personal_message(recipient.id, msg_event)
    if not delivered and recipient.telegram_id:
        delivered = await ws_manager.send_personal_message(recipient.telegram_id, msg_event)
    # Also notify sender's own sessions
    await ws_manager.send_personal_message(current_user.id, msg_event)

    # Fallback push to bot PM ONLY if user is completely offline / closed the Web App
    if not delivered and recipient.telegram_id:
        from app.bot.bot import send_bot_push_notification
        preview = req.content[:100] if req.content else f"[{req.media_type}]"
        await send_bot_push_notification(
            telegram_id=recipient.telegram_id,
            text=f"💬 <b>Новое сообщение от @{current_user.username}</b>:\n\n{preview}",
            button_text="Открыть чат",
            start_param=f"chat_{current_user.id}"
        )

    return {"status": "ok", "message_id": msg.id, "message": msg_dict}


# ============================================================================
# ============================================================================
# Calls Disabled (Removed completely per project requirements)
# ============================================================================

@router.post("/call/start")
async def start_call():
    return {"status": "calls_disabled", "message": "Звонки отключены"}

@router.get("/call/incoming")
async def check_incoming_call():
    return {"has_incoming": False}

@router.post("/call/accept")
async def accept_call():
    return {"status": "calls_disabled"}

@router.post("/call/reject")
async def reject_call():
    return {"status": "calls_disabled"}

@router.post("/call/end")
async def end_call_session():
    return {"status": "ended"}

@router.get("/call/{call_id}/status")
async def get_call_status(call_id: int):
    return {"status": "ended", "duration_seconds": 0}

@router.post("/call/signal")
async def send_call_signal():
    return {"status": "calls_disabled"}

@router.get("/call/signal/pending")
async def get_pending_call_signals():
    return {"signals": []}

@router.get("/call/ice-servers")
async def get_ice_servers():
    return {"iceServers": []}

