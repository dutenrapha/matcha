from fastapi import APIRouter, Depends, HTTPException
from app.db import get_connection
from app.schemas.matches import MatchOut, MatchWithProfile

router = APIRouter(prefix="/matches", tags=["matches"])

@router.get("/{user_id}", response_model=list)
async def get_matches(user_id: int, conn=Depends(get_connection)):
    """Obter matches do usuário"""
    rows = await conn.fetch("""
        SELECT m.match_id, m.user1_id, m.user2_id, m.created_at
        FROM matches m
        WHERE m.user1_id = $1 OR m.user2_id = $1
        ORDER BY m.created_at DESC
    """, user_id)
    
    return [dict(r) for r in rows]

@router.get("/{user_id}/with-profiles", response_model=list)
async def get_matches_with_profiles(user_id: int, conn=Depends(get_connection)):
    """Obter matches com informações dos perfis"""
    rows = await conn.fetch("""
        SELECT m.match_id, 
               CASE 
                   WHEN m.user1_id = $1 THEN m.user2_id
                   ELSE m.user1_id
               END as user_id,
               u.name, p.age, p.bio, p.avatar_url, m.created_at
        FROM matches m
        JOIN users u ON (
            CASE 
                WHEN m.user1_id = $1 THEN m.user2_id
                ELSE m.user1_id
            END = u.user_id
        )
        JOIN profiles p ON u.user_id = p.user_id
        WHERE m.user1_id = $1 OR m.user2_id = $1
        ORDER BY m.created_at DESC
    """, user_id)
    
    return [dict(r) for r in rows]

@router.get("/{user_id}/count", response_model=dict)
async def get_match_count(user_id: int, conn=Depends(get_connection)):
    """Obter contagem de matches do usuário"""
    count = await conn.fetchval("""
        SELECT COUNT(*) FROM matches
        WHERE user1_id = $1 OR user2_id = $1
    """, user_id)
    
    return {"user_id": user_id, "match_count": count}

@router.delete("/{match_id}", response_model=dict)
async def delete_match(match_id: int, conn=Depends(get_connection)):
    """Deletar match (unmatch)"""
    # Verificar se match existe e obter os user_ids
    match = await conn.fetchrow("SELECT match_id, user1_id, user2_id FROM matches WHERE match_id = $1", match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    user1_id = match["user1_id"]
    user2_id = match["user2_id"]
    
    # Deletar swipes mútuos que criaram o match
    await conn.execute("""
        DELETE FROM swipes 
        WHERE (swiper_id = $1 AND swiped_id = $2 AND direction = 'like')
           OR (swiper_id = $2 AND swiped_id = $1 AND direction = 'like')
    """, user1_id, user2_id)
    
    # Deletar match (cascade vai deletar chat e mensagens)
    await conn.execute("DELETE FROM matches WHERE match_id = $1", match_id)
    
    return {"message": "Match deleted successfully"}

@router.get("/{user_id}/stats", response_model=dict)
async def get_match_stats(user_id: int, conn=Depends(get_connection)):
    """Obter estatísticas de matches do usuário"""
    # Total de matches
    total_matches = await conn.fetchval("""
        SELECT COUNT(*) FROM matches
        WHERE user1_id = $1 OR user2_id = $1
    """, user_id)
    
    # Matches dos últimos 7 dias
    recent_matches = await conn.fetchval("""
        SELECT COUNT(*) FROM matches
        WHERE (user1_id = $1 OR user2_id = $1)
        AND created_at >= NOW() - INTERVAL '7 days'
    """, user_id)
    
    # Matches dos últimos 30 dias
    monthly_matches = await conn.fetchval("""
        SELECT COUNT(*) FROM matches
        WHERE (user1_id = $1 OR user2_id = $1)
        AND created_at >= NOW() - INTERVAL '30 days'
    """, user_id)
    
    return {
        "user_id": user_id,
        "total_matches": total_matches,
        "recent_matches_7d": recent_matches,
        "monthly_matches_30d": monthly_matches
    }
