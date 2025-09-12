import React from 'react';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return (
      <div className="unauthorized-container">
        <div className="unauthorized-card">
          <h2>🔒 Acesso Negado</h2>
          <p>Você precisa estar logado para acessar esta página.</p>
          <button 
            className="auth-button"
            onClick={() => window.location.href = '/'}
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
