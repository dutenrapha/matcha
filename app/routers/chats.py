from fastapi import APIRouter, Depends, HTTPException
from app.db import get_connection
from app.schemas.chats import ChatOut, ChatWithProfile

router = APIRouter(prefix="/chats", tags=["chats"])

@router.get("/{user_id}", response_model=list)
async def get_user_chats(user_id: int, conn=Depends(get_connection)):
    """Obter chats do usuário"""
    rows = await conn.fetch("""
        SELECT c.chat_id, c.match_id, c.created_at
        FROM chats c
        JOIN matches m ON c.match_id = m.match_id
        WHERE m.user1_id = $1 OR m.user2_id = $1
        ORDER BY c.created_at DESC
    """, user_id)
    
    return [dict(r) for r in rows]

@router.get("/{user_id}/with-profiles", response_model=list)
async def get_chats_with_profiles(user_id: int, conn=Depends(get_connection)):
    """Obter chats com informações dos perfis"""
    rows = await conn.fetch("""
        SELECT c.chat_id, c.match_id,
               CASE 
                   WHEN m.user1_id = $1 THEN m.user2_id
                   ELSE m.user1_id
               END as user_id,
               u.name, p.avatar_url,
               COALESCE(last_msg.content, '') as last_message,
               COALESCE(last_msg.sent_at, c.created_at) as last_message_time,
               COALESCE(unread.count, 0) as unread_count
        FROM chats c
        JOIN matches m ON c.match_id = m.match_id
        JOIN users u ON (
            CASE 
                WHEN m.user1_id = $1 THEN m.user2_id
                ELSE m.user1_id
            END = u.user_id
        )
        JOIN profiles p ON u.user_id = p.user_id
        LEFT JOIN LATERAL (
            SELECT content, sent_at
            FROM messages
            WHERE chat_id = c.chat_id
            ORDER BY sent_at DESC
            LIMIT 1
        ) last_msg ON true
        LEFT JOIN LATERAL (
            SELECT COUNT(*) as count
            FROM messages
            WHERE chat_id = c.chat_id
            AND sender_id != $1
            AND is_read = false
        ) unread ON true
        WHERE m.user1_id = $1 OR m.user2_id = $1
        ORDER BY last_message_time DESC
    """, user_id)
    
    return [dict(r) for r in rows]

@router.get("/{chat_id}/info", response_model=ChatOut)
async def get_chat_info(chat_id: int, conn=Depends(get_connection)):
    """Obter informações do chat"""
    chat = await conn.fetchrow("""
        SELECT * FROM chats WHERE chat_id = $1
    """, chat_id)
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    return dict(chat)

@router.get("/{chat_id}/participants", response_model=list)
async def get_chat_participants(chat_id: int, conn=Depends(get_connection)):
    """Obter participantes do chat"""
    rows = await conn.fetch("""
        SELECT u.user_id, u.name, p.avatar_url
        FROM chats c
        JOIN matches m ON c.match_id = m.match_id
        JOIN users u ON (u.user_id = m.user1_id OR u.user_id = m.user2_id)
        JOIN profiles p ON u.user_id = p.user_id
        WHERE c.chat_id = $1
    """, chat_id)
    
    return [dict(r) for r in rows]

@router.delete("/{chat_id}", response_model=dict)
async def delete_chat(chat_id: int, conn=Depends(get_connection)):
    """Deletar chat"""
    # Verificar se chat existe
    chat = await conn.fetchrow("SELECT chat_id FROM chats WHERE chat_id = $1", chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Deletar chat (cascade vai deletar mensagens)
    await conn.execute("DELETE FROM chats WHERE chat_id = $1", chat_id)
    
    return {"message": "Chat deleted successfully"}

@router.get("/{user_id}/unread-count", response_model=dict)
async def get_unread_count(user_id: int, conn=Depends(get_connection)):
    """Obter contagem de mensagens não lidas"""
    count = await conn.fetchval("""
        SELECT COUNT(*)
        FROM messages m
        JOIN chats c ON m.chat_id = c.chat_id
        JOIN matches mat ON c.match_id = mat.match_id
        WHERE (mat.user1_id = $1 OR mat.user2_id = $1)
        AND m.sender_id != $1
        AND m.is_read = false
    """, user_id)
    
    return {"user_id": user_id, "unread_count": count}
