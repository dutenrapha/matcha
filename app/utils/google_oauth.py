import os
import httpx
from typing import Optional, Dict, Any
from app.schemas.auth import GoogleUserInfo
from dotenv import load_dotenv

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

class GoogleOAuthError(Exception):
    """Exceção personalizada para erros do Google OAuth"""
    pass

async def get_google_user_info(access_token: str) -> GoogleUserInfo:
    """
    Obtém informações do usuário do Google usando o access_token
    
    Args:
        access_token: Token de acesso do Google
        
    Returns:
        GoogleUserInfo: Informações do usuário
        
    Raises:
        GoogleOAuthError: Se houver erro na comunicação com a API do Google
    """
    try:
        async with httpx.AsyncClient() as client:
            # Fazer requisição para a API do Google
            response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if response.status_code != 200:
                raise GoogleOAuthError(f"Google API error: {response.status_code}")
            
            user_data = response.json()
            
            # Validar se o email está verificado
            if not user_data.get("verified_email", False):
                raise GoogleOAuthError("Email not verified by Google")
            
            return GoogleUserInfo(
                id=user_data["id"],
                email=user_data["email"],
                name=user_data["name"],
                picture=user_data.get("picture"),
                verified_email=user_data.get("verified_email", False)
            )
            
    except httpx.RequestError as e:
        raise GoogleOAuthError(f"Network error: {str(e)}")
    except KeyError as e:
        raise GoogleOAuthError(f"Missing required field in Google response: {str(e)}")
    except Exception as e:
        raise GoogleOAuthError(f"Unexpected error: {str(e)}")

def get_google_auth_url() -> str:
    """
    Gera URL de autorização do Google OAuth
    
    Returns:
        str: URL para redirecionar o usuário para o Google
    """
    if not GOOGLE_CLIENT_ID:
        raise GoogleOAuthError("GOOGLE_CLIENT_ID not configured")
    
    if not GOOGLE_REDIRECT_URI:
        raise GoogleOAuthError("GOOGLE_REDIRECT_URI not configured")
    
    # Parâmetros para a URL de autorização
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "scope": "openid email profile",
        "response_type": "code",
        "access_type": "offline",
        "prompt": "consent"
    }
    
    # Construir URL
    base_url = "https://accounts.google.com/o/oauth2/v2/auth"
    query_string = "&".join([f"{key}={value}" for key, value in params.items()])
    
    return f"{base_url}?{query_string}"

async def exchange_code_for_token(code: str) -> Dict[str, Any]:
    """
    Troca o código de autorização por um token de acesso
    
    Args:
        code: Código de autorização retornado pelo Google
        
    Returns:
        Dict: Dados do token (access_token, refresh_token, etc.)
        
    Raises:
        GoogleOAuthError: Se houver erro na troca do código
    """
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise GoogleOAuthError("Google OAuth credentials not configured")
    
    try:
        request_data = {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": GOOGLE_REDIRECT_URI
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data=request_data
            )
            
            if response.status_code != 200:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
                raise GoogleOAuthError(f"Token exchange failed: {error_data.get('error_description', 'Unknown error')}")
            
            return response.json()
            
    except httpx.RequestError as e:
        raise GoogleOAuthError(f"Network error during token exchange: {str(e)}")
    except Exception as e:
        raise GoogleOAuthError(f"Unexpected error during token exchange: {str(e)}")
