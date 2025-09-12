import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileService, preferencesService, tagsService } from '../services/api';
import './ProfileEdit.css';

const ProfileEdit = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados do perfil
  const [profile, setProfile] = useState({
    bio: '',
    age: 18,
    gender: 'male',
    sexual_pref: 'female',
    location: '',
    latitude: null,
    longitude: null,
    avatar_url: '',
    photo1_url: '',
    photo2_url: '',
    photo3_url: '',
    photo4_url: '',
    photo5_url: '',
  });

  // Estado para controlar qual foto é o avatar
  const [selectedAvatar, setSelectedAvatar] = useState(1);

  // Estados das preferências
  const [preferences, setPreferences] = useState({
    preferred_gender: 'female',
    age_min: 18,
    age_max: 35,
    max_distance_km: 20,
  });

  // Estados das tags
  const [availableTags, setAvailableTags] = useState([]);
  const [userTags, setUserTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');

  // Estados de upload
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadProfileData();
  }, [user?.user_id]);

  const loadProfileData = async () => {
    if (!user?.user_id) return;

    try {
      setLoading(true);
      
      // Carregar perfil
      try {
        const profileData = await profileService.getProfile(user.user_id);
        setProfile(prev => ({ ...prev, ...profileData }));
      } catch (err) {
        console.log('Perfil não encontrado, será criado um novo');
      }

      // Carregar preferências
      try {
        const prefsData = await preferencesService.getPreferences(user.user_id);
        setPreferences(prefsData);
      } catch (err) {
        console.log('Preferências não encontradas, usando padrões');
      }

      // Carregar tags disponíveis
      try {
        const tagsData = await tagsService.getAllTags();
        setAvailableTags(Array.isArray(tagsData) ? tagsData : []);
      } catch (err) {
        console.error('Erro ao carregar tags:', err);
        setAvailableTags([]);
      }

      // Carregar tags do usuário
      try {
        const userTagsData = await tagsService.getUserTags(user.user_id);
        setUserTags(Array.isArray(userTagsData) ? userTagsData : []);
      } catch (err) {
        console.log('Usuário não possui tags ainda');
        setUserTags([]);
      }

    } catch (err) {
      setError('Erro ao carregar dados do perfil');
      console.error('Erro ao carregar perfil:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfile(prev => {
      const newProfile = { ...prev, [field]: value };
      
      // Se é uma foto e é a primeira foto, atualizar avatar automaticamente
      if (field === 'photo1_url' && value) {
        newProfile.avatar_url = value;
        setSelectedAvatar(1);
      }
      
      return newProfile;
    });
  };

  const handlePreferencesChange = (field, value) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user?.user_id) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Validar dados obrigatórios
      if (!profile.photo1_url) {
        setError('Pelo menos uma foto é obrigatória');
        return;
      }

      if (profile.age < 18 || profile.age > 100) {
        setError('Idade deve estar entre 18 e 100 anos');
        return;
      }

      // Salvar perfil
      const profileData = {
        user_id: user.user_id,
        ...profile
      };

      await profileService.createOrUpdateProfile(profileData);

      // Salvar preferências
      const prefsData = {
        user_id: user.user_id,
        ...preferences
      };

      await preferencesService.createOrUpdatePreferences(prefsData);

      setSuccess('Perfil salvo com sucesso!');
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao salvar perfil');
      console.error('Erro ao salvar perfil:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim() || !user?.user_id) return;

    // Validar nome da tag
    const cleanTagName = newTagName.trim().toLowerCase();
    if (cleanTagName.length < 2) {
      setError('Tag deve ter pelo menos 2 caracteres');
      return;
    }
    
    if (cleanTagName.length > 20) {
      setError('Tag deve ter no máximo 20 caracteres');
      return;
    }

    // Verificar caracteres especiais
    if (!/^[a-záàâãéèêíìîóòôõúùûç\s]+$/i.test(cleanTagName)) {
      setError('Tag deve conter apenas letras e espaços');
      return;
    }

    try {
      setError(''); // Limpar erros anteriores
      
      // Verificar se a tag já existe
      let tag = availableTags.find(t => t.name.toLowerCase() === cleanTagName);
      
      if (!tag) {
        // Criar nova tag
        console.log('Criando nova tag:', cleanTagName);
        const newTag = await tagsService.createTag({ name: cleanTagName });
        console.log('Tag criada:', newTag);
        
        tag = newTag;
        setAvailableTags(prev => [...prev, tag]);
      }

      // Verificar se o usuário já tem essa tag
      if (userTags.find(ut => ut.tag_id === tag.tag_id)) {
        setError('Você já possui essa tag');
        return;
      }

      // Atribuir tag ao usuário
      await tagsService.assignTag(user.user_id, tag.tag_id);
      setUserTags(prev => [...prev, tag]);
      setNewTagName('');
      setSuccess('Tag adicionada com sucesso!');
      setTimeout(() => setSuccess(''), 2000);

    } catch (err) {
      console.error('Erro ao adicionar tag:', err);
      
      // Extrair mensagem de erro de forma segura
      let errorMessage = 'Erro ao adicionar tag';
      
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (typeof err.message === 'string') {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  const handleRemoveTag = async (tagId) => {
    if (!user?.user_id) return;

    try {
      await tagsService.removeTag(user.user_id, tagId);
      setUserTags(prev => prev.filter(tag => tag.tag_id !== tagId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao remover tag');
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada pelo navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setProfile(prev => ({
          ...prev,
          latitude,
          longitude
        }));
        setSuccess('Localização obtida com sucesso!');
        setTimeout(() => setSuccess(''), 3000);
      },
      (error) => {
        setError('Erro ao obter localização: ' + error.message);
      }
    );
  };

  // Funções de upload de imagens
  const handleFileSelect = (file, photoField) => {
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB');
      return;
    }

    // Converter para base64 para preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      handleProfileChange(photoField, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e, photoField) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0], photoField);
    }
  };

  const handleFileInputChange = (e, photoField) => {
    const file = e.target.files[0];
    handleFileSelect(file, photoField);
  };

  const handleSetAvatar = (photoNumber) => {
    const photoField = `photo${photoNumber}_url`;
    const photoUrl = profile[photoField];
    
    if (photoUrl) {
      setProfile(prev => ({ ...prev, avatar_url: photoUrl }));
      setSelectedAvatar(photoNumber);
      setSuccess(`Foto ${photoNumber} definida como avatar!`);
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  if (loading) {
    return (
      <div className="profile-edit-loading">
        <div className="loading-spinner"></div>
        <p>Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="profile-edit">
      <div className="profile-edit-header">
        <h2>👤 Editar Perfil</h2>
        <p>Complete suas informações para encontrar matches perfeitos</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>❌</span>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span>✅</span>
          {success}
        </div>
      )}

      <div className="profile-edit-content">
        {/* Informações Básicas */}
        <div className="form-section">
          <h3>📝 Informações Básicas</h3>
          
          <div className="form-group">
            <label htmlFor="bio">Biografia *</label>
            <textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => handleProfileChange('bio', e.target.value)}
              placeholder="Conte um pouco sobre você..."
              rows={4}
              maxLength={500}
            />
            <small>{profile.bio.length}/500 caracteres</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="age">Idade *</label>
              <input
                type="number"
                id="age"
                value={profile.age}
                onChange={(e) => handleProfileChange('age', parseInt(e.target.value))}
                min="18"
                max="100"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gênero *</label>
              <select
                id="gender"
                value={profile.gender}
                onChange={(e) => handleProfileChange('gender', e.target.value)}
                required
              >
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="sexual_pref">Preferência Sexual *</label>
            <select
              id="sexual_pref"
              value={profile.sexual_pref}
              onChange={(e) => handleProfileChange('sexual_pref', e.target.value)}
              required
            >
              <option value="male">Homens</option>
              <option value="female">Mulheres</option>
              <option value="both">Ambos</option>
            </select>
          </div>
        </div>

        {/* Localização */}
        <div className="form-section">
          <h3>📍 Localização</h3>
          
          <div className="form-group">
            <label htmlFor="location">Cidade</label>
            <input
              type="text"
              id="location"
              value={profile.location}
              onChange={(e) => handleProfileChange('location', e.target.value)}
              placeholder="Ex: São Paulo, SP"
            />
          </div>

          <div className="location-buttons">
            <button
              type="button"
              onClick={getCurrentLocation}
              className="btn btn-secondary"
            >
              📍 Obter Localização Atual
            </button>
          </div>

          {(profile.latitude && profile.longitude) && (
            <div className="location-info">
              <small>
                Coordenadas: {profile.latitude.toFixed(4)}, {profile.longitude.toFixed(4)}
              </small>
            </div>
          )}
        </div>

        {/* Fotos */}
        <div className="form-section">
          <h3>📸 Fotos</h3>
          <p className="section-description">
            Adicione até 5 fotos. A primeira será automaticamente definida como avatar. Você pode alterar depois.
          </p>
          
          <div className="photos-grid">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="photo-upload">
                <div 
                  className={`photo-drop-zone ${dragOver ? 'drag-over' : ''} ${selectedAvatar === num ? 'selected-avatar' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, `photo${num}_url`)}
                  onClick={() => document.getElementById(`file-input-${num}`).click()}
                >
                  {profile[`photo${num}_url`] ? (
                    <div className="photo-preview">
                      <img src={profile[`photo${num}_url`]} alt={`Foto ${num}`} />
                      <button
                        type="button"
                        className="remove-photo"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProfileChange(`photo${num}_url`, '');
                          // Se era o avatar, limpar avatar
                          if (selectedAvatar === num) {
                            setProfile(prev => ({ ...prev, avatar_url: '' }));
                            setSelectedAvatar(1);
                          }
                        }}
                      >
                        ✕
                      </button>
                      {selectedAvatar === num && (
                        <div className="avatar-badge">
                          <span>👑</span>
                          <small>Avatar</small>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="photo-placeholder">
                      <span>📷</span>
                      <small>Clique ou arraste uma foto aqui</small>
                      <div className="upload-hint">Foto {num}</div>
                    </div>
                  )}
                </div>
                
                <input
                  type="file"
                  id={`file-input-${num}`}
                  accept="image/*"
                  onChange={(e) => handleFileInputChange(e, `photo${num}_url`)}
                  style={{ display: 'none' }}
                />

                {/* Botão para definir como avatar */}
                {profile[`photo${num}_url`] && selectedAvatar !== num && (
                  <button
                    type="button"
                    className="set-avatar-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetAvatar(num);
                    }}
                  >
                    👑 Definir como Avatar
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Preview do avatar atual */}
          {profile.avatar_url && (
            <div className="avatar-preview-section">
              <h4>👑 Seu Avatar Atual</h4>
              <div className="avatar-preview">
                <img src={profile.avatar_url} alt="Avatar preview" />
                <p>Esta é a foto que outros usuários verão primeiro</p>
              </div>
            </div>
          )}
        </div>

        {/* Tags/Interesses */}
        <div className="form-section">
          <h3>🏷️ Interesses</h3>
          
          <div className="tags-input">
            <div className="add-tag">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Adicionar interesse (ex: música, esportes, viagem)"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="btn btn-primary"
                disabled={!newTagName.trim()}
              >
                Adicionar
              </button>
            </div>

            <div className="user-tags">
              {(userTags || []).map((tag) => (
                <span key={tag.tag_id} className="tag">
                  #{tag.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag.tag_id)}
                    className="remove-tag"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Preferências */}
        <div className="form-section">
          <h3>⚙️ Preferências de Busca</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="preferred_gender">Gênero Preferido</label>
              <select
                id="preferred_gender"
                value={preferences.preferred_gender}
                onChange={(e) => handlePreferencesChange('preferred_gender', e.target.value)}
              >
                <option value="male">Homens</option>
                <option value="female">Mulheres</option>
                <option value="both">Ambos</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="max_distance_km">Distância Máxima (km)</label>
              <input
                type="number"
                id="max_distance_km"
                value={preferences.max_distance_km}
                onChange={(e) => handlePreferencesChange('max_distance_km', parseInt(e.target.value))}
                min="1"
                max="1000"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="age_min">Idade Mínima</label>
              <input
                type="number"
                id="age_min"
                value={preferences.age_min}
                onChange={(e) => handlePreferencesChange('age_min', parseInt(e.target.value))}
                min="18"
                max="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="age_max">Idade Máxima</label>
              <input
                type="number"
                id="age_max"
                value={preferences.age_max}
                onChange={(e) => handlePreferencesChange('age_max', parseInt(e.target.value))}
                min="18"
                max="100"
              />
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleSaveProfile}
            className="btn btn-primary btn-large"
            disabled={saving}
          >
            {saving ? '💾 Salvando...' : '💾 Salvar Perfil'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
