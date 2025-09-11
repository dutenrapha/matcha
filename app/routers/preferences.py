from fastapi import APIRouter, Depends, HTTPException
from app.db import get_connection
from app.schemas.preferences import PreferenceCreate, PreferenceOut, PreferenceUpdate

router = APIRouter(prefix="/preferences", tags=["preferences"])

@router.post("/", response_model=dict)
async def create_preferences(pref: PreferenceCreate, conn=Depends(get_connection)):
    """Criar ou atualizar preferências"""
    await conn.execute("""
        INSERT INTO preferences (user_id, preferred_gender, age_min, age_max, max_distance_km)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id) DO UPDATE
        SET preferred_gender = EXCLUDED.preferred_gender,
            age_min = EXCLUDED.age_min,
            age_max = EXCLUDED.age_max,
            max_distance_km = EXCLUDED.max_distance_km
    """, pref.user_id, pref.preferred_gender, pref.age_min, pref.age_max, pref.max_distance_km)
    
    return {"message": "Preferences saved successfully"}

@router.get("/{user_id}", response_model=PreferenceOut)
async def get_preferences(user_id: int, conn=Depends(get_connection)):
    """Obter preferências do usuário"""
    prefs = await conn.fetchrow("""
        SELECT * FROM preferences WHERE user_id = $1
    """, user_id)
    
    if not prefs:
        raise HTTPException(status_code=404, detail="Preferences not found")
    
    return dict(prefs)

@router.put("/{user_id}", response_model=dict)
async def update_preferences(user_id: int, pref_update: PreferenceUpdate, conn=Depends(get_connection)):
    """Atualizar preferências"""
    # Verificar se preferências existem
    existing = await conn.fetchrow("SELECT user_id FROM preferences WHERE user_id = $1", user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Preferences not found")
    
    # Construir query dinamicamente
    updates = []
    params = []
    param_count = 1
    
    if pref_update.preferred_gender is not None:
        updates.append(f"preferred_gender = ${param_count}")
        params.append(pref_update.preferred_gender)
        param_count += 1
    
    if pref_update.age_min is not None:
        updates.append(f"age_min = ${param_count}")
        params.append(pref_update.age_min)
        param_count += 1
    
    if pref_update.age_max is not None:
        updates.append(f"age_max = ${param_count}")
        params.append(pref_update.age_max)
        param_count += 1
    
    if pref_update.max_distance_km is not None:
        updates.append(f"max_distance_km = ${param_count}")
        params.append(pref_update.max_distance_km)
        param_count += 1
    
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    params.append(user_id)
    
    query = f"UPDATE preferences SET {', '.join(updates)} WHERE user_id = ${param_count}"
    
    await conn.execute(query, *params)
    return {"message": "Preferences updated successfully"}

@router.delete("/{user_id}", response_model=dict)
async def delete_preferences(user_id: int, conn=Depends(get_connection)):
    """Deletar preferências"""
    # Verificar se preferências existem
    prefs = await conn.fetchrow("SELECT user_id FROM preferences WHERE user_id = $1", user_id)
    if not prefs:
        raise HTTPException(status_code=404, detail="Preferences not found")
    
    await conn.execute("DELETE FROM preferences WHERE user_id = $1", user_id)
    return {"message": "Preferences deleted successfully"}
