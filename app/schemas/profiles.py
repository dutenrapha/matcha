from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class ProfileCreate(BaseModel):
    user_id: int
    bio: Optional[str] = None
    age: int = Field(..., ge=18, le=100, description="Age must be between 18 and 100")
    gender: str
    sexual_pref: str
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    avatar_url: str
    photo1_url: Optional[str] = None
    photo2_url: Optional[str] = None
    photo3_url: Optional[str] = None
    photo4_url: Optional[str] = None
    photo5_url: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": 1,
                "bio": "I love hiking and dogs 🐶",
                "age": 28,
                "gender": "female",
                "sexual_pref": "male",
                "location": "New York",
                "latitude": 40.7128,
                "longitude": -74.0060,
                "avatar_url": "https://example.com/avatar.jpg",
                "photo1_url": "https://example.com/p1.jpg"
            }
        }
    )

class ProfileOut(BaseModel):
    profile_id: int
    user_id: int
    bio: Optional[str]
    age: int
    gender: str
    sexual_pref: str
    location: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    avatar_url: str
    photo1_url: Optional[str]
    photo2_url: Optional[str]
    photo3_url: Optional[str]
    photo4_url: Optional[str]
    photo5_url: Optional[str]

    class Config:
        schema_extra = {
            "example": {
                "profile_id": 1,
                "user_id": 1,
                "bio": "I love hiking and dogs 🐶",
                "age": 28,
                "gender": "female",
                "sexual_pref": "male",
                "location": "New York",
                "latitude": 40.7128,
                "longitude": -74.0060,
                "avatar_url": "https://example.com/avatar.jpg",
                "photo1_url": "https://example.com/p1.jpg"
            }
        }

class ProfileUpdate(BaseModel):
    bio: Optional[str] = None
    age: Optional[int] = Field(None, ge=18, le=100, description="Age must be between 18 and 100")
    gender: Optional[str] = None
    sexual_pref: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    avatar_url: Optional[str] = None
    photo1_url: Optional[str] = None
    photo2_url: Optional[str] = None
    photo3_url: Optional[str] = None
    photo4_url: Optional[str] = None
    photo5_url: Optional[str] = None

    class Config:
        schema_extra = {
            "example": {
                "bio": "Updated bio",
                "age": 29,
                "location": "San Francisco"
            }
        }
