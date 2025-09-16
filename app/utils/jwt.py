import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Cria token JWT com JTI único"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Adicionar JTI único para permitir logout
    jti = str(uuid.uuid4())
    
    # Ensure sub is a string (JWT standard requirement)
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    
    to_encode.update({
        "exp": expire,
        "jti": jti
    })
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, jti

def verify_token(token: str) -> Optional[dict]:
    """Verifica e decodifica token JWT"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def get_user_id_from_token(token: str) -> Optional[int]:
    """Extrai user_id do token JWT"""
    payload = verify_token(token)
    if payload:
        return payload.get("sub")
    return None

def get_jti_from_token(token: str) -> Optional[str]:
    """Extrai JTI do token JWT"""
    payload = verify_token(token)
    if payload:
        return payload.get("jti")
    return None

async def get_current_user_ws(websocket):
    """Autentica usuário via WebSocket usando token JWT"""
    from fastapi import HTTPException
    
    # Obter token do query parameter ou header
    token = None
    
    # Tentar obter do query parameter
    if websocket.query_params.get("token"):
        token = websocket.query_params.get("token")
    # Tentar obter do header Authorization
    elif "authorization" in websocket.headers:
        auth_header = websocket.headers["authorization"]
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Token não fornecido")
    
    # Verificar token
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    return {
        "user_id": int(user_id),
        "email": payload.get("email"),
        "username": payload.get("username")
    }
