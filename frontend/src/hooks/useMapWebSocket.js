import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const useMapWebSocket = (onLocationUpdate, onStatusUpdate) => {
  const { user } = useAuth();
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (!user?.user_id) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:8000'}/ws/map/${user.user_id}?token=${token}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Map WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connected':
              console.log('Map WebSocket: Connected to real-time map updates');
              break;
              
            case 'location_update':
              if (onLocationUpdate) {
                onLocationUpdate(data);
              }
              break;
              
            case 'status_update':
              if (onStatusUpdate) {
                onStatusUpdate(data);
              }
              break;
              
            case 'pong':
              // Heartbeat response
              break;
              
            default:
              console.log('Map WebSocket: Unknown message type', data.type);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('Map WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError('Falha ao conectar ao mapa em tempo real após várias tentativas');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Map WebSocket error:', error);
        setError('Erro na conexão com o mapa em tempo real');
      };

    } catch (err) {
      console.error('Error creating Map WebSocket:', err);
      setError('Erro ao conectar ao mapa em tempo real');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    setIsConnected(false);
  };

  const sendLocationUpdate = (latitude, longitude) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'location_update',
        latitude,
        longitude
      }));
    }
  };

  const ping = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'ping'
      }));
    }
  };

  // Connect on mount and when user changes
  useEffect(() => {
    if (user?.user_id) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user?.user_id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Send ping every 30 seconds to keep connection alive
  useEffect(() => {
    if (isConnected) {
      const pingInterval = setInterval(ping, 30000);
      return () => clearInterval(pingInterval);
    }
  }, [isConnected]);

  return {
    isConnected,
    error,
    sendLocationUpdate,
    reconnect: connect
  };
};

export default useMapWebSocket;
