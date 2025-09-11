import json
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_ws_notifications_success():
    """Teste de notificações WebSocket bem-sucedido"""
    user_id = 99

    with client.websocket_connect(f"/ws/notifications/{user_id}") as ws:
        # Enviar notificação
        ws.send_text(json.dumps({
            "type": "match",
            "content": "You matched with Alice!"
        }))

        # Receber notificação
        response = ws.receive_text()
        data = json.loads(response)

        assert data["user_id"] == user_id
        assert data["type"] == "match"
        assert "Alice" in data["content"]
        assert "created_at" in data

def test_ws_notifications_invalid_json():
    """Teste de notificações WebSocket com JSON inválido"""
    user_id = 99

    with client.websocket_connect(f"/ws/notifications/{user_id}") as ws:
        ws.send_text("INVALID JSON")
        response = ws.receive_text()
        data = json.loads(response)

        assert "error" in data
        assert data["error"] == "Invalid JSON"

def test_ws_notifications_missing_fields():
    """Teste de notificações WebSocket com campos ausentes"""
    user_id = 99

    with client.websocket_connect(f"/ws/notifications/{user_id}") as ws:
        ws.send_text(json.dumps({"content": "Missing type"}))
        response = ws.receive_text()
        data = json.loads(response)

        assert "error" in data
        assert "Invalid payload" in data["error"]

def test_ws_notifications_empty_content():
    """Teste de notificações WebSocket com conteúdo vazio"""
    user_id = 99

    with client.websocket_connect(f"/ws/notifications/{user_id}") as ws:
        ws.send_text(json.dumps({"type": "like", "content": ""}))
        response = ws.receive_text()
        data = json.loads(response)

        assert "error" in data
        assert "Invalid payload" in data["error"]
