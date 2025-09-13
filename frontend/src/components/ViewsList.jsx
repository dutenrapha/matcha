import React, { useState, useEffect } from 'react';
import { viewService } from '../services/api';
import './ViewsList.css';

const ViewsList = ({ user }) => {
  const [viewsReceived, setViewsReceived] = useState([]);
  const [viewsGiven, setViewsGiven] = useState([]);
  const [viewCounts, setViewCounts] = useState({ views_received: 0, views_given: 0 });
  const [activeTab, setActiveTab] = useState('received');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.user_id) {
      loadViewsData();
    }
  }, [user?.user_id]);

  const loadViewsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [received, given, counts] = await Promise.all([
        viewService.getViewsReceived(user.user_id, 50, 0),
        viewService.getViewsGiven(user.user_id, 50, 0),
        viewService.getViewCount(user.user_id)
      ]);

      setViewsReceived(received);
      setViewsGiven(given);
      setViewCounts(counts);
    } catch (err) {
      console.error('Erro ao carregar visualizações:', err);
      setError('Erro ao carregar visualizações');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteView = async (viewId) => {
    if (!window.confirm('Tem certeza que deseja remover esta visualização?')) {
      return;
    }

    try {
      await viewService.deleteView(viewId);
      // Recarregar dados
      loadViewsData();
    } catch (err) {
      console.error('Erro ao deletar visualização:', err);
      alert('Erro ao deletar visualização');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d atrás`;
    }
  };

  const renderViewItem = (view, isReceived = true) => (
    <div key={view.view_id} className="view-item">
      <div className="view-avatar">
        <img 
          src={view.viewer_avatar || view.viewed_avatar || '/default-avatar.png'} 
          alt={isReceived ? view.viewer_name : view.viewed_name}
          onError={(e) => {
            e.target.src = '/default-avatar.png';
          }}
        />
      </div>
      <div className="view-info">
        <div className="view-name">
          {isReceived ? view.viewer_name : view.viewed_name}
        </div>
        <div className="view-time">
          {formatDate(view.created_at)}
        </div>
      </div>
      <div className="view-actions">
        <button 
          className="delete-btn"
          onClick={() => handleDeleteView(view.view_id)}
          title="Remover visualização"
        >
          🗑️
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="views-list">
        <div className="loading">Carregando visualizações...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="views-list">
        <div className="error">{error}</div>
        <button onClick={loadViewsData} className="retry-btn">
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="views-list">
      <div className="views-header">
        <h2>👁️ Visualizações do Perfil</h2>
        <div className="view-stats">
          <div className="stat-item">
            <span className="stat-number">{viewCounts.views_received}</span>
            <span className="stat-label">Recebidas</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{viewCounts.views_given}</span>
            <span className="stat-label">Dadas</span>
          </div>
        </div>
      </div>

      <div className="views-tabs">
        <button 
          className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          Quem me viu ({viewsReceived.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'given' ? 'active' : ''}`}
          onClick={() => setActiveTab('given')}
        >
          Quem eu vi ({viewsGiven.length})
        </button>
      </div>

      <div className="views-content">
        {activeTab === 'received' ? (
          <div className="views-section">
            {viewsReceived.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👁️</div>
                <div className="empty-text">
                  Ninguém visualizou seu perfil ainda
                </div>
                <div className="empty-subtext">
                  Continue interagindo para aparecer mais no Discover!
                </div>
              </div>
            ) : (
              <div className="views-grid">
                {viewsReceived.map(view => renderViewItem(view, true))}
              </div>
            )}
          </div>
        ) : (
          <div className="views-section">
            {viewsGiven.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👀</div>
                <div className="empty-text">
                  Você ainda não visualizou nenhum perfil
                </div>
                <div className="empty-subtext">
                  Explore o Discover para ver perfis interessantes!
                </div>
              </div>
            ) : (
              <div className="views-grid">
                {viewsGiven.map(view => renderViewItem(view, false))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="views-footer">
        <button onClick={loadViewsData} className="refresh-btn">
          🔄 Atualizar
        </button>
      </div>
    </div>
  );
};

export default ViewsList;
