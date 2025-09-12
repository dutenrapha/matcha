import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { matchesService } from '../services/api';
import ProfileDetail from './ProfileDetail';
import './MatchesList.css';

const MatchesList = ({ onNavigateToChat }) => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isProfileDetailOpen, setIsProfileDetailOpen] = useState(false);

  const loadMatches = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      setLoading(true);
      setError('');
      
      const matchesData = await matchesService.getMatchesWithProfiles(user.user_id);
      setMatches(matchesData);
      
    } catch (err) {
      console.error('Erro ao carregar matches:', err);
      setError('Erro ao carregar matches');
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const handleProfileClick = (match) => {
    setSelectedProfile(match);
    setIsProfileDetailOpen(true);
  };

  const handleCloseProfileDetail = () => {
    setIsProfileDetailOpen(false);
    setSelectedProfile(null);
    // Recarregar matches após unmatch
    loadMatches();
  };

  const formatMatchDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hoje';
    if (diffDays === 2) return 'Ontem';
    if (diffDays <= 7) return `${diffDays} dias atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="matches-list">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="matches-list">
        <div className="error-container">
          <p>❌ {error}</p>
          <button onClick={loadMatches} className="retry-btn">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="matches-list">
      <div className="matches-header">
        <h2>💕 Meus Matches</h2>
        <p>{matches.length} {matches.length === 1 ? 'match encontrado' : 'matches encontrados'}</p>
      </div>

      {matches.length === 0 ? (
        <div className="no-matches">
          <div className="no-matches-icon">💔</div>
          <h3>Nenhum match ainda</h3>
          <p>Continue explorando perfis para encontrar sua pessoa especial!</p>
          <div className="no-matches-tips">
            <h4>💡 Dicas para conseguir mais matches:</h4>
            <ul>
              <li>Complete seu perfil com informações interessantes</li>
              <li>Adicione fotos de boa qualidade</li>
              <li>Seja ativo e dê likes em perfis que te interessam</li>
              <li>Use a busca avançada para encontrar pessoas com interesses similares</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="matches-grid">
          {matches.map((match) => (
            <div 
              key={match.match_id} 
              className="match-card"
              onClick={() => handleProfileClick(match)}
            >
              <div className="match-avatar">
                <img 
                  src={match.avatar_url || 'https://via.placeholder.com/150x150/6b46c1/ffffff?text=Avatar'} 
                  alt={match.name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150x150/6b46c1/ffffff?text=Avatar';
                  }}
                />
                <div className="match-badge">💕</div>
              </div>
              
              <div className="match-info">
                <h3>{match.name}</h3>
                <p className="match-age">{match.age} anos</p>
                {match.bio && (
                  <p className="match-bio">
                    {match.bio.length > 60 ? `${match.bio.substring(0, 60)}...` : match.bio}
                  </p>
                )}
                <p className="match-date">
                  Match há {formatMatchDate(match.created_at)}
                </p>
              </div>
              
              <div className="match-actions">
                <button className="view-profile-btn">
                  👁️ Ver Perfil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Visualização Detalhada */}
      <ProfileDetail
        profile={selectedProfile}
        isOpen={isProfileDetailOpen}
        onClose={handleCloseProfileDetail}
        isMatch={true}
        onNavigateToChat={onNavigateToChat}
      />
    </div>
  );
};

export default MatchesList;
