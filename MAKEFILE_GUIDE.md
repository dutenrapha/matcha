# 🚀 Guia do Makefile - Matcha Clone

Este guia explica como usar o Makefile para gerenciar o projeto Matcha Clone de forma eficiente.

## 📋 Pré-requisitos

- **Docker e Docker Compose** (para execução com containers)
- **Python 3.11+** (para desenvolvimento local)
- **Node.js 16+** (para desenvolvimento local)
- **Make** (geralmente já instalado no Linux/macOS)

## 🎯 Comandos Principais

### Setup Inicial (Primeira Vez)

```bash
# Setup completo - instala todas as dependências
make setup

# Ou passo a passo:
make install-backend   # Instalar dependências Python
make install-frontend  # Instalar dependências Node.js
make setup-env         # Configurar arquivo .env
```

### Execução com Docker (Recomendado)

```bash
# Sequência completa para rodar o projeto
make up          # Subir containers
make migrate     # Aplicar migrations
make populate    # Popular banco com dados de teste
```

### Desenvolvimento Local

```bash
# Executar backend localmente
make run-backend

# Executar frontend localmente (em outro terminal)
make run-frontend

# Ou executar ambos (em paralelo)
make run-local
```

## 📚 Comandos Detalhados

### 🐳 Docker

| Comando | Descrição |
|---------|-----------|
| `make up` | Subir containers em background |
| `make down` | Parar todos os containers |
| `make build` | Rebuild completo dos containers |
| `make dev` | Modo desenvolvimento (com logs) |
| `make status` | Ver status dos containers |

### 🗄️ Banco de Dados

| Comando | Descrição |
|---------|-----------|
| `make migrate` | Aplicar todas as migrations |
| `make populate` | Popular banco com dados de teste |
| `make reset` | Reset completo (limpar + recriar + popular) |
| `make psql` | Acessar banco PostgreSQL |
| `make migration name="nome"` | Criar nova migration |

### 🧪 Testes

| Comando | Descrição |
|---------|-----------|
| `make test` | Executar todos os testes |
| `make test-coverage` | Testes com relatório de coverage |

### 📋 Logs

| Comando | Descrição |
|---------|-----------|
| `make logs` | Logs de todos os serviços |
| `make logs-api` | Logs apenas da API |
| `make logs-db` | Logs apenas do banco |
| `make logs-frontend` | Logs apenas do frontend |

### 🔧 Utilitários

| Comando | Descrição |
|---------|-----------|
| `make clean` | Limpar cache e arquivos temporários |
| `make help` | Mostrar ajuda completa |

## 🎯 Fluxos de Trabalho

### Para Novos Desenvolvedores

1. **Clone o repositório:**
```bash
git clone <repository-url>
cd matcha4
```

2. **Setup inicial:**
```bash
make setup
```

3. **Execute o projeto:**
```bash
make up
make migrate
make populate
```

4. **Acesse:**
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Mailhog: http://localhost:8025

### Para Desenvolvimento

1. **Desenvolvimento com Docker:**
```bash
make dev  # Executa com logs em tempo real
```

2. **Desenvolvimento local:**
```bash
make run-backend    # Terminal 1
make run-frontend   # Terminal 2
```

### Para Testes

```bash
make test           # Executar testes
make test-coverage  # Testes com coverage
```

### Para Reset Completo

```bash
make reset  # Limpa tudo e recria do zero
```

## 🔧 Configuração

### Arquivo .env

O comando `make setup-env` cria automaticamente o arquivo `.env` a partir do `env.example`. Edite conforme necessário:

```bash
# Exemplo de configuração
DATABASE_URL=postgresql://postgres:password@localhost:5432/tinder_clone
SECRET_KEY=your-secret-key-here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### Dependências

- **Backend**: Instaladas via `requirements.txt`
- **Frontend**: Instaladas via `package.json`

## 🚨 Solução de Problemas

### Containers não sobem

```bash
make down
make build
make up
```

### Problemas de permissão

```bash
make clean
sudo chown -R $USER:$USER .
make setup
```

### Banco de dados corrompido

```bash
make reset
```

### Dependências desatualizadas

```bash
make clean
make install-backend
make install-frontend
```

## 📊 Monitoramento

### Ver logs em tempo real

```bash
make logs           # Todos os serviços
make logs-api       # Apenas API
make logs-db        # Apenas banco
```

### Status dos containers

```bash
make status
```

### Limpeza de cache

```bash
make clean
```

## 🎉 Comandos de Emergência

```bash
# Reset completo
make reset

# Reiniciar containers
make down && make up

# Ver logs de erro
make logs

# Limpar tudo e recomeçar
make clean && make setup && make up
```

## 📖 Ajuda

Para ver todos os comandos disponíveis:

```bash
make help
```

---

**💡 Dica**: Use `make help` sempre que precisar relembrar os comandos disponíveis!
