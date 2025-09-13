import React, { useState } from 'react';
import { reportService } from '../services/api';
import './ReportUserModal.css';

const ReportUserModal = ({ isOpen, onClose, userToReport, currentUserId }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [error, setError] = useState('');

  const reportReasons = [
    { value: 'fake', label: 'Perfil Fake', description: 'Este perfil parece ser falso ou fraudulento' },
    { value: 'inappropriate', label: 'Conteúdo Inapropriado', description: 'Fotos ou informações inadequadas' },
    { value: 'harassment', label: 'Assédio', description: 'Comportamento abusivo ou ameaçador' },
    { value: 'spam', label: 'Spam', description: 'Envio de mensagens não solicitadas' },
    { value: 'underage', label: 'Menor de Idade', description: 'Pessoa menor de 18 anos' },
    { value: 'other', label: 'Outro', description: 'Outro motivo (especifique abaixo)' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReason) {
      setError('Por favor, selecione um motivo para o reporte');
      return;
    }

    if (selectedReason === 'other' && !customReason.trim()) {
      setError('Por favor, especifique o motivo do reporte');
      return;
    }

    try {
      setIsReporting(true);
      setError('');

      const reason = selectedReason === 'other' ? customReason.trim() : selectedReason;
      
      await reportService.reportUser(currentUserId, userToReport.user_id, reason);
      
      // Fechar modal e mostrar feedback
      onClose();
      alert('Usuário reportado com sucesso! Nossa equipe analisará o caso.');
      
      // Reset form
      setSelectedReason('');
      setCustomReason('');
    } catch (err) {
      console.error('Erro ao reportar usuário:', err);
      if (err.response?.data?.detail === 'User already reported') {
        setError('Você já reportou este usuário anteriormente');
      } else {
        setError('Erro ao reportar usuário. Tente novamente.');
      }
    } finally {
      setIsReporting(false);
    }
  };

  const handleClose = () => {
    if (!isReporting) {
      setSelectedReason('');
      setCustomReason('');
      setError('');
      onClose();
    }
  };

  if (!isOpen || !userToReport) return null;

  return (
    <div className="report-modal-overlay" onClick={handleClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <h2>📝 Reportar Usuário</h2>
          <button className="close-btn" onClick={handleClose} disabled={isReporting}>
            ✕
          </button>
        </div>

        <div className="report-modal-content">
          <div className="user-info">
            <img 
              src={userToReport.avatar_url || 'https://via.placeholder.com/60x60/6b46c1/ffffff?text=Avatar'} 
              alt={userToReport.name}
              className="user-avatar"
            />
            <div className="user-details">
              <h3>{userToReport.name}</h3>
              <p>Reportando: {userToReport.name}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="report-form">
            <div className="form-group">
              <label>Motivo do Reporte:</label>
              <div className="reason-options">
                {reportReasons.map((reason) => (
                  <div key={reason.value} className="reason-option">
                    <input
                      type="radio"
                      id={reason.value}
                      name="reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      disabled={isReporting}
                    />
                    <label htmlFor={reason.value} className="reason-label">
                      <span className="reason-title">{reason.label}</span>
                      <span className="reason-description">{reason.description}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {selectedReason === 'other' && (
              <div className="form-group">
                <label htmlFor="customReason">Especifique o motivo:</label>
                <textarea
                  id="customReason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Descreva o motivo do reporte..."
                  rows={3}
                  disabled={isReporting}
                  maxLength={500}
                />
                <div className="char-count">
                  {customReason.length}/500 caracteres
                </div>
              </div>
            )}

            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={handleClose}
                disabled={isReporting}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={isReporting || !selectedReason}
              >
                {isReporting ? '⏳ Reportando...' : '📝 Reportar Usuário'}
              </button>
            </div>
          </form>

          <div className="report-info">
            <h4>ℹ️ Informações Importantes:</h4>
            <ul>
              <li>Reports são analisados pela nossa equipe de moderação</li>
              <li>Você só pode reportar um usuário uma vez</li>
              <li>Reports falsos podem resultar em penalidades</li>
              <li>Seus dados pessoais não serão compartilhados</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportUserModal;
