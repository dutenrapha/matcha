from fastapi import APIRouter, Depends, HTTPException
from app.db import get_connection
from app.schemas.notifications import NotificationOut, NotificationCreate

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/{user_id}", response_model=list)
async def get_notifications(user_id: int, limit: int = 20, offset: int = 0, conn=Depends(get_connection)):
    """Obter notificações do usuário"""
    rows = await conn.fetch("""
        SELECT 
            n.*,
            u.name as related_user_name,
            u.username as related_user_username,
            p.avatar_url as related_user_avatar
        FROM notifications n
        LEFT JOIN users u ON n.related_user_id = u.user_id
        LEFT JOIN profiles p ON n.related_user_id = p.user_id
        WHERE n.user_id = $1
        ORDER BY n.created_at DESC
        LIMIT $2 OFFSET $3
    """, user_id, limit, offset)
    
    return [dict(r) for r in rows]

@router.get("/{user_id}/unread", response_model=list)
async def get_unread_notifications(user_id: int, conn=Depends(get_connection)):
    """Obter notificações não lidas do usuário"""
    rows = await conn.fetch("""
        SELECT * FROM notifications 
        WHERE user_id = $1 AND is_read = false
        ORDER BY created_at DESC
    """, user_id)
    
    return [dict(r) for r in rows]

@router.get("/{user_id}/count", response_model=dict)
async def get_notification_count(user_id: int, conn=Depends(get_connection)):
    """Obter contagem de notificações não lidas"""
    count = await conn.fetchval("""
        SELECT COUNT(*) FROM notifications 
        WHERE user_id = $1 AND (is_read = false OR is_read IS NULL)
    """, user_id)
    
    return {"user_id": user_id, "unread_count": count}

@router.put("/{notification_id}/read", response_model=dict)
async def mark_notification_read(notification_id: int, conn=Depends(get_connection)):
    """Marcar notificação como lida"""
    # Verificar se notificação existe
    notification = await conn.fetchrow("""
        SELECT notification_id FROM notifications WHERE notification_id = $1
    """, notification_id)
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Marcar como lida
    await conn.execute("""
        UPDATE notifications SET is_read = true WHERE notification_id = $1
    """, notification_id)
    
    return {"message": "Notification marked as read"}

@router.put("/{user_id}/read-all", response_model=dict)
async def mark_all_notifications_read(user_id: int, conn=Depends(get_connection)):
    """Marcar todas as notificações do usuário como lidas"""
    await conn.execute("""
        UPDATE notifications SET is_read = true WHERE user_id = $1
    """, user_id)
    
    return {"message": "All notifications marked as read"}

@router.post("/", response_model=dict)
async def create_notification(notification: NotificationCreate, conn=Depends(get_connection)):
    """Criar notificação"""
    await conn.execute("""
        INSERT INTO notifications (user_id, type, content)
        VALUES ($1, $2, $3)
    """, notification.user_id, notification.type, notification.content)
    
    return {"message": "Notification created successfully"}

@router.delete("/{notification_id}", response_model=dict)
async def delete_notification(notification_id: int, conn=Depends(get_connection)):
    """Deletar notificação"""
    # Verificar se notificação existe
    notification = await conn.fetchrow("""
        SELECT notification_id FROM notifications WHERE notification_id = $1
    """, notification_id)
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Deletar notificação
    await conn.execute("DELETE FROM notifications WHERE notification_id = $1", notification_id)
    
    return {"message": "Notification deleted successfully"}

@router.delete("/{user_id}/all", response_model=dict)
async def delete_all_notifications(user_id: int, conn=Depends(get_connection)):
    """Deletar todas as notificações do usuário"""
    await conn.execute("DELETE FROM notifications WHERE user_id = $1", user_id)
    
    return {"message": "All notifications deleted successfully"}
