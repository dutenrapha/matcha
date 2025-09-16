import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileService, tagsService, swipeService } from '../services/api';
import SwipeCard from './SwipeCard';
import ProfileDetail from './ProfileDetail';
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
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isProfileDetailOpen, setIsProfileDetailOpen] = useState(false);
  const [profileStatus, setProfileStatus] = useState(null);

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const profilesData = await profileService.discoverProfiles(user.user_id, 20);
      setProfiles(profilesData);
      setCurrentIndex(0);
      
    } catch (err) {
      console.error('Erro ao carregar perfis:', err);
      if (err.response?.status === 400) {
        setError(err.response.data.detail || 'Erro ao carregar perfis sugeridos');
      } else {
        setError('Erro ao carregar perfis sugeridos');
      }
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

  const checkProfileStatus = useCallback(async () => {
    try {
      setLoading(true);
      const status = await profileService.getProfileStatus(user.user_id);
      setProfileStatus(status);
      
      // Só carregar perfis se o perfil estiver completo
      if (status.is_complete) {
        // Chamar loadProfiles diretamente para evitar dependência circular
        try {
          setError('');
          
          const profilesData = await profileService.discoverProfiles(user.user_id, 20);
          setProfiles(profilesData);
          setCurrentIndex(0);
        } catch (err) {
          console.error('Erro ao carregar perfis:', err);
          if (err.response?.status === 400) {
            setError(err.response.data.detail || 'Erro ao carregar perfis sugeridos');
          } else {
            setError('Erro ao carregar perfis sugeridos');
          }
        }
      }
    } catch (err) {
      console.error('Erro ao verificar status do perfil:', err);
      // Se houver erro, assumir que o perfil não está completo
      setProfileStatus({
        has_profile: false,
        is_complete: false,
        missing_fields: ['profile'],
        message: 'Erro ao verificar perfil. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user?.user_id) {
      loadUserTags();
      checkProfileStatus();
    }
  }, [user?.user_id, loadUserTags, checkProfileStatus]);

  const handleNextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Se não há mais perfis, recarregar a lista
      loadProfiles();
    }
  };


  const handleRefresh = () => {
    if (profileStatus?.is_complete) {
      loadProfiles();
    } else {
      checkProfileStatus();
    }
  };

  const handleViewProfile = (profile) => {
    setSelectedProfile(profile);
    setIsProfileDetailOpen(true);
  };

  const handleCloseProfileDetail = () => {
    setIsProfileDetailOpen(false);
    setSelectedProfile(null);
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

  // Se o perfil não está completo, mostrar mensagem específica
  if (profileStatus && !profileStatus.is_complete) {
    return (
      <div className="discover-profiles">
        <div className="discover-header">
          <h2>🔍 Descobrir</h2>
          <p>Encontre pessoas interessantes baseado nas suas preferências</p>
          
          <div className="profile-status-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <h4>Perfil Incompleto</h4>
              <p>{profileStatus.message}</p>
              <p>Complete seu perfil para descobrir pessoas.</p>
            </div>
          </div>
        </div>
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
                     onViewProfile={handleViewProfile}
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
                   onViewProfile={handleViewProfile}
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

      {/* Modal de Visualização Detalhada */}
      <ProfileDetail
        profile={selectedProfile}
        isOpen={isProfileDetailOpen}
        onClose={handleCloseProfileDetail}
        isMatch={false}
        currentUserId={user?.user_id}
      />
    </div>
  );
};


export default DiscoverProfiles;
