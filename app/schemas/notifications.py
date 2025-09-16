from pydantic import BaseModel, ConfigDict
from datetime import datetime

class NotificationOut(BaseModel):
    notification_id: int
    user_id: int
    type: str
    content: str
    is_read: bool
    created_at: datetime
    related_user_id: int | None = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "notification_id": 1,
                "user_id": 2,
                "type": "match",
                "content": "You have a new match with Alice!",
                "is_read": False,
                "created_at": "2025-01-10T12:00:00Z"
            }
        }
    )

class NotificationCreate(BaseModel):
    user_id: int
    type: str
    content: str
    related_user_id: int | None = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": 2,
                "type": "like",
                "content": "Someone liked your profile!"
            }
        }
    )
