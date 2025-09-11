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

### Opção 1: Docker (Recomendado)

1. Clone o repositório:
```bash
git clone <repository-url>
cd matcha-clone-backend
```

2. Configure as variáveis de ambiente:
```bash
cp env.example .env
# Edite o .env conforme necessário
```

3. Suba os containers:
```bash
make up
```

4. Aplique as migrations:
```bash
make migrate
```

5. Popule o banco com dados de teste:
```bash
make populate
```

### Opção 2: Instalação Local

1. Instale as dependências:
```bash
pip install -r requirements.txt
```

2. Configure o PostgreSQL e crie o banco `tinder_clone`

3. Configure as variáveis de ambiente no arquivo `.env`

4. Aplique as migrations:
```bash
alembic upgrade head
```

5. Popule o banco:
```bash
python scripts/populate.py
```

6. Execute a API:
```bash
uvicorn app.main:app --reload
```

## 📚 Comandos Úteis

```bash
# Subir containers
make up

# Derrubar containers
make down

# Rebuild completo
make build

# Aplicar migrations
make migrate

# Rodar testes
make test

# Popular banco com 500 usuários
make populate

# Reset completo (limpar + recriar + popular)
make reset

# Ver logs da API
make logs-api

# Acessar banco PostgreSQL
make psql
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
