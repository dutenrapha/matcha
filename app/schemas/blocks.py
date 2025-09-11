from pydantic import BaseModel, ConfigDict
from datetime import datetime

class BlockIn(BaseModel):
    blocker_id: int
    blocked_id: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "blocker_id": 1,
                "blocked_id": 2
            }
        }
    )

class BlockOut(BaseModel):
    block_id: int
    blocker_id: int
    blocked_id: int
    created_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "block_id": 1,
                "blocker_id": 1,
                "blocked_id": 2,
                "created_at": "2025-01-10T12:00:00Z"
            }
        }
    )

class BlockedUserOut(BaseModel):
    block_id: int
    blocked_id: int
    blocked_name: str
    blocked_avatar: str
    created_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "block_id": 1,
                "blocked_id": 2,
                "blocked_name": "Alice",
                "blocked_avatar": "https://example.com/avatar.jpg",
                "created_at": "2025-01-10T12:00:00Z"
            }
        }
    )
