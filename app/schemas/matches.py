from pydantic import BaseModel, ConfigDict
from datetime import datetime

class MatchOut(BaseModel):
    match_id: int
    user1_id: int
    user2_id: int
    created_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "match_id": 10,
                "user1_id": 1,
                "user2_id": 2,
                "created_at": "2025-01-10T12:00:00Z"
            }
        }
    )

class MatchWithProfile(BaseModel):
    match_id: int
    user_id: int
    name: str
    age: int
    bio: str
    avatar_url: str
    created_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "match_id": 10,
                "user_id": 2,
                "name": "Alice",
                "age": 28,
                "bio": "Love hiking and dogs",
                "avatar_url": "https://example.com/avatar.jpg",
                "created_at": "2025-01-10T12:00:00Z"
            }
        }
    )
