import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileService, tagsService, swipeService } from '../services/api';
import SwipeCard from './SwipeCard';
import './DiscoverProfiles.css';

const DiscoverProfiles = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userTags, setUserTags] = useState([]);
  const [swipeFeedback, setSwipeFeedback] = useState('');
  const [isSwiping, setIsSwiping] = useState(false);

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const profilesData = await profileService.discoverProfiles(user.user_id, 20);
      setProfiles(profilesData);
      setCurrentIndex(0);
      
    } catch (err) {
      console.error('Erro ao carregar perfis:', err);
      setError('Erro ao carregar perfis sugeridos');
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  const loadUserTags = useCallback(async () => {
    try {
      const tagsData = await tagsService.getUserTags(user.user_id);
      setUserTags(tagsData);
    } catch (err) {
      console.error('Erro ao carregar tags do usuário:', err);
    }
  }, [user?.user_id]);

  // Carregar perfis sugeridos
  useEffect(() => {
    if (user?.user_id) {
      loadProfiles();
      loadUserTags();
    }
  }, [user?.user_id, loadProfiles, loadUserTags]);

  const handleNextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Se não há mais perfis, recarregar a lista
      loadProfiles();
    }
  };


  const handleRefresh = () => {
    loadProfiles();
  };

  const handleSwipe = async (direction) => {
    if (!user?.user_id || isSwiping) return;

    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;

    try {
      setIsSwiping(true);
      setSwipeFeedback('');

      // Enviar swipe para a API
      await swipeService.addSwipe(user.user_id, currentProfile.user_id, direction);

      // Feedback visual
      if (direction === 'like') {
        setSwipeFeedback('❤️ Like enviado!');
      } else {
        setSwipeFeedback('👎 Dislike enviado!');
      }

      // Limpar feedback após um tempo mais curto
      setTimeout(() => {
        setSwipeFeedback('');
        setIsSwiping(false);
      }, 500);

    } catch (err) {
      console.error('Erro ao enviar swipe:', err);
      setSwipeFeedback('❌ Erro ao enviar');
      setTimeout(() => {
        setSwipeFeedback('');
        setIsSwiping(false);
      }, 1000);
    }
  };

  if (loading) {
    return (
      <div className="discover-loading">
        <div className="loading-spinner"></div>
        <p>Buscando perfis interessantes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="discover-error">
        <div className="error-icon">😔</div>
        <h3>Ops! Algo deu errado</h3>
        <p>{error}</p>
        <button onClick={handleRefresh} className="btn btn-primary">
          🔄 Tentar Novamente
        </button>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="discover-empty">
        <div className="empty-icon">🔍</div>
        <h3>Nenhum perfil encontrado</h3>
        <p>Parece que não há perfis que correspondam às suas preferências no momento.</p>
        <div className="empty-suggestions">
          <h4>💡 Dicas:</h4>
          <ul>
            <li>Aumente a distância máxima nas suas preferências</li>
            <li>Expanda a faixa etária</li>
            <li>Adicione mais tags aos seus interesses</li>
          </ul>
        </div>
        <button onClick={handleRefresh} className="btn btn-primary">
          🔄 Buscar Novamente
        </button>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];
  const progress = ((currentIndex + 1) / profiles.length) * 100;

  return (
    <div className="discover-profiles">
      <div className="discover-header">
        <h2>🔍 Descobrir</h2>
        <p>Encontre pessoas interessantes baseado nas suas preferências</p>
        
        <div className="discover-stats">
          <div className="stat">
            <span className="stat-number">{profiles.length}</span>
            <span className="stat-label">Perfis encontrados</span>
          </div>
          <div className="stat">
            <span className="stat-number">{currentIndex + 1}</span>
            <span className="stat-label">Visualizando</span>
          </div>
          <div className="stat">
            <span className="stat-number">{profiles.length - currentIndex - 1}</span>
            <span className="stat-label">Restantes</span>
          </div>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="swipe-container">
               {/* Card de fundo (próximo perfil) */}
               {profiles[currentIndex + 1] && (
                 <div className="swipe-card-back">
                   <SwipeCard
                     key={`back-${profiles[currentIndex + 1].user_id}`}
                     profile={profiles[currentIndex + 1]}
                     userTags={userTags}
                     onNext={handleNextProfile}
                     onRefresh={handleRefresh}
                     currentUserId={user?.user_id}
                     onSwipe={handleSwipe}
                     swipeFeedback={swipeFeedback}
                   />
                 </div>
               )}

               {/* Card principal */}
               {currentProfile && (
                 <SwipeCard
                   key={`main-${currentProfile.user_id}`}
                   profile={currentProfile}
                   userTags={userTags}
                   onNext={handleNextProfile}
                   onRefresh={handleRefresh}
                   currentUserId={user?.user_id}
                   onSwipe={handleSwipe}
                   swipeFeedback={swipeFeedback}
                 />
               )}
      </div>

      <div className="discover-actions">
        <button 
          onClick={handleRefresh}
          className="btn btn-secondary"
        >
          🔄 Atualizar Lista
        </button>
        
        <div className="discover-info">
          <small>
            💡 Dica: Os perfis são ordenados por fama e proximidade
          </small>
        </div>
      </div>
    </div>
  );
};


export default DiscoverProfiles;
