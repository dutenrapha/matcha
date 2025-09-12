# Matcha Frontend

Frontend React para a aplicação Matcha Clone com integração de autenticação.

## 🚀 Funcionalidades

- **Autenticação completa**: Login e registro de usuários
- **Roteamento protegido**: Páginas acessíveis apenas para usuários logados
- **Interface moderna**: Design responsivo e intuitivo
- **Integração com API**: Comunicação completa com o backend FastAPI
- **Gerenciamento de estado**: Context API para autenticação

## 🛠️ Tecnologias

- **React 18**: Framework principal
- **React Router**: Roteamento
- **Axios**: Requisições HTTP
- **Context API**: Gerenciamento de estado
- **CSS Modules**: Estilização
- **Docker**: Containerização

## 📁 Estrutura

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Login.jsx          # Componente de login
│   │   ├── Signup.jsx         # Componente de registro
│   │   ├── Dashboard.jsx      # Página principal logada
│   │   ├── ProtectedRoute.jsx # Rota protegida
│   │   ├── Auth.css           # Estilos de autenticação
│   │   └── Dashboard.css      # Estilos do dashboard
│   ├── context/
│   │   └── AuthContext.jsx    # Context de autenticação
│   ├── services/
│   │   └── api.js             # Serviços de API
│   ├── App.jsx                # Componente principal
│   ├── App.css                # Estilos globais
│   ├── index.js               # Ponto de entrada
│   └── index.css              # Estilos base
├── Dockerfile
├── package.json
└── README.md
```

## 🚀 Como usar

### Com Docker (Recomendado)

1. **Subir todos os serviços**:
```bash
make up
```

2. **Acessar a aplicação**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Documentação: http://localhost:8000/docs

### Desenvolvimento Local

1. **Instalar dependências**:
```bash
cd frontend
npm install
```

2. **Iniciar em modo desenvolvimento**:
```bash
npm start
```

## 🔧 Comandos Make

```bash
# Subir todos os serviços
make up

# Parar todos os serviços
make down

# Ver logs do frontend
make logs-frontend

# Instalar dependências do frontend
make frontend-install

# Build do frontend
make frontend-build

# Acessar shell do frontend
make frontend-shell
```

## 🔐 Fluxo de Autenticação

1. **Usuário acessa** → Verifica se tem token válido
2. **Se não tem token** → Mostra Login/Signup
3. **Login/Signup** → Chama API → Armazena token
4. **Com token** → Mostra dashboard protegido
5. **Logout** → Remove token → Volta para login

## 📱 Páginas

### Página Inicial (`/`)
- Se não logado: Mostra formulário de Login/Signup
- Se logado: Redireciona para `/dashboard`

### Dashboard (`/dashboard`)
- Página protegida
- Mostra informações do usuário logado
- Botão de logout

## 🎨 Design

- **Cores**: Gradiente azul/roxo
- **Tipografia**: System fonts (San Francisco, Segoe UI, etc.)
- **Responsivo**: Funciona em desktop e mobile
- **Acessibilidade**: Foco visível e navegação por teclado

## 🔗 Integração com Backend

O frontend se comunica com os seguintes endpoints:

- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/me` - Informações do usuário atual
- `POST /users/` - Criar usuário

## 🐳 Docker

O frontend é containerizado e configurado para:
- Hot reload em desenvolvimento
- Build otimizado para produção
- Integração com o backend via Docker Compose

## 📝 Variáveis de Ambiente

- `REACT_APP_API_URL`: URL da API backend (padrão: http://localhost:8000)

## 🧪 Desenvolvimento

Para desenvolvimento local sem Docker:

1. Certifique-se que o backend está rodando em http://localhost:8000
2. Execute `npm start` no diretório frontend
3. Acesse http://localhost:3000

## 🚀 Deploy

Para produção, use:
```bash
make frontend-build
```

Isso criará uma versão otimizada do frontend.
