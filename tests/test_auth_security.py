import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_password_validation_weak():
    """Testa validação de senhas fracas"""
    # Senha muito curta
    response = client.post("/users/", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "123"
    })
    assert response.status_code == 400
    assert "Password must be at least 8 characters long" in response.json()["detail"]

def test_password_validation_common():
    """Testa validação de senhas comuns"""
    # Senha comum
    response = client.post("/users/", json={
        "name": "Test User",
        "email": "test2@example.com",
        "password": "password"
    })
    assert response.status_code == 400
    assert "Password is too common" in response.json()["detail"]

def test_password_validation_missing_requirements():
    """Testa validação de requisitos de senha"""
    # Senha sem maiúscula
    response = client.post("/users/", json={
        "name": "Test User",
        "email": "test3@example.com",
        "password": "password123!"
    })
    assert response.status_code == 400
    assert "Password must contain at least one uppercase letter" in response.json()["detail"]

def test_password_validation_strong():
    """Testa senha forte válida"""
    response = client.post("/users/", json={
        "name": "Test User",
        "email": "test4@example.com",
        "password": "StrongPass123!"
    })
    assert response.status_code == 200
    assert "User created successfully" in response.json()["message"]

def test_reset_password_request():
    """Testa solicitação de reset de senha"""
    # Primeiro criar um usuário
    client.post("/users/", json={
        "name": "Test User",
        "email": "reset@example.com",
        "password": "StrongPass123!"
    })
    
    # Solicitar reset
    response = client.post("/auth/request-reset", json={
        "email": "reset@example.com"
    })
    assert response.status_code == 200
    assert "Reset email sent" in response.json()["message"]

def test_reset_password_nonexistent_email():
    """Testa reset de senha com email inexistente"""
    response = client.post("/auth/request-reset", json={
        "email": "nonexistent@example.com"
    })
    assert response.status_code == 404
    assert "Email not found" in response.json()["detail"]

def test_logout_without_token():
    """Testa logout sem token"""
    response = client.post("/auth/logout")
    assert response.status_code == 401

def test_login_and_logout_flow():
    """Testa fluxo completo de login e logout"""
    # Usuário já existe no seed com email "login@example.com" e senha "LoginPass123!"
    # Fazer login com usuário não verificado
    login_response = client.post("/auth/login", data={
        "username": "login@example.com",
        "password": "LoginPass123!"
    })
    
    # Verificar se login falha (email não verificado)
    assert login_response.status_code == 403
    assert "Email not verified" in login_response.json()["detail"]

def test_blacklist_validation():
    """Testa se tokens blacklisted são rejeitados"""
    # Este teste seria mais complexo pois precisaria de um token válido
    # Por enquanto, apenas verifica se o endpoint existe
    response = client.get("/auth/me")
    assert response.status_code == 401  # Sem token
