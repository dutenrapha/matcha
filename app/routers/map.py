from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.db import get_connection
from app.schemas.map import MapUser, MapUsersResponse, MapFilters
from app.utils.geo import calculate_distance
from app.routers.auth import get_current_user

router = APIRouter(prefix="/map", tags=["map"])

@router.get("/users", response_model=MapUsersResponse)
async def get_map_users(
    current_user: dict = Depends(get_current_user),
    age_min: Optional[int] = Query(None, ge=18, le=100),
    age_max: Optional[int] = Query(None, ge=18, le=100),
    gender: Optional[str] = Query(None),
    max_distance_km: Optional[int] = Query(None, ge=1, le=1000),
    online_only: Optional[bool] = Query(False),
    conn=Depends(get_connection)
):
    """Get users for map display with optional filters"""
    
    # Get current user's location and preferences
    user_data = await conn.fetchrow("""
        SELECT p.latitude, p.longitude, p.location, p.age, p.gender,
               pref.preferred_gender, pref.age_min, pref.age_max, pref.max_distance_km
        FROM profiles p
        LEFT JOIN preferences pref ON p.user_id = pref.user_id
        WHERE p.user_id = $1
    """, current_user["user_id"])
    
    if not user_data or not user_data["latitude"] or not user_data["longitude"]:
        raise HTTPException(
            status_code=400, 
            detail="User location not set. Please update your profile with your location."
        )
    
    # Use user preferences as defaults if not provided
    if age_min is None:
        age_min = user_data["age_min"] or 18
    if age_max is None:
        age_max = user_data["age_max"] or 100
    if gender is None:
        gender = user_data["preferred_gender"] or "both"
    if max_distance_km is None:
        max_distance_km = user_data["max_distance_km"] or 50
    
    user_lat = user_data["latitude"]
    user_lon = user_data["longitude"]
    
    # Build the query
    query = """
        SELECT DISTINCT
            u.user_id,
            u.username,
            p.age,
            p.gender,
            p.location,
            p.latitude,
            p.longitude,
            p.avatar_url,
            p.location_visible,
            p.show_exact_location,
            p.location_precision,
            CASE 
                WHEN u.last_login > NOW() - INTERVAL '5 minutes' THEN true
                ELSE false
            END as is_online
        FROM users u
        JOIN profiles p ON u.user_id = p.user_id
        WHERE u.user_id != $1
        AND p.latitude IS NOT NULL 
        AND p.longitude IS NOT NULL
        AND p.location_visible = true
        AND p.age >= $2
        AND p.age <= $3
    """
    
    params = [current_user["user_id"], age_min, age_max]
    param_count = 3
    
    # Add gender filter
    if gender != "both":
        param_count += 1
        query += f" AND p.gender = ${param_count}"
        params.append(gender)
    
    # Add online filter
    if online_only:
        query += " AND u.last_login > NOW() - INTERVAL '5 minutes'"
    
    # Exclude blocked users
    query += """
        AND u.user_id NOT IN (
            SELECT blocked_id FROM blocked_users 
            WHERE blocker_id = $1
        )
        AND u.user_id NOT IN (
            SELECT blocker_id FROM blocked_users 
            WHERE blocked_id = $1
        )
    """
    
    # Execute query
    users_data = await conn.fetch(query, *params)
    
    # Calculate distances and filter by distance
    map_users = []
    for user in users_data:
        distance = calculate_distance(
            user_lat, user_lon, 
            user["latitude"], user["longitude"]
        )
        
        # Filter by distance
        if distance <= max_distance_km:
            # Apply location precision
            lat, lon = user["latitude"], user["longitude"]
            if not user["show_exact_location"] and user["location_precision"] > 1:
                # Add random offset based on precision level
                import random
                offset_factor = user["location_precision"] * 0.001  # ~100m per level
                lat += random.uniform(-offset_factor, offset_factor)
                lon += random.uniform(-offset_factor, offset_factor)
            
            map_user = MapUser(
                user_id=user["user_id"],
                username=user["username"],
                age=user["age"],
                gender=user["gender"],
                location=user["location"],
                latitude=lat,
                longitude=lon,
                avatar_url=user["avatar_url"],
                is_online=user["is_online"],
                distance_km=round(distance, 1)
            )
            map_users.append(map_user)
    
    return MapUsersResponse(
        users=map_users,
        total_count=len(map_users),
        current_user_location={
            "latitude": user_lat,
            "longitude": user_lon,
            "location": user_data["location"]
        }
    )

@router.get("/users/nearby", response_model=List[MapUser])
async def get_nearby_users(
    current_user: dict = Depends(get_current_user),
    radius_km: int = Query(10, ge=1, le=100),
    limit: int = Query(50, ge=1, le=200),
    conn=Depends(get_connection)
):
    """Get nearby users within a specific radius"""
    
    # Get current user's location
    user_data = await conn.fetchrow("""
        SELECT latitude, longitude FROM profiles WHERE user_id = $1
    """, current_user["user_id"])
    
    if not user_data or not user_data["latitude"] or not user_data["longitude"]:
        raise HTTPException(
            status_code=400, 
            detail="User location not set. Please update your profile with your location."
        )
    
    user_lat = user_data["latitude"]
    user_lon = user_data["longitude"]
    
    # Get all users with location data
    users_data = await conn.fetch("""
        SELECT DISTINCT
            u.user_id,
            u.username,
            p.age,
            p.gender,
            p.location,
            p.latitude,
            p.longitude,
            p.avatar_url,
            CASE 
                WHEN u.last_login > NOW() - INTERVAL '5 minutes' THEN true
                ELSE false
            END as is_online
        FROM users u
        JOIN profiles p ON u.user_id = p.user_id
        WHERE u.user_id != $1
        AND p.latitude IS NOT NULL 
        AND p.longitude IS NOT NULL
        AND p.location_visible = true
        AND u.user_id NOT IN (
            SELECT blocked_id FROM blocked_users 
            WHERE blocker_id = $1
        )
        AND u.user_id NOT IN (
            SELECT blocker_id FROM blocked_users 
            WHERE blocked_id = $1
        )
    """, current_user["user_id"])
    
    # Calculate distances and filter
    nearby_users = []
    for user in users_data:
        distance = calculate_distance(
            user_lat, user_lon, 
            user["latitude"], user["longitude"]
        )
        
        if distance <= radius_km:
            map_user = MapUser(
                user_id=user["user_id"],
                username=user["username"],
                age=user["age"],
                gender=user["gender"],
                location=user["location"],
                latitude=user["latitude"],
                longitude=user["longitude"],
                avatar_url=user["avatar_url"],
                is_online=user["is_online"],
                distance_km=round(distance, 1)
            )
            nearby_users.append(map_user)
    
    # Sort by distance and limit results
    nearby_users.sort(key=lambda x: x.distance_km)
    return nearby_users[:limit]
