import axios from 'axios';

// Configurar URL base da API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Criar instância do axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Só redirecionar se não estivermos na página inicial
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authService = {
  // Login
  login: async (username, password) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erro no logout:', error);
      // Não relançar o erro para evitar que o interceptor redirecione
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Obter informações do usuário atual
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Enviar verificação de email
  sendVerification: async (userId) => {
    const response = await api.post(`/auth/send-verification?user_id=${userId}`);
    return response.data;
  },

  // Solicitar reset de senha
  requestPasswordReset: async (email) => {
    const response = await api.post('/auth/request-reset', { email });
    return response.data;
  },

  // Resetar senha com token
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', {
      token,
      new_password: newPassword
    });
    return response.data;
  },
};

// Serviços de usuário
export const userService = {
  // Criar usuário
  createUser: async (userData) => {
    const response = await api.post('/users/', userData);
    return response.data;
  },

  // Obter usuário por ID
  getUser: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Atualizar usuário
  updateUser: async (userId, userData) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },
};

// Serviços de perfil
export const profileService = {
  // Criar ou atualizar perfil
  createOrUpdateProfile: async (profileData) => {
    const response = await api.post('/profiles/', profileData);
    return response.data;
  },

  // Obter perfil por user_id
  getProfile: async (userId) => {
    const response = await api.get(`/profiles/${userId}`);
    return response.data;
  },

  // Atualizar perfil
  updateProfile: async (userId, profileData) => {
    const response = await api.put(`/profiles/${userId}`, profileData);
    return response.data;
  },

  // Descobrir perfis
  discoverProfiles: async (userId, limit = 10) => {
    const response = await api.get(`/profiles/discover/${userId}?limit=${limit}`);
    return response.data;
  },

  // Verificar status do perfil
  getProfileStatus: async (userId) => {
    const response = await api.get(`/profiles/${userId}/status`);
    return response.data;
  },
};

// Serviços de preferências
export const preferencesService = {
  // Criar ou atualizar preferências
  createOrUpdatePreferences: async (preferencesData) => {
    const response = await api.post('/preferences/', preferencesData);
    return response.data;
  },

  // Obter preferências
  getPreferences: async (userId) => {
    const response = await api.get(`/preferences/${userId}`);
    return response.data;
  },
};

// Serviços de tags
export const tagsService = {
  // Obter todas as tags
  getAllTags: async () => {
    const response = await api.get('/tags/');
    return response.data;
  },

  // Criar nova tag
  createTag: async (tagData) => {
    const response = await api.post('/tags/', tagData);
    return response.data;
  },

  // Obter tags do usuário
  getUserTags: async (userId) => {
    const response = await api.get(`/tags/user/${userId}`);
    return response.data.tags || [];
  },

  // Atribuir tag ao usuário
  assignTag: async (userId, tagId) => {
    const response = await api.post('/tags/assign', { user_id: userId, tag_id: tagId });
    return response.data;
  },

  // Remover tag do usuário
  removeTag: async (userId, tagId) => {
    const response = await api.delete('/tags/unassign', { 
      data: { user_id: userId, tag_id: tagId } 
    });
    return response.data;
  },
};

// Serviços de swipe
export const swipeService = {
  // Dar like/dislike
  addSwipe: async (swiperId, swipedId, direction) => {
    const response = await api.post('/swipes/', {
      swiper_id: swiperId,
      swiped_id: swipedId,
      direction: direction
    });
    return response.data;
  },

  // Obter likes recebidos
  getLikesReceived: async (userId) => {
    const response = await api.get(`/swipes/likes-received/${userId}`);
    return response.data;
  },

  // Obter swipes dados
  getSwipesGiven: async (userId) => {
    const response = await api.get(`/swipes/given/${userId}`);
    return response.data;
  },
};

// Serviços de busca
export const searchService = {
  // Busca avançada
  advancedSearch: async (currentUserId, filters = {}) => {
    const params = new URLSearchParams();
    params.append('current_user_id', currentUserId);
    
    if (filters.age_min) params.append('age_min', filters.age_min);
    if (filters.age_max) params.append('age_max', filters.age_max);
    if (filters.fame_min) params.append('fame_min', filters.fame_min);
    if (filters.fame_max) params.append('fame_max', filters.fame_max);
    if (filters.max_distance_km) params.append('max_distance_km', filters.max_distance_km);
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    
    const response = await api.get(`/users/search?${params.toString()}`);
    return response.data;
  },
  
  // Buscar tags
  searchTags: async (query, limit = 10) => {
    const response = await api.get(`/tags/search/${query}?limit=${limit}`);
    return response.data;
  },
  
  // Top famosos próximos
  getTopFame: async (userId) => {
    const response = await api.get(`/users/top-fame/${userId}`);
    return response.data;
  },
};

// Serviços de matches
export const matchesService = {
  // Obter matches do usuário
  getMatches: async (userId) => {
    const response = await api.get(`/matches/${userId}`);
    return response.data;
  },

  // Obter matches com perfis
  getMatchesWithProfiles: async (userId) => {
    const response = await api.get(`/matches/${userId}/with-profiles`);
    return response.data;
  },

  // Obter contagem de matches
  getMatchCount: async (userId) => {
    const response = await api.get(`/matches/${userId}/count`);
    return response.data;
  },

  // Obter estatísticas de matches
  getMatchStats: async (userId) => {
    const response = await api.get(`/matches/${userId}/stats`);
    return response.data;
  },

  // Deletar match (unmatch)
  deleteMatch: async (matchId) => {
    const response = await api.delete(`/matches/${matchId}`);
    return response.data;
  },
};

// Serviços de chat
export const chatService = {
  // Obter chats do usuário
  getUserChats: async (userId) => {
    const response = await api.get(`/chats/${userId}`);
    return response.data;
  },

  // Obter chats com perfis
  getChatsWithProfiles: async (userId) => {
    const response = await api.get(`/chats/${userId}/with-profiles`);
    return response.data;
  },

  // Obter informações do chat
  getChatInfo: async (chatId) => {
    const response = await api.get(`/chats/${chatId}/info`);
    return response.data;
  },

  // Obter participantes do chat
  getChatParticipants: async (chatId) => {
    const response = await api.get(`/chats/${chatId}/participants`);
    return response.data;
  },

  // Deletar chat
  deleteChat: async (chatId) => {
    const response = await api.delete(`/chats/${chatId}`);
    return response.data;
  },

  // Obter contagem de mensagens não lidas
  getUnreadCount: async (userId) => {
    const response = await api.get(`/chats/${userId}/unread-count`);
    return response.data;
  },
};

// Serviços de mensagens
export const messageService = {
  // Enviar mensagem
  sendMessage: async (chatId, senderId, content) => {
    const response = await api.post('/messages/', {
      chat_id: chatId,
      sender_id: senderId,
      content: content
    });
    return response.data;
  },

  // Obter mensagens do chat
  getMessages: async (chatId, limit = 50, offset = 0) => {
    const response = await api.get(`/messages/${chatId}?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  // Obter mensagens com remetentes
  getMessagesWithSenders: async (chatId, limit = 50, offset = 0) => {
    const response = await api.get(`/messages/${chatId}/with-senders?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  // Marcar mensagem como lida
  markMessageRead: async (messageId) => {
    const response = await api.put(`/messages/${messageId}/read`);
    return response.data;
  },

  // Marcar todas as mensagens do chat como lidas
  markAllMessagesRead: async (chatId, userId) => {
    const response = await api.put(`/messages/chat/${chatId}/read-all?user_id=${userId}`);
    return response.data;
  },

  // Deletar mensagem
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  // Obter contagem de mensagens
  getMessageCount: async (chatId) => {
    const response = await api.get(`/messages/${chatId}/count`);
    return response.data;
  },
};

// Serviços de notificações
export const notificationService = {
  // Obter notificações do usuário
  getNotifications: async (userId, limit = 20, offset = 0) => {
    const response = await api.get(`/notifications/${userId}?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  // Obter notificações não lidas
  getUnreadNotifications: async (userId) => {
    const response = await api.get(`/notifications/${userId}/unread`);
    return response.data;
  },

  // Obter contagem de notificações não lidas
  getUnreadCount: async (userId) => {
    const response = await api.get(`/notifications/${userId}/count`);
    return response.data;
  },

  // Marcar notificação como lida
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Marcar todas as notificações como lidas
  markAllAsRead: async (userId) => {
    const response = await api.put(`/notifications/${userId}/read-all`);
    return response.data;
  },

  // Criar notificação
  createNotification: async (userId, type, content) => {
    const response = await api.post('/notifications/', {
      user_id: userId,
      type: type,
      content: content
    });
    return response.data;
  },

  // Deletar notificação
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Deletar todas as notificações
  deleteAllNotifications: async (userId) => {
    const response = await api.delete(`/notifications/${userId}/all`);
    return response.data;
  },
};

// Serviços de bloqueios
export const blockService = {
  // Bloquear usuário
  blockUser: async (blockerId, blockedId) => {
    const response = await api.post('/blocks/', {
      blocker_id: blockerId,
      blocked_id: blockedId
    });
    return response.data;
  },

  // Desbloquear usuário por IDs
  unblockUser: async (blockerId, blockedId) => {
    const response = await api.delete(`/blocks/user/${blockerId}/${blockedId}`);
    return response.data;
  },

  // Desbloquear usuário por block_id
  unblockUserById: async (blockId) => {
    const response = await api.delete(`/blocks/${blockId}`);
    return response.data;
  },

  // Obter usuários bloqueados pelo usuário
  getBlockedUsers: async (userId) => {
    const response = await api.get(`/blocks/${userId}/blocked`);
    return response.data;
  },

  // Obter usuários que bloquearam o usuário
  getUsersWhoBlocked: async (userId) => {
    const response = await api.get(`/blocks/${userId}/blocked-by`);
    return response.data;
  },

  // Verificar status de bloqueio entre dois usuários
  checkBlockStatus: async (user1Id, user2Id) => {
    const response = await api.get(`/blocks/check/${user1Id}/${user2Id}`);
    return response.data;
  },

  // Obter contagem de bloqueios
  getBlockCount: async (userId) => {
    const response = await api.get(`/blocks/${userId}/count`);
    return response.data;
  },
};

// Serviços de reports
export const reportService = {
  // Reportar usuário
  reportUser: async (reporterId, reportedId, reason) => {
    const response = await api.post('/reports/', {
      reporter_id: reporterId,
      reported_id: reportedId,
      reason: reason
    });
    return response.data;
  },

  // Obter reports feitos pelo usuário
  getReportsMade: async (userId) => {
    const response = await api.get(`/reports/${userId}/made`);
    return response.data;
  },

  // Obter reports recebidos pelo usuário
  getReportsReceived: async (userId) => {
    const response = await api.get(`/reports/${userId}/received`);
    return response.data;
  },

  // Obter contagem de reports
  getReportCount: async (userId) => {
    const response = await api.get(`/reports/${userId}/count`);
    return response.data;
  },

  // Deletar report
  deleteReport: async (reportId) => {
    const response = await api.delete(`/reports/${reportId}`);
    return response.data;
  },

  // Obter todos os reports (admin)
  getAllReports: async (limit = 50, offset = 0) => {
    const response = await api.get(`/reports/admin/all?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  // Obter estatísticas de reports (admin)
  getReportStats: async () => {
    const response = await api.get('/reports/admin/stats');
    return response.data;
  },
};

// Serviços de visualizações
export const viewService = {
  // Registrar visualização de perfil
  addView: async (viewerId, viewedId) => {
    const response = await api.post('/views/', {
      viewer_id: viewerId,
      viewed_id: viewedId
    });
    return response.data;
  },

  // Obter visualizações recebidas pelo usuário
  getViewsReceived: async (userId, limit = 20, offset = 0) => {
    const response = await api.get(`/views/${userId}/received?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  // Obter visualizações dadas pelo usuário
  getViewsGiven: async (userId, limit = 20, offset = 0) => {
    const response = await api.get(`/views/${userId}/given?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  // Obter contagem de visualizações
  getViewCount: async (userId) => {
    const response = await api.get(`/views/${userId}/count`);
    return response.data;
  },

  // Obter visualizações recentes
  getRecentViews: async (userId, days = 7) => {
    const response = await api.get(`/views/${userId}/recent?days=${days}`);
    return response.data;
  },

  // Deletar visualização
  deleteView: async (viewId) => {
    const response = await api.delete(`/views/${viewId}`);
    return response.data;
  },
};

// Serviços de status online
export const statusService = {
  // Atualizar status online do usuário
  updateOnlineStatus: async (isOnline) => {
    const response = await api.put('/status/online', {
      is_online: isOnline
    });
    return response.data;
  },

  // Obter status de um usuário específico
  getUserStatus: async (userId) => {
    const response = await api.get(`/status/${userId}`);
    return response.data;
  },

  // Obter status de múltiplos usuários
  getMultipleUsersStatus: async (userIds) => {
    const userIdsString = Array.isArray(userIds) ? userIds.join(',') : userIds;
    const response = await api.get('/status/batch', {
      params: { user_ids: userIdsString }
    });
    return response.data;
  },

  // Obter lista de usuários online
  getOnlineUsers: async () => {
    const response = await api.get('/status/online/users');
    return response.data;
  }
};

export default api;
