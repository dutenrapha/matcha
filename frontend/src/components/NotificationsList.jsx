import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import './NotificationsList.css';

const NotificationsList = () => {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    loadNotifications
  } = useNotifications(user?.user_id);

  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleDeleteNotification = (notificationId) => {
    deleteNotification(notificationId);
  };

  const handleDeleteAll = () => {
    if (!window.confirm('Tem certeza que deseja deletar todas as notificações?')) {
      return;
    }
    deleteAllNotifications();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'match':
        return '💕';
      case 'like':
        return '❤️';
      case 'message':
        return '💬';
      case 'view':
        return '👁️';
      case 'system':
        return '⭐';
      case 'unlike':
        return '💔';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'match':
        return '#e91e63';
      case 'like':
        return '#f44336';
      case 'message':
        return '#2196f3';
      case 'view':
        return '#4caf50';
      case 'system':
        return '#ff9800';
      case 'unlike':
        return '#9e9e9e';
      default:
        return '#9e9e9e';
    }
  };

  const formatNotificationTime = (createdAt) => {
    const now = new Date();
    const notificationTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return notificationTime.toLocaleDateString('pt-BR');
  };


  if (loading) {
    return (
      <div className="notifications-loading">
        <div className="loading-spinner"></div>
        <p>Carregando notificações...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notifications-error">
        <div className="error-icon">❌</div>
        <h3>Erro ao carregar notificações</h3>
        <p>{error}</p>
        <button onClick={loadNotifications} className="retry-btn">
          🔄 Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      {/* Header */}
      <div className="notifications-header">
        <h2>🔔 Notificações</h2>
        <div className="notifications-actions">
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="mark-all-read-btn"
              title="Marcar todas como lidas"
            >
              ✅ Marcar todas como lidas
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              onClick={handleDeleteAll}
              className="delete-all-btn"
              title="Deletar todas as notificações"
            >
              🗑️ Limpar todas
            </button>
          )}
        </div>
      </div>

      {/* Contador de não lidas */}
      {unreadCount > 0 && (
        <div className="unread-counter">
          <span className="unread-badge">{unreadCount}</span>
          <span>notificação{unreadCount > 1 ? 'ões' : ''} não lida{unreadCount > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Lista de notificações */}
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="notifications-empty">
            <div className="empty-icon">🔔</div>
            <h3>Nenhuma notificação</h3>
            <p>Você não tem notificações no momento.</p>
            <p>Quando alguém curtir seu perfil, fizer match ou enviar mensagem, você será notificado aqui!</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.notification_id}
              className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
            >
              <div className="notification-icon" style={{ backgroundColor: getNotificationColor(notification.type) }}>
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="notification-content">
                <div className="notification-text">
                  {notification.content}
                </div>
                <div className="notification-meta">
                  <span className="notification-time">
                    {formatNotificationTime(notification.created_at)}
                  </span>
                  <span className="notification-type">
                    {notification.type}
                  </span>
                </div>
              </div>

              <div className="notification-actions">
                {!notification.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(notification.notification_id)}
                    className="mark-read-btn"
                    title="Marcar como lida"
                  >
                    ✓
                  </button>
                )}
                <button
                  onClick={() => handleDeleteNotification(notification.notification_id)}
                  className="delete-btn"
                  title="Deletar notificação"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer com estatísticas */}
      {notifications.length > 0 && (
        <div className="notifications-footer">
          <p>
            {notifications.length} notificação{notifications.length > 1 ? 'ões' : ''} total
            {unreadCount > 0 && ` • ${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`}
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationsList;
