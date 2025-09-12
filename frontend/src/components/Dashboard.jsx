import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProfileEdit from './ProfileEdit';
import DiscoverProfiles from './DiscoverProfiles';
import './Dashboard.css';

// Componentes das seções (placeholder por enquanto)
const HomeSection = () => (
  <div className="section-content">
    <h2>🏠 Dashboard</h2>
    <p>Bem-vindo ao Matcha! Aqui você pode ver um resumo da sua atividade.</p>
    <div className="stats-grid">
      <div className="stat-card">
        <h3>Fame Rating</h3>
        <p className="stat-value">0</p>
      </div>
      <div className="stat-card">
        <h3>Visualizações</h3>
        <p className="stat-value">0</p>
      </div>
      <div className="stat-card">
        <h3>Likes Recebidos</h3>
        <p className="stat-value">0</p>
      </div>
      <div className="stat-card">
        <h3>Matches</h3>
        <p className="stat-value">0</p>
      </div>
    </div>
  </div>
);

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
    <h2>🔎 Busca Avançada</h2>
    <p>Use filtros específicos para encontrar exatamente o que procura.</p>
    <div className="placeholder-content">
      <p>🚧 Funcionalidade em desenvolvimento...</p>
    </div>
  </div>
);

const ChatSection = () => (
  <div className="section-content">
    <h2>💬 Chat</h2>
    <p>Converse com seus matches em tempo real.</p>
    <div className="placeholder-content">
      <p>🚧 Funcionalidade em desenvolvimento...</p>
    </div>
  </div>
);

const NotificationsSection = () => (
  <div className="section-content">
    <h2>🔔 Notificações</h2>
    <p>Veja suas notificações e atividade recente.</p>
    <div className="placeholder-content">
      <p>🚧 Funcionalidade em desenvolvimento...</p>
    </div>
  </div>
);

const SettingsSection = () => (
  <div className="section-content">
    <h2>⚙️ Configurações</h2>
    <p>Gerencie suas configurações de privacidade e bloqueios.</p>
    <div className="placeholder-content">
      <p>🚧 Funcionalidade em desenvolvimento...</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const navigationItems = [
    { id: 'home', label: 'Dashboard', icon: '🏠', component: HomeSection },
    { id: 'profile', label: 'Meu Perfil', icon: '👤', component: ProfileSection },
    { id: 'discover', label: 'Descobrir', icon: '🔍', component: DiscoverSection },
    { id: 'search', label: 'Busca', icon: '🔎', component: SearchSection },
    { id: 'chat', label: 'Chat', icon: '💬', component: ChatSection },
    { id: 'notifications', label: 'Notificações', icon: '🔔', component: NotificationsSection },
    { id: 'settings', label: 'Configurações', icon: '⚙️', component: SettingsSection },
  ];

  const ActiveComponent = navigationItems.find(item => item.id === activeSection)?.component || HomeSection;

  return (
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
          <div className="notifications-icon">
            🔔
            <span className="notification-badge">0</span>
          </div>
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
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
