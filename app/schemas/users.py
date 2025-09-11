from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Alice",
                "email": "alice@example.com",
                "password": "StrongPass123!"
            }
        }
    )

class UserOut(BaseModel):
    user_id: int
    name: str
    email: EmailStr
    fame_rating: Optional[int] = 0
    is_verified: Optional[bool] = False

    class Config:
        schema_extra = {
            "example": {
                "user_id": 1,
                "name": "Alice",
                "email": "alice@example.com",
                "fame_rating": 42,
                "is_verified": True
            }
        }

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

    class Config:
        schema_extra = {
            "example": {
                "name": "Alice Updated",
                "email": "alice.updated@example.com"
            }
        }
