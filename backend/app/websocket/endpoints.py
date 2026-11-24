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

    telegram_id = int(payload["sub"])
    db_user_id = None
    try:
        from app.database.session import AsyncSessionLocal
        from app.models.entities import User
        from sqlalchemy import select
        async with AsyncSessionLocal() as db:
            res = await db.execute(select(User.id).where(User.telegram_id == telegram_id))
            db_user_id = res.scalars().first()
    except Exception as e:
        print("[WS Connect DB lookup note]", e)

    await ws_manager.connect_user(telegram_id, websocket)
    if db_user_id and db_user_id != telegram_id:
        await ws_manager.connect_user(db_user_id, websocket)

    user_id = db_user_id or telegram_id

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
                if target_user_id:
                    msg_body = {
                        "event": event_type,
                        "signal_type": event_type,
                        "from_user_id": user_id,
                        "target_user_id": target_user_id,
                        "call_id": data.get("call_id"),
                        "payload": data.get("payload")
                    }
                    await ws_manager.send_personal_message(target_user_id, msg_body)
                    try:
                        from app.api.chat import _pending_call_signals
                        if target_user_id not in _pending_call_signals:
                            _pending_call_signals[target_user_id] = []
                        _pending_call_signals[target_user_id].append(msg_body)
                        if len(_pending_call_signals[target_user_id]) > 50:
                            _pending_call_signals[target_user_id] = _pending_call_signals[target_user_id][-50:]
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

    except WebSocketDisconnect:
        ws_manager.disconnect_user(telegram_id, websocket)
        if db_user_id and db_user_id != telegram_id:
            ws_manager.disconnect_user(db_user_id, websocket)
    except Exception as e:
        ws_manager.disconnect_user(telegram_id, websocket)
        if db_user_id and db_user_id != telegram_id:
            ws_manager.disconnect_user(db_user_id, websocket)
