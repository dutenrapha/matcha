import React, { useEffect, useState } from 'react';
import { statusService } from '../services/api';
import './OnlineStatusManager.css';

const OnlineStatusManager = ({ userId }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);

  useEffect(() => {
    if (!userId) return;

    // Marcar como online quando o componente monta
    const markAsOnline = async () => {
      try {
        await statusService.updateOnlineStatus({ is_online: true });
        setIsOnline(true);
        setLastSeen(new Date());
      } catch (error) {
        console.error('Erro ao marcar como online:', error);
      }
    };

    markAsOnline();

    // Atualizar status a cada 1 minuto para manter online
    const keepAliveInterval = setInterval(async () => {
      try {
        await statusService.updateOnlineStatus({ is_online: true });
        setLastSeen(new Date());
      } catch (error) {
        console.error('Erro ao manter status online:', error);
      }
    }, 60000); // 1 minuto

    // Marcar como offline quando a página for fechada
    const handleBeforeUnload = async () => {
      try {
        await statusService.updateOnlineStatus({ is_online: false });
      } catch (error) {
        console.error('Erro ao marcar como offline:', error);
      }
    };

    // Marcar como offline quando a página perder foco (opcional)
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        try {
          await statusService.updateOnlineStatus({ is_online: false });
          setIsOnline(false);
        } catch (error) {
          console.error('Erro ao marcar como offline:', error);
        }
      } else {
        try {
          await statusService.updateOnlineStatus({ is_online: true });
          setIsOnline(true);
          setLastSeen(new Date());
        } catch (error) {
          console.error('Erro ao marcar como online:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(keepAliveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Marcar como offline ao desmontar
      statusService.updateOnlineStatus(false).catch(console.error);
    };
  }, [userId]);

  const formatLastSeen = (date) => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  return (
    <div className="online-status-manager">
      <div className="status-info">
        <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></div>
        <span className="status-text">
          {isOnline ? 'Online' : 'Offline'}
        </span>
        {lastSeen && (
          <span className="last-seen">
            Última atividade: {formatLastSeen(lastSeen)}
          </span>
        )}
      </div>
    </div>
  );
};

export default OnlineStatusManager;
