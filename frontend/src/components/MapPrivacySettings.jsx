import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './MapPrivacySettings.css';

const MapPrivacySettings = () => {
  const { user } = useAuth();
  const [privacySettings, setPrivacySettings] = useState({
    location_visible: true,
    show_exact_location: false,
    location_precision: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  // Load current privacy settings
  useEffect(() => {
    if (user?.user_id) {
      loadPrivacySettings();
    }
  }, [user?.user_id]);

  const loadPrivacySettings = async () => {
    try {
      const response = await api.get(`/profiles/${user.user_id}`);
      setPrivacySettings({
        location_visible: response.data.location_visible ?? true,
        show_exact_location: response.data.show_exact_location ?? false,
        location_precision: response.data.location_precision ?? 1
      });
    } catch (err) {
      console.error('Error loading privacy settings:', err);
      setError('Erro ao carregar configurações de privacidade');
    }
  };

  const handleSettingChange = (setting, value) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await api.put(`/profiles/${user.user_id}`, privacySettings);
      
      setSuccess('Configurações de privacidade salvas com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving privacy settings:', err);
      setError('Erro ao salvar configurações de privacidade');
    } finally {
      setLoading(false);
    }
  };

  const getPrecisionDescription = (level) => {
    const descriptions = {
      1: 'Localização exata (precisão máxima)',
      2: 'Muito precisa (~100m de margem)',
      3: 'Precisa (~300m de margem)',
      4: 'Moderadamente precisa (~500m de margem)',
      5: 'Aproximada (~1km de margem)',
      6: 'Muito aproximada (~2km de margem)',
      7: 'Aproximada (~5km de margem)',
      8: 'Muito aproximada (~10km de margem)',
      9: 'Extremamente aproximada (~20km de margem)',
      10: 'Apenas cidade/região (~50km de margem)'
    };
    return descriptions[level] || 'Nível de precisão inválido';
  };

  return (
    <div className="privacy-settings">
      <h2>🔒 Configurações de Privacidade do Mapa</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <div className="privacy-section">
        <h3>Visibilidade no Mapa</h3>
        
        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={privacySettings.location_visible}
              onChange={(e) => handleSettingChange('location_visible', e.target.checked)}
            />
            <span className="setting-text">
              <strong>Mostrar minha localização no mapa</strong>
              <p className="setting-description">
                Quando desabilitado, você não aparecerá no mapa para outros usuários
              </p>
            </span>
          </label>
        </div>

        {privacySettings.location_visible && (
          <>
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={privacySettings.show_exact_location}
                  onChange={(e) => handleSettingChange('show_exact_location', e.target.checked)}
                />
                <span className="setting-text">
                  <strong>Mostrar localização exata</strong>
                  <p className="setting-description">
                    Quando desabilitado, sua localização será aproximada para proteger sua privacidade
                  </p>
                </span>
              </label>
            </div>

            <div className="setting-item">
              <label className="setting-label">
                <span className="setting-text">
                  <strong>Nível de Precisão da Localização</strong>
                  <p className="setting-description">
                    {getPrecisionDescription(privacySettings.location_precision)}
                  </p>
                </span>
              </label>
              <div className="precision-slider">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={privacySettings.location_precision}
                  onChange={(e) => handleSettingChange('location_precision', parseInt(e.target.value))}
                  className="slider"
                />
                <div className="slider-labels">
                  <span>Exata</span>
                  <span>Aproximada</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="privacy-info">
        <h4>ℹ️ Informações sobre Privacidade</h4>
        <ul>
          <li>Suas configurações de privacidade afetam apenas como você aparece no mapa</li>
          <li>Outros usuários ainda podem ver seu perfil através de busca e descoberta</li>
          <li>Você pode alterar essas configurações a qualquer momento</li>
          <li>Mesmo com localização aproximada, a distância calculada será baseada na localização real</li>
        </ul>
      </div>

      <div className="privacy-actions">
        <button 
          onClick={saveSettings}
          disabled={loading}
          className="save-button"
        >
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </button>
        
        <button 
          onClick={loadPrivacySettings}
          className="reset-button"
        >
          Cancelar Alterações
        </button>
      </div>
    </div>
  );
};

export default MapPrivacySettings;
