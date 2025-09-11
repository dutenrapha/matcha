# Documentação da API - Matcha Clone

## Visão Geral

A API do Matcha Clone é uma aplicação completa para encontros online, desenvolvida com FastAPI. Ela oferece todas as funcionalidades necessárias para um app de dating moderno, incluindo autenticação, perfis, matches, chat em tempo real e sistema de notificações.

## Base URL

```
http://localhost:8000
```

## Autenticação

A API usa JWT (JSON Web Tokens) para autenticação. Após o login, inclua o token no header:

```
Authorization: Bearer <seu_token>
```

## Endpoints

### 🔐 Autenticação

#### Login
```http
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=password123
```

**Resposta:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user_id": 1
}
```

#### Enviar Verificação de Email
```http
POST /auth/send-verification?user_id=1
```

#### Verificar Email
```http
GET /auth/verify?token=uuid-token
```

#### Solicitar Reset de Senha
```http
POST /auth/request-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Resetar Senha
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "uuid-token",
  "new_password": "NewPassword123!"
}
```

### 👥 Usuários

#### Criar Usuário
```http
POST /users/
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "StrongPass123!"
}
```

#### Obter Usuário
```http
GET /users/1
Authorization: Bearer <token>
```

#### Atualizar Usuário
```http
PUT /users/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "João Santos"
}
```

#### Busca Avançada
```http
GET /users/search?current_user_id=1&age_min=25&age_max=35&fame_min=50&tags=vegan&sort_by=fame_rating
Authorization: Bearer <token>
```

**Parâmetros:**
- `age_min`, `age_max`: Faixa etária
- `fame_min`, `fame_max`: Faixa de fama
- `max_distance_km`: Distância máxima
- `tags`: Lista de tags (ex: `tags=vegan&tags=geek`)
- `sort_by`: `age`, `distance`, `fame_rating`, `tags`

#### Top Famosos Próximos
```http
GET /users/top-fame/1
Authorization: Bearer <token>
```

### 📋 Perfis

#### Criar/Atualizar Perfil
```http
POST /profiles/
Content-Type: application/json

{
  "user_id": 1,
  "bio": "Amo viajar e conhecer pessoas novas!",
  "age": 28,
  "gender": "male",
  "sexual_pref": "female",
  "location": "São Paulo",
  "latitude": -23.5475,
  "longitude": -46.6361,
  "avatar_url": "https://example.com/avatar.jpg",
  "photo1_url": "https://example.com/photo1.jpg",
  "photo2_url": "https://example.com/photo2.jpg"
}
```

#### Obter Perfil
```http
GET /profiles/1
```

#### Descobrir Perfis
```http
GET /profiles/discover/1?limit=10
Authorization: Bearer <token>
```

### ❤️ Swipes e Matches

#### Registrar Swipe
```http
POST /swipes/
Content-Type: application/json

{
  "swiper_id": 1,
  "swiped_id": 2,
  "direction": "like"
}
```

#### Obter Matches
```http
GET /matches/1
Authorization: Bearer <token>
```

#### Matches com Perfis
```http
GET /matches/1/with-profiles
Authorization: Bearer <token>
```

### 💬 Chat e Mensagens

#### Enviar Mensagem
```http
POST /messages/
Content-Type: application/json

{
  "chat_id": 1,
  "sender_id": 1,
  "content": "Oi! Como você está?"
}
```

#### Obter Mensagens
```http
GET /messages/1?limit=50&offset=0
Authorization: Bearer <token>
```

#### Obter Chats
```http
GET /chats/1
Authorization: Bearer <token>
```

### 🏷️ Tags

#### Criar Tag
```http
POST /tags/
Content-Type: application/json

{
  "name": "vegan"
}
```

#### Listar Tags
```http
GET /tags/
```

#### Atribuir Tag ao Usuário
```http
POST /tags/assign
Content-Type: application/json

{
  "user_id": 1,
  "tag_id": 3
}
```

#### Tags do Usuário
```http
GET /tags/user/1
```

### 👁️ Visualizações

#### Registrar Visualização
```http
POST /views/
Content-Type: application/json

{
  "viewer_id": 1,
  "viewed_id": 2
}
```

#### Visualizações Recebidas
```http
GET /views/1/received?limit=20&offset=0
Authorization: Bearer <token>
```

### 🚫 Bloqueios

#### Bloquear Usuário
```http
POST /blocks/
Content-Type: application/json

{
  "blocker_id": 1,
  "blocked_id": 2
}
```

#### Usuários Bloqueados
```http
GET /blocks/1/blocked
Authorization: Bearer <token>
```

### 📢 Reports

#### Reportar Usuário
```http
POST /reports/
Content-Type: application/json

{
  "reporter_id": 1,
  "reported_id": 2,
  "reason": "Perfil fake"
}
```

### 🔔 Notificações

#### Obter Notificações
```http
GET /notifications/1?limit=20&offset=0
Authorization: Bearer <token>
```

#### Marcar como Lida
```http
PUT /notifications/1/read
Authorization: Bearer <token>
```

## WebSockets

### Chat em Tempo Real

Conecte-se ao chat:
```javascript
const socket = new WebSocket('ws://localhost:8000/ws/chat/1');

// Enviar mensagem
socket.send(JSON.stringify({
  sender_id: 1,
  content: "Olá!"
}));

// Receber mensagens
socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Nova mensagem:', message);
};
```

### Notificações em Tempo Real

Conecte-se às notificações:
```javascript
const socket = new WebSocket('ws://localhost:8000/ws/notifications/1');

// Receber notificações
socket.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  console.log('Nova notificação:', notification);
};
```

## Códigos de Status

- `200` - Sucesso
- `201` - Criado
- `400` - Erro de validação
- `401` - Não autorizado
- `403` - Proibido
- `404` - Não encontrado
- `422` - Erro de validação de dados
- `500` - Erro interno do servidor

## Exemplos de Uso

### Fluxo Completo de Uso

1. **Criar usuário:**
```bash
curl -X POST "http://localhost:8000/users/" \
  -H "Content-Type: application/json" \
  -d '{"name":"João","email":"joao@example.com","password":"StrongPass123!"}'
```

2. **Fazer login:**
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=joao@example.com&password=StrongPass123!"
```

3. **Criar perfil:**
```bash
curl -X POST "http://localhost:8000/profiles/" \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"bio":"Amo viajar","age":28,"gender":"male","sexual_pref":"female","avatar_url":"https://example.com/avatar.jpg"}'
```

4. **Dar like:**
```bash
curl -X POST "http://localhost:8000/swipes/" \
  -H "Content-Type: application/json" \
  -d '{"swiper_id":1,"swiped_id":2,"direction":"like"}'
```

5. **Enviar mensagem:**
```bash
curl -X POST "http://localhost:8000/messages/" \
  -H "Content-Type: application/json" \
  -d '{"chat_id":1,"sender_id":1,"content":"Oi!"}'
```

## Validações

### Senhas
- Mínimo 8 caracteres
- Pelo menos 1 letra minúscula
- Pelo menos 1 letra maiúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial
- Não pode ser senha comum (password, 123456, etc.)

### Perfis
- Idade mínima: 18 anos
- Avatar obrigatório
- Localização automática via IP se não fornecida

### Swipes
- Não pode dar swipe em si mesmo
- Direção deve ser "like" ou "dislike"

## Rate Limiting

Atualmente não há rate limiting implementado, mas é recomendado para produção.

## Paginação

Muitos endpoints suportam paginação:
- `limit`: Número de itens por página (padrão: 20)
- `offset`: Número de itens a pular

## Filtros e Ordenação

### Busca Avançada
- **Filtros**: idade, fama, distância, tags
- **Ordenação**: idade, distância, fama, afinidade de tags

### Geolocalização
- **Distância**: Calculada usando fórmula de Haversine
- **Unidade**: Quilômetros
- **Precisão**: Até 2 casas decimais

## Sistema de Fame Rating

Calculado automaticamente baseado em:
- Likes recebidos: +1 ponto
- Matches: +3 pontos
- Visualizações: +0.5 pontos
- Perfil completo: +5 pontos
- Reports: -5 pontos
- Bloqueios: -2 pontos

## Tratamento de Erros

Todos os erros seguem o formato:
```json
{
  "detail": "Mensagem de erro específica"
}
```

## Logs

A API gera logs para:
- Conexões WebSocket
- Erros de validação
- Falhas de autenticação
- Operações de banco de dados

## Monitoramento

- **Health Check**: `GET /health`
- **Métricas**: Via endpoints de estatísticas
- **Logs**: Acessíveis via `make logs-api`
