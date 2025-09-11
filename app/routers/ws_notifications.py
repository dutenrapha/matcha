from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
from app.db import get_connection
import json
from datetime import datetime

router = APIRouter(prefix="/ws", tags=["notifications"])

# Conexões ativas: user_id -> lista de websockets
active_notifications: Dict[int, List[WebSocket]] = {}

async def save_notification(conn, user_id: int, notif_type: str, content: str):
    """Insere notificação no banco"""
    await conn.execute("""
        INSERT INTO notifications (user_id, type, content)
        VALUES ($1, $2, $3)
    """, user_id, notif_type, content)

async def push_notification(user_id: int, message: dict):
    """Envia notificação para todos os sockets do usuário"""
    if user_id in active_notifications:
        for ws in active_notifications[user_id]:
            try:
                await ws.send_text(json.dumps(message))
            except Exception as e:
                print(f"[WARN] Falha ao enviar notificação: {e}")

@router.websocket("/notifications/{user_id}")
async def notifications_socket(websocket: WebSocket, user_id: int, conn=Depends(get_connection)):
    await websocket.accept()

    if user_id not in active_notifications:
        active_notifications[user_id] = []
    active_notifications[user_id].append(websocket)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
                notif_type = data.get("type")
                content = data.get("content")

                if not notif_type or not content:
                    await websocket.send_text(json.dumps({
                        "error": "Invalid payload. Expected {type, content}"
                    }))
                    continue

                # salvar no banco
                await save_notification(conn, user_id, notif_type, content)

                # criar payload
                message = {
                    "user_id": user_id,
                    "type": notif_type,
                    "content": content,
                    "created_at": datetime.utcnow().isoformat() + "Z"
                }

                # broadcast para aquele usuário
                await push_notification(user_id, message)

            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "error": "Invalid JSON"
                }))

    except WebSocketDisconnect:
        print(f"[INFO] Notificação WS desconectada: {user_id}")
        active_notifications[user_id].remove(websocket)
        if not active_notifications[user_id]:
            del active_notifications[user_id]

# Exportar funções para uso em outros módulos
__all__ = ["save_notification", "push_notification"]
