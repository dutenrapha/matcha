import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_data():
    """Setup dados de teste"""
    async def seed():
        from app.db import get_connection
        async for conn in get_connection():
            # Limpar dados de teste
            await conn.execute("DELETE FROM email_verifications")
            await conn.execute("DELETE FROM password_resets")
            await conn.execute("DELETE FROM sessions")
            await conn.execute("DELETE FROM users")
            
            # Criar usuário de teste com ID específico
            import bcrypt
            password_hash = bcrypt.hashpw("TestPass123!".encode(), bcrypt.gensalt()).decode()
            await conn.execute("""
                INSERT INTO users (user_id, name, email, password_hash, is_verified)
                VALUES (1, 'Test User', 'test@example.com', $1, TRUE)
            """, password_hash)
    
    asyncio.get_event_loop().run_until_complete(seed())

def test_login_success():
    """Teste de login bem-sucedido"""
    response = client.post("/auth/login", data={
        "username": "test@example.com",
        "password": "TestPass123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials():
    """Teste de login com credenciais inválidas"""
    response = client.post("/auth/login", data={
        "username": "test@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_login_unverified_email():
    """Teste de login com email não verificado"""
    # Criar usuário não verificado
    import asyncio
    from app.db import get_connection
    import bcrypt
    
    async def create_unverified():
        async for conn in get_connection():
            password_hash = bcrypt.hashpw("TestPass123!".encode(), bcrypt.gensalt()).decode()
            await conn.execute("""
                INSERT INTO users (user_id, name, email, password_hash, is_verified)
                VALUES (2, 'Unverified', 'unverified@example.com', $1, FALSE)
            """, password_hash)
    
    asyncio.get_event_loop().run_until_complete(create_unverified())
    
    response = client.post("/auth/login", data={
        "username": "unverified@example.com",
        "password": "TestPass123!"
    })
    assert response.status_code == 403

def test_send_verification():
    """Teste de envio de verificação"""
    response = client.post("/auth/send-verification?user_id=1")
    assert response.status_code == 200
    assert "Verification email sent" in response.json()["message"]

def test_verify_email_invalid_token():
    """Teste de verificação com token inválido"""
    response = client.get("/auth/verify?token=invalid-token")
    assert response.status_code == 400

def test_request_reset_nonexistent_email():
    """Teste de reset com email inexistente"""
    response = client.post("/auth/request-reset", json={
        "email": "nonexistent@example.com"
    })
    assert response.status_code == 404

def test_reset_password_invalid_token():
    """Teste de reset com token inválido"""
    response = client.post("/auth/reset-password", json={
        "token": "invalid-token",
        "new_password": "NewPass123!"
    })
    assert response.status_code == 400

def test_get_current_user():
    """Teste de obter usuário atual"""
    # Primeiro fazer login
    login_response = client.post("/auth/login", data={
        "username": "test@example.com",
        "password": "TestPass123!"
    })
    token = login_response.json()["access_token"]
    
    # Usar token para acessar endpoint protegido
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
