import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileService, tagsService, swipeService } from '../services/api';
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

  // Carregar perfis sugeridos
  useEffect(() => {
    if (user?.user_id) {
      loadProfiles();
      loadUserTags();
    }
  }, [user?.user_id]);

  const loadProfiles = async () => {
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
  };

  const loadUserTags = async () => {
    try {
      const tagsData = await tagsService.getUserTags(user.user_id);
      setUserTags(tagsData);
    } catch (err) {
      console.error('Erro ao carregar tags do usuário:', err);
    }
  };

  const handleNextProfile = () => {
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Carregar mais perfis quando chegar ao final
      loadMoreProfiles();
    }
  };

  const loadMoreProfiles = async () => {
    try {
      const moreProfiles = await profileService.discoverProfiles(user.user_id, 10);
      setProfiles(prev => [...prev, ...moreProfiles]);
    } catch (err) {
      console.error('Erro ao carregar mais perfis:', err);
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

      // Avançar para o próximo perfil após um delay
      setTimeout(() => {
        handleNextProfile();
        setSwipeFeedback('');
      }, 1000);

    } catch (err) {
      console.error('Erro ao enviar swipe:', err);
      setSwipeFeedback('❌ Erro ao enviar');
      setTimeout(() => setSwipeFeedback(''), 2000);
    } finally {
      setIsSwiping(false);
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
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="profile-card-container">
        <ProfileCard 
          profile={currentProfile}
          userTags={userTags}
          onNext={handleNextProfile}
          onRefresh={handleRefresh}
          onSwipe={handleSwipe}
          isSwiping={isSwiping}
          swipeFeedback={swipeFeedback}
        />
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

// Componente do Card de Perfil
const ProfileCard = ({ profile, userTags, onNext, onRefresh, onSwipe, isSwiping, swipeFeedback }) => {
  const [profileTags, setProfileTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);

  useEffect(() => {
    if (profile?.user_id) {
      loadProfileTags();
    }
  }, [profile?.user_id]);

  const loadProfileTags = async () => {
    try {
      setLoadingTags(true);
      const tagsData = await tagsService.getUserTags(profile.user_id);
      setProfileTags(tagsData);
    } catch (err) {
      console.error('Erro ao carregar tags do perfil:', err);
    } finally {
      setLoadingTags(false);
    }
  };

  const getCommonTags = () => {
    if (!userTags.length || !profileTags.length) return [];
    
    const userTagNames = userTags.map(tag => tag.name.toLowerCase());
    return profileTags.filter(tag => 
      userTagNames.includes(tag.name.toLowerCase())
    );
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const getAgeSuffix = (age) => {
    if (age >= 18 && age <= 25) return 's';
    return '';
  };

  if (!profile) return null;

  const commonTags = getCommonTags();

  return (
    <div className="profile-card">
      <div className="profile-image">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.name} />
        ) : (
          <div className="no-avatar">
            <span>📷</span>
          </div>
        )}
        
        <div className="profile-overlay">
          <div className="profile-info">
            <h3>{profile.name}</h3>
            <p className="profile-age">{profile.age} ano{getAgeSuffix(profile.age)}</p>
            <p className="profile-distance">📍 {formatDistance(profile.distance)}</p>
          </div>
        </div>

        <div className="profile-badges">
          <div className="fame-badge">
            ⭐ {profile.fame_rating || 0}
          </div>
          {commonTags.length > 0 && (
            <div className="common-tags-badge">
              🏷️ {commonTags.length} interesse{commonTags.length > 1 ? 's' : ''} em comum
            </div>
          )}
        </div>
      </div>

      <div className="profile-details">
        {profile.bio && (
          <div className="profile-bio">
            <p>"{profile.bio}"</p>
          </div>
        )}

        {loadingTags ? (
          <div className="tags-loading">
            <small>Carregando interesses...</small>
          </div>
        ) : profileTags.length > 0 ? (
          <div className="profile-tags">
            <h4>Interesses:</h4>
            <div className="tags-list">
              {profileTags.map((tag, index) => {
                const isCommon = commonTags.some(ct => ct.tag_id === tag.tag_id);
                return (
                  <span 
                    key={tag.tag_id} 
                    className={`tag ${isCommon ? 'common-tag' : ''}`}
                  >
                    #{tag.name}
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="no-tags">
            <small>Nenhum interesse adicionado</small>
          </div>
        )}

        {commonTags.length > 0 && (
          <div className="common-interests">
            <h4>🎯 Interesses em Comum:</h4>
            <div className="common-tags-list">
              {commonTags.map(tag => (
                <span key={tag.tag_id} className="common-tag">
                  #{tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="profile-actions">
        {swipeFeedback && (
          <div className="swipe-feedback">
            {swipeFeedback}
          </div>
        )}
        
        <div className="swipe-buttons">
          <button 
            className="btn btn-dislike"
            onClick={() => onSwipe('dislike')}
            disabled={isSwiping}
          >
            👎 Passar
          </button>
          
          <button 
            className="btn btn-skip"
            onClick={onNext}
            disabled={isSwiping}
          >
            ⏭️ Pular
          </button>
          
          <button 
            className="btn btn-like"
            onClick={() => onSwipe('like')}
            disabled={isSwiping}
          >
            ❤️ Curtir
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscoverProfiles;
