from fastapi import APIRouter, Depends, HTTPException
from app.db import get_connection
from app.schemas.messages import MessageIn, MessageOut, MessageWithSender

router = APIRouter(prefix="/messages", tags=["messages"])

@router.post("/", response_model=dict)
async def send_message(message: MessageIn, conn=Depends(get_connection)):
    """Enviar mensagem"""
    # Verificar se o chat existe e o usuário é participante
    chat = await conn.fetchrow("""
        SELECT c.chat_id
        FROM chats c
        JOIN matches m ON c.match_id = m.match_id
        WHERE c.chat_id = $1 AND (m.user1_id = $2 OR m.user2_id = $2)
    """, message.chat_id, message.sender_id)
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found or user not authorized")
    
    # Inserir mensagem
    await conn.execute("""
        INSERT INTO messages (chat_id, sender_id, content)
        VALUES ($1, $2, $3)
    """, message.chat_id, message.sender_id, message.content)
    
    return {"message": "Message sent successfully"}

@router.get("/{chat_id}", response_model=list)
async def get_messages(chat_id: int, limit: int = 50, offset: int = 0, conn=Depends(get_connection)):
    """Obter mensagens do chat"""
    rows = await conn.fetch("""
        SELECT m.message_id, m.chat_id, m.sender_id, m.content, m.sent_at, m.is_read
        FROM messages m
        WHERE m.chat_id = $1
        ORDER BY m.sent_at DESC
        LIMIT $2 OFFSET $3
    """, chat_id, limit, offset)
    
    return [dict(r) for r in rows]

@router.get("/{chat_id}/with-senders", response_model=list)
async def get_messages_with_senders(chat_id: int, limit: int = 50, offset: int = 0, conn=Depends(get_connection)):
    """Obter mensagens com informações dos remetentes"""
    rows = await conn.fetch("""
        SELECT m.message_id, m.chat_id, m.sender_id, u.name as sender_name,
               m.content, m.sent_at, m.is_read
        FROM messages m
        JOIN users u ON m.sender_id = u.user_id
        WHERE m.chat_id = $1
        ORDER BY m.sent_at DESC
        LIMIT $2 OFFSET $3
    """, chat_id, limit, offset)
    
    return [dict(r) for r in rows]

@router.put("/{message_id}/read", response_model=dict)
async def mark_message_read(message_id: int, conn=Depends(get_connection)):
    """Marcar mensagem como lida"""
    # Verificar se mensagem existe
    message = await conn.fetchrow("SELECT message_id FROM messages WHERE message_id = $1", message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Marcar como lida
    await conn.execute("UPDATE messages SET is_read = true WHERE message_id = $1", message_id)
    
    return {"message": "Message marked as read"}

@router.put("/chat/{chat_id}/read-all", response_model=dict)
async def mark_all_messages_read(chat_id: int, user_id: int, conn=Depends(get_connection)):
    """Marcar todas as mensagens do chat como lidas"""
    # Verificar se o usuário é participante do chat
    chat = await conn.fetchrow("""
        SELECT c.chat_id
        FROM chats c
        JOIN matches m ON c.match_id = m.match_id
        WHERE c.chat_id = $1 AND (m.user1_id = $2 OR m.user2_id = $2)
    """, chat_id, user_id)
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found or user not authorized")
    
    # Marcar todas as mensagens como lidas (exceto as próprias)
    await conn.execute("""
        UPDATE messages 
        SET is_read = true 
        WHERE chat_id = $1 AND sender_id != $2
    """, chat_id, user_id)
    
    return {"message": "All messages marked as read"}

@router.delete("/{message_id}", response_model=dict)
async def delete_message(message_id: int, conn=Depends(get_connection)):
    """Deletar mensagem"""
    # Verificar se mensagem existe
    message = await conn.fetchrow("SELECT message_id FROM messages WHERE message_id = $1", message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Deletar mensagem
    await conn.execute("DELETE FROM messages WHERE message_id = $1", message_id)
    
    return {"message": "Message deleted successfully"}

@router.get("/{chat_id}/count", response_model=dict)
async def get_message_count(chat_id: int, conn=Depends(get_connection)):
    """Obter contagem de mensagens do chat"""
    count = await conn.fetchval("""
        SELECT COUNT(*) FROM messages WHERE chat_id = $1
    """, chat_id)
    
    return {"chat_id": chat_id, "message_count": count}
