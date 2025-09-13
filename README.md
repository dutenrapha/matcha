# Matcha Clone API

Uma API completa para aplicação de encontros estilo Tinder, desenvolvida com FastAPI, PostgreSQL e WebSockets.

## 🚀 Características

- **Autenticação completa**: Login, registro, verificação de email, reset de senha
- **Perfis de usuário**: Com fotos, bio, localização e preferências
- **Sistema de swipes**: Like/dislike com criação automática de matches
- **Chat em tempo real**: Via WebSockets com notificações instantâneas
- **Busca avançada**: Por idade, fama, localização e tags de interesse
- **Sistema de tags**: Para categorizar interesses dos usuários
- **Geolocalização**: Automática via IP ou manual
- **Fame rating**: Sistema de pontuação baseado em interações
- **Bloqueios e reports**: Sistema de moderação
- **Testes completos**: Cobertura de todos os endpoints

## 📋 Requisitos

- Python 3.11+
- PostgreSQL 15+
- Docker e Docker Compose (opcional)

## 🛠️ Instalação

### 🚀 Instalação Rápida (Recomendado)

1. **Clone o repositório:**
```bash
git clone <repository-url>
cd matcha4
```

2. **Setup completo automático:**
```bash
make setup
```

3. **Subir containers e configurar banco:**
```bash
make up
make migrate
make populate
```

**Pronto!** 🎉 O projeto estará rodando em:
- **API**: http://localhost:8000
- **Documentação**: http://localhost:8000/docs
- **Frontend**: http://localhost:3000 (se executado localmente)
- **Mailhog**: http://localhost:8025

### 🐳 Instalação com Docker (Completa)

1. **Clone e configure:**
```bash
git clone <repository-url>
cd matcha4
make setup
```

2. **Execute o projeto:**
```bash
make up          # Subir containers
make migrate     # Aplicar migrations
make populate    # Popular banco com dados de teste
```

### 🏃 Instalação Local (Desenvolvimento)

1. **Setup das dependências:**
```bash
make install-backend   # Instalar dependências Python
make install-frontend  # Instalar dependências Node.js
make setup-env         # Configurar arquivo .env
```

2. **Configure o PostgreSQL:**
   - Instale PostgreSQL 15+
   - Crie o banco `tinder_clone`
   - Configure as credenciais no arquivo `.env`

3. **Execute localmente:**
```bash
make run-backend   # Backend na porta 8000
make run-frontend  # Frontend na porta 3000
```

### 🔄 Reset Completo

Para resetar completamente o ambiente:
```bash
make reset
```

## 📚 Comandos Make Disponíveis

### 🚀 Comandos Principais
```bash
make setup           # Setup completo do projeto (primeira vez)
make up              # Subir containers
make migrate         # Aplicar migrations
make populate        # Popular banco com dados de teste
make reset           # Reset completo do ambiente
```

### 🐳 Docker
```bash
make up              # Subir containers
make down            # Parar containers
make build           # Rebuild containers
make dev             # Modo desenvolvimento (com logs)
make status          # Status dos containers
```

### 🗄️ Banco de Dados
```bash
make migrate         # Aplicar migrations
make populate        # Popular banco com dados de teste
make reset           # Reset completo (limpar + recriar + popular)
make psql            # Acessar banco PostgreSQL
make migration name="nome"  # Criar nova migration
```

### 🏃 Desenvolvimento Local
```bash
make run-backend     # Executar backend localmente
make run-frontend    # Executar frontend localmente
make run-local       # Executar ambos localmente
```

### 🧪 Testes
```bash
make test            # Executar testes
make test-coverage   # Testes com coverage
```

### 📋 Logs e Monitoramento
```bash
make logs            # Logs de todos os serviços
make logs-api        # Logs da API
make logs-db         # Logs do banco
make logs-frontend   # Logs do frontend
```

### 🔧 Utilitários
```bash
make clean           # Limpar cache e arquivos temporários
make help            # Mostrar ajuda completa
make install-backend # Instalar dependências do backend
make install-frontend# Instalar dependências do frontend
make setup-env       # Configurar arquivo .env
```

### 📖 Ajuda
```bash
make help            # Mostrar todos os comandos disponíveis
```

> 📚 **Guia Completo do Makefile**: Consulte o arquivo [MAKEFILE_GUIDE.md](MAKEFILE_GUIDE.md) para instruções detalhadas sobre todos os comandos disponíveis.

## 🎯 Fluxo de Instalação Recomendado

### Para Novos Desenvolvedores

1. **Clone e setup inicial:**
```bash
git clone <repository-url>
cd matcha4
make setup
```

2. **Execute o projeto:**
```bash
make up
make migrate
make populate
```

3. **Acesse a aplicação:**
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Mailhog: http://localhost:8025

### Para Desenvolvimento Local

1. **Setup das dependências:**
```bash
make install-backend
make install-frontend
make setup-env
```

2. **Configure PostgreSQL localmente**

3. **Execute em modo desenvolvimento:**
```bash
make run-backend    # Terminal 1
make run-frontend   # Terminal 2
```

### Para Reset Completo

```bash
make reset          # Limpa tudo e recria do zero
```

### Comandos de Emergência

```bash
make clean          # Limpar cache e arquivos temporários
make down && make up # Reiniciar containers
make logs           # Ver logs de todos os serviços
make fix-frontend   # Corrigir problemas do frontend
make populate-safe  # Popular banco (versão segura)
```

## 🚨 Solução de Problemas

### Erro no `make populate`
Se você receber erro de "duplicate key value violates unique constraint":

```bash
# Opção 1: Reset completo
make reset

# Opção 2: População segura
make populate-safe
```

### Erro no Frontend (localhost:3000)
Se você receber erro de "html-webpack-plugin":

```bash
# Corrigir problemas do frontend
make fix-frontend

# Ou reinstalar dependências
make install-frontend
```

### Problemas Gerais
```bash
# Limpar tudo e recomeçar
make clean
make setup
make up
make migrate
make populate-safe
```

## 🔗 Endpoints Principais

### Autenticação
- `POST /auth/login` - Login com email/senha
- `POST /auth/send-verification` - Enviar verificação de email
- `GET /auth/verify` - Verificar email com token
- `POST /auth/request-reset` - Solicitar reset de senha
- `POST /auth/reset-password` - Resetar senha

### Usuários
- `POST /users/` - Criar usuário
- `GET /users/{user_id}` - Obter usuário
- `PUT /users/{user_id}` - Atualizar usuário
- `GET /users/search` - Busca avançada
- `GET /users/top-fame/{user_id}` - Top famosos próximos

### Perfis
- `POST /profiles/` - Criar/atualizar perfil
- `GET /profiles/{user_id}` - Obter perfil
- `GET /profiles/discover/{user_id}` - Descobrir perfis

### Swipes e Matches
- `POST /swipes/` - Registrar swipe (like/dislike)
- `GET /matches/{user_id}` - Obter matches
- `GET /matches/{user_id}/with-profiles` - Matches com perfis

### Chat e Mensagens
- `POST /messages/` - Enviar mensagem
- `GET /messages/{chat_id}` - Obter mensagens
- `GET /chats/{user_id}` - Obter chats do usuário

### WebSockets
- `ws://localhost:8000/ws/chat/{chat_id}` - Chat em tempo real
- `ws://localhost:8000/ws/notifications/{user_id}` - Notificações em tempo real

### Tags e Interesses
- `POST /tags/` - Criar tag
- `GET /tags/` - Listar todas as tags
- `POST /tags/assign` - Atribuir tag ao usuário
- `GET /tags/user/{user_id}` - Tags do usuário

### Outros
- `POST /views/` - Registrar visualização de perfil
- `POST /blocks/` - Bloquear usuário
- `POST /reports/` - Reportar usuário
- `GET /notifications/{user_id}` - Obter notificações

## 🗄️ Estrutura do Banco

### Tabelas Principais
- `users` - Dados básicos dos usuários
- `profiles` - Perfis com fotos e localização
- `preferences` - Preferências de busca
- `swipes` - Histórico de likes/dislikes
- `matches` - Matches entre usuários
- `chats` - Conversas
- `messages` - Mensagens
- `notifications` - Notificações
- `tags` - Tags de interesse
- `user_tags` - Tags atribuídas aos usuários
- `profile_views` - Visualizações de perfil
- `blocked_users` - Usuários bloqueados
- `reports` - Reports de usuários

### Triggers Automáticos
- **Fame Rating**: Atualizado automaticamente em swipes, matches, views, reports e blocks
- **Notificações**: Criadas automaticamente em matches e likes

## 🧪 Testes

Execute todos os testes:
```bash
make test
```

Execute testes específicos:
```bash
pytest tests/test_auth.py -v
pytest tests/test_users.py -v
pytest tests/test_ws_chat.py -v
```

## 📊 Sistema de Fame Rating

O sistema calcula automaticamente a popularidade dos usuários baseado em:

- **Likes recebidos**: +1 ponto cada
- **Matches**: +3 pontos cada
- **Visualizações**: +0.5 pontos cada
- **Perfil completo**: +5 pontos (avatar + bio + 2+ fotos)
- **Reports**: -5 pontos cada
- **Bloqueios**: -2 pontos cada

## 🌍 Geolocalização

- **Automática**: Via IP usando ip-api.com
- **Manual**: Usuário pode ajustar localização
- **Busca**: Filtra por distância máxima configurada

## 🔒 Segurança

- **Senhas**: Hash com bcrypt + validação de força
- **JWT**: Tokens para autenticação
- **Validação**: Pydantic para todos os inputs
- **SQL Injection**: Protegido com asyncpg
- **CORS**: Configurado para desenvolvimento

## 📱 WebSockets

### Chat
```javascript
const socket = new WebSocket('ws://localhost:8000/ws/chat/1');
socket.send(JSON.stringify({
  sender_id: 1,
  content: "Hello!"
}));
```

### Notificações
```javascript
const socket = new WebSocket('ws://localhost:8000/ws/notifications/1');
socket.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  console.log('Nova notificação:', notification);
};
```

## 🐳 Docker

O projeto inclui:
- **API**: FastAPI com Python 3.11
- **Banco**: PostgreSQL 15
- **Email**: Mailhog para desenvolvimento

Acesse:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **Mailhog**: http://localhost:8025

## 📈 Monitoramento

- **Health Check**: `GET /health`
- **Logs**: `make logs-api`
- **Métricas**: Via endpoints de estatísticas

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação da API em `/docs`
2. Consulte os testes para exemplos de uso
3. Abra uma issue no repositório

---

**Desenvolvido com ❤️ usando FastAPI, PostgreSQL e WebSockets**
