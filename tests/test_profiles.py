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
            await conn.execute("DELETE FROM profiles")
            await conn.execute("DELETE FROM users")
            
            # Criar usuário de teste
            import bcrypt
            password_hash = bcrypt.hashpw("TestPass123!".encode(), bcrypt.gensalt()).decode()
            await conn.execute("""
                INSERT INTO users (user_id, name, email, password_hash, is_verified)
                VALUES (1, 'Test User', 'test@example.com', $1, TRUE)
            """, password_hash)
    
    asyncio.get_event_loop().run_until_complete(seed())

def test_create_profile_success():
    """Teste de criação de perfil bem-sucedida"""
    response = client.post("/profiles/", json={
        "user_id": 1,
        "bio": "Love hiking and dogs",
        "age": 25,
        "gender": "female",
        "sexual_pref": "male",
        "location": "São Paulo",
        "latitude": -23.55,
        "longitude": -46.63,
        "avatar_url": "https://example.com/avatar.jpg"
    })
    assert response.status_code == 200
    assert "Profile saved successfully" in response.json()["message"]

def test_create_profile_missing_avatar():
    """Teste de criação de perfil sem avatar"""
    response = client.post("/profiles/", json={
        "user_id": 1,
        "bio": "Love hiking",
        "age": 25,
        "gender": "female",
        "sexual_pref": "male"
        # Faltando avatar_url
    })
    assert response.status_code == 422  # Erro de validação

def test_create_profile_underage():
    """Teste de criação de perfil menor de idade"""
    response = client.post("/profiles/", json={
        "user_id": 1,
        "bio": "Too young",
        "age": 17,  # Menor de 18
        "gender": "female",
        "sexual_pref": "male",
        "avatar_url": "https://example.com/avatar.jpg"
    })
    assert response.status_code == 422  # Erro de validação

def test_get_profile_success():
    """Teste de obter perfil existente"""
    response = client.get("/profiles/1")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == 1
    assert data["bio"] == "Love hiking and dogs"

def test_get_profile_not_found():
    """Teste de obter perfil inexistente"""
    response = client.get("/profiles/99999")
    assert response.status_code == 404
    assert "Profile not found" in response.json()["detail"]

def test_update_profile_success():
    """Teste de atualização de perfil"""
    response = client.put("/profiles/1", json={
        "bio": "Updated bio",
        "age": 26
    })
    assert response.status_code == 200
    assert "Profile updated successfully" in response.json()["message"]

def test_update_profile_no_fields():
    """Teste de atualização sem campos"""
    response = client.put("/profiles/1", json={})
    assert response.status_code == 400
    assert "No fields to update" in response.json()["detail"]

def test_delete_profile_success():
    """Teste de deleção de perfil"""
    response = client.delete("/profiles/1")
    assert response.status_code == 200
    assert "Profile deleted successfully" in response.json()["message"]
