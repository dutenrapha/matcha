import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_data():
    """Setup dados de teste para busca"""
    async def seed():
        from app.db import get_connection
        async for conn in get_connection():
            # Limpar dados de teste
            await conn.execute("DELETE FROM user_tags")
            await conn.execute("DELETE FROM tags")
            await conn.execute("DELETE FROM profiles")
            await conn.execute("DELETE FROM users")
            
            # Criar usuários de teste
            import bcrypt
            password_hash = bcrypt.hashpw("TestPass123!".encode(), bcrypt.gensalt()).decode()
            
            # Usuário 1 (base para busca)
            await conn.execute("""
                INSERT INTO users (user_id, name, email, password_hash, is_verified, fame_rating)
                VALUES (1, 'Searcher', 'searcher@test.com', $1, TRUE, 50)
            """, password_hash)
            
            await conn.execute("""
                INSERT INTO profiles (user_id, age, gender, sexual_pref, latitude, longitude, avatar_url)
                VALUES (1, 25, 'female', 'male', -23.55, -46.63, 'avatar1.jpg')
            """)
            
            # Usuário 2 (jovem, fama alta, tag vegan)
            await conn.execute("""
                INSERT INTO users (user_id, name, email, password_hash, is_verified, fame_rating)
                VALUES (2, 'Bob', 'bob@test.com', $1, TRUE, 90)
            """, password_hash)
            
            await conn.execute("""
                INSERT INTO profiles (user_id, age, gender, sexual_pref, latitude, longitude, avatar_url)
                VALUES (2, 24, 'male', 'female', -23.56, -46.62, 'avatar2.jpg')
            """)
            
            # Usuário 3 (mais velho, fama baixa, tag geek)
            await conn.execute("""
                INSERT INTO users (user_id, name, email, password_hash, is_verified, fame_rating)
                VALUES (3, 'Charlie', 'charlie@test.com', $1, TRUE, 20)
            """, password_hash)
            
            await conn.execute("""
                INSERT INTO profiles (user_id, age, gender, sexual_pref, latitude, longitude, avatar_url)
                VALUES (3, 35, 'male', 'female', -23.60, -46.70, 'avatar3.jpg')
            """)
            
            # Criar tags
            vegan_id = await conn.fetchval("INSERT INTO tags (name) VALUES ('vegan') RETURNING tag_id")
            geek_id = await conn.fetchval("INSERT INTO tags (name) VALUES ('geek') RETURNING tag_id")
            
            # Atribuir tags
            await conn.execute("INSERT INTO user_tags (user_id, tag_id) VALUES (2, $1)", vegan_id)
            await conn.execute("INSERT INTO user_tags (user_id, tag_id) VALUES (3, $1)", geek_id)
    
    asyncio.get_event_loop().run_until_complete(seed())

def test_filter_by_age():
    """Teste de filtro por idade"""
    response = client.get("/users/search", params={
        "current_user_id": 1,
        "age_min": 20,
        "age_max": 30
    })
    assert response.status_code == 200
    data = response.json()
    assert all(20 <= user["age"] <= 30 for user in data)

def test_filter_by_fame():
    """Teste de filtro por fama"""
    response = client.get("/users/search", params={
        "current_user_id": 1,
        "fame_min": 80
    })
    assert response.status_code == 200
    data = response.json()
    assert all(user["fame_rating"] >= 80 for user in data)

def test_filter_by_tag():
    """Teste de filtro por tag"""
    response = client.get("/users/search", params={
        "current_user_id": 1,
        "tags": "vegan"
    })
    assert response.status_code == 200
    data = response.json()
    # Verificar se pelo menos um usuário tem a tag
    assert len(data) > 0

def test_sort_by_age():
    """Teste de ordenação por idade"""
    response = client.get("/users/search", params={
        "current_user_id": 1,
        "sort_by": "age"
    })
    assert response.status_code == 200
    data = response.json()
    ages = [user["age"] for user in data]
    assert ages == sorted(ages)

def test_sort_by_fame():
    """Teste de ordenação por fama"""
    response = client.get("/users/search", params={
        "current_user_id": 1,
        "sort_by": "fame_rating"
    })
    assert response.status_code == 200
    data = response.json()
    ratings = [user["fame_rating"] for user in data]
    assert ratings == sorted(ratings, reverse=True)

def test_sort_by_distance():
    """Teste de ordenação por distância"""
    response = client.get("/users/search", params={
        "current_user_id": 1,
        "sort_by": "distance"
    })
    assert response.status_code == 200
    data = response.json()
    distances = [user["distance"] for user in data]
    assert distances == sorted(distances)

def test_multiple_filters():
    """Teste de múltiplos filtros"""
    response = client.get("/users/search", params={
        "current_user_id": 1,
        "age_min": 20,
        "age_max": 30,
        "fame_min": 50,
        "tags": "vegan"
    })
    assert response.status_code == 200
    data = response.json()
    # Verificar se todos os filtros foram aplicados
    for user in data:
        assert 20 <= user["age"] <= 30
        assert user["fame_rating"] >= 50
