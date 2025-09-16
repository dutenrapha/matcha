import React, { useState } from 'react';
import { authService } from '../services/api';
import './Auth.css';

const ForgotPassword = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authService.requestPasswordReset(email);
      setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setEmail('');
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao enviar email de recuperação';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Esqueci minha senha</h2>
        <p className="auth-subtitle">Digite seu email para receber um link de recuperação</p>
        
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

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            Lembrou da senha?{' '}
            <button 
              type="button" 
              className="switch-button"
              onClick={onBackToLogin}
            >
              Voltar ao login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
