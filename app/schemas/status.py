from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserStatusOut(BaseModel):
    user_id: int
    is_online: bool
    last_seen: Optional[datetime] = None
    last_login: Optional[datetime] = None

class StatusUpdateIn(BaseModel):
    is_online: bool

class StatusUpdateOut(BaseModel):
    message: str
    is_online: bool
    last_seen: datetime
