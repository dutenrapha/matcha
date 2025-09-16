from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, List, Set
from app.db import get_connection
from app.utils.jwt import get_current_user_ws
import json
from datetime import datetime

router = APIRouter(prefix="/ws", tags=["map"])

# Conexões ativas do mapa: user_id -> lista de websockets
active_map_connections: Dict[int, List[WebSocket]] = {}

# Usuários que estão visualizando o mapa
map_viewers: Set[int] = set()

async def broadcast_user_location_update(user_id: int, latitude: float, longitude: float, is_online: bool):
    """Broadcast location update to all map viewers"""
    message = {
        "type": "location_update",
        "user_id": user_id,
        "latitude": latitude,
        "longitude": longitude,
        "is_online": is_online,
        "timestamp": datetime.now().isoformat()
    }
    
    # Send to all map viewers
    for viewer_id in map_viewers:
        if viewer_id in active_map_connections:
            for ws in active_map_connections[viewer_id]:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception as e:
                    print(f"[WARN] Falha ao enviar atualização de localização: {e}")

async def broadcast_user_online_status(user_id: int, is_online: bool):
    """Broadcast online status update to all map viewers"""
    message = {
        "type": "status_update",
        "user_id": user_id,
        "is_online": is_online,
        "timestamp": datetime.now().isoformat()
    }
    
    # Send to all map viewers
    for viewer_id in map_viewers:
        if viewer_id in active_map_connections:
            for ws in active_map_connections[viewer_id]:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception as e:
                    print(f"[WARN] Falha ao enviar atualização de status: {e}")

@router.websocket("/map/{user_id}")
async def map_socket(websocket: WebSocket, user_id: int, conn=Depends(get_connection)):
    """WebSocket para atualizações em tempo real do mapa"""
    print(f"[INFO] Tentando conectar WebSocket do mapa para usuário {user_id}")
    
    # Verificar autenticação
    try:
        current_user = await get_current_user_ws(websocket)
        if current_user["user_id"] != user_id:
            await websocket.close(code=4001, reason="Unauthorized")
            return
    except Exception as e:
        print(f"[ERROR] Falha na autenticação do WebSocket do mapa: {e}")
        await websocket.close(code=4001, reason="Unauthorized")
        return
    
    await websocket.accept()
    print(f"[INFO] WebSocket do mapa conectado para usuário {user_id}")

    # Adicionar à lista de conexões ativas
    if user_id not in active_map_connections:
        active_map_connections[user_id] = []
    active_map_connections[user_id].append(websocket)
    
    # Adicionar aos visualizadores do mapa
    map_viewers.add(user_id)
    
    print(f"[INFO] Usuário {user_id} adicionado às conexões do mapa. Total: {len(active_map_connections[user_id])}")

    try:
        # Enviar mensagem de confirmação
        await websocket.send_text(json.dumps({
            "type": "connected",
            "message": "Conectado ao mapa em tempo real",
            "timestamp": datetime.now().isoformat()
        }))

        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
                message_type = data.get("type")

                if message_type == "ping":
                    # Responder ao ping
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    }))
                
                elif message_type == "location_update":
                    # Atualizar localização do usuário
                    latitude = data.get("latitude")
                    longitude = data.get("longitude")
                    
                    if latitude and longitude:
                        # Atualizar no banco de dados
                        await conn.execute("""
                            UPDATE profiles 
                            SET latitude = $1, longitude = $2, updated_at = NOW()
                            WHERE user_id = $3
                        """, latitude, longitude, user_id)
                        
                        # Broadcast para outros usuários
                        await broadcast_user_location_update(user_id, latitude, longitude, True)
                        
                        await websocket.send_text(json.dumps({
                            "type": "location_updated",
                            "message": "Localização atualizada com sucesso",
                            "timestamp": datetime.now().isoformat()
                        }))

            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "error": "Invalid JSON format"
                }))
            except Exception as e:
                print(f"[ERROR] Erro no WebSocket do mapa: {e}")
                await websocket.send_text(json.dumps({
                    "error": "Internal server error"
                }))

    except WebSocketDisconnect:
        print(f"[INFO] WebSocket do mapa desconectado para usuário {user_id}")
    except Exception as e:
        print(f"[ERROR] Erro no WebSocket do mapa: {e}")
    finally:
        # Remover das conexões ativas
        if user_id in active_map_connections:
            if websocket in active_map_connections[user_id]:
                active_map_connections[user_id].remove(websocket)
            if not active_map_connections[user_id]:
                del active_map_connections[user_id]
        
        # Remover dos visualizadores do mapa
        map_viewers.discard(user_id)
        
        print(f"[INFO] Usuário {user_id} removido das conexões do mapa")

# Função para notificar mudanças de status online/offline
async def notify_status_change(user_id: int, is_online: bool):
    """Notificar mudança de status online/offline para visualizadores do mapa"""
    await broadcast_user_online_status(user_id, is_online)
