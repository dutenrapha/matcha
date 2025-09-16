from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

class LoginIn(BaseModel):
    username: str
    password: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username": "alice",
                "password": "StrongPass123!"
            }
        }
    )

class LoginOut(BaseModel):
    access_token: str
    token_type: str
    user_id: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "token_type": "bearer",
                "user_id": 1
            }
        }
    )

class TokenVerify(BaseModel):
    token: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "token": "550e8400-e29b-41d4-a716-446655440000"
            }
        }
    )

class RequestResetIn(BaseModel):
    email: EmailStr

    model_config = ConfigDict(
        json_schema_extra={
            "example": {"email": "alice@example.com"}
        }
    )

class ResetPasswordIn(BaseModel):
    token: str
    new_password: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "token": "550e8400-e29b-41d4-a716-446655440000",
                "new_password": "NewStrongPass123!"
            }
        }
    )

class SessionOut(BaseModel):
    session_id: str
    user_id: int
    expires_at: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "user_id": 1,
                "expires_at": "2025-01-11T12:00:00Z"
            }
        }
    )

class GoogleOAuthIn(BaseModel):
    """Schema para dados do Google OAuth"""
    access_token: str
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "ya29.a0AfH6SMC..."
            }
        }
    )

class GoogleUserInfo(BaseModel):
    """Schema para informações do usuário do Google"""
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    verified_email: bool = False
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "123456789",
                "email": "user@gmail.com",
                "name": "João Silva",
                "picture": "https://lh3.googleusercontent.com/...",
                "verified_email": True
            }
        }
    )

class OAuthLoginOut(BaseModel):
    """Schema para resposta de login OAuth"""
    access_token: str
    token_type: str
    user_id: int
    is_new_user: bool
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "token_type": "bearer",
                "user_id": 1,
                "is_new_user": False
            }
        }
    )
