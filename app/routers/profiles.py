from fastapi import APIRouter, Depends, HTTPException, Request
from app.db import get_connection
from app.schemas.profiles import ProfileCreate, ProfileOut, ProfileUpdate
from app.utils.geo import get_geo_from_ip

router = APIRouter(prefix="/profiles", tags=["profiles"])

@router.post("/", response_model=dict)
async def create_profile(profile: ProfileCreate, request: Request, conn=Depends(get_connection)):
    """Criar ou atualizar perfil"""
    # Se não forneceu coordenadas, tentar obter por IP
    lat, lon, city = profile.latitude, profile.longitude, profile.location
    
    if not lat or not lon:
        client_ip = request.client.host
        lat, lon, city = await get_geo_from_ip(client_ip)
    
    # Usar cidade do IP se não foi fornecida
    if not city:
        city = "Unknown"
    
    await conn.execute("""
        INSERT INTO profiles 
        (user_id, bio, age, gender, sexual_pref, location, latitude, longitude, avatar_url,
         photo1_url, photo2_url, photo3_url, photo4_url, photo5_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (user_id) DO UPDATE 
        SET bio = EXCLUDED.bio, age = EXCLUDED.age, gender = EXCLUDED.gender, 
            sexual_pref = EXCLUDED.sexual_pref, location = EXCLUDED.location,
            latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
            avatar_url = EXCLUDED.avatar_url, photo1_url = EXCLUDED.photo1_url,
            photo2_url = EXCLUDED.photo2_url, photo3_url = EXCLUDED.photo3_url,
            photo4_url = EXCLUDED.photo4_url, photo5_url = EXCLUDED.photo5_url
    """, profile.user_id, profile.bio, profile.age, profile.gender, profile.sexual_pref,
         city, lat, lon, profile.avatar_url,
         profile.photo1_url, profile.photo2_url, profile.photo3_url, 
         profile.photo4_url, profile.photo5_url)
    
    return {
        "message": "Profile saved successfully",
        "latitude": lat,
        "longitude": lon,
        "city": city
    }

@router.get("/{user_id}", response_model=ProfileOut)
async def get_profile(user_id: int, conn=Depends(get_connection)):
    """Obter perfil por user_id"""
    profile = await conn.fetchrow("""
        SELECT * FROM profiles WHERE user_id = $1
    """, user_id)
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return dict(profile)

@router.put("/{user_id}", response_model=dict)
async def update_profile(user_id: int, profile_update: ProfileUpdate, conn=Depends(get_connection)):
    """Atualizar perfil"""
    # Verificar se perfil existe
    existing = await conn.fetchrow("SELECT user_id FROM profiles WHERE user_id = $1", user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Construir query dinamicamente
    updates = []
    params = []
    param_count = 1
    
    fields = [
        ("bio", profile_update.bio),
        ("age", profile_update.age),
        ("gender", profile_update.gender),
        ("sexual_pref", profile_update.sexual_pref),
        ("location", profile_update.location),
        ("latitude", profile_update.latitude),
        ("longitude", profile_update.longitude),
        ("avatar_url", profile_update.avatar_url),
        ("photo1_url", profile_update.photo1_url),
        ("photo2_url", profile_update.photo2_url),
        ("photo3_url", profile_update.photo3_url),
        ("photo4_url", profile_update.photo4_url),
        ("photo5_url", profile_update.photo5_url),
    ]
    
    for field_name, field_value in fields:
        if field_value is not None:
            updates.append(f"{field_name} = ${param_count}")
            params.append(field_value)
            param_count += 1
    
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    params.append(user_id)
    
    query = f"UPDATE profiles SET {', '.join(updates)} WHERE user_id = ${param_count}"
    
    await conn.execute(query, *params)
    return {"message": "Profile updated successfully"}

@router.get("/discover/{user_id}", response_model=list)
async def discover_profiles(user_id: int, limit: int = 10, conn=Depends(get_connection)):
    """Descobrir perfis para o usuário (algoritmo de recomendação)"""
    # Obter preferências do usuário
    prefs = await conn.fetchrow("""
        SELECT preferred_gender, age_min, age_max, max_distance_km,
               p.latitude, p.longitude
        FROM preferences pref
        JOIN profiles p ON pref.user_id = p.user_id
        WHERE pref.user_id = $1
    """, user_id)
    
    if not prefs:
        # Se não tem preferências, usar valores padrão
        profile = await conn.fetchrow("""
            SELECT latitude, longitude FROM profiles WHERE user_id = $1
        """, user_id)
        
        if not profile or profile['latitude'] is None or profile['longitude'] is None:
            raise HTTPException(status_code=400, detail="User location not set. Please update your profile with location.")
        
        # Usar preferências padrão
        prefs = {
            'preferred_gender': 'both',
            'age_min': 18,
            'age_max': 50,
            'max_distance_km': 50,
            'latitude': profile['latitude'],
            'longitude': profile['longitude']
        }
    
    # Validar se as preferências têm todos os campos necessários
    if not all(key in prefs for key in ['latitude', 'longitude', 'age_min', 'age_max', 'preferred_gender', 'max_distance_km']):
        raise HTTPException(status_code=400, detail="Incomplete user preferences")
    
    # Garantir que os valores são válidos
    if prefs['latitude'] is None or prefs['longitude'] is None:
        raise HTTPException(status_code=400, detail="User location not set")
    
    # Debug: imprimir preferências
    print(f"DEBUG: User {user_id} preferences: {dict(prefs)}")
    
    # Obter usuários já visualizados
    viewed_users = await conn.fetch("""
        SELECT DISTINCT viewed_id FROM profile_views WHERE viewer_id = $1
    """, user_id)
    viewed_ids = [int(row["viewed_id"]) for row in viewed_users]
    
    # Obter usuários já com swipe
    swiped_users = await conn.fetch("""
        SELECT DISTINCT swiped_id FROM swipes WHERE swiper_id = $1
    """, user_id)
    swiped_ids = [int(row["swiped_id"]) for row in swiped_users]
    
    # Combinar listas de exclusão
    exclude_ids = list(set(viewed_ids + swiped_ids + [user_id]))
    
    # Se não há IDs para excluir, usar uma lista com o próprio usuário
    if not exclude_ids:
        exclude_ids = [user_id]
    
    # Debug: imprimir IDs de exclusão
    print(f"DEBUG: Exclude IDs: {exclude_ids}")
    
    # Query para descobrir perfis
    rows = await conn.fetch("""
        SELECT u.user_id, u.name, u.fame_rating,
               p.age, p.bio, p.gender, p.avatar_url,
               (6371 * acos(
                   cos(radians($1)) * cos(radians(p.latitude)) *
                   cos(radians(p.longitude) - radians($2)) +
                   sin(radians($1)) * sin(radians(p.latitude))
               )) AS distance
        FROM users u
        JOIN profiles p ON u.user_id = p.user_id
        WHERE u.user_id <> ALL($3)
          AND p.age BETWEEN $4 AND $5
          AND ($6 = 'both' OR p.gender = $6)
          AND (6371 * acos(
                   cos(radians($1)) * cos(radians(p.latitude)) *
                   cos(radians(p.longitude) - radians($2)) +
                   sin(radians($1)) * sin(radians(p.latitude))
              )) <= $7
        ORDER BY u.fame_rating DESC, distance ASC
        LIMIT $8
    """, prefs["latitude"], prefs["longitude"], exclude_ids,
         prefs["age_min"], prefs["age_max"], prefs["preferred_gender"], 
         prefs["max_distance_km"], limit)
    
    return [dict(r) for r in rows]

@router.delete("/{user_id}", response_model=dict)
async def delete_profile(user_id: int, conn=Depends(get_connection)):
    """Deletar perfil"""
    # Verificar se perfil existe
    profile = await conn.fetchrow("SELECT user_id FROM profiles WHERE user_id = $1", user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    await conn.execute("DELETE FROM profiles WHERE user_id = $1", user_id)
    return {"message": "Profile deleted successfully"}
