import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { mapService } from '../services/api';
import useMapWebSocket from '../hooks/useMapWebSocket';
import ProfileDetail from './ProfileDetail';
import './InteractiveMap.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icons for different user types
const createCustomIcon = (isOnline, gender) => {
  const color = isOnline ? '#4CAF50' : '#9E9E9E';
  const genderIcon = gender === 'female' ? '👩' : gender === 'male' ? '👨' : '👤';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="marker-container" style="background-color: ${color}">
        <div class="marker-avatar">${genderIcon}</div>
        <div class="marker-status ${isOnline ? 'online' : 'offline'}"></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

// Component to center map on user location
const MapCenter = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

const InteractiveMap = () => {
  const { user } = useAuth();
  const [mapUsers, setMapUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [filters, setFilters] = useState({
    gender: null,
    max_distance_km: null,
    online_only: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isProfileDetailOpen, setIsProfileDetailOpen] = useState(false);
  const mapRef = useRef(null);

  // WebSocket handlers
  const handleLocationUpdate = (data) => {
    setMapUsers(prevUsers => 
      prevUsers.map(user => 
        user.user_id === data.user_id 
          ? { ...user, latitude: data.latitude, longitude: data.longitude, is_online: data.is_online }
          : user
      )
    );
  };

  const handleStatusUpdate = (data) => {
    setMapUsers(prevUsers => 
      prevUsers.map(user => 
        user.user_id === data.user_id 
          ? { ...user, is_online: data.is_online }
          : user
      )
    );
  };

  // WebSocket connection
  const { isConnected, error: wsError, sendLocationUpdate } = useMapWebSocket(
    handleLocationUpdate,
    handleStatusUpdate
  );

  // Load map users
  const loadMapUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await mapService.getMapUsers(filters);
      setMapUsers(response.users);
      setCurrentUserLocation(response.current_user_location);
    } catch (err) {
      console.error('Error loading map users:', err);
      setError('Erro ao carregar usuários do mapa');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (user) {
      loadMapUsers();
    }
  }, [user, filters]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      gender: null,
      max_distance_km: null,
      online_only: false
    });
  }, []);

  const centerOnUser = () => {
    if (currentUserLocation && mapRef.current) {
      mapRef.current.setView(
        [currentUserLocation.latitude, currentUserLocation.longitude],
        13
      );
    }
  };

  const updateMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada pelo navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Update local state
        setCurrentUserLocation(prev => ({
          ...prev,
          latitude,
          longitude
        }));
        
        // Send to server via WebSocket
        sendLocationUpdate(latitude, longitude);
        
        // Center map on new location
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 13);
        }
      },
      (error) => {
        setError('Erro ao obter localização: ' + error.message);
      }
    );
  };

  if (loading) {
    return (
      <div className="map-container">
        <div className="map-loading">
          <div className="loading-spinner"></div>
          <p>Carregando mapa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="map-container">
        <div className="map-error">
          <p>{error}</p>
          <button onClick={loadMapUsers} className="retry-button">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const defaultCenter = currentUserLocation 
    ? [currentUserLocation.latitude, currentUserLocation.longitude]
    : [-23.5475, -46.6361]; // São Paulo fallback

  return (
    <div className="map-container">
      {/* Map Controls */}
      <div className="map-controls">
        <button 
          className="control-button filter-button"
          onClick={() => setShowFilters(!showFilters)}
        >
          🔍 Filtros
        </button>
        <button 
          className="control-button center-button"
          onClick={centerOnUser}
        >
          📍 Minha Localização
        </button>
        <button 
          className="control-button update-location-button"
          onClick={updateMyLocation}
        >
          📍 Atualizar Localização
        </button>
        <button 
          className="control-button refresh-button"
          onClick={loadMapUsers}
        >
          🔄 Atualizar
        </button>
      </div>

      {/* Connection Status */}
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </div>
        {wsError && (
          <div className="ws-error">
            {wsError}
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <h3>Filtros</h3>
          

          <div className="filter-group">
            <label>Gênero:</label>
            <select
              value={filters.gender || ''}
              onChange={(e) => handleFilterChange('gender', e.target.value || null)}
            >
              <option value="">Todos</option>
              <option value="male">Homens</option>
              <option value="female">Mulheres</option>
              <option value="both">Ambos</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Distância Máxima (km):</label>
            <input
              type="number"
              min="1"
              max="1000"
              value={filters.max_distance_km || ''}
              onChange={(e) => handleFilterChange('max_distance_km', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>

          <div className="filter-group">
            <label>
              <input
                type="checkbox"
                checked={filters.online_only}
                onChange={(e) => handleFilterChange('online_only', e.target.checked)}
              />
              Apenas usuários online
            </label>
          </div>

          <div className="filter-actions">
            <button onClick={resetFilters} className="reset-filters">
              Limpar Filtros
            </button>
            <button onClick={() => setShowFilters(false)} className="close-filters">
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="map-wrapper">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          className="leaflet-container"
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Current user marker */}
          {currentUserLocation && (
            <Marker
              position={[currentUserLocation.latitude, currentUserLocation.longitude]}
              icon={L.divIcon({
                className: 'current-user-marker',
                html: `
                  <div class="current-user-container">
                    <div class="current-user-avatar">👤</div>
                    <div class="current-user-pulse"></div>
                  </div>
                `,
                iconSize: [35, 35],
                iconAnchor: [17, 17]
              })}
            >
              <Popup>
                <div className="user-popup">
                  <h4>Você está aqui</h4>
                  <p>{currentUserLocation.location || 'Localização atual'}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Other users markers */}
          {mapUsers.map((mapUser) => (
            <Marker
              key={mapUser.user_id}
              position={[mapUser.latitude, mapUser.longitude]}
              icon={createCustomIcon(mapUser.is_online, mapUser.gender)}
            >
              <Popup>
                <div className="user-popup">
                  <div className="popup-header">
                    <img 
                      src={mapUser.avatar_url} 
                      alt={mapUser.username}
                      className="popup-avatar"
                    />
                    <div className="popup-info">
                      <h4>{mapUser.username}</h4>
                      <p>{mapUser.age} anos • {mapUser.gender === 'male' ? 'Homem' : 'Mulher'}</p>
                      {mapUser.distance_km && (
                        <p className="distance">📍 {mapUser.distance_km} km</p>
                      )}
                    </div>
                  </div>
                  {mapUser.location && (
                    <p className="popup-location">📍 {mapUser.location}</p>
                  )}
                  <div className="popup-status">
                    <span className={`status-indicator ${mapUser.is_online ? 'online' : 'offline'}`}>
                      {mapUser.is_online ? '🟢 Online' : '⚫ Offline'}
                    </span>
                  </div>
                  <div className="popup-actions">
                    <button 
                      className="action-button view-profile"
                      onClick={() => {
                        setSelectedProfile(mapUser);
                        setIsProfileDetailOpen(true);
                      }}
                    >
                      Ver Perfil
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Map Info */}
      <div className="map-info">
        <p>
          {mapUsers.length} usuário{mapUsers.length !== 1 ? 's' : ''} encontrado{mapUsers.length !== 1 ? 's' : ''}
          {filters.online_only && ' (apenas online)'}
        </p>
      </div>

      {/* Profile Detail Modal */}
      {isProfileDetailOpen && selectedProfile && (
        <ProfileDetail
          profile={selectedProfile}
          isOpen={isProfileDetailOpen}
          onClose={() => {
            setIsProfileDetailOpen(false);
            setSelectedProfile(null);
          }}
          currentUserId={user?.user_id}
        />
      )}
    </div>
  );
};

export default InteractiveMap;
