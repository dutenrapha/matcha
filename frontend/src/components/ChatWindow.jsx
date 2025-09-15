import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { messageService, statusService } from '../services/api';
import OnlineStatus from './OnlineStatus';
import './ChatWindow.css';

const ChatWindow = ({ chat, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [wsConnection, setWsConnection] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = useCallback(async () => {
    if (!chat?.chat_id) return;
    
    try {
      setLoading(true);
      setError('');
      
      const messagesData = await messageService.getMessagesWithSenders(chat.chat_id, 50, 0);
      setMessages(messagesData.reverse()); // Inverter para mostrar as mais antigas primeiro
      
      // Marcar mensagens como lidas
      await messageService.markAllMessagesRead(chat.chat_id, user.user_id);
      
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      setError('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  }, [chat?.chat_id, user?.user_id]);

  const setupWebSocket = useCallback(() => {
    if (!chat?.chat_id || !user?.user_id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host.replace('3000', '8000')}/ws/chat/${chat.chat_id}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket conectado para chat:', chat.chat_id);
      setWsConnection(ws);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          console.error('Erro do WebSocket:', data.error);
          return;
        }
        
        // Adicionar nova mensagem
        const newMessage = {
          message_id: Date.now(), // ID temporário
          chat_id: data.chat_id,
          sender_id: data.sender_id,
          sender_name: data.sender_id === user.user_id ? user.name : chat.name,
          content: data.content,
          sent_at: data.sent_at,
          is_read: true
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // Marcar como lida se não for nossa mensagem
        if (data.sender_id !== user.user_id) {
          messageService.markAllMessagesRead(chat.chat_id, user.user_id);
        }
        
      } catch (err) {
        console.error('Erro ao processar mensagem WebSocket:', err);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket desconectado');
      setWsConnection(null);
      
      // Tentar reconectar após 3 segundos
      setTimeout(() => {
        if (chat?.chat_id) {
          setupWebSocket();
        }
      }, 3000);
    };
    
    ws.onerror = (error) => {
      console.error('Erro no WebSocket:', error);
    };
    
    return ws;
  }, [chat?.chat_id, chat?.name, user?.user_id, user?.name]);

  useEffect(() => {
    if (chat) {
      loadMessages();
      const ws = setupWebSocket();
      
      return () => {
        if (ws) {
          ws.close();
        }
      };
    }
  }, [chat, loadMessages, setupWebSocket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending || !wsConnection) return;
    
    try {
      setSending(true);
      
      // Enviar via WebSocket
      wsConnection.send(JSON.stringify({
        sender_id: user.user_id,
        content: newMessage.trim()
      }));
      
      setNewMessage('');
      
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!chat) {
    return (
      <div className="chat-window">
        <div className="chat-window-empty">
          <div className="empty-icon">💬</div>
          <h3>Selecione uma conversa</h3>
          <p>Escolha uma conversa da lista para começar a trocar mensagens!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-info">
          <img 
            src={chat.avatar_url || '/default-avatar.png'} 
            alt={chat.name}
            className="chat-header-avatar"
            onError={(e) => {
              e.target.src = '/default-avatar.png';
            }}
          />
          <div className="chat-header-details">
            <h3>{chat.name}</h3>
            <OnlineStatus userId={chat.user_id} showText={true} size="small" />
          </div>
        </div>
        <button onClick={onClose} className="chat-close-btn">
          ✕
        </button>
      </div>

      <div className="chat-messages" ref={messagesContainerRef}>
        {loading && (
          <div className="chat-loading">
            <div className="loading-spinner"></div>
            <p>Carregando mensagens...</p>
          </div>
        )}
        
        {error && (
          <div className="chat-error">
            <p>{error}</p>
            <button onClick={loadMessages} className="btn btn-primary">
              🔄 Tentar Novamente
            </button>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.message_id}
            className={`message ${message.sender_id === user.user_id ? 'own' : 'other'}`}
          >
            <div className="message-content">
              <p>{message.content}</p>
              <span className="message-time">
                {formatMessageTime(message.sent_at)}
              </span>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <div className="chat-input-container">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="chat-input"
            disabled={sending || !wsConnection}
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || !wsConnection}
            className="chat-send-btn"
          >
            {sending ? '⏳' : '📤'}
          </button>
        </div>
        {!wsConnection && (
          <div className="chat-connection-status">
            <span>🔴 Conectando...</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatWindow;
