import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { searchService, tagsService, swipeService, profileService } from '../services/api';
import SwipeCard from './SwipeCard';
import ProfileDetail from './ProfileDetail';
import './AdvancedSearch.css';

const AdvancedSearch = () => {
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userTags, setUserTags] = useState([]);
  const [swipeFeedback, setSwipeFeedback] = useState('');
  const [isSwiping, setIsSwiping] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isProfileDetailOpen, setIsProfileDetailOpen] = useState(false);
  const [profileStatus, setProfileStatus] = useState(null);

  // Filtros de busca
  const [filters, setFilters] = useState({
    age_min: '',
    age_max: '',
    fame_min: '',
    fame_max: '',
    max_distance_km: '',
    tags: [],
    sort_by: 'fame_rating'
  });

  // Tags disponíveis (removido - não usado)
  // const [availableTags, setAvailableTags] = useState([]);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [tagSearchResults, setTagSearchResults] = useState([]);

  // Carregar tags do usuário
  const loadUserTags = useCallback(async () => {
    try {
      const tagsData = await tagsService.getUserTags(user.user_id);
      setUserTags(tagsData);
    } catch (err) {
      console.error('Erro ao carregar tags do usuário:', err);
    }
  }, [user?.user_id]);

  useEffect(() => {
    if (user?.user_id) {
      loadUserTags();
      checkProfileStatus();
    }
  }, [user?.user_id, loadUserTags]);

  const checkProfileStatus = useCallback(async () => {
    try {
      const status = await profileService.getProfileStatus(user.user_id);
      setProfileStatus(status);
    } catch (err) {
      console.error('Erro ao verificar status do perfil:', err);
    }
  }, [user?.user_id]);

  // Buscar tags
  const searchTags = async (query) => {
    if (query.length < 2) {
      setTagSearchResults([]);
      return;
    }
    
    try {
      const results = await searchService.searchTags(query);
      setTagSearchResults(results);
    } catch (err) {
      console.error('Erro ao buscar tags:', err);
    }
  };

  // Executar busca
  const performSearch = async () => {
    if (!user?.user_id) return;

    // Verificar se o perfil está completo
    if (!profileStatus?.is_complete) {
      setError('Perfil incompleto. Complete seu perfil antes de fazer buscas.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Converter strings vazias para undefined
      const cleanFilters = {
        age_min: filters.age_min ? parseInt(filters.age_min) : undefined,
        age_max: filters.age_max ? parseInt(filters.age_max) : undefined,
        fame_min: filters.fame_min ? parseInt(filters.fame_min) : undefined,
        fame_max: filters.fame_max ? parseInt(filters.fame_max) : undefined,
        max_distance_km: filters.max_distance_km ? parseInt(filters.max_distance_km) : undefined,
        tags: filters.tags.length > 0 ? filters.tags : undefined,
        sort_by: filters.sort_by
      };

      const results = await searchService.advancedSearch(user.user_id, cleanFilters);
      setSearchResults(results);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Erro na busca:', err);
      if (err.response?.status === 400) {
        setError(err.response.data.detail || 'Erro ao realizar busca');
      } else {
        setError('Erro ao realizar busca');
      }
    } finally {
      setLoading(false);
    }
  };

  // Adicionar tag aos filtros
  const addTagToFilters = (tag) => {
    if (!filters.tags.includes(tag)) {
      setFilters(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
    setTagSearchQuery('');
    setTagSearchResults([]);
  };

  // Remover tag dos filtros
  const removeTagFromFilters = (tagToRemove) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      age_min: '',
      age_max: '',
      fame_min: '',
      fame_max: '',
      max_distance_km: '',
      tags: [],
      sort_by: 'fame_rating'
    });
    setSearchResults([]);
    setCurrentIndex(0);
  };

  // Próximo perfil
  const handleNextProfile = () => {
    if (currentIndex < searchResults.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Se não há mais perfis, limpar a lista
      setSearchResults([]);
      setCurrentIndex(0);
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

  // Swipe
  const handleSwipe = async (direction) => {
    if (!user?.user_id || isSwiping) return;

    const currentProfile = searchResults[currentIndex];
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

      // Limpar feedback após um tempo
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

  const currentProfile = searchResults[currentIndex];
  const progress = searchResults.length > 0 ? ((currentIndex + 1) / searchResults.length) * 100 : 0;

  return (
    <div className="advanced-search">
      <div className="search-header">
        <h2>🔍 Busca Avançada</h2>
        <p>Encontre pessoas com base em critérios específicos</p>
      </div>

      {/* Status do Perfil */}
      {profileStatus && !profileStatus.is_complete && (
        <div className="profile-status-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            <h4>Perfil Incompleto</h4>
            <p>{profileStatus.message}</p>
            <p>Complete seu perfil para usar a busca avançada.</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="search-filters">
        <div className="filters-grid">
          {/* Idade */}
          <div className="filter-group">
            <label>Idade</label>
            <div className="age-range">
              <input
                type="number"
                placeholder="Min"
                value={filters.age_min}
                onChange={(e) => setFilters(prev => ({ ...prev, age_min: e.target.value }))}
                min="18"
                max="100"
              />
              <span>até</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.age_max}
                onChange={(e) => setFilters(prev => ({ ...prev, age_max: e.target.value }))}
                min="18"
                max="100"
              />
            </div>
          </div>

          {/* Fama */}
          <div className="filter-group">
            <label>Fama</label>
            <div className="fame-range">
              <input
                type="number"
                placeholder="Min"
                value={filters.fame_min}
                onChange={(e) => setFilters(prev => ({ ...prev, fame_min: e.target.value }))}
                min="0"
                max="100"
              />
              <span>até</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.fame_max}
                onChange={(e) => setFilters(prev => ({ ...prev, fame_max: e.target.value }))}
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Distância */}
          <div className="filter-group">
            <label>Distância Máxima (km)</label>
            <input
              type="number"
              placeholder="Ex: 20"
              value={filters.max_distance_km}
              onChange={(e) => setFilters(prev => ({ ...prev, max_distance_km: e.target.value }))}
              min="1"
              max="1000"
            />
          </div>

          {/* Ordenação */}
          <div className="filter-group">
            <label>Ordenar por</label>
            <select
              value={filters.sort_by}
              onChange={(e) => setFilters(prev => ({ ...prev, sort_by: e.target.value }))}
            >
              <option value="fame_rating">Fama</option>
              <option value="distance">Distância</option>
              <option value="age">Idade</option>
              <option value="tags">Tags em Comum</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div className="filter-group tags-filter">
          <label>Interesses</label>
          <div className="tags-input-container">
            <input
              type="text"
              placeholder="Buscar interesses..."
              value={tagSearchQuery}
              onChange={(e) => {
                setTagSearchQuery(e.target.value);
                searchTags(e.target.value);
              }}
            />
            
            {/* Tags selecionadas */}
            <div className="selected-tags">
              {filters.tags.map(tag => (
                <span key={tag} className="selected-tag">
                  #{tag}
                  <button onClick={() => removeTagFromFilters(tag)}>×</button>
                </span>
              ))}
            </div>

            {/* Sugestões de tags */}
            {tagSearchResults.length > 0 && (
              <div className="tag-suggestions">
                {tagSearchResults.map(tag => (
                  <button
                    key={tag.tag_id}
                    className="tag-suggestion"
                    onClick={() => addTagToFilters(tag.name)}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botões */}
        <div className="filter-actions">
          <button onClick={clearFilters} className="btn btn-secondary">
            🗑️ Limpar Filtros
          </button>
          <button 
            onClick={performSearch} 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '🔍 Buscando...' : '🔍 Buscar'}
          </button>
        </div>
      </div>

      {/* Resultados */}
      {error && (
        <div className="search-error">
          <p>❌ {error}</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="search-results">
          <div className="results-header">
            <h3>Resultados da Busca</h3>
            <div className="results-stats">
              <span>{searchResults.length} PERFIS ENCONTRADOS</span>
              <span>{currentIndex + 1} VISUALIZANDO</span>
              <span>{searchResults.length - currentIndex - 1} RESTANTES</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          <div className="swipe-container">
            {/* Card de fundo (próximo perfil) */}
            {searchResults[currentIndex + 1] && (
              <div className="swipe-card-back">
                <SwipeCard
                  key={`back-${searchResults[currentIndex + 1].user_id}`}
                  profile={searchResults[currentIndex + 1]}
                  userTags={userTags}
                  onNext={handleNextProfile}
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
                onSwipe={handleSwipe}
                swipeFeedback={swipeFeedback}
                onViewProfile={handleViewProfile}
              />
            )}
          </div>
        </div>
      )}

      {searchResults.length === 0 && !loading && (
        <div className="no-results">
          <h3>🔍 Nenhum resultado encontrado</h3>
          <p>Tente ajustar os filtros para encontrar mais pessoas.</p>
        </div>
      )}

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

export default AdvancedSearch;
