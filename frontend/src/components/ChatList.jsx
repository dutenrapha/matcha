import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/api';
import './ChatList.css';

const ChatList = ({ onChatSelect, selectedChatId }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const loadChats = useCallback(async () => {
    if (!user?.user_id) return;
    
    try {
      setLoading(true);
      setError('');
      
      const [chatsData, unreadData] = await Promise.all([
        chatService.getChatsWithProfiles(user.user_id),
        chatService.getUnreadCount(user.user_id)
      ]);
      
      setChats(chatsData);
      setUnreadCount(unreadData.unread_count || 0);
      
    } catch (err) {
      console.error('Erro ao carregar chats:', err);
      setError('Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // 7 dias
      return date.toLocaleDateString('pt-BR', { 
        weekday: 'short' 
      });
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const handleChatClick = (chat) => {
    if (onChatSelect) {
      onChatSelect(chat);
    }
  };

  if (loading) {
    return (
      <div className="chat-list">
        <div className="chat-list-header">
          <h2>💬 Conversas</h2>
        </div>
        <div className="chat-list-loading">
          <div className="loading-spinner"></div>
          <p>Carregando conversas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-list">
        <div className="chat-list-header">
          <h2>💬 Conversas</h2>
        </div>
        <div className="chat-list-error">
          <div className="error-icon">😔</div>
          <p>{error}</p>
          <button onClick={loadChats} className="btn btn-primary">
            🔄 Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="chat-list">
        <div className="chat-list-header">
          <h2>💬 Conversas</h2>
          {unreadCount > 0 && (
            <div className="unread-badge">
              {unreadCount}
            </div>
          )}
        </div>
        <div className="chat-list-empty">
          <div className="empty-icon">💬</div>
          <h3>Nenhuma conversa ainda</h3>
          <p>Quando você fizer match com alguém, as conversas aparecerão aqui!</p>
          <div className="empty-suggestions">
            <h4>💡 Dicas:</h4>
            <ul>
              <li>Vá para "Descobrir" e faça swipe em perfis</li>
              <li>Use a "Busca Avançada" para encontrar pessoas específicas</li>
              <li>Quando houver match mútuo, vocês poderão conversar!</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>💬 Conversas</h2>
        {unreadCount > 0 && (
          <div className="unread-badge">
            {unreadCount}
          </div>
        )}
      </div>
      
      <div className="chat-list-content">
        {chats.map((chat) => (
          <div
            key={chat.chat_id}
            className={`chat-item ${selectedChatId === chat.chat_id ? 'selected' : ''}`}
            onClick={() => handleChatClick(chat)}
          >
            <div className="chat-avatar">
              <img 
                src={chat.avatar_url || '/default-avatar.png'} 
                alt={chat.name}
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
              {chat.unread_count > 0 && (
                <div className="chat-unread-indicator">
                  {chat.unread_count > 9 ? '9+' : chat.unread_count}
                </div>
              )}
            </div>
            
            <div className="chat-info">
              <div className="chat-header">
                <h3 className="chat-name">{chat.name}</h3>
                <span className="chat-time">
                  {formatLastMessageTime(chat.last_message_time)}
                </span>
              </div>
              
              <div className="chat-preview">
                <p className={`chat-last-message ${chat.unread_count > 0 ? 'unread' : ''}`}>
                  {chat.last_message || 'Nenhuma mensagem ainda'}
                </p>
                {chat.unread_count > 0 && (
                  <div className="chat-unread-dot"></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatList;
