import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { profileService, swipeService, matchesService, viewService } from '../services/api';
import ProfileEdit from './ProfileEdit';
import DiscoverProfiles from './DiscoverProfiles';
import AdvancedSearch from './AdvancedSearch';
import MatchesList from './MatchesList';
import Chat from './Chat';
import NotificationsList from './NotificationsList';
import NotificationIndicator from './NotificationIndicator';
import BlockedUsers from './BlockedUsers';
import ReportsList from './ReportsList';
import ViewsList from './ViewsList';
import OnlineStatusManager from './OnlineStatusManager';
import Settings from './Settings';
import InteractiveMap from './InteractiveMap';
import './Dashboard.css';

// Componentes das seções (placeholder por enquanto)
const HomeSection = ({ user }) => {
  const [stats, setStats] = useState({
    fameRating: 0,
    views: 0,
    likesReceived: 0,
    matches: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.user_id) return;

      try {
        setLoading(true);
        
        // Buscar todas as estatísticas em paralelo
        const [profileData, viewsData, likesData, matchesData] = await Promise.all([
          profileService.getProfile(user.user_id),
          viewService.getViewCount(user.user_id),
          swipeService.getLikesReceivedCount(user.user_id),
          matchesService.getMatchCount(user.user_id)
        ]);

        setStats({
          fameRating: profileData.fame_rating || 0,
          views: viewsData.views_received || 0,
          likesReceived: likesData.total_likes || 0,
          matches: matchesData.match_count || 0
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        // Manter valores padrão em caso de erro
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user?.user_id]);

  // Função para determinar o nível de fama
  const getFameLevel = (rating) => {
    if (rating >= 100) return { level: 'Lenda', emoji: '👑', color: '#FFD700' };
    if (rating >= 50) return { level: 'Popular', emoji: '⭐', color: '#FF6B6B' };
    if (rating >= 20) return { level: 'Conhecido', emoji: '🌟', color: '#4ECDC4' };
    if (rating >= 10) return { level: 'Emergente', emoji: '✨', color: '#45B7D1' };
    if (rating >= 5) return { level: 'Iniciante', emoji: '🌱', color: '#96CEB4' };
    return { level: 'Novato', emoji: '🌿', color: '#DDA0DD' };
  };

  const fameInfo = getFameLevel(stats.fameRating);

  return (
    <div className="section-content">
      <h2>🏠 Dashboard</h2>
      <p>Bem-vindo ao Matcha! Aqui você pode ver um resumo da sua atividade e seu índice de fama.</p>
      
      {/* Status Online Manager */}
      {user && <OnlineStatusManager userId={user.user_id} />}
      
      {/* Fame Rating Card - Destaque especial */}
      <div className="fame-card">
        <div className="fame-header">
          <div className="fame-icon" style={{ color: fameInfo.color }}>
            {fameInfo.emoji}
          </div>
          <div className="fame-info">
            <h3>Índice de Fama</h3>
            <p className="fame-level" style={{ color: fameInfo.color }}>
              {fameInfo.level}
            </p>
          </div>
        </div>
        <div className="fame-rating">
          <span className="fame-value">
            {loading ? '...' : stats.fameRating}
          </span>
          <span className="fame-label">pontos</span>
        </div>
        <div className="fame-description">
          <p>Seu índice de fama é calculado baseado em:</p>
          <ul>
            <li>✨ <strong>Likes recebidos:</strong> +1 ponto cada</li>
            <li>💕 <strong>Matches:</strong> +3 pontos cada</li>
            <li>👁️ <strong>Visualizações:</strong> +0.5 pontos cada</li>
            <li>📝 <strong>Perfil completo:</strong> +5 pontos</li>
            <li>⚠️ <strong>Reports:</strong> -5 pontos cada</li>
            <li>🚫 <strong>Bloqueios:</strong> -2 pontos cada</li>
          </ul>
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Visualizações</h3>
          <p className="stat-value">
            {loading ? '...' : stats.views}
          </p>
          <p className="stat-subtitle">Perfis que te viram</p>
        </div>
        <div className="stat-card">
          <h3>Likes Recebidos</h3>
          <p className="stat-value">
            {loading ? '...' : stats.likesReceived}
          </p>
          <p className="stat-subtitle">Pessoas que te curtiram</p>
        </div>
        <div className="stat-card">
          <h3>Matches</h3>
          <p className="stat-value">
            {loading ? '...' : stats.matches}
          </p>
          <p className="stat-subtitle">Conexões mútuas</p>
        </div>
      </div>
    </div>
  );
};

const ProfileSection = () => (
  <div className="section-content">
    <ProfileEdit />
  </div>
);

const DiscoverSection = () => (
  <div className="section-content">
    <DiscoverProfiles />
  </div>
);

const SearchSection = () => (
  <div className="section-content">
    <AdvancedSearch />
  </div>
);

const MatchesSection = ({ onNavigateToChat }) => (
  <div className="section-content">
    <MatchesList onNavigateToChat={onNavigateToChat} />
  </div>
);

const ChatSection = () => (
  <div className="section-content">
    <Chat />
  </div>
);

const NotificationsSection = () => (
  <div className="section-content">
    <NotificationsList />
  </div>
);

const BlockedUsersSection = () => (
  <div className="section-content">
    <BlockedUsers />
  </div>
);

const ReportsSection = () => (
  <div className="section-content">
    <ReportsList />
  </div>
);

const ViewsSection = ({ user }) => (
  <div className="section-content">
    <ViewsList user={user} />
  </div>
);

const SettingsSection = () => (
  <div className="section-content">
    <Settings />
  </div>
);

const MapSection = () => (
  <div className="section-content map-section">
    <InteractiveMap />
  </div>
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleNavigateToChat = () => {
    setActiveSection('chat');
  };

  const navigationItems = [
    { id: 'home', label: 'Dashboard', icon: '🏠', component: HomeSection },
    { id: 'profile', label: 'Meu Perfil', icon: '👤', component: ProfileSection },
    { id: 'discover', label: 'Descobrir', icon: '🔍', component: DiscoverSection },
    { id: 'search', label: 'Busca', icon: '🔎', component: SearchSection },
    { id: 'map', label: 'Mapa', icon: '🗺️', component: MapSection },
    { id: 'matches', label: 'Matches', icon: '💕', component: MatchesSection },
    { id: 'chat', label: 'Chat', icon: '💬', component: ChatSection },
    { id: 'notifications', label: 'Notificações', icon: '🔔', component: NotificationsSection },
    { id: 'views', label: 'Visualizações', icon: '👁️', component: ViewsSection },
    { id: 'blocked', label: 'Bloqueados', icon: '🚫', component: BlockedUsersSection },
    { id: 'reports', label: 'Reports', icon: '📝', component: ReportsSection },
    { id: 'settings', label: 'Configurações', icon: '⚙️', component: SettingsSection },
  ];

  const ActiveComponent = navigationItems.find(item => item.id === activeSection)?.component || HomeSection;

  return (
    <NotificationProvider userId={user?.user_id}>
      <div className="dashboard-layout">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <button 
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <h1 className="app-title">Matcha</h1>
          </div>
          
          <div className="header-right">
            <NotificationIndicator 
              onClick={() => setActiveSection('notifications')}
            />
            <div className="user-menu">
              <div className="user-avatar-small">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="user-name">{user?.name || 'Usuário'}</span>
              <button className="logout-btn" onClick={handleLogout}>
                🚪
              </button>
            </div>
          </div>
        </header>

        <div className="dashboard-body">
          {/* Sidebar */}
          <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
            <nav className="sidebar-nav">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false); // Fechar sidebar no mobile após seleção
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Overlay para mobile */}
          {sidebarOpen && (
            <div 
              className="sidebar-overlay"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <main className="dashboard-main">
            {activeSection === 'home' ? (
              <ActiveComponent user={user} onNavigateToChat={handleNavigateToChat} />
            ) : activeSection === 'views' ? (
              <ActiveComponent user={user} onNavigateToChat={handleNavigateToChat} />
            ) : (
              <ActiveComponent onNavigateToChat={handleNavigateToChat} />
            )}
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
};

export default Dashboard;
