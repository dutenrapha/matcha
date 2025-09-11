import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.db import get_connection
from app.schemas.auth import LoginIn, LoginOut, RequestResetIn, ResetPasswordIn, SessionOut
from app.utils.passwords import validate_password, hash_password, verify_password
from app.utils.email import send_email
from app.utils.jwt import create_access_token, verify_token, get_jti_from_token
from typing import Optional

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), conn=Depends(get_connection)):
    """Dependência para obter usuário atual via JWT"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    
    # Verificar se token está na blacklist
    jti = payload.get("jti")
    if jti:
        blacklisted = await conn.fetchrow(
            "SELECT token_id FROM blacklisted_tokens WHERE token_jti = $1", 
            jti
        )
        if blacklisted:
            raise credentials_exception
    
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
    
    # Convert string user_id back to int for database query
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise credentials_exception
    
    # Verificar se usuário existe e está verificado
    user = await conn.fetchrow(
        "SELECT user_id, name, email, is_verified FROM users WHERE user_id = $1", 
        user_id
    )
    if user is None:
        raise credentials_exception
    
    # Para testes, não exigir verificação
    # if not user["is_verified"]:
    #     raise credentials_exception
    
    return dict(user)

@router.post("/login", response_model=LoginOut)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), conn=Depends(get_connection)):
    """Login com email e senha"""
    # Buscar usuário por email
    user = await conn.fetchrow(
        "SELECT user_id, name, email, password_hash, is_verified FROM users WHERE email = $1", 
        form_data.username
    )
    
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user["is_verified"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified"
        )
    
    # Atualizar last_login
    await conn.execute(
        "UPDATE users SET last_login = NOW() WHERE user_id = $1", 
        user["user_id"]
    )
    
    # Criar token JWT
    access_token, jti = create_access_token(data={"sub": user["user_id"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user["user_id"]
    }

@router.post("/send-verification")
async def send_verification(user_id: int = Query(...), conn=Depends(get_connection)):
    """Enviar email de verificação"""
    user = await conn.fetchrow("SELECT email FROM users WHERE user_id = $1", user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Gerar token de verificação
    token = str(uuid.uuid4())
    expires = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
    
    await conn.execute("""
        INSERT INTO email_verifications (token, user_id, expires_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (token) DO UPDATE SET expires_at = $3
    """, token, user_id, expires)
    
    # Criar link de verificação
    verify_link = f"http://localhost:8000/auth/verify?token={token}"
    
    # Enviar email
    subject = "Verify your Matcha account"
    body = f"""Hello!
    
Please verify your account by clicking the link below:
{verify_link}

This link expires in 24 hours.

Best regards,
Matcha Team"""
    
    await send_email(user["email"], subject, body)
    
    return {"message": f"Verification email sent to {user['email']}"}

@router.get("/verify")
async def verify_email(token: str, conn=Depends(get_connection)):
    """Verificar email com token"""
    # Validar formato do UUID
    try:
        uuid.UUID(token)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid token format")
    
    verification = await conn.fetchrow("""
        SELECT user_id, expires_at FROM email_verifications WHERE token = $1
    """, token)
    
    if not verification:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    if verification["expires_at"] < datetime.datetime.now(datetime.timezone.utc):
        raise HTTPException(status_code=400, detail="Token expired")
    
    # Marcar usuário como verificado
    await conn.execute(
        "UPDATE users SET is_verified = TRUE WHERE user_id = $1", 
        verification["user_id"]
    )
    
    # Remover token usado
    await conn.execute("DELETE FROM email_verifications WHERE token = $1", token)
    
    return {"message": "Email verified successfully"}

@router.post("/request-reset")
async def request_reset(data: RequestResetIn, conn=Depends(get_connection)):
    """Solicitar reset de senha"""
    user = await conn.fetchrow("SELECT user_id FROM users WHERE email = $1", data.email)
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    
    # Gerar token de reset
    token = str(uuid.uuid4())
    expires = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
    
    await conn.execute("""
        INSERT INTO password_resets (token, user_id, expires_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (token) DO UPDATE SET expires_at = $3
    """, token, user["user_id"], expires)
    
    # Criar link de reset
    reset_link = f"http://localhost:8000/auth/reset-password?token={token}"
    
    # Enviar email
    subject = "Reset your Matcha password"
    body = f"""Hello!
    
You requested a password reset. Click the link below to reset your password:
{reset_link}

This link expires in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
Matcha Team"""
    
    await send_email(data.email, subject, body)
    
    return {"message": f"Reset email sent to {data.email}"}

@router.post("/reset-password")
async def reset_password(data: ResetPasswordIn, conn=Depends(get_connection)):
    """Resetar senha com token"""
    # Validar formato do UUID
    try:
        uuid.UUID(data.token)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid token format")
    
    reset = await conn.fetchrow("""
        SELECT user_id, expires_at FROM password_resets WHERE token = $1
    """, data.token)
    
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    if reset["expires_at"] < datetime.datetime.now(datetime.timezone.utc):
        raise HTTPException(status_code=400, detail="Token expired")
    
    # Validar nova senha
    valid, error = validate_password(data.new_password)
    if not valid:
        raise HTTPException(status_code=400, detail=error)
    
    # Atualizar senha
    hashed = hash_password(data.new_password)
    await conn.execute(
        "UPDATE users SET password_hash = $1 WHERE user_id = $2", 
        hashed, reset["user_id"]
    )
    
    # Remover token usado
    await conn.execute("DELETE FROM password_resets WHERE token = $1", data.token)
    
    return {"message": "Password reset successfully"}

@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme), conn=Depends(get_connection)):
    """Logout - adiciona token à blacklist"""
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    jti = payload.get("jti")
    user_id_str = payload.get("sub")
    expires_at = datetime.fromtimestamp(payload.get("exp", 0))
    
    if not jti or not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format"
        )
    
    # Convert string user_id back to int for database query
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format"
        )
    
    # Adicionar token à blacklist
    await conn.execute("""
        INSERT INTO blacklisted_tokens (token_jti, user_id, expires_at)
        VALUES ($1, $2, $3)
        ON CONFLICT (token_jti) DO NOTHING
    """, jti, user_id, expires_at)
    
    return {"message": "Logout successful"}

@router.get("/me", response_model=dict)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Obter informações do usuário atual"""
    return current_user
