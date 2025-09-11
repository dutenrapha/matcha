from pydantic import BaseModel, validator, ConfigDict
from datetime import datetime
from typing import Literal

class SwipeIn(BaseModel):
    swiper_id: int
    swiped_id: int
    direction: Literal["like", "dislike"]

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "swiper_id": 1,
                "swiped_id": 2,
                "direction": "like"
            }
        }
    )

class SwipeOut(BaseModel):
    swipe_id: int
    swiper_id: int
    swiped_id: int
    direction: str
    created_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "swipe_id": 1,
                "swiper_id": 1,
                "swiped_id": 2,
                "direction": "like",
                "created_at": "2025-01-10T12:00:00Z"
            }
        }
    )
