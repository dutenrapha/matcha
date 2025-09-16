import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService, statusService } from '../services/api';
import MapPrivacySettings from './MapPrivacySettings';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Account settings state
  const [accountSettings, setAccountSettings] = useState({
    name: '',
    email: '',
    username: '',
    is_online: true
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user account data
      setAccountSettings({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        is_online: true // Default value
      });

      // Load online status
      try {
        const status = await statusService.getUserStatus(user.user_id);
        setAccountSettings(prev => ({
          ...prev,
          is_online: status.is_online
        }));
      } catch (error) {
        console.log('Could not load online status');
      }

    } catch (error) {
      setError('Erro ao carregar dados do usuário');
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setMessage('');

      // Update user account
      await userService.updateUser(user.user_id, {
        name: accountSettings.name,
        email: accountSettings.email,
        username: accountSettings.username
      });

      // Update online status only if it's different from current status
      try {
        await statusService.updateOnlineStatus({
          is_online: accountSettings.is_online
        });
      } catch (statusError) {
        console.log('Could not update online status:', statusError);
        // Don't fail the entire operation if status update fails
      }

      setMessage('Configurações da conta salvas com sucesso!');
    } catch (error) {
      setError('Erro ao salvar configurações da conta');
      console.error('Error saving account settings:', error);
    } finally {
      setLoading(false);
    }
  };



  if (loading && !accountSettings.name) {
    return (
      <div className="settings-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>⚙️ Configurações</h2>
        <p>Gerencie suas preferências e configurações da conta</p>
      </div>

      {message && (
        <div className="message success">
          <span>✅</span>
          <p>{message}</p>
        </div>
      )}

      {error && (
        <div className="message error">
          <span>❌</span>
          <p>{error}</p>
        </div>
      )}


      <div className="settings-content">
        <div className="settings-section">
          <h3>👤 Configurações da Conta</h3>
          <p>Gerencie suas informações pessoais e status online</p>
          
          <form onSubmit={handleAccountSubmit} className="settings-form">
            <div className="form-group">
              <label htmlFor="name">Nome</label>
              <input
                type="text"
                id="name"
                value={accountSettings.name}
                onChange={(e) => setAccountSettings(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={accountSettings.email}
                onChange={(e) => setAccountSettings(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Nome de Usuário</label>
              <input
                type="text"
                id="username"
                value={accountSettings.username}
                onChange={(e) => setAccountSettings(prev => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={accountSettings.is_online}
                  onChange={(e) => setAccountSettings(prev => ({ ...prev, is_online: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Mostrar como online
              </label>
            </div>

            <button type="submit" className="save-button" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </form>
        </div>

        {/* Map Privacy Settings */}
        <div className="settings-section">
          <MapPrivacySettings />
        </div>
      </div>
    </div>
  );
};

export default Settings;
