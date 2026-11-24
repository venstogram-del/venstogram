from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, timezone
from app.database.session import get_db
from app.models.entities import User, LiveBattle, BattleGift, Transaction
from app.schemas.all_schemas import BattleInviteCreate, SendGiftRequest
from app.api.deps import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/battles", tags=["Live PK Battles & Gifts"])

# Static Gift Catalog definition
GIFTS_CATALOG = {
    "rose": {"code": "rose", "name": "Роза", "emoji": "🌹", "coins": 5, "sound": "rose_pop"},
    "heart": {"code": "heart", "name": "Сердце", "emoji": "❤️", "coins": 20, "sound": "heart_beat"},
    "fire": {"code": "fire", "name": "Огонь", "emoji": "🔥", "coins": 50, "sound": "fire_woosh"},
    "car": {"code": "car", "name": "Спорткар", "emoji": "🏎️", "coins": 200, "sound": "car_engine"},
    "plane": {"code": "plane", "name": "Бизнес-джет", "emoji": "✈️", "coins": 500, "sound": "plane_fly"},
    "lion": {"code": "lion", "name": "Королевский Лев", "emoji": "🦁", "coins": 1000, "sound": "lion_roar"},
    "crown": {"code": "crown", "name": "Императорская Корона", "emoji": "👑", "coins": 2500, "sound": "crown_fanfare"},
}

@router.get("/catalog")
async def get_gifts_catalog():
    return list(GIFTS_CATALOG.values())


@router.get("/active")
async def get_active_battles(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(LiveBattle)
        .options(selectinload(LiveBattle.host), selectinload(LiveBattle.guest))
        .where(LiveBattle.status.in_(["active", "waiting"]))
        .order_by(desc(LiveBattle.created_at))
    )
    battles = res.scalars().all()
    
    output = []
    for b in battles:
        output.append({
            "id": b.id,
            "title": b.title,
            "status": b.status,
            "duration_seconds": b.duration_seconds,
            "penalty_task": b.penalty_task,
            "host_score": b.host_score,
            "guest_score": b.guest_score,
            "started_at": b.started_at.isoformat() if b.started_at else None,
            "host": {
                "id": b.host.id,
                "username": b.host.username,
                "first_name": b.host.first_name,
                "avatar_url": b.host.avatar_url,
                "is_verified": b.host.is_verified
            },
            "guest": {
                "id": b.guest.id,
                "username": b.guest.username,
                "first_name": b.guest.first_name,
                "avatar_url": b.guest.avatar_url,
                "is_verified": b.guest.is_verified
            } if b.guest else None
        })
    return output


@router.get("/{battle_id}")
async def get_battle_details(battle_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(LiveBattle)
        .options(selectinload(LiveBattle.host), selectinload(LiveBattle.guest))
        .where(LiveBattle.id == battle_id)
    )
    b = res.scalars().first()
    if not b:
        raise HTTPException(status_code=404, detail="Battle not found")

    # Fetch top MVP sponsors (top senders by coins in this battle)
    mvp_query = (
        select(
            BattleGift.sender_id,
            func.sum(BattleGift.cost_coins).label("total_coins")
        )
        .where(BattleGift.battle_id == battle_id)
        .group_by(BattleGift.sender_id)
        .order_by(desc("total_coins"))
        .limit(3)
    )
    mvp_res = await db.execute(mvp_query)
    mvp_rows = mvp_res.all()

    mvp_users = []
    for sender_id, total_coins in mvp_rows:
        u_res = await db.execute(select(User).where(User.id == sender_id))
        u = u_res.scalars().first()
        if u:
            mvp_users.append({
                "user_id": u.id,
                "username": u.username,
                "avatar_url": u.avatar_url,
                "total_coins": total_coins
            })

    return {
        "id": b.id,
        "title": b.title,
        "status": b.status,
        "duration_seconds": b.duration_seconds,
        "penalty_task": b.penalty_task,
        "host_score": b.host_score,
        "guest_score": b.guest_score,
        "started_at": b.started_at.isoformat() if b.started_at else None,
        "host": {
            "id": b.host.id,
            "username": b.host.username,
            "first_name": b.host.first_name,
            "avatar_url": b.host.avatar_url,
            "is_verified": b.host.is_verified
        },
        "guest": {
            "id": b.guest.id,
            "username": b.guest.username,
            "first_name": b.guest.first_name,
            "avatar_url": b.guest.avatar_url,
            "is_verified": b.guest.is_verified
        } if b.guest else None,
        "mvp_sponsors": mvp_users
    }


@router.post("/invite")
async def create_battle_invite(
    req: BattleInviteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    guest_res = await db.execute(select(User).where(User.id == req.guest_id))
    guest = guest_res.scalars().first()
    if not guest:
        raise HTTPException(status_code=404, detail="Opponent user not found")

    battle = LiveBattle(
        host_id=current_user.id,
        guest_id=guest.id,
        title=f"PK Battle: @{current_user.username} VS @{guest.username}",
        status="active",
        duration_seconds=req.duration_seconds,
        penalty_task=req.penalty_task,
        started_at=datetime.now(timezone.utc)
    )
    db.add(battle)
    await db.commit()
    await db.refresh(battle)

    # In production/bot worker, this also triggers bot push notification to guest's PM
    from app.bot.bot import send_bot_push_notification
    await send_bot_push_notification(
        telegram_id=guest.telegram_id,
        text=f"⚔️ <b>ВЫЗОВ НА PK БАТТЛ!</b>\n\nПользователь @{current_user.username} вызывает вас на баттл!\n\nШтрафное задание: <i>{req.penalty_task}</i>\nДлительность: {req.duration_seconds // 60} мин.\n\nЗаходите в прямой эфир прямо сейчас!",
        button_text="Принять вызов в Mini App",
        start_param=f"battle_{battle.id}"
    )

    return {"status": "ok", "battle_id": battle.id}


@router.post("/gift")
async def send_battle_gift(
    req: SendGiftRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Sends an animated gift in a live battle with automatic 40% streamer / 60% platform revenue split.
    """
    if req.gift_code not in GIFTS_CATALOG:
        raise HTTPException(status_code=400, detail="Unknown gift code")

    gift_info = GIFTS_CATALOG[req.gift_code]
    cost_coins = gift_info["coins"]

    if current_user.wallet_coins < cost_coins:
        raise HTTPException(status_code=400, detail=f"Недостаточно монет. Стоимость: {cost_coins} Vensto Coins")

    battle_res = await db.execute(select(LiveBattle).where(LiveBattle.id == req.battle_id))
    battle = battle_res.scalars().first()
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")

    recipient_res = await db.execute(select(User).where(User.id == req.recipient_id))
    recipient = recipient_res.scalars().first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    # 40% Streamer, 60% Platform Split
    streamer_share = int(cost_coins * settings.STREAMER_SPLIT_PERCENT / 100)
    platform_share = cost_coins - streamer_share

    # Deduct coins from sender
    current_user.wallet_coins -= cost_coins
    # Credit streamer
    recipient.wallet_coins += streamer_share

    # Update battle score
    if req.recipient_id == battle.host_id:
        battle.host_score += cost_coins
    elif req.recipient_id == battle.guest_id:
        battle.guest_score += cost_coins

    # Record BattleGift
    gift_record = BattleGift(
        battle_id=battle.id,
        sender_id=current_user.id,
        recipient_id=recipient.id,
        gift_code=req.gift_code,
        gift_name=gift_info["name"],
        cost_coins=cost_coins,
        streamer_share=streamer_share,
        platform_share=platform_share
    )
    db.add(gift_record)

    # Record Transactions
    tx_sender = Transaction(
        user_id=current_user.id,
        type="gift_sent",
        amount_coins=-cost_coins,
        payment_method="balance",
        description=f"Подарок {gift_info['name']} ({gift_info['emoji']}) для @{recipient.username}"
    )
    tx_streamer = Transaction(
        user_id=recipient.id,
        type="gift_received",
        amount_coins=streamer_share,
        payment_method="balance",
        description=f"Донат с баттла (40% split): {gift_info['name']} от @{current_user.username}"
    )
    db.add_all([tx_sender, tx_streamer])
    await db.commit()

    # Broadcast gift via WebSocket to all viewers of the battle
    from app.websocket.manager import ws_manager
    await ws_manager.broadcast_to_room(
        f"battle_{battle.id}",
        {
            "event": "gift_received",
            "gift": gift_info,
            "sender": {
                "id": current_user.id,
                "username": current_user.username,
                "first_name": current_user.first_name,
                "avatar_url": current_user.avatar_url
            },
            "recipient_id": recipient.id,
            "host_score": battle.host_score,
            "guest_score": battle.guest_score
        }
    )

    return {
        "status": "ok",
        "gift": gift_info,
        "remaining_coins": current_user.wallet_coins,
        "host_score": battle.host_score,
        "guest_score": battle.guest_score
    }
