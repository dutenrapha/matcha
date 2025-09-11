import json
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
            await conn.execute("DELETE FROM swipes")
            await conn.execute("DELETE FROM matches")
            await conn.execute("DELETE FROM users")
            
            # Criar usuários de teste
            import bcrypt
            password_hash = bcrypt.hashpw("TestPass123!".encode(), bcrypt.gensalt()).decode()
            
            await conn.execute("""
                INSERT INTO users (user_id, name, email, password_hash, is_verified)
                VALUES (101, 'User 1', 'user1@test.com', $1, TRUE)
            """, password_hash)
            
            await conn.execute("""
                INSERT INTO users (user_id, name, email, password_hash, is_verified)
                VALUES (102, 'User 2', 'user2@test.com', $1, TRUE)
            """, password_hash)
    
    asyncio.get_event_loop().run_until_complete(seed())

def test_swipe_like_success():
    """Teste de swipe like bem-sucedido"""
    response = client.post("/swipes/", json={
        "swiper_id": 101,
        "swiped_id": 102,
        "direction": "like"
    })
    assert response.status_code == 200
    assert "Swipe registered" in response.json()["message"]

def test_swipe_dislike_success():
    """Teste de swipe dislike bem-sucedido"""
    response = client.post("/swipes/", json={
        "swiper_id": 101,
        "swiped_id": 102,
        "direction": "dislike"
    })
    assert response.status_code == 200
    assert "Swipe registered" in response.json()["message"]

def test_swipe_invalid_direction():
    """Teste de swipe com direção inválida"""
    response = client.post("/swipes/", json={
        "swiper_id": 101,
        "swiped_id": 102,
        "direction": "superlike"  # Inválido
    })
    assert response.status_code == 422  # Erro de validação

def test_swipe_missing_fields():
    """Teste de swipe com campos ausentes"""
    response = client.post("/swipes/", json={
        "swiper_id": 101,
        "direction": "like"
        # Faltando swiped_id
    })
    assert response.status_code == 422

def test_get_likes_received():
    """Teste de obter likes recebidos"""
    response = client.get("/swipes/102/likes")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_swipes_given():
    """Teste de obter swipes dados"""
    response = client.get("/swipes/101/given")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_swipe_creates_match():
    """Teste de swipe que cria match"""
    # Primeiro user1 dá like em user2
    client.post("/swipes/", json={
        "swiper_id": 101,
        "swiped_id": 102,
        "direction": "like"
    })
    
    # Depois user2 dá like em user1 (deve criar match)
    response = client.post("/swipes/", json={
        "swiper_id": 102,
        "swiped_id": 101,
        "direction": "like"
    })
    
    assert response.status_code == 200
    assert "Match created!" in response.json()["message"]
    assert "match_id" in response.json()
