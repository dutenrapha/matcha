import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, userService } from '../services/api';
import googleAuthService from '../services/googleAuth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Verificar se usuário está logado ao carregar a aplicação
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // Verificar se o token ainda é válido
          const userData = await authService.getCurrentUser();
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          // Token inválido, limpar storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      const { access_token } = response;

      // Armazenar token no localStorage PRIMEIRO
      localStorage.setItem('token', access_token);

      // Agora obter dados completos do usuário (o interceptor já terá o token)
      const userData = await authService.getCurrentUser();

      // Armazenar dados do usuário
      localStorage.setItem('user', JSON.stringify(userData));

      // Atualizar estado
      setToken(access_token);
      setUser(userData);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro no login';
      return { success: false, error: message };
    }
  };

  const signup = async (name, email, username, password) => {
    try {
      // Criar usuário
      const createResponse = await userService.createUser({ name, email, username, password });
      
      // Verificar se o usuário foi criado com sucesso e obter o ID
      if (createResponse.user_id) {
        try {
          // Enviar email de verificação
          await authService.sendVerification(createResponse.user_id);
          
          return { 
            success: true, 
            message: 'Usuário criado com sucesso! Um email de verificação foi enviado para você. Faça login para continuar.' 
          };
        } catch (verificationError) {
          // Se falhar ao enviar verificação, ainda consideramos o signup como sucesso
          console.error('Erro ao enviar verificação:', verificationError);
          
          return { 
            success: true, 
            message: 'Usuário criado com sucesso! Faça login para continuar.' 
          };
        }
      } else {
        return { 
          success: true, 
          message: 'Usuário criado com sucesso! Faça login para continuar.' 
        };
      }
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao criar usuário';
      return { success: false, error: message };
    }
  };

  const loginWithGoogle = async () => {
    try {
      // Fazer login com Google
      const googleResult = await googleAuthService.signIn();
      
      if (!googleResult.success) {
        return { success: false, error: googleResult.error };
      }

      // O googleAuthService.signIn() já retorna o JWT do sistema
      const { access_token, user_id, is_new_user } = googleResult.data;

      // Armazenar token no localStorage
      localStorage.setItem('token', access_token);

      // Obter dados completos do usuário
      const userData = await authService.getCurrentUser();

      // Armazenar dados do usuário
      localStorage.setItem('user', JSON.stringify(userData));

      // Atualizar estado
      setToken(access_token);
      setUser(userData);

      return { 
        success: true, 
        isNewUser: is_new_user,
        message: is_new_user ? 'Conta criada com sucesso!' : 'Login realizado com sucesso!'
      };
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro no login com Google';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      // Logout do Google
      await googleAuthService.signOut();
      
      // Logout do backend
      await authService.logout();
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Limpar estado e localStorage
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirecionar para a página inicial
      window.location.href = '/';
    }
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
