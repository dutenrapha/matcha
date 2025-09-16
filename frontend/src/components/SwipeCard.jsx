import React, { useState, useRef, useEffect, useCallback } from 'react';
import { tagsService, viewService } from '../services/api';
import './SwipeCard.css';

const SwipeCard = ({ 
  profile, 
  userTags, 
  onSwipe, 
  onNext, 
  swipeFeedback,
  currentUserId,
  onViewProfile 
}) => {
  
  const [profileTags, setProfileTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  
  const cardRef = useRef(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  const loadProfileTags = useCallback(async () => {
    try {
      setLoadingTags(true);
      const tagsData = await tagsService.getUserTags(profile.user_id);
      setProfileTags(tagsData);
    } catch (err) {
      console.error('Erro ao carregar tags do perfil:', err);
    } finally {
      setLoadingTags(false);
    }
  }, [profile?.user_id]);

  useEffect(() => {
    if (profile?.user_id) {
      loadProfileTags();
      
      // Registrar visualização do perfil (apenas se não for o próprio usuário)
      if (currentUserId && profile.user_id !== currentUserId) {
        const registerView = async () => {
          try {
            await viewService.addView(currentUserId, profile.user_id);
            console.log(`Visualização registrada: usuário ${currentUserId} visualizou perfil ${profile.user_id}`);
          } catch (viewError) {
            console.error('Erro ao registrar visualização:', viewError);
            // Não mostrar erro para o usuário, apenas log
          }
        };
        registerView();
      }
    }
  }, [profile?.user_id, currentUserId, loadProfileTags]);

  // Função de swipe
  const handleSwipe = (direction) => {
    // Converter direção para o formato esperado pela API
    const apiDirection = direction === 'right' ? 'like' : 'dislike';
    
    // Chama a API
    if (onSwipe) {
      onSwipe(apiDirection);
    }
    
    // Animar saída do card
    if (cardRef.current) {
      const card = cardRef.current;
      card.style.transition = 'all 0.3s ease-out';
      card.style.transform = direction === 'right' 
        ? 'translateX(100vw) rotate(30deg)' 
        : 'translateX(-100vw) rotate(-30deg)';
      card.style.opacity = '0';
      
      // Remover o card após a animação
      setTimeout(() => {
        if (onNext) {
          onNext();
        }
      }, 300);
    } else {
      // Fallback se não houver ref
      if (onNext) {
        onNext();
      }
    }
  };

  // Eventos de mouse
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.clientX);
    setCurrentX(e.clientX);
    startXRef.current = e.clientX;
    currentXRef.current = e.clientX;
    
    const handleMouseMove = (e) => {
      setCurrentX(e.clientX);
      currentXRef.current = e.clientX;
    };
    
    const handleMouseUp = (e) => {
      e.preventDefault();
      
      const deltaX = currentXRef.current - startXRef.current;
      const threshold = 50;
      
      if (Math.abs(deltaX) > threshold) {
        const direction = deltaX > 0 ? 'right' : 'left';
        handleSwipe(direction);
      } else {
        // Reset
        setIsDragging(false);
        setStartX(0);
        setCurrentX(0);
        startXRef.current = 0;
        currentXRef.current = 0;
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Eventos de touch
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setStartX(touch.clientX);
    setCurrentX(touch.clientX);
    startXRef.current = touch.clientX;
    currentXRef.current = touch.clientX;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    setCurrentX(touch.clientX);
    currentXRef.current = touch.clientX;
  };

  const handleTouchEnd = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const deltaX = currentXRef.current - startXRef.current;
    const threshold = 50;
    
    if (Math.abs(deltaX) > threshold) {
      const direction = deltaX > 0 ? 'right' : 'left';
      handleSwipe(direction);
    } else {
      // Reset
      setIsDragging(false);
      setStartX(0);
      setCurrentX(0);
      startXRef.current = 0;
      currentXRef.current = 0;
    }
  };

  // Transformação
  const deltaX = currentX - startX;
  const rotation = deltaX * 0.1;
  const opacity = Math.max(1 - Math.abs(deltaX) / 300, 0.3);
  
  const transform = isDragging 
    ? `translateX(${deltaX}px) rotate(${rotation}deg)`
    : 'translateX(0px) rotate(0deg)';

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
    <div className="swipe-card-container">
      {/* Indicadores */}
      {isDragging && (
        <>
          <div className={`swipe-indicator swipe-indicator-left ${deltaX < -50 ? 'active' : ''}`}>
            <div className="indicator-content">
              <span className="indicator-icon">👎</span>
              <span className="indicator-text">PASSAR</span>
            </div>
          </div>
          
          <div className={`swipe-indicator swipe-indicator-right ${deltaX > 50 ? 'active' : ''}`}>
            <div className="indicator-content">
              <span className="indicator-icon">❤️</span>
              <span className="indicator-text">CURTIR</span>
            </div>
          </div>
        </>
      )}

      {/* Card */}
      <div 
        ref={cardRef}
        className={`swipe-card ${isDragging ? 'dragging' : ''}`}
        style={{
          transform,
          opacity,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {swipeFeedback && (
          <div className="swipe-feedback-overlay">
            {swipeFeedback}
          </div>
        )}

        <div className="swipe-card-image">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.name} />
          ) : (
            <div className="no-avatar">
              <span>📷</span>
            </div>
          )}
          
          <div className="swipe-card-overlay">
            <div className="swipe-card-info">
              <h3>{profile.name}</h3>
              <p className="swipe-card-age">{profile.age} ano{getAgeSuffix(profile.age)}</p>
              <p className="swipe-card-distance">📍 {formatDistance(profile.distance)}</p>
            </div>
          </div>

          <div className="swipe-card-badges">
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

        <div className="swipe-card-details">
          {profile.bio && (
            <div className="swipe-card-bio">
              <p>"{profile.bio}"</p>
            </div>
          )}

          {loadingTags ? (
            <div className="tags-loading">
              <small>Carregando interesses...</small>
            </div>
          ) : profileTags.length > 0 ? (
            <div className="swipe-card-tags">
              <h4>Interesses:</h4>
              <div className="tags-list">
                {profileTags.map((tag) => {
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

          {/* Botão para ver perfil completo */}
          <div className="swipe-card-actions">
            <button 
              className="view-profile-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (onViewProfile) {
                  onViewProfile(profile);
                }
              }}
            >
              👁️ Ver Perfil Completo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SwipeCard;
