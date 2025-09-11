from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class SearchFilters(BaseModel):
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    fame_min: Optional[int] = None
    fame_max: Optional[int] = None
    max_distance_km: Optional[int] = None
    tags: Optional[List[str]] = None
    sort_by: Optional[str] = "fame_rating"  # age, distance, fame_rating, tags

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "age_min": 25,
                "age_max": 35,
                "fame_min": 50,
                "fame_max": 100,
                "max_distance_km": 20,
                "tags": ["vegan", "geek"],
                "sort_by": "fame_rating"
            }
        }
    )

class SearchResult(BaseModel):
    user_id: int
    name: str
    fame_rating: int
    age: int
    gender: str
    latitude: Optional[float]
    longitude: Optional[float]
    distance: Optional[float]
    common_tags: int
    avatar_url: str

    class Config:
        schema_extra = {
            "example": {
                "user_id": 42,
                "name": "Alice",
                "fame_rating": 95,
                "age": 28,
                "gender": "female",
                "latitude": -23.55,
                "longitude": -46.63,
                "distance": 3.2,
                "common_tags": 2,
                "avatar_url": "https://example.com/avatar.jpg"
            }
        }

class DiscoverResult(BaseModel):
    user_id: int
    name: str
    age: int
    bio: str
    avatar_url: str
    distance: float
    fame_rating: int
    common_tags: List[str]

    class Config:
        schema_extra = {
            "example": {
                "user_id": 42,
                "name": "Alice",
                "age": 28,
                "bio": "Love hiking and dogs",
                "avatar_url": "https://example.com/avatar.jpg",
                "distance": 3.2,
                "fame_rating": 95,
                "common_tags": ["vegan", "geek"]
            }
        }
