import React, { useState, useEffect, useCallback } from 'react';
import { profileService, tagsService, matchesService, blockService, viewService } from '../services/api';
import ReportUserModal from './ReportUserModal';
import './ProfileDetail.css';

const ProfileDetail = ({ profile, isOpen, onClose, isMatch = false, onNavigateToChat, currentUserId }) => {
  // const { user } = useAuth(); // Removido - não usado
  const [profileData, setProfileData] = useState(null);
  const [profileTags, setProfileTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUnmatching, setIsUnmatching] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockStatus, setBlockStatus] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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

      // Carregar status de bloqueio apenas se currentUserId estiver disponível
      if (currentUserId) {
        try {
          const blockStatusData = await blockService.checkBlockStatus(currentUserId, profile.user_id);
          setBlockStatus(blockStatusData);
        } catch (blockError) {
          console.error('Erro ao verificar status de bloqueio:', blockError);
          setBlockStatus(null);
        }
      }

      // Registrar visualização do perfil (apenas se currentUserId estiver disponível e não for o próprio usuário)
      if (currentUserId && profile.user_id !== currentUserId) {
        try {
          await viewService.addView(currentUserId, profile.user_id);
          console.log(`Visualização registrada: usuário ${currentUserId} visualizou perfil ${profile.user_id}`);
        } catch (viewError) {
          console.error('Erro ao registrar visualização:', viewError);
          // Não mostrar erro para o usuário, apenas log
        }
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes do perfil:', err);
      setError('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id, currentUserId]);

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

  const handleBlockUser = async () => {
    if (!currentUserId || !profile?.user_id) return;
    
    const confirmMessage = `Tem certeza que deseja bloquear ${profile.name || 'este usuário'}?\n\nIsso irá:\n• Remover o match (se existir)\n• Impedir que vocês se vejam nas buscas\n• Desabilitar o chat entre vocês`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setIsBlocking(true);
      await blockService.blockUser(currentUserId, profile.user_id);
      
      // Atualizar status de bloqueio
      setBlockStatus(prev => ({
        ...prev,
        user1_blocked_user2: true,
        any_block: true
      }));
      
      // Fechar modal e mostrar feedback
      onClose();
      alert('Usuário bloqueado com sucesso!');
    } catch (err) {
      console.error('Erro ao bloquear usuário:', err);
      alert('Erro ao bloquear usuário. Tente novamente.');
    } finally {
      setIsBlocking(false);
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
              
              {/* Botão de bloquear - sempre visível (exceto se já bloqueado) */}
              {currentUserId && profile?.user_id && currentUserId !== profile.user_id && 
               blockStatus && !blockStatus.user1_blocked_user2 && (
                <button 
                  className="action-btn block-btn"
                  onClick={handleBlockUser}
                  disabled={isBlocking}
                >
                  {isBlocking ? '⏳ Bloqueando...' : '🚫 Bloquear Usuário'}
                </button>
              )}
              
              {/* Botão de reportar - sempre visível (exceto se for o próprio usuário) */}
              {currentUserId && profile?.user_id && currentUserId !== profile.user_id && (
                <button 
                  className="action-btn report-btn"
                  onClick={() => setIsReportModalOpen(true)}
                >
                  📝 Reportar Usuário
                </button>
              )}
              
              {/* Indicador se usuário está bloqueado */}
              {blockStatus && blockStatus.any_block && (
                <div className="block-status">
                  {blockStatus.user1_blocked_user2 ? (
                    <span className="blocked-indicator">🚫 Você bloqueou este usuário</span>
                  ) : blockStatus.user2_blocked_user1 ? (
                    <span className="blocked-indicator">🚫 Este usuário te bloqueou</span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de Reporte */}
      <ReportUserModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        userToReport={displayProfile}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default ProfileDetail;
