import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '../services/api';

const NotificationContext = createContext();

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children, userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Função para conectar ao WebSocket
  const connectWebSocket = useCallback(() => {
    if (!userId) {
      console.log('🔔 NotificationContext: userId não fornecido, pulando conexão WebSocket');
      return;
    }
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔔 NotificationContext: WebSocket já conectado');
      return;
    }

    try {
      const wsUrl = `ws://localhost:8000/ws/notifications/${userId}`;
      console.log(`🔔 NotificationContext: Conectando WebSocket para usuário ${userId}: ${wsUrl}`);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔔 WebSocket de notificações conectado');
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.error) {
            console.error('Erro no WebSocket de notificações:', data.error);
            return;
          }

          // Adicionar nova notificação
          const newNotification = {
            notification_id: Date.now(), // ID temporário
            user_id: data.user_id,
            type: data.type,
            content: data.content,
            is_read: false,
            created_at: data.created_at
          };

          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Mostrar notificação do navegador se permitido
          if (Notification.permission === 'granted') {
            new Notification('Nova notificação', {
              body: data.content,
              icon: '/favicon.ico',
              tag: `notification-${data.type}`
            });
          }
        } catch (err) {
          console.error('Erro ao processar mensagem do WebSocket:', err);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔔 WebSocket de notificações desconectado');
        
        // Tentar reconectar
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 Tentando reconectar WebSocket (tentativa ${reconnectAttempts.current})`);
            connectWebSocket();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Erro no WebSocket de notificações:', error);
      };

    } catch (err) {
      console.error('Erro ao conectar WebSocket de notificações:', err);
    }
  }, [userId]);

  // Função para desconectar WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Carregar notificações iniciais
  const loadNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError('');
      
      const [notificationsData, countData] = await Promise.all([
        notificationService.getNotifications(userId, 50, 0),
        notificationService.getUnreadCount(userId)
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(countData.unread_count);
      
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
      setError('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.notification_id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    
    try {
      console.log('🔔 Marking all notifications as read for user:', userId);
      await notificationService.markAllAsRead(userId);
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
      console.log('🔔 All notifications marked as read, unreadCount set to 0');
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
    }
  }, [userId]);

  // Deletar notificação
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(prev => 
        prev.filter(notif => notif.notification_id !== notificationId)
      );
      // Verificar se era não lida para atualizar contador
      const deletedNotif = notifications.find(n => n.notification_id === notificationId);
      if (deletedNotif && !deletedNotif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Erro ao deletar notificação:', err);
    }
  }, [notifications]);

  // Deletar todas as notificações
  const deleteAllNotifications = useCallback(async () => {
    if (!userId) return;
    
    try {
      await notificationService.deleteAllNotifications(userId);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Erro ao deletar todas as notificações:', err);
    }
  }, [userId]);

  // Solicitar permissão para notificações do navegador
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Efeitos
  useEffect(() => {
    if (userId) {
      loadNotifications();
      connectWebSocket();
      requestNotificationPermission();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [userId, loadNotifications, connectWebSocket, disconnectWebSocket, requestNotificationPermission]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    loadNotifications,
    requestNotificationPermission
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
