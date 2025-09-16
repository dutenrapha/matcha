from fastapi import APIRouter, Depends, HTTPException
from app.db import get_connection
from app.schemas.swipes import SwipeIn, SwipeOut
from app.routers.ws_notifications import save_notification, push_notification
from datetime import datetime

router = APIRouter(prefix="/swipes", tags=["swipes"])

@router.post("/", response_model=dict)
async def add_swipe(swipe: SwipeIn, conn=Depends(get_connection)):
    """Registrar swipe (like/dislike)"""
    print(f"DEBUG: Swipe received - swiper_id: {swipe.swiper_id}, swiped_id: {swipe.swiped_id}, direction: {swipe.direction}")
    
    # Inserir ou atualizar swipe
    await conn.execute("""
        INSERT INTO swipes (swiper_id, swiped_id, direction)
        VALUES ($1, $2, $3)
        ON CONFLICT (swiper_id, swiped_id) DO UPDATE
        SET direction = EXCLUDED.direction
    """, int(swipe.swiper_id), int(swipe.swiped_id), swipe.direction)
    
    # Se for like, verificar se há reciprocidade
    if swipe.direction == "like":
        print(f"DEBUG: Checking for reciprocal like - looking for swiper_id: {swipe.swiped_id}, swiped_id: {swipe.swiper_id}")
        
        # Verificar se o outro usuário já deu like
        reciprocal = await conn.fetchrow("""
            SELECT * FROM swipes 
            WHERE swiper_id = $1 AND swiped_id = $2 AND direction = 'like'
        """, int(swipe.swiped_id), int(swipe.swiper_id))
        
        print(f"DEBUG: Reciprocal swipe found: {reciprocal is not None}")
        if reciprocal:
            print(f"DEBUG: Reciprocal swipe details: {dict(reciprocal) if reciprocal else 'None'}")
        
        if reciprocal:
            print(f"DEBUG: Creating match between {swipe.swiper_id} and {swipe.swiped_id}")
            
            # Criar match se ainda não existir (usando LEAST/GREATEST para evitar duplicatas)
            match = await conn.fetchrow("""
                INSERT INTO matches (user1_id, user2_id)
                VALUES (LEAST($1::int, $2::int), GREATEST($1::int, $2::int))
                ON CONFLICT (user1_id, user2_id) DO NOTHING
                RETURNING match_id
            """, int(swipe.swiper_id), int(swipe.swiped_id))
            
            print(f"DEBUG: Match creation result: {match}")
            
            if match:
                # Criar chat para o match
                await conn.execute("""
                    INSERT INTO chats (match_id)
                    VALUES ($1)
                """, match["match_id"])
                
                # Buscar nomes dos usuários para notificações mais amigáveis
                user1 = await conn.fetchrow("SELECT name FROM users WHERE user_id = $1", int(swipe.swiper_id))
                user2 = await conn.fetchrow("SELECT name FROM users WHERE user_id = $1", int(swipe.swiped_id))
                
                # Criar notificações para ambos os usuários
                content1 = f"Você tem um novo match com {user2['name'] if user2 else 'alguém'}! 💕"
                content2 = f"Você tem um novo match com {user1['name'] if user1 else 'alguém'}! 💕"
                
                # Salvar notificações no banco
                await save_notification(conn, int(swipe.swiper_id), "match", content1, int(swipe.swiped_id))
                await save_notification(conn, int(swipe.swiped_id), "match", content2, int(swipe.swiper_id))
                
                # Enviar notificações em tempo real
                notif1 = {
                    "user_id": int(swipe.swiper_id),
                    "type": "match",
                    "content": content1,
                    "created_at": datetime.utcnow().isoformat() + "Z"
                }
                notif2 = {
                    "user_id": int(swipe.swiped_id),
                    "type": "match",
                    "content": content2,
                    "created_at": datetime.utcnow().isoformat() + "Z"
                }
                
                await push_notification(int(swipe.swiper_id), notif1)
                await push_notification(int(swipe.swiped_id), notif2)
                
                print(f"DEBUG: Match created successfully! Match ID: {match['match_id']}")
                return {"message": "Match created!", "match_id": match["match_id"]}
        
        # Buscar nome do usuário que deu like
        liker = await conn.fetchrow("SELECT name FROM users WHERE user_id = $1", int(swipe.swiper_id))
        
        # Se não há match, criar notificação de like
        content = f"{liker['name'] if liker else 'Alguém'} curtiu seu perfil! ❤️"
        await save_notification(conn, int(swipe.swiped_id), "like", content, int(swipe.swiper_id))
        
        notif = {
            "user_id": int(swipe.swiped_id),
            "type": "like",
            "content": content,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        await push_notification(int(swipe.swiped_id), notif)
    
    elif swipe.direction == "dislike":
        # Buscar nome do usuário que deu dislike
        disliker = await conn.fetchrow("SELECT name FROM users WHERE user_id = $1", int(swipe.swiper_id))
        
        # Criar notificação de unlike
        content = f"{disliker['name'] if disliker else 'Alguém'} descurtiu seu perfil 💔"
        await save_notification(conn, int(swipe.swiped_id), "unlike", content, int(swipe.swiper_id))
        
        notif = {
            "user_id": int(swipe.swiped_id),
            "type": "unlike",
            "content": content,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        await push_notification(int(swipe.swiped_id), notif)
    
    return {"message": "Swipe registered"}

@router.get("/{user_id}/likes", response_model=list)
async def get_likes_received(user_id: int, conn=Depends(get_connection)):
    """Obter likes recebidos pelo usuário"""
    rows = await conn.fetch("""
        SELECT s.swipe_id, s.swiper_id, s.created_at,
               u.name, p.avatar_url
        FROM swipes s
        JOIN users u ON s.swiper_id = u.user_id
        JOIN profiles p ON s.swiper_id = p.user_id
        WHERE s.swiped_id = $1 AND s.direction = 'like'
        ORDER BY s.created_at DESC
    """, user_id)
    
    return [dict(r) for r in rows]

@router.get("/{user_id}/likes/count", response_model=dict)
async def get_likes_received_count(user_id: int, conn=Depends(get_connection)):
    """Obter contagem de likes recebidos pelo usuário"""
    count = await conn.fetchval("""
        SELECT COUNT(*) FROM swipes 
        WHERE swiped_id = $1 AND direction = 'like'
    """, user_id)
    
    return {"user_id": user_id, "total_likes": count}

@router.get("/{user_id}/given", response_model=list)
async def get_swipes_given(user_id: int, conn=Depends(get_connection)):
    """Obter swipes dados pelo usuário"""
    rows = await conn.fetch("""
        SELECT s.swipe_id, s.swiped_id, s.direction, s.created_at,
               u.name, p.avatar_url
        FROM swipes s
        JOIN users u ON s.swiped_id = u.user_id
        JOIN profiles p ON s.swiped_id = p.user_id
        WHERE s.swiper_id = $1
        ORDER BY s.created_at DESC
    """, user_id)
    
    return [dict(r) for r in rows]

@router.delete("/{swipe_id}", response_model=dict)
async def delete_swipe(swipe_id: int, conn=Depends(get_connection)):
    """Deletar swipe"""
    # Verificar se swipe existe
    swipe = await conn.fetchrow("SELECT swipe_id FROM swipes WHERE swipe_id = $1", swipe_id)
    if not swipe:
        raise HTTPException(status_code=404, detail="Swipe not found")
    
    await conn.execute("DELETE FROM swipes WHERE swipe_id = $1", swipe_id)
    return {"message": "Swipe deleted successfully"}
