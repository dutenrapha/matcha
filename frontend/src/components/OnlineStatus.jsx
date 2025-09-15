import React, { useState, useEffect } from 'react';
import { statusService } from '../services/api';
import './OnlineStatus.css';

const OnlineStatus = ({ userId, showText = true, size = 'small' }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const userStatus = await statusService.getUserStatus(userId);
        setStatus(userStatus);
      } catch (error) {
        console.error('Erro ao obter status do usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    
    // Atualizar status a cada 15 segundos
    const interval = setInterval(fetchStatus, 15000);
    
    return () => clearInterval(interval);
  }, [userId]);

  if (loading || !status) {
    return (
      <div className={`online-status ${size}`}>
        <div className="status-indicator loading"></div>
        {showText && <span className="status-text">Carregando...</span>}
      </div>
    );
  }

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Nunca';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    
    // Para mais de 1 dia, mostrar o dia da semana
    const daysAgo = Math.floor(diffInMinutes / 1440);
    if (daysAgo === 1) return 'Ontem';
    if (daysAgo < 7) {
      const dayNames = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
      return dayNames[lastSeenDate.getDay()];
    }
    
    return `${daysAgo}d atrás`;
  };

  return (
    <div className={`online-status ${size}`}>
      <div 
        className={`status-indicator ${status.is_online ? 'online' : 'offline'}`}
        title={status.is_online ? 'Online' : `Última vez: ${formatLastSeen(status.last_seen)}`}
      ></div>
      {showText && (
        <span className="status-text">
          {status.is_online ? 'Online' : formatLastSeen(status.last_seen)}
        </span>
      )}
    </div>
  );
};

export default OnlineStatus;
