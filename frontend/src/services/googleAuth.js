// Configuração do Google OAuth
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id-here';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class GoogleAuthService {
  constructor() {
    this.isInitialized = false;
    this.google = null;
  }

  /**
   * Inicializa o Google Identity Services
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Carregar a nova biblioteca do Google Identity Services
      await this.loadGoogleScript();
      this.isInitialized = true;
    } catch (error) {
      console.error('Erro ao inicializar Google Auth:', error);
      throw error;
    }
  }

  /**
   * Carrega o script do Google Identity Services
   */
  loadGoogleScript() {
    return new Promise((resolve, reject) => {
      if (window.google) {
        this.google = window.google;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        this.google = window.google;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Inicia o processo de login com Google usando a nova API
   */
  async signIn() {
    try {
      await this.initialize();
      
      return new Promise((resolve) => {
        this.google.accounts.oauth2.initCodeClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: async (response) => {
            try {
              // Enviar o código para o backend fazer a troca por token
              const backendResponse = await fetch(`${API_URL}/auth/google/callback`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  code: response.code,
                  redirect_uri: window.location.origin,
                }),
              });

              if (backendResponse.ok) {
                const data = await backendResponse.json();
                resolve({
                  success: true,
                  data: {
                    access_token: data.access_token,
                    user_id: data.user_id,
                    is_new_user: data.is_new_user
                  }
                });
              } else {
                const errorData = await backendResponse.json();
                resolve({
                  success: false,
                  error: errorData.detail || 'Erro no processamento do login'
                });
              }
            } catch (error) {
              console.error('Erro ao processar resposta do Google:', error);
              resolve({
                success: false,
                error: error.message || 'Erro no processamento do login'
              });
            }
          },
        }).requestCode();
      });
    } catch (error) {
      console.error('Erro no login Google:', error);
      return {
        success: false,
        error: error.message || 'Erro no login com Google'
      };
    }
  }

  /**
   * Faz logout do Google (simplificado para nova API)
   */
  async signOut() {
    try {
      // A nova API não mantém estado de sessão no frontend
      // O logout é gerenciado pelo backend
      console.log('Logout do Google realizado');
    } catch (error) {
      console.error('Erro no logout Google:', error);
    }
  }

  /**
   * Verifica se o usuário está logado no Google (simplificado)
   */
  async isSignedIn() {
    // A nova API não mantém estado de sessão no frontend
    // A verificação é feita via token no backend
    return false;
  }

  /**
   * Obtém o usuário atual do Google (simplificado)
   */
  async getCurrentUser() {
    // A nova API não mantém estado de sessão no frontend
    // As informações do usuário são obtidas via token no backend
    return null;
  }
}

// Instância singleton
const googleAuthService = new GoogleAuthService();

export default googleAuthService;