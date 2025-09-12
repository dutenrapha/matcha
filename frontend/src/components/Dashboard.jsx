import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <h1>🎉 Bem-vindo ao Matcha!</h1>
          <p className="dashboard-subtitle">
            Você está logado com sucesso
          </p>
        </div>

        <div className="user-info">
          <div className="user-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <h2>Olá, {user?.name || 'Usuário'}!</h2>
            <p className="user-email">
              📧 {user?.email || 'email@exemplo.com'}
            </p>
            {user?.fame_rating !== undefined && (
              <p className="user-fame">
                ⭐ Fame Rating: {user.fame_rating}
              </p>
            )}
            <p className="user-status">
              {user?.is_verified ? '✅ Email verificado' : '⏳ Email pendente de verificação'}
            </p>
          </div>
        </div>

        <div className="dashboard-actions">
          <button 
            className="logout-button"
            onClick={handleLogout}
          >
            🚪 Sair
          </button>
        </div>

        <div className="dashboard-footer">
          <p>
            Esta é uma página protegida que só pode ser acessada por usuários logados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
