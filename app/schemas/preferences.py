from pydantic import BaseModel, ConfigDict
from typing import Optional

class PreferenceCreate(BaseModel):
    user_id: int
    preferred_gender: str
    age_min: int
    age_max: int
    max_distance_km: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": 1,
                "preferred_gender": "male",
                "age_min": 25,
                "age_max": 35,
                "max_distance_km": 20
            }
        }
    )

class PreferenceOut(BaseModel):
    preference_id: int
    user_id: int
    preferred_gender: str
    age_min: int
    age_max: int
    max_distance_km: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "preference_id": 1,
                "user_id": 1,
                "preferred_gender": "male",
                "age_min": 25,
                "age_max": 35,
                "max_distance_km": 20
            }
        }
    )

class PreferenceUpdate(BaseModel):
    preferred_gender: Optional[str] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    max_distance_km: Optional[int] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "preferred_gender": "both",
                "age_min": 22,
                "age_max": 40,
                "max_distance_km": 50
            }
        }
    )
