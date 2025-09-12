import React, { useState, useEffect, useCallback } from 'react';
import { profileService, tagsService, matchesService } from '../services/api';
import './ProfileDetail.css';

const ProfileDetail = ({ profile, isOpen, onClose, isMatch = false, onNavigateToChat }) => {
  // const { user } = useAuth(); // Removido - não usado
  const [profileData, setProfileData] = useState(null);
  const [profileTags, setProfileTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUnmatching, setIsUnmatching] = useState(false);

  const loadProfileDetails = useCallback(async () => {
    if (!profile?.user_id) return;

    try {
      setLoading(true);
      setError('');

      // Carregar dados completos do perfil
      const [profileDetails, tags] = await Promise.all([
        profileService.getProfile(profile.user_id),
        tagsService.getUserTags(profile.user_id)
      ]);

      setProfileData(profileDetails);
      setProfileTags(tags);
    } catch (err) {
      console.error('Erro ao carregar detalhes do perfil:', err);
      setError('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id]);

  useEffect(() => {
    if (isOpen && profile) {
      loadProfileDetails();
    }
  }, [isOpen, profile, loadProfileDetails]);

  const handleUnmatch = async () => {
    if (!profile?.match_id || !window.confirm('Tem certeza que deseja desfazer o match?')) {
      return;
    }

    try {
      setIsUnmatching(true);
      await matchesService.deleteMatch(profile.match_id);
      
      // Fechar modal e notificar o componente pai
      onClose();
      
      // Mostrar feedback
      alert('Match desfeito com sucesso!');
    } catch (err) {
      console.error('Erro ao desfazer match:', err);
      alert('Erro ao desfazer match');
    } finally {
      setIsUnmatching(false);
    }
  };

  const handleStartChat = () => {
    if (onNavigateToChat) {
      onNavigateToChat();
      onClose(); // Fechar o modal do perfil
    }
  };

  if (!isOpen || !profile) return null;

  const displayProfile = profileData || profile;

  return (
    <div className="profile-detail-overlay" onClick={onClose}>
      <div className="profile-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="profile-detail-header">
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
          <h2>Perfil Detalhado</h2>
        </div>

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando perfil...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p>❌ {error}</p>
            <button onClick={loadProfileDetails} className="retry-btn">
              Tentar Novamente
            </button>
          </div>
        )}

        {!loading && !error && displayProfile && (
          <div className="profile-detail-content">
            {/* Avatar e Informações Básicas */}
            <div className="profile-basic-info">
              <div className="profile-avatar">
                <img 
                  src={displayProfile.avatar_url || 'https://via.placeholder.com/200x200/6b46c1/ffffff?text=Avatar'} 
                  alt={displayProfile.name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x200/6b46c1/ffffff?text=Avatar';
                  }}
                />
                {isMatch && (
                  <div className="match-badge">
                    💕 Match!
                  </div>
                )}
              </div>
              
              <div className="profile-info">
                <h3>{displayProfile.name}</h3>
                <div className="profile-stats">
                  <span className="age">{displayProfile.age} anos</span>
                  {displayProfile.distance && (
                    <span className="distance">
                      📍 {displayProfile.distance.toFixed(1)} km
                    </span>
                  )}
                  {displayProfile.fame_rating && (
                    <span className="fame">
                      ⭐ {displayProfile.fame_rating} fama
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {displayProfile.bio && (
              <div className="profile-section">
                <h4>📝 Sobre</h4>
                <p className="profile-bio">{displayProfile.bio}</p>
              </div>
            )}

            {/* Tags/Interesses */}
            {profileTags.length > 0 && (
              <div className="profile-section">
                <h4>🏷️ Interesses</h4>
                <div className="profile-tags">
                  {profileTags.map(tag => (
                    <span key={tag.tag_id} className="profile-tag">
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Informações Adicionais */}
            <div className="profile-section">
              <h4>ℹ️ Informações</h4>
              <div className="profile-details">
                <div className="detail-item">
                  <span className="detail-label">Gênero:</span>
                  <span className="detail-value">
                    {displayProfile.gender === 'male' ? '👨 Masculino' : '👩 Feminino'}
                  </span>
                </div>
                
                {displayProfile.latitude && displayProfile.longitude && (
                  <div className="detail-item">
                    <span className="detail-label">Localização:</span>
                    <span className="detail-value">
                      📍 {displayProfile.latitude.toFixed(4)}, {displayProfile.longitude.toFixed(4)}
                    </span>
                  </div>
                )}

                {isMatch && displayProfile.created_at && (
                  <div className="detail-item">
                    <span className="detail-label">Match desde:</span>
                    <span className="detail-value">
                      📅 {new Date(displayProfile.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Fotos Adicionais */}
            {(displayProfile.photo1_url || displayProfile.photo2_url || displayProfile.photo3_url || displayProfile.photo4_url || displayProfile.photo5_url) && (
              <div className="profile-section">
                <h4>📸 Fotos</h4>
                <div className="profile-photos">
                  {[displayProfile.photo1_url, displayProfile.photo2_url, displayProfile.photo3_url, displayProfile.photo4_url, displayProfile.photo5_url]
                    .filter(photo => photo)
                    .map((photo, index) => (
                      <div key={index} className="profile-photo">
                        <img 
                          src={photo} 
                          alt={`Foto ${index + 1}`}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="profile-actions">
              {isMatch ? (
                <>
                  <button 
                    className="action-btn chat-btn"
                    onClick={handleStartChat}
                  >
                    💬 Iniciar Conversa
                  </button>
                  <button 
                    className="action-btn unmatch-btn"
                    onClick={handleUnmatch}
                    disabled={isUnmatching}
                  >
                    {isUnmatching ? '⏳ Desfazendo...' : '💔 Desfazer Match'}
                  </button>
                </>
              ) : (
                <button 
                  className="action-btn close-btn"
                  onClick={onClose}
                >
                  ✕ Fechar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDetail;
