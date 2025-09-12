import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import './NotificationIndicator.css';

const NotificationIndicator = ({ userId, onClick }) => {
  const { unreadCount } = useNotifications(userId);

  return (
    <div 
      className="notification-indicator"
      onClick={onClick}
      title={unreadCount > 0 ? `${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}` : 'Nenhuma notificação nova'}
    >
      <span className="notification-icon">🔔</span>
      {unreadCount > 0 && (
        <span className="notification-badge">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );
};

export default NotificationIndicator;
