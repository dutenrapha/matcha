import json
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_websocket_chat_success():
    """Teste de chat WebSocket bem-sucedido"""
    chat_id = 1

    with client.websocket_connect(f"/ws/chat/{chat_id}") as ws1:
        with client.websocket_connect(f"/ws/chat/{chat_id}") as ws2:
            # Enviar mensagem pelo ws1
            ws1.send_text(json.dumps({"sender_id": 1, "content": "Hello WebSocket!"}))

            # Receber mensagem no ws2
            response = ws2.receive_text()
            data = json.loads(response)

            assert data["chat_id"] == chat_id
            assert data["sender_id"] == 1
            assert data["content"] == "Hello WebSocket!"
            assert "sent_at" in data

def test_websocket_invalid_json():
    """Teste de WebSocket com JSON inválido"""
    chat_id = 1

    with client.websocket_connect(f"/ws/chat/{chat_id}") as ws:
        ws.send_text("INVALID JSON")
        response = ws.receive_text()
        data = json.loads(response)

        assert "error" in data
        assert data["error"] == "Invalid JSON"

def test_websocket_missing_fields():
    """Teste de WebSocket com campos ausentes"""
    chat_id = 1

    with client.websocket_connect(f"/ws/chat/{chat_id}") as ws:
        # Faltando sender_id
        ws.send_text(json.dumps({"content": "Oi"}))
        response = ws.receive_text()
        data = json.loads(response)

        assert "error" in data
        assert "Invalid payload" in data["error"]

def test_websocket_empty_content():
    """Teste de WebSocket com conteúdo vazio"""
    chat_id = 1

    with client.websocket_connect(f"/ws/chat/{chat_id}") as ws:
        ws.send_text(json.dumps({"sender_id": 1, "content": ""}))
        response = ws.receive_text()
        data = json.loads(response)

        assert "error" in data
        assert "Invalid payload" in data["error"]
