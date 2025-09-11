from fastapi import APIRouter, Depends, HTTPException
from app.db import get_connection
from app.schemas.blocks import BlockIn, BlockOut, BlockedUserOut

router = APIRouter(prefix="/blocks", tags=["blocks"])

@router.post("/", response_model=dict)
async def block_user(data: BlockIn, conn=Depends(get_connection)):
    """Bloquear usuário"""
    # Verificar se não está tentando bloquear a si mesmo
    if data.blocker_id == data.blocked_id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    
    try:
        await conn.execute("""
            INSERT INTO blocked_users (blocker_id, blocked_id)
            VALUES ($1, $2)
        """, data.blocker_id, data.blocked_id)
        return {"message": "User blocked successfully"}
    except Exception:
        raise HTTPException(status_code=400, detail="User already blocked")

@router.get("/{user_id}/blocked", response_model=list)
async def get_blocked_users(user_id: int, conn=Depends(get_connection)):
    """Obter usuários bloqueados pelo usuário"""
    rows = await conn.fetch("""
        SELECT b.block_id, b.blocked_id, b.created_at,
               u.name as blocked_name, p.avatar_url as blocked_avatar
        FROM blocked_users b
        JOIN users u ON b.blocked_id = u.user_id
        JOIN profiles p ON b.blocked_id = p.user_id
        WHERE b.blocker_id = $1
        ORDER BY b.created_at DESC
    """, user_id)
    
    return [dict(r) for r in rows]

@router.get("/{user_id}/blocked-by", response_model=list)
async def get_users_who_blocked(user_id: int, conn=Depends(get_connection)):
    """Obter usuários que bloquearam o usuário"""
    rows = await conn.fetch("""
        SELECT b.block_id, b.blocker_id, b.created_at,
               u.name as blocker_name, p.avatar_url as blocker_avatar
        FROM blocked_users b
        JOIN users u ON b.blocker_id = u.user_id
        JOIN profiles p ON b.blocker_id = p.user_id
        WHERE b.blocked_id = $1
        ORDER BY b.created_at DESC
    """, user_id)
    
    return [dict(r) for r in rows]

@router.delete("/{block_id}", response_model=dict)
async def unblock_user(block_id: int, conn=Depends(get_connection)):
    """Desbloquear usuário"""
    # Verificar se bloqueio existe
    block = await conn.fetchrow("SELECT block_id FROM blocked_users WHERE block_id = $1", block_id)
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    # Remover bloqueio
    await conn.execute("DELETE FROM blocked_users WHERE block_id = $1", block_id)
    
    return {"message": "User unblocked successfully"}

@router.delete("/user/{blocker_id}/{blocked_id}", response_model=dict)
async def unblock_user_by_ids(blocker_id: int, blocked_id: int, conn=Depends(get_connection)):
    """Desbloquear usuário por IDs"""
    result = await conn.execute("""
        DELETE FROM blocked_users 
        WHERE blocker_id = $1 AND blocked_id = $2
    """, blocker_id, blocked_id)
    
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Block not found")
    
    return {"message": "User unblocked successfully"}

@router.get("/{user_id}/count", response_model=dict)
async def get_block_count(user_id: int, conn=Depends(get_connection)):
    """Obter contagem de bloqueios"""
    blocked = await conn.fetchval("""
        SELECT COUNT(*) FROM blocked_users WHERE blocker_id = $1
    """, user_id)
    
    blocked_by = await conn.fetchval("""
        SELECT COUNT(*) FROM blocked_users WHERE blocked_id = $1
    """, user_id)
    
    return {
        "user_id": user_id,
        "blocked_count": blocked,
        "blocked_by_count": blocked_by
    }

@router.get("/check/{user1_id}/{user2_id}", response_model=dict)
async def check_block_status(user1_id: int, user2_id: int, conn=Depends(get_connection)):
    """Verificar se há bloqueio entre dois usuários"""
    # Verificar se user1 bloqueou user2
    block1 = await conn.fetchrow("""
        SELECT block_id FROM blocked_users 
        WHERE blocker_id = $1 AND blocked_id = $2
    """, user1_id, user2_id)
    
    # Verificar se user2 bloqueou user1
    block2 = await conn.fetchrow("""
        SELECT block_id FROM blocked_users 
        WHERE blocker_id = $1 AND blocked_id = $2
    """, user2_id, user1_id)
    
    return {
        "user1_blocked_user2": block1 is not None,
        "user2_blocked_user1": block2 is not None,
        "any_block": block1 is not None or block2 is not None
    }
