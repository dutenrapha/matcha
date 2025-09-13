import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { blockService } from '../services/api';
import './BlockedUsers.css';

const BlockedUsers = () => {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unblocking, setUnblocking] = useState(null);

  const loadBlockedUsers = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      setLoading(true);
      setError('');
      
      const blockedData = await blockService.getBlockedUsers(user.user_id);
      setBlockedUsers(blockedData);
      
    } catch (err) {
      console.error('Erro ao carregar usuários bloqueados:', err);
      setError('Erro ao carregar usuários bloqueados');
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  const handleUnblockUser = async (blockedUser) => {
    const confirmMessage = `Tem certeza que deseja desbloquear ${blockedUser.blocked_name}?\n\nIsso irá:\n• Permitir que vocês se vejam nas buscas novamente\n• Reativar a possibilidade de match\n• Reativar o chat (se houver match)`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setUnblocking(blockedUser.block_id);
      await blockService.unblockUserById(blockedUser.block_id);
      
      // Remover da lista local
      setBlockedUsers(prev => prev.filter(u => u.block_id !== blockedUser.block_id));
      
      alert(`${blockedUser.blocked_name} foi desbloqueado com sucesso!`);
    } catch (err) {
      console.error('Erro ao desbloquear usuário:', err);
      alert('Erro ao desbloquear usuário. Tente novamente.');
    } finally {
      setUnblocking(null);
    }
  };

  const formatBlockDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="blocked-users">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando usuários bloqueados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blocked-users">
        <div className="error-container">
          <p>❌ {error}</p>
          <button onClick={loadBlockedUsers} className="retry-btn">
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="blocked-users">
      <div className="blocked-users-header">
        <h2>🚫 Usuários Bloqueados</h2>
        <p>{blockedUsers.length} {blockedUsers.length === 1 ? 'usuário bloqueado' : 'usuários bloqueados'}</p>
      </div>

      {blockedUsers.length === 0 ? (
        <div className="no-blocked-users">
          <div className="no-blocked-users-icon">✅</div>
          <h3>Nenhum usuário bloqueado</h3>
          <p>Você não bloqueou nenhum usuário ainda.</p>
          <div className="no-blocked-users-info">
            <h4>ℹ️ Sobre bloqueios:</h4>
            <ul>
              <li>Usuários bloqueados não aparecem nas suas buscas</li>
              <li>Vocês não podem mais conversar (mesmo se houver match)</li>
              <li>Você pode desbloquear a qualquer momento</li>
              <li>Bloqueios são privados - o usuário não sabe que foi bloqueado</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="blocked-users-list">
          {blockedUsers.map((blockedUser) => (
            <div key={blockedUser.block_id} className="blocked-user-card">
              <div className="blocked-user-avatar">
                <img 
                  src={blockedUser.blocked_avatar || 'https://via.placeholder.com/80x80/6b46c1/ffffff?text=Avatar'} 
                  alt={blockedUser.blocked_name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/80x80/6b46c1/ffffff?text=Avatar';
                  }}
                />
              </div>
              
              <div className="blocked-user-info">
                <h3>{blockedUser.blocked_name}</h3>
                <p className="blocked-date">
                  Bloqueado em {formatBlockDate(blockedUser.created_at)}
                </p>
              </div>
              
              <div className="blocked-user-actions">
                <button 
                  className="unblock-btn"
                  onClick={() => handleUnblockUser(blockedUser)}
                  disabled={unblocking === blockedUser.block_id}
                >
                  {unblocking === blockedUser.block_id ? '⏳ Desbloqueando...' : '🔓 Desbloquear'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlockedUsers;
