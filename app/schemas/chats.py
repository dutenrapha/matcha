from pydantic import BaseModel, ConfigDict
from datetime import datetime

class ChatOut(BaseModel):
    chat_id: int
    match_id: int
    created_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "chat_id": 5,
                "match_id": 10,
                "created_at": "2025-01-10T12:00:00Z"
            }
        }
    )

class ChatWithProfile(BaseModel):
    chat_id: int
    match_id: int
    user_id: int
    name: str
    avatar_url: str
    last_message: str
    last_message_time: datetime
    unread_count: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "chat_id": 5,
                "match_id": 10,
                "user_id": 2,
                "name": "Alice",
                "avatar_url": "https://example.com/avatar.jpg",
                "last_message": "Hey, how are you?",
                "last_message_time": "2025-01-10T12:00:00Z",
                "unread_count": 2
            }
        }
    )
