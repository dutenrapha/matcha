from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List
from app.db import get_connection
import json
from datetime import datetime

router = APIRouter(prefix="/ws", tags=["chat"])

# Armazena conexões ativas por chat_id
active_connections: Dict[int, List[WebSocket]] = {}

async def save_message(conn, chat_id: int, sender_id: int, content: str):
    """Insere mensagem no banco"""
    await conn.execute("""
        INSERT INTO messages (chat_id, sender_id, content)
        VALUES ($1, $2, $3)
    """, chat_id, sender_id, content)

async def broadcast(chat_id: int, message: dict):
    """Envia mensagem para todos conectados no mesmo chat"""
    if chat_id in active_connections:
        for connection in active_connections[chat_id]:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                print(f"[WARN] Falha ao enviar mensagem: {e}")

@router.websocket("/chat/{chat_id}")
async def chat_socket(websocket: WebSocket, chat_id: int, conn=Depends(get_connection)):
    await websocket.accept()

    # registra conexão
    if chat_id not in active_connections:
        active_connections[chat_id] = []
    active_connections[chat_id].append(websocket)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
                sender_id = data.get("sender_id")
                content = data.get("content")

                if not sender_id or not content:
                    await websocket.send_text(json.dumps({
                        "error": "Invalid payload. Expected {sender_id, content}"
                    }))
                    continue

                # salvar no banco
                await save_message(conn, chat_id, sender_id, content)

                # criar resposta
                message = {
                    "chat_id": chat_id,
                    "sender_id": sender_id,
                    "content": content,
                    "sent_at": datetime.utcnow().isoformat() + "Z"
                }

                # broadcast p/ todos no mesmo chat
                await broadcast(chat_id, message)

            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "error": "Invalid JSON"
                }))

    except WebSocketDisconnect:
        print(f"[INFO] Cliente desconectado do chat {chat_id}")
        active_connections[chat_id].remove(websocket)
        if not active_connections[chat_id]:
            del active_connections[chat_id]
