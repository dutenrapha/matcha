from fastapi import APIRouter, Depends, HTTPException
from app.db import get_connection
from app.schemas.views import ViewIn, ViewOut, ViewWithProfile

router = APIRouter(prefix="/views", tags=["views"])

@router.post("/", response_model=dict)
async def add_view(view: ViewIn, conn=Depends(get_connection)):
    """Registrar visualização de perfil"""
    # Verificar se não é o próprio usuário
    if view.viewer_id == view.viewed_id:
        raise HTTPException(status_code=400, detail="Cannot view own profile")
    
    # Inserir visualização
    await conn.execute("""
        INSERT INTO profile_views (viewer_id, viewed_id)
        VALUES ($1, $2)
    """, view.viewer_id, view.viewed_id)
    
    return {"message": "View recorded successfully"}

@router.get("/{user_id}/received", response_model=list)
async def get_views_received(user_id: int, limit: int = 20, offset: int = 0, conn=Depends(get_connection)):
    """Obter visualizações recebidas pelo usuário"""
    rows = await conn.fetch("""
        SELECT v.view_id, v.viewer_id, v.created_at,
               u.name as viewer_name, p.avatar_url as viewer_avatar
        FROM profile_views v
        JOIN users u ON v.viewer_id = u.user_id
        JOIN profiles p ON v.viewer_id = p.user_id
        WHERE v.viewed_id = $1
        ORDER BY v.created_at DESC
        LIMIT $2 OFFSET $3
    """, user_id, limit, offset)
    
    return [dict(r) for r in rows]

@router.get("/{user_id}/given", response_model=list)
async def get_views_given(user_id: int, limit: int = 20, offset: int = 0, conn=Depends(get_connection)):
    """Obter visualizações dadas pelo usuário"""
    rows = await conn.fetch("""
        SELECT v.view_id, v.viewed_id, v.created_at,
               u.name as viewed_name, p.avatar_url as viewed_avatar
        FROM profile_views v
        JOIN users u ON v.viewed_id = u.user_id
        JOIN profiles p ON v.viewed_id = p.user_id
        WHERE v.viewer_id = $1
        ORDER BY v.created_at DESC
        LIMIT $2 OFFSET $3
    """, user_id, limit, offset)
    
    return [dict(r) for r in rows]

@router.get("/{user_id}/count", response_model=dict)
async def get_view_count(user_id: int, conn=Depends(get_connection)):
    """Obter contagem de visualizações"""
    received = await conn.fetchval("""
        SELECT COUNT(*) FROM profile_views WHERE viewed_id = $1
    """, user_id)
    
    given = await conn.fetchval("""
        SELECT COUNT(*) FROM profile_views WHERE viewer_id = $1
    """, user_id)
    
    return {
        "user_id": user_id,
        "views_received": received,
        "views_given": given
    }

@router.get("/{user_id}/recent", response_model=list)
async def get_recent_views(user_id: int, days: int = 7, conn=Depends(get_connection)):
    """Obter visualizações recentes"""
    rows = await conn.fetch("""
        SELECT v.view_id, v.viewer_id, v.created_at,
               u.name as viewer_name, p.avatar_url as viewer_avatar
        FROM profile_views v
        JOIN users u ON v.viewer_id = u.user_id
        JOIN profiles p ON v.viewer_id = p.user_id
        WHERE v.viewed_id = $1
        AND v.created_at >= NOW() - INTERVAL '%s days'
        ORDER BY v.created_at DESC
    """ % days, user_id)
    
    return [dict(r) for r in rows]

@router.delete("/{view_id}", response_model=dict)
async def delete_view(view_id: int, conn=Depends(get_connection)):
    """Deletar visualização"""
    # Verificar se visualização existe
    view = await conn.fetchrow("SELECT view_id FROM profile_views WHERE view_id = $1", view_id)
    if not view:
        raise HTTPException(status_code=404, detail="View not found")
    
    # Deletar visualização
    await conn.execute("DELETE FROM profile_views WHERE view_id = $1", view_id)
    
    return {"message": "View deleted successfully"}
