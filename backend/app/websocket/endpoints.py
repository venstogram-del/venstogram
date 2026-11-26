import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from app.core.security import decode_access_token
from app.websocket.manager import ws_manager

router = APIRouter(tags=["WebSockets"])

@router.websocket("/ws/live")
async def websocket_live_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        telegram_id = int(payload["sub"])
    except (ValueError, TypeError):
        telegram_id = payload["sub"]

    db_user_id = None
    user_tg_id = telegram_id
    try:
        from app.database.session import AsyncSessionLocal
        from app.models.entities import User
        from sqlalchemy import select
        async with AsyncSessionLocal() as db:
            if isinstance(telegram_id, int):
                res = await db.execute(select(User).where((User.telegram_id == telegram_id) | (User.id == telegram_id)))
            else:
                res = await db.execute(select(User).where(User.username == str(telegram_id)))
            user_obj = res.scalars().first()
            if user_obj:
                db_user_id = user_obj.id
                user_tg_id = user_obj.telegram_id
    except Exception as e:
        print("[WS Connect DB lookup note]", e)

    identifiers = set()
    if user_tg_id:
        identifiers.add(user_tg_id)
        identifiers.add(str(user_tg_id))
    if db_user_id:
        identifiers.add(db_user_id)
        identifiers.add(str(db_user_id))
    if not identifiers:
        identifiers.add(telegram_id)

    for ident in identifiers:
        await ws_manager.connect_user(ident, websocket)

    user_id = db_user_id or user_tg_id or telegram_id

    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                data = json.loads(data_text)
            except Exception:
                continue

            event_type = data.get("type")

            # 1. Room Subscription (Battle Arena / Stream)
            if event_type == "join_room":
                room = data.get("room")
                if room:
                    await ws_manager.join_room(room, websocket)
                    await websocket.send_text(json.dumps({"event": "joined_room", "room": room}))

            elif event_type == "leave_room":
                room = data.get("room")
                if room:
                    ws_manager.leave_room(room, websocket)

            # 2. WebRTC 1-on-1 Calls Signaling (Offer, Answer, ICE Candidate)
            elif event_type in ("call_offer", "call_answer", "ice_candidate", "call_reject", "call_end"):
                target_user_id = data.get("target_user_id")
                if target_user_id is not None:
                    try:
                        target_uid_int = int(target_user_id)
                    except (ValueError, TypeError):
                        target_uid_int = target_user_id

                    msg_body = {
                        "event": event_type,
                        "signal_type": event_type,
                        "from_user_id": user_id,
                        "target_user_id": target_uid_int,
                        "call_id": data.get("call_id"),
                        "payload": data.get("payload")
                    }
                    await ws_manager.send_personal_message(target_uid_int, msg_body)
                    try:
                        from app.api.chat import _pending_call_signals
                        for q_key in set([target_uid_int, str(target_uid_int)]):
                            if q_key not in _pending_call_signals:
                                _pending_call_signals[q_key] = []
                            _pending_call_signals[q_key].append(msg_body)
                            if len(_pending_call_signals[q_key]) > 50:
                                _pending_call_signals[q_key] = _pending_call_signals[q_key][-50:]
                    except Exception:
                        pass

            # 3. WebRTC Live PK Stream Signaling between Battle Host & Guest
            elif event_type in ("pk_stream_offer", "pk_stream_answer", "pk_stream_ice"):
                battle_id = data.get("battle_id")
                if battle_id:
                    await ws_manager.broadcast_to_room(
                        f"battle_{battle_id}",
                        {
                            "event": event_type,
                            "from_user_id": user_id,
                            "payload": data.get("payload")
                        }
                    )

    except (WebSocketDisconnect, Exception):
        for ident in identifiers:
            try:
                ws_manager.disconnect_user(ident, websocket)
            except Exception:
                pass
