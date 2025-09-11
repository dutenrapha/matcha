from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class MessageIn(BaseModel):
    chat_id: int
    sender_id: int
    content: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "chat_id": 5,
                "sender_id": 1,
                "content": "Hey, how are you?"
            }
        }
    )

class MessageOut(BaseModel):
    message_id: int
    chat_id: int
    sender_id: int
    content: str
    sent_at: datetime
    is_read: bool

    class Config:
        schema_extra = {
            "example": {
                "message_id": 100,
                "chat_id": 5,
                "sender_id": 1,
                "content": "Hey, how are you?",
                "sent_at": "2025-01-10T12:00:00Z",
                "is_read": False
            }
        }

class MessageWithSender(BaseModel):
    message_id: int
    chat_id: int
    sender_id: int
    sender_name: str
    content: str
    sent_at: datetime
    is_read: bool

    class Config:
        schema_extra = {
            "example": {
                "message_id": 100,
                "chat_id": 5,
                "sender_id": 1,
                "sender_name": "John",
                "content": "Hey, how are you?",
                "sent_at": "2025-01-10T12:00:00Z",
                "is_read": False
            }
        }
