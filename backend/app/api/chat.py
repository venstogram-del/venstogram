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
# WebRTC / Audio-Video Call Signaling
# ============================================================================

@router.post("/call/start")
async def start_call(
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.core.config import settings
    recipient_id = req.get("recipient_id")
    call_type = req.get("call_type", "video") # "audio" or "video"

    rec_res = await db.execute(select(User).where(User.id == recipient_id))
    recipient = rec_res.scalars().first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Собеседник не найден")

    # Create new call session in ringing state (open to all users)
    call = CallSession(
        caller_id=current_user.id,
        receiver_id=recipient.id,
        call_type=call_type,
        status="ringing",
        duration_seconds=0
    )
    db.add(call)
    await db.commit()
    await db.refresh(call)

    # Deliver incoming call to recipient via WebSocket in Web App
    from app.websocket.manager import ws_manager
    call_payload = {
        "event": "incoming_call",
        "call_id": call.id,
        "call_type": call_type,
        "caller": {
            "id": current_user.id,
            "username": current_user.username,
            "first_name": current_user.first_name,
            "avatar_url": current_user.avatar_url
        }
    }
    delivered = await ws_manager.send_personal_message(recipient.id, call_payload)
    if not delivered and recipient.telegram_id:
        delivered = await ws_manager.send_personal_message(recipient.telegram_id, call_payload)

    # Send Telegram push notification to ensure recipient never misses the call
    if recipient.telegram_id:
        try:
            from app.bot.bot import send_bot_push_notification
            call_icon = "📹 Видеозвонок" if call_type == "video" else "📞 Аудиозвонок"
            await send_bot_push_notification(
                telegram_id=recipient.telegram_id,
                text=f"📲 <b>Входящий {call_icon} от @{current_user.username}</b>!\n\nОткройте приложение Venstogram, чтобы ответить на звонок.",
                button_text="Принять звонок в приложении",
                start_param=f"chat_{current_user.id}"
            )
        except Exception as e:
            print(f"[Bot Call Push Note] {e}")

    return {
        "status": "ok",
        "call_id": call.id,
        "call_status": "ringing"
    }


@router.get("/call/incoming")
async def check_incoming_call(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Polls or checks if current_user has any incoming ringing call.
    """
    res = await db.execute(
        select(CallSession)
        .options(selectinload(CallSession.caller))
        .where(
            CallSession.receiver_id == current_user.id,
            CallSession.status == "ringing"
        )
        .order_by(desc(CallSession.created_at))
    )
    call = res.scalars().first()
    if not call or not call.caller:
        return {"has_incoming": False}

    return {
        "has_incoming": True,
        "call_id": call.id,
        "call_type": call.call_type or "audio",
        "caller": {
            "id": call.caller.id,
            "username": call.caller.username or f"user{call.caller.id}",
            "first_name": call.caller.first_name or "Пользователь",
            "avatar_url": call.caller.avatar_url
        }
    }


@router.post("/call/accept")
async def accept_call(
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    call_id = req.get("call_id")
    res = await db.execute(select(CallSession).where(CallSession.id == call_id))
    call = res.scalars().first()
    if not call:
        raise HTTPException(status_code=404, detail="Звонок не найден")

    call.status = "accepted"
    await db.commit()

    # Notify caller that receiver accepted
    from app.websocket.manager import ws_manager
    await ws_manager.send_personal_message(
        call.caller_id,
        {
            "event": "call_accepted",
            "call_id": call.id,
            "receiver_id": current_user.id
        }
    )

    return {"status": "ok", "call_status": "accepted"}


@router.post("/call/reject")
async def reject_call(
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    call_id = req.get("call_id")
    res = await db.execute(select(CallSession).where(CallSession.id == call_id))
    call = res.scalars().first()
    if not call:
        raise HTTPException(status_code=404, detail="Звонок не найден")

    call.status = "rejected"
    await db.commit()

    from app.websocket.manager import ws_manager
    await ws_manager.send_personal_message(
        call.caller_id,
        {
            "event": "call_rejected",
            "call_id": call.id,
            "message": "Абонент отклонил звонок"
        }
    )

    return {"status": "ok", "call_status": "rejected"}


@router.post("/call/end")
async def end_call_session(
    req: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    call_id = req.get("call_id")
    duration = req.get("duration_seconds", 0)
    res = await db.execute(select(CallSession).where(CallSession.id == call_id))
    call = res.scalars().first()
    if not call:
        return {"status": "ok"}

    call.status = "ended"
    call.duration_seconds = duration
    await db.commit()

    partner_id = call.receiver_id if call.caller_id == current_user.id else call.caller_id
    from app.websocket.manager import ws_manager
    await ws_manager.send_personal_message(
        partner_id,
        {
            "event": "call_ended",
            "call_id": call.id
        }
    )

    return {"status": "ok", "call_status": "ended"}


@router.get("/call/{call_id}/status")
async def get_call_status(
    call_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(CallSession).where(CallSession.id == call_id))
    call = res.scalars().first()
    if not call:
        return {"status": "ended"}

    return {
        "status": call.status,
        "duration_seconds": call.duration_seconds
    }


# In-memory mailbox for WebRTC signaling (offers, answers, ICE candidates)
# Ensures signaling delivery even across WebSocket disconnects / cellular handovers
_pending_call_signals: dict = {}

@router.post("/call/signal")
async def send_call_signal(
    req: dict,
    current_user: User = Depends(get_current_user)
):
    """
    Relays WebRTC SDP offers, SDP answers, and ICE candidates between call participants.
    Delivers via active WebSocket with fallback queuing for HTTP polling.
    """
    target_user_id = req.get("target_user_id")
    call_id = req.get("call_id")
    signal_type = req.get("signal_type") # "call_offer", "call_answer", "ice_candidate", "call_end"
    payload = req.get("payload")

    if not target_user_id or not signal_type:
        raise HTTPException(status_code=400, detail="Missing target_user_id or signal_type")

    event_name = signal_type if signal_type.startswith("call_") or signal_type == "ice_candidate" else f"call_{signal_type}"

    signal_data = {
        "event": event_name,
        "signal_type": signal_type,
        "call_id": call_id,
        "from_user_id": current_user.id,
        "target_user_id": target_user_id,
        "payload": payload,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    # 1. Deliver immediately to active WebSocket
    from app.websocket.manager import ws_manager
    delivered = await ws_manager.send_personal_message(target_user_id, signal_data)

    # 2. Store in pending queue for HTTP polling fallback only if not delivered via WS
    if not delivered:
        if target_user_id not in _pending_call_signals:
            _pending_call_signals[target_user_id] = []
        _pending_call_signals[target_user_id].append(signal_data)
        if len(_pending_call_signals[target_user_id]) > 50:
            _pending_call_signals[target_user_id] = _pending_call_signals[target_user_id][-50:]

    return {"status": "ok", "delivered_ws": delivered}


@router.get("/call/signal/pending")
async def get_pending_call_signals(
    current_user: User = Depends(get_current_user)
):
    """
    Fetches and drains queued WebRTC signaling messages for current user.
    """
    signals = _pending_call_signals.pop(current_user.id, [])
    return {"signals": signals}


@router.get("/call/ice-servers")
async def get_ice_servers():
    """
    Returns public STUN servers for WebRTC NAT traversal.
    """
    return {
        "iceServers": [
            {"urls": "stun:stun.l.google.com:19302"},
            {"urls": "stun:stun1.l.google.com:19302"},
            {"urls": "stun:stun2.l.google.com:19302"},
            {"urls": "stun:stun3.l.google.com:19302"},
            {"urls": "stun:stun4.l.google.com:19302"}
        ]
    }

