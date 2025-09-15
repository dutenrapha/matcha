from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
from app.db import get_connection
from app.schemas.status import UserStatusOut, StatusUpdateIn, StatusUpdateOut
from app.routers.auth import get_current_user
import pytz

router = APIRouter(prefix="/status", tags=["status"])

@router.put("/online", response_model=StatusUpdateOut)
async def update_online_status(
    status_update: StatusUpdateIn,
    current_user: dict = Depends(get_current_user),
    conn=Depends(get_connection)
):
    """Atualizar status online do usuário"""
    user_id = current_user["user_id"]
    is_online = status_update.is_online
    
    # Atualizar last_login se estiver ficando online
    if is_online:
        await conn.execute("""
            UPDATE users 
            SET last_login = NOW(), updated_at = NOW()
            WHERE user_id = $1
        """, user_id)
    else:
        # Quando ficar offline, não atualizar last_login, apenas updated_at
        await conn.execute("""
            UPDATE users 
            SET updated_at = NOW()
            WHERE user_id = $1
        """, user_id)
    
    return StatusUpdateOut(
        message="Status updated successfully",
        is_online=is_online,
        last_seen=datetime.utcnow()
    )

@router.get("/{user_id}", response_model=UserStatusOut)
async def get_user_status(user_id: int, conn=Depends(get_connection)):
    """Obter status de um usuário específico"""
    user = await conn.fetchrow("""
        SELECT user_id, last_login, updated_at
        FROM users 
        WHERE user_id = $1
    """, user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Considerar online se last_login foi nos últimos 3 minutos
    last_login = user["last_login"]
    is_online = False
    last_seen = None
    
    if last_login:
        # Converter para UTC se necessário e calcular diferença
        if last_login.tzinfo is None:
            # Se não tem timezone, assumir que é UTC
            last_login_utc = last_login
        else:
            last_login_utc = last_login.astimezone(pytz.UTC).replace(tzinfo=None)
        
        now_utc = datetime.utcnow()
        time_diff = now_utc - last_login_utc
        is_online = time_diff <= timedelta(minutes=3)
        
        # last_seen é sempre o last_login, independente se está online ou não
        last_seen = last_login
    
    return UserStatusOut(
        user_id=user_id,
        is_online=is_online,
        last_seen=last_seen,
        last_login=last_login
    )

@router.get("/batch", response_model=list[UserStatusOut])
async def get_multiple_users_status(
    user_ids: str,  # Comma-separated list
    conn=Depends(get_connection)
):
    """Obter status de múltiplos usuários"""
    try:
        ids = [int(id.strip()) for id in user_ids.split(",")]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user IDs format")
    
    if len(ids) > 50:  # Limite de segurança
        raise HTTPException(status_code=400, detail="Too many user IDs (max 50)")
    
    # Criar placeholders para a query
    placeholders = ",".join([f"${i+1}" for i in range(len(ids))])
    
    users = await conn.fetch(f"""
        SELECT user_id, last_login, updated_at
        FROM users 
        WHERE user_id IN ({placeholders})
    """, *ids)
    
    results = []
    for user in users:
        last_login = user["last_login"]
        is_online = False
        last_seen = None
        
        if last_login:
            # Converter para UTC se necessário e calcular diferença
            if last_login.tzinfo is None:
                # Se não tem timezone, assumir que é UTC
                last_login_utc = last_login
            else:
                last_login_utc = last_login.astimezone(pytz.UTC).replace(tzinfo=None)
            
            now_utc = datetime.utcnow()
            time_diff = now_utc - last_login_utc
            is_online = time_diff <= timedelta(minutes=3)
            
            # last_seen é sempre o last_login, independente se está online ou não
            last_seen = last_login
        
        results.append(UserStatusOut(
            user_id=user["user_id"],
            is_online=is_online,
            last_seen=last_seen,
            last_login=last_login
        ))
    
    return results

@router.get("/online/users", response_model=list[UserStatusOut])
async def get_online_users(conn=Depends(get_connection)):
    """Obter lista de usuários online (últimos 3 minutos)"""
    users = await conn.fetch("""
        SELECT user_id, last_login, updated_at
        FROM users 
        WHERE last_login IS NOT NULL 
        AND last_login > NOW() - INTERVAL '3 minutes'
        ORDER BY last_login DESC
        LIMIT 100
    """)
    
    results = []
    for user in users:
        results.append(UserStatusOut(
            user_id=user["user_id"],
            is_online=True,
            last_seen=user["last_login"],
            last_login=user["last_login"]
        ))
    
    return results
