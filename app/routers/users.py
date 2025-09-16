from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
import asyncpg
from app.db import get_connection
from app.schemas.users import UserCreate, UserOut, UserUpdate
from app.schemas.search import SearchResult
from app.utils.passwords import validate_password, hash_password
from app.utils.geo import calculate_distance

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=dict)
async def create_user(user: UserCreate, conn=Depends(get_connection)):
    """Criar novo usuário"""
    # Validar senha
    valid, error = validate_password(user.password)
    if not valid:
        raise HTTPException(status_code=400, detail=error)

    # Hash da senha
    hashed = hash_password(user.password)

    try:
        result = await conn.fetchrow("""
            INSERT INTO users (name, email, username, password_hash)
            VALUES ($1, $2, $3, $4)
            RETURNING user_id
        """, user.name, user.email, user.username, hashed)
        return {
            "message": "User created successfully",
            "user_id": result["user_id"]
        }
    except asyncpg.UniqueViolationError as e:
        if "email" in str(e):
            raise HTTPException(status_code=400, detail="Email already exists")
        elif "username" in str(e):
            raise HTTPException(status_code=400, detail="Username already exists")
        else:
            raise HTTPException(status_code=400, detail="User already exists")

@router.get("/search", response_model=List[SearchResult])
async def advanced_search(
    current_user_id: int,
    age_min: Optional[int] = Query(None),
    age_max: Optional[int] = Query(None),
    fame_min: Optional[int] = Query(None),
    fame_max: Optional[int] = Query(None),
    max_distance_km: Optional[int] = Query(None),
    tags: Optional[List[str]] = Query(None),
    sort_by: Optional[str] = Query("fame_rating"),
    conn=Depends(get_connection),
):
    """Busca avançada de usuários"""
    # Obter localização do usuário atual
    profile = await conn.fetchrow(
        "SELECT latitude, longitude FROM profiles WHERE user_id = $1",
        current_user_id
    )
    if not profile:
        raise HTTPException(
            status_code=400, 
            detail="Profile not found. Please complete your profile first."
        )
    
    if profile["latitude"] is None or profile["longitude"] is None:
        raise HTTPException(
            status_code=400, 
            detail="Location not set. Please update your profile with your location."
        )

    lat, lon = profile["latitude"], profile["longitude"]

    # Normalizar tags
    tags_list = []
    if tags:
        if isinstance(tags, str):
            tags_list = [tags]
        else:
            tags_list = tags

    # Query base
    base_query = """
        SELECT u.user_id, u.name, COALESCE(u.fame_rating, 0) as fame_rating,
               p.age, p.gender, p.latitude, p.longitude, p.avatar_url,
               (6371 * acos(
                   cos(radians($2)) * cos(radians(p.latitude)) *
                   cos(radians(p.longitude) - radians($3)) +
                   sin(radians($2)) * sin(radians(p.latitude))
               )) AS distance,
               0 AS common_tags
        FROM users u
        JOIN profiles p ON u.user_id = p.user_id
        WHERE u.user_id <> $1
    """

    params = [current_user_id, lat, lon]
    param_count = 4  # próximo placeholder livre

    # Filtros dinâmicos
    if age_min is not None:
        base_query += f" AND p.age >= ${param_count}"
        params.append(age_min)
        param_count += 1

    if age_max is not None:
        base_query += f" AND p.age <= ${param_count}"
        params.append(age_max)
        param_count += 1

    if fame_min is not None:
        base_query += f" AND u.fame_rating >= ${param_count}"
        params.append(fame_min)
        param_count += 1

    if fame_max is not None:
        base_query += f" AND u.fame_rating <= ${param_count}"
        params.append(fame_max)
        param_count += 1

    if max_distance_km is not None:
        base_query += f""" AND (6371 * acos(
            cos(radians($2)) * cos(radians(p.latitude)) *
            cos(radians(p.longitude) - radians($3)) +
            sin(radians($2)) * sin(radians(p.latitude))
        )) <= ${param_count}"""
        params.append(max_distance_km)
        param_count += 1

    if tags_list:
        base_query += f""" AND EXISTS (
            SELECT 1 FROM user_tags ut 
            JOIN tags t ON ut.tag_id = t.tag_id 
            WHERE ut.user_id = u.user_id AND t.name = ANY(${param_count}::text[])
        )"""
        params.append(tags_list)
        param_count += 1

    # Ordenação
    if sort_by == "age":
        base_query += " ORDER BY p.age"
    elif sort_by == "distance":
        base_query += " ORDER BY distance"
    elif sort_by == "fame_rating":
        base_query += " ORDER BY u.fame_rating DESC"
    else:
        base_query += " ORDER BY u.fame_rating DESC"

    base_query += " LIMIT 50"

    # DEBUG prints
    print("========== DEBUG advanced_search ==========")
    print("FINAL QUERY:", base_query)
    print("FINAL PARAMS:", params)
    print("NUM PLACEHOLDERS (last used):", param_count - 1)
    print("NUM PARAMS:", len(params))
    print("==========================================")

    rows = await conn.fetch(base_query, *params)
    return [dict(r) for r in rows]


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: int, conn=Depends(get_connection)):
    """Obter usuário por ID"""
    user = await conn.fetchrow("""
        SELECT user_id, name, email, 
               COALESCE(fame_rating, 0) as fame_rating, 
               COALESCE(is_verified, false) as is_verified 
        FROM users WHERE user_id = $1
    """, user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return dict(user)

@router.put("/{user_id}", response_model=dict)
async def update_user(user_id: int, user_update: UserUpdate, conn=Depends(get_connection)):
    """Atualizar usuário"""
    # Verificar se usuário existe
    existing = await conn.fetchrow("SELECT user_id FROM users WHERE user_id = $1", user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Construir query dinamicamente
    updates = []
    params = []
    param_count = 1
    
    if user_update.name is not None:
        updates.append(f"name = ${param_count}")
        params.append(user_update.name)
        param_count += 1
    
    if user_update.email is not None:
        updates.append(f"email = ${param_count}")
        params.append(user_update.email)
        param_count += 1
    
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    updates.append(f"updated_at = NOW()")
    params.append(user_id)
    
    query = f"UPDATE users SET {', '.join(updates)} WHERE user_id = ${param_count}"
    
    try:
        await conn.execute(query, *params)
        return {"message": "User updated successfully"}
    except asyncpg.UniqueViolationError:
        raise HTTPException(status_code=400, detail="Email already exists")

@router.get("/top-fame/{user_id}", response_model=List[SearchResult])
async def top_fame_nearby(user_id: int, conn=Depends(get_connection)):
    """Obter usuários mais famosos próximos"""
    # Obter localização e preferências do usuário
    prefs = await conn.fetchrow("""
        SELECT pref.preferred_gender, pref.age_min, pref.age_max, pref.max_distance_km,
               p.latitude, p.longitude
        FROM preferences pref
        JOIN profiles p ON pref.user_id = p.user_id
        WHERE pref.user_id = $1
    """, user_id)
    
    if not prefs:
        # Verificar se tem perfil
        profile = await conn.fetchrow("""
            SELECT latitude, longitude FROM profiles WHERE user_id = $1
        """, user_id)
        
        if not profile:
            raise HTTPException(
                status_code=400, 
                detail="Profile not found. Please complete your profile first."
            )
        
        if profile['latitude'] is None or profile['longitude'] is None:
            raise HTTPException(
                status_code=400, 
                detail="Location not set. Please update your profile with your location."
            )
        
        # Usar preferências padrão
        prefs = {
            'preferred_gender': 'both',
            'age_min': 18,
            'age_max': 50,
            'max_distance_km': 50,
            'latitude': profile['latitude'],
            'longitude': profile['longitude']
        }
    
    lat, lon = prefs["latitude"], prefs["longitude"]
    preferred_gender = prefs["preferred_gender"]
    age_min, age_max = prefs["age_min"], prefs["age_max"]
    max_distance = prefs["max_distance_km"]
    
    # Query para usuários próximos e famosos
    rows = await conn.fetch("""
        SELECT u.user_id, u.name, u.fame_rating,
               p.age, p.gender, p.latitude, p.longitude, p.avatar_url,
               (6371 * acos(
                   cos(radians($1)) * cos(radians(p.latitude)) *
                   cos(radians(p.longitude) - radians($2)) +
                   sin(radians($1)) * sin(radians(p.latitude))
               )) AS distance
        FROM users u
        JOIN profiles p ON u.user_id = p.user_id
        WHERE u.user_id <> $3
          AND p.age BETWEEN $4 AND $5
          AND ($6 = 'both' OR p.gender = $6)
          AND (6371 * acos(
                   cos(radians($1)) * cos(radians(p.latitude)) *
                   cos(radians(p.longitude) - radians($2)) +
                   sin(radians($1)) * sin(radians(p.latitude))
              )) <= $7
        ORDER BY u.fame_rating DESC
        LIMIT 20
    """, lat, lon, user_id, age_min, age_max, preferred_gender, max_distance)
    
    return [dict(r) for r in rows]

@router.delete("/{user_id}", response_model=dict)
async def delete_user(user_id: int, conn=Depends(get_connection)):
    """Deletar usuário (soft delete)"""
    # Verificar se usuário existe
    user = await conn.fetchrow("SELECT user_id FROM users WHERE user_id = $1", user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Marcar como deletado (ou realmente deletar se preferir)
    await conn.execute("DELETE FROM users WHERE user_id = $1", user_id)
    
    return {"message": "User deleted successfully"}
