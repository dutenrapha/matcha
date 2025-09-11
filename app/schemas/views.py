from pydantic import BaseModel, ConfigDict
from datetime import datetime

class ViewIn(BaseModel):
    viewer_id: int
    viewed_id: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "viewer_id": 1,
                "viewed_id": 2
            }
        }
    )

class ViewOut(BaseModel):
    view_id: int
    viewer_id: int
    viewed_id: int
    created_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "view_id": 1,
                "viewer_id": 1,
                "viewed_id": 2,
                "created_at": "2025-01-10T12:00:00Z"
            }
        }
    )

class ViewWithProfile(BaseModel):
    view_id: int
    viewer_id: int
    viewer_name: str
    viewer_avatar: str
    created_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "view_id": 1,
                "viewer_id": 1,
                "viewer_name": "John",
                "viewer_avatar": "https://example.com/avatar.jpg",
                "created_at": "2025-01-10T12:00:00Z"
            }
        }
    )
