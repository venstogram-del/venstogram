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

    user_id = int(payload["sub"])
    await ws_manager.connect_user(user_id, websocket)

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
                    await ws_manager.send_personal_message(
                        target_user_id,
                        {
                            "event": event_type,
                            "from_user_id": user_id,
                            "payload": data.get("payload")
                        }
                    )

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
        ws_manager.disconnect_user(user_id, websocket)
    except Exception as e:
        ws_manager.disconnect_user(user_id, websocket)
