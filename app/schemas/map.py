from pydantic import BaseModel
from typing import Optional, List

class MapUser(BaseModel):
    """Schema for user data displayed on the map"""
    user_id: int
    username: str
    age: int
    gender: str
    location: Optional[str]
    latitude: float
    longitude: float
    avatar_url: str
    is_online: bool
    distance_km: Optional[float] = None

class MapUsersResponse(BaseModel):
    """Response schema for map users endpoint"""
    users: List[MapUser]
    total_count: int
    current_user_location: Optional[dict] = None

class MapFilters(BaseModel):
    """Schema for map filtering options"""
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    gender: Optional[str] = None
    max_distance_km: Optional[int] = None
    online_only: Optional[bool] = False
