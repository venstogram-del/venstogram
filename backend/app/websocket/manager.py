import json
from typing import Dict, List, Set, Any
from fastapi import WebSocket

class WebSocketConnectionManager:
    def __init__(self):
        # user_id -> List[WebSocket]
        self.active_user_connections: Dict[int, List[WebSocket]] = {}
        # room_name -> Set[WebSocket]
        self.rooms: Dict[str, Set[WebSocket]] = {}

    async def connect_user(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_user_connections:
            self.active_user_connections[user_id] = []
        self.active_user_connections[user_id].append(websocket)

    def disconnect_user(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_user_connections:
            if websocket in self.active_user_connections[user_id]:
                self.active_user_connections[user_id].remove(websocket)
            if not self.active_user_connections[user_id]:
                del self.active_user_connections[user_id]
        
        # Also clean up from any rooms
        for room_name, sockets in list(self.rooms.items()):
            if websocket in sockets:
                sockets.remove(websocket)
            if not sockets:
                del self.rooms[room_name]

    async def join_room(self, room_name: str, websocket: WebSocket):
        if room_name not in self.rooms:
            self.rooms[room_name] = set()
        self.rooms[room_name].add(websocket)

    def leave_room(self, room_name: str, websocket: WebSocket):
        if room_name in self.rooms and websocket in self.rooms[room_name]:
            self.rooms[room_name].remove(websocket)

    async def send_personal_message(self, user_id: Any, message: Dict[str, Any]) -> bool:
        """Sends a JSON message to all active tabs of a specific user. Returns True if delivered."""
        sockets: List[WebSocket] = []
        # Check direct key
        if user_id in self.active_user_connections:
            sockets.extend(self.active_user_connections[user_id])
        # Check int version
        try:
            uid_int = int(user_id)
            if uid_int in self.active_user_connections:
                for s in self.active_user_connections[uid_int]:
                    if s not in sockets:
                        sockets.append(s)
        except (ValueError, TypeError):
            pass
        # Check str version
        try:
            uid_str = str(user_id)
            if uid_str in self.active_user_connections:
                for s in self.active_user_connections[uid_str]:
                    if s not in sockets:
                        sockets.append(s)
        except Exception:
            pass

        if not sockets:
            return False

        payload = json.dumps(message)
        dead_sockets = []
        for ws in sockets:
            try:
                await ws.send_text(payload)
            except Exception:
                dead_sockets.append(ws)

        for ws in dead_sockets:
            self.disconnect_user(user_id, ws)
        return True

    async def broadcast_to_room(self, room_name: str, message: Dict[str, Any]):
        """Broadcasts a JSON message to all viewers/participants of a room (e.g. live battle)."""
        sockets = self.rooms.get(room_name, set())
        if not sockets:
            return

        payload = json.dumps(message)
        dead_sockets = []
        for ws in list(sockets):
            try:
                await ws.send_text(payload)
            except Exception:
                dead_sockets.append(ws)

        for ws in dead_sockets:
            if ws in self.rooms.get(room_name, set()):
                self.rooms[room_name].remove(ws)

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcasts a JSON message to all connected users."""
        payload = json.dumps(message)
        seen_sockets = set()
        for user_id, sockets in list(self.active_user_connections.items()):
            for ws in list(sockets):
                if ws not in seen_sockets:
                    seen_sockets.add(ws)
                    try:
                        await ws.send_text(payload)
                    except Exception:
                        pass

ws_manager = WebSocketConnectionManager()
