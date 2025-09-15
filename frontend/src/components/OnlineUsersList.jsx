import React, { useState, useEffect } from 'react';
import { statusService } from '../services/api';
import OnlineStatus from './OnlineStatus';
import './OnlineUsersList.css';

const OnlineUsersList = ({ limit = 20 }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const users = await statusService.getOnlineUsers();
        setOnlineUsers(users.slice(0, limit));
      } catch (err) {
        console.error('Erro ao obter usuários online:', err);
        setError('Erro ao carregar usuários online');
      } finally {
        setLoading(false);
      }
    };

    fetchOnlineUsers();
    
    // Atualizar lista a cada 30 segundos
    const interval = setInterval(fetchOnlineUsers, 30000);
    
    return () => clearInterval(interval);
  }, [limit]);

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Nunca';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  if (loading) {
    return (
      <div className="online-users-list">
        <h3>Usuários Online</h3>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Carregando usuários online...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="online-users-list">
        <h3>Usuários Online</h3>
        <div className="error-state">
          <span>❌ {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="online-users-list">
      <h3>
        Usuários Online 
        <span className="online-count">({onlineUsers.length})</span>
      </h3>
      
      {onlineUsers.length === 0 ? (
        <div className="empty-state">
          <span>Nenhum usuário online no momento</span>
        </div>
      ) : (
        <div className="users-grid">
          {onlineUsers.map((user) => (
            <div key={user.user_id} className="user-card">
              <div className="user-avatar">
                <div className="avatar-placeholder">
                  {user.user_id}
                </div>
                <OnlineStatus 
                  userId={user.user_id} 
                  showText={false} 
                  size="small" 
                />
              </div>
              <div className="user-info">
                <div className="user-name">Usuário {user.user_id}</div>
                <div className="last-seen">
                  {formatLastSeen(user.last_seen)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OnlineUsersList;
