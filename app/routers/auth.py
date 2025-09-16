import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from app.db import get_connection
from app.schemas.auth import (
    LoginIn, LoginOut, RequestResetIn, ResetPasswordIn, SessionOut,
    GoogleOAuthIn, OAuthLoginOut
)
from pydantic import BaseModel

class GoogleCodeIn(BaseModel):
    code: str
    redirect_uri: str
from app.utils.passwords import validate_password, hash_password, verify_password
from app.utils.email import send_email
from app.utils.jwt import create_access_token, verify_token, get_jti_from_token
from app.utils.google_oauth import (
    get_google_user_info, get_google_auth_url, 
    exchange_code_for_token, GoogleOAuthError
)
from typing import Optional

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

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
        "SELECT user_id, name, email, username, is_verified FROM users WHERE user_id = $1", 
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
    """Login com username e senha"""
    # Buscar usuário por username
    user = await conn.fetchrow(
        "SELECT user_id, name, email, username, password_hash, is_verified FROM users WHERE username = $1", 
        form_data.username
    )
    
    if not user or not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Para testes, não exigir verificação de email
    # if not user["is_verified"]:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Email not verified"
    #     )
    
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
    reset_link = f"http://localhost:3000/reset-password?token={token}"
    
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
    expires_at = datetime.datetime.fromtimestamp(payload.get("exp", 0))
    
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

# ==================== GOOGLE OAUTH ROUTES ====================

@router.get("/google/login")
async def google_login():
    """
    Inicia o processo de login com Google OAuth
    Redireciona o usuário para a página de autorização do Google
    """
    try:
        auth_url = get_google_auth_url()
        return RedirectResponse(url=auth_url)
    except GoogleOAuthError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google OAuth configuration error: {str(e)}"
        )

@router.post("/google/callback")
async def google_callback_post(data: GoogleCodeIn, conn=Depends(get_connection)):
    """
    Callback do Google OAuth via POST (para nova API)
    Processa o código de autorização e faz login/cadastro do usuário
    """
    try:
        # Trocar código por token
        token_data = await exchange_code_for_token(data.code)
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No access token received from Google"
            )
        
        # Obter informações do usuário
        google_user = await get_google_user_info(access_token)
        
        # Verificar se usuário já existe
        existing_user = await conn.fetchrow(
            "SELECT user_id, name, email, username, is_verified FROM users WHERE email = $1",
            google_user.email
        )
        
        is_new_user = False
        
        if existing_user:
            # Usuário existe - fazer login
            user_id = existing_user["user_id"]
            
            # Atualizar informações se necessário
            if existing_user["name"] != google_user.name:
                await conn.execute(
                    "UPDATE users SET name = $1 WHERE user_id = $2",
                    google_user.name, user_id
                )
            
            # Marcar como verificado se não estiver
            if not existing_user["is_verified"]:
                await conn.execute(
                    "UPDATE users SET is_verified = TRUE WHERE user_id = $1",
                    user_id
                )
        else:
            # Usuário não existe - criar novo
            is_new_user = True
            
            # Gerar username único baseado no email
            base_username = google_user.email.split("@")[0]
            username = base_username
            counter = 1
            
            while True:
                existing_username = await conn.fetchrow(
                    "SELECT user_id FROM users WHERE username = $1", username
                )
                if not existing_username:
                    break
                username = f"{base_username}{counter}"
                counter += 1
            
            # Inserir novo usuário
            result = await conn.fetchrow("""
                INSERT INTO users (name, email, username, is_verified, created_at, last_login)
                VALUES ($1, $2, $3, TRUE, NOW(), NOW())
                RETURNING user_id
            """, google_user.name, google_user.email, username)
            
            user_id = result["user_id"]
        
        # Atualizar last_login
        await conn.execute(
            "UPDATE users SET last_login = NOW() WHERE user_id = $1",
            user_id
        )
        
        # Criar token JWT
        jwt_token, jti = create_access_token(data={"sub": user_id})
        
        # Retornar resposta
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user_id": user_id,
            "is_new_user": is_new_user,
            "message": "Login successful" if not is_new_user else "Account created and login successful"
        }
        
    except GoogleOAuthError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google OAuth error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/google/callback")
async def google_callback(code: str = Query(...), conn=Depends(get_connection)):
    """
    Callback do Google OAuth
    Processa o código de autorização e faz login/cadastro do usuário
    """
    try:
        # Trocar código por token
        token_data = await exchange_code_for_token(code)
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No access token received from Google"
            )
        
        # Obter informações do usuário
        google_user = await get_google_user_info(access_token)
        
        # Verificar se usuário já existe
        existing_user = await conn.fetchrow(
            "SELECT user_id, name, email, username, is_verified FROM users WHERE email = $1",
            google_user.email
        )
        
        is_new_user = False
        
        if existing_user:
            # Usuário existe - fazer login
            user_id = existing_user["user_id"]
            
            # Atualizar informações se necessário
            if existing_user["name"] != google_user.name:
                await conn.execute(
                    "UPDATE users SET name = $1 WHERE user_id = $2",
                    google_user.name, user_id
                )
            
            # Marcar como verificado se não estiver
            if not existing_user["is_verified"]:
                await conn.execute(
                    "UPDATE users SET is_verified = TRUE WHERE user_id = $1",
                    user_id
                )
        else:
            # Usuário não existe - criar novo
            is_new_user = True
            
            # Gerar username único baseado no email
            base_username = google_user.email.split("@")[0]
            username = base_username
            counter = 1
            
            while True:
                existing_username = await conn.fetchrow(
                    "SELECT user_id FROM users WHERE username = $1", username
                )
                if not existing_username:
                    break
                username = f"{base_username}{counter}"
                counter += 1
            
            # Inserir novo usuário
            result = await conn.fetchrow("""
                INSERT INTO users (name, email, username, is_verified, created_at, last_login)
                VALUES ($1, $2, $3, TRUE, NOW(), NOW())
                RETURNING user_id
            """, google_user.name, google_user.email, username)
            
            user_id = result["user_id"]
        
        # Atualizar last_login
        await conn.execute(
            "UPDATE users SET last_login = NOW() WHERE user_id = $1",
            user_id
        )
        
        # Criar token JWT
        jwt_token, jti = create_access_token(data={"sub": user_id})
        
        # Retornar resposta
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user_id": user_id,
            "is_new_user": is_new_user,
            "message": "Login successful" if not is_new_user else "Account created and login successful"
        }
        
    except GoogleOAuthError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google OAuth error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/google/token", response_model=OAuthLoginOut)
async def google_token_login(data: GoogleOAuthIn, conn=Depends(get_connection)):
    """
    Login com Google usando access_token diretamente
    Útil para frontend que já possui o token do Google
    """
    try:
        # Obter informações do usuário
        google_user = await get_google_user_info(data.access_token)
        
        # Verificar se usuário já existe
        existing_user = await conn.fetchrow(
            "SELECT user_id, name, email, username, is_verified FROM users WHERE email = $1",
            google_user.email
        )
        
        is_new_user = False
        
        if existing_user:
            # Usuário existe - fazer login
            user_id = existing_user["user_id"]
            
            # Atualizar informações se necessário
            if existing_user["name"] != google_user.name:
                await conn.execute(
                    "UPDATE users SET name = $1 WHERE user_id = $2",
                    google_user.name, user_id
                )
            
            # Marcar como verificado se não estiver
            if not existing_user["is_verified"]:
                await conn.execute(
                    "UPDATE users SET is_verified = TRUE WHERE user_id = $1",
                    user_id
                )
        else:
            # Usuário não existe - criar novo
            is_new_user = True
            
            # Gerar username único baseado no email
            base_username = google_user.email.split("@")[0]
            username = base_username
            counter = 1
            
            while True:
                existing_username = await conn.fetchrow(
                    "SELECT user_id FROM users WHERE username = $1", username
                )
                if not existing_username:
                    break
                username = f"{base_username}{counter}"
                counter += 1
            
            # Inserir novo usuário
            result = await conn.fetchrow("""
                INSERT INTO users (name, email, username, is_verified, created_at, last_login)
                VALUES ($1, $2, $3, TRUE, NOW(), NOW())
                RETURNING user_id
            """, google_user.name, google_user.email, username)
            
            user_id = result["user_id"]
        
        # Atualizar last_login
        await conn.execute(
            "UPDATE users SET last_login = NOW() WHERE user_id = $1",
            user_id
        )
        
        # Criar token JWT
        jwt_token, jti = create_access_token(data={"sub": user_id})
        
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "user_id": user_id,
            "is_new_user": is_new_user
        }
        
    except GoogleOAuthError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google OAuth error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )
