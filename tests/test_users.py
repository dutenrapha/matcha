from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_user_success():
    """Teste de criação de usuário bem-sucedida"""
    response = client.post("/users/", json={
        "name": "Alice",
        "email": "alice@example.com",
        "password": "StrongPass123!"
    })
    assert response.status_code == 200
    assert "User created successfully" in response.json()["message"]

def test_create_user_weak_password():
    """Teste de criação com senha fraca"""
    response = client.post("/users/", json={
        "name": "Bob",
        "email": "bob@example.com",
        "password": "123"
    })
    assert response.status_code == 400
    assert "Password must be at least 8 characters long" in response.json()["detail"]

def test_create_user_common_password():
    """Teste de criação com senha comum"""
    response = client.post("/users/", json={
        "name": "Charlie",
        "email": "charlie@example.com",
        "password": "password"
    })
    assert response.status_code == 400
    assert "Password is too common" in response.json()["detail"]

def test_create_user_duplicate_email():
    """Teste de criação com email duplicado"""
    response = client.post("/users/", json={
        "name": "Duplicate",
        "email": "test@example.com",  # Email já existe (do seed)
        "password": "StrongPass123!"
    })
    assert response.status_code == 400
    assert "Email already exists" in response.json()["detail"]

def test_get_user_success():
    """Teste de obter usuário existente"""
    response = client.get("/users/1")
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == 1
    assert data["name"] == "Test User"
    assert data["email"] == "test@example.com"

def test_get_user_not_found():
    """Teste de obter usuário inexistente"""
    response = client.get("/users/99999")
    assert response.status_code == 404
    assert "User not found" in response.json()["detail"]

def test_update_user_success():
    """Teste de atualização de usuário"""
    response = client.put("/users/1", json={
        "name": "Updated Name"
    })
    assert response.status_code == 200
    assert "User updated successfully" in response.json()["message"]

def test_update_user_no_fields():
    """Teste de atualização sem campos"""
    response = client.put("/users/1", json={})
    assert response.status_code == 400
    assert "No fields to update" in response.json()["detail"]

def test_delete_user_success():
    """Teste de deleção de usuário"""
    # Primeiro criar um usuário para deletar
    client.post("/users/", json={
        "name": "To Delete",
        "email": "delete@example.com",
        "password": "StrongPass123!"
    })
    
    response = client.delete("/users/2")
    assert response.status_code == 200
    assert "User deleted successfully" in response.json()["message"]
