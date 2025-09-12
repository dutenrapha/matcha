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
  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
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

export default api;
