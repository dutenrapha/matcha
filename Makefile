# Variáveis
DOCKER_COMPOSE = docker-compose
API_SERVICE = api
DB_SERVICE = db
FRONTEND_SERVICE = frontend
PYTHON = python3
NODE = node
NPM = npm

# =============================================================================
# SETUP INICIAL - Instalação completa do projeto
# =============================================================================

# Setup completo: instalar dependências e configurar ambiente
setup: install-backend install-frontend setup-env
	@echo "✅ Setup completo realizado com sucesso!"
	@echo "📋 Próximos passos:"
	@echo "   1. make up      - Subir containers"
	@echo "   2. make migrate - Aplicar migrations"
	@echo "   3. make populate - Popular banco com dados de teste"

# Instalar dependências do backend
install-backend:
	@echo "🐍 Instalando dependências do backend..."
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -r requirements.txt
	@echo "✅ Dependências do backend instaladas!"

# Instalar dependências do frontend
install-frontend:
	@echo "📦 Instalando dependências do frontend..."
	cd frontend && rm -rf node_modules package-lock.json
	cd frontend && $(NPM) install
	@echo "✅ Dependências do frontend instaladas!"

# Configurar arquivo de ambiente
setup-env:
	@echo "⚙️  Configurando arquivo de ambiente..."
	@if [ ! -f .env ]; then \
		cp env.example .env; \
		echo "📝 Arquivo .env criado a partir do env.example"; \
		echo "⚠️  Edite o arquivo .env conforme necessário"; \
	else \
		echo "✅ Arquivo .env já existe"; \
	fi

# =============================================================================
# DOCKER - Gerenciamento de containers
# =============================================================================

# Subir containers
up:
	@echo "🚀 Subindo containers..."
	$(DOCKER_COMPOSE) up -d
	@echo "✅ Containers iniciados!"
	@echo "🌐 API: http://localhost:8000"
	@echo "📚 Docs: http://localhost:8000/docs"
	@echo "📧 Mailhog: http://localhost:8025"
	@echo "⚛️  Frontend: http://localhost:3000"

# Derrubar containers
down:
	@echo "🛑 Parando containers..."
	$(DOCKER_COMPOSE) down
	@echo "✅ Containers parados!"

# Rebuild total
build:
	@echo "🔨 Rebuild completo dos containers..."
	$(DOCKER_COMPOSE) up --build -d
	@echo "✅ Containers rebuildados!"

# Subir com logs (foreground)
dev:
	@echo "🔍 Iniciando em modo desenvolvimento..."
	$(DOCKER_COMPOSE) up

# =============================================================================
# BANCO DE DADOS
# =============================================================================

# Aplicar migrations
migrate:
	@echo "🗄️  Aplicando migrations..."
	$(DOCKER_COMPOSE) run --rm $(API_SERVICE) alembic upgrade head
	@echo "✅ Migrations aplicadas!"

# Criar nova migration
migration:
	@echo "📝 Criando nova migration: $(name)"
	$(DOCKER_COMPOSE) run --rm $(API_SERVICE) alembic revision --autogenerate -m "$(name)"
	@echo "✅ Migration criada!"

# Popular DB com dados de teste
populate:
	@echo "👥 Populando banco com dados de teste..."
	$(DOCKER_COMPOSE) run --rm $(API_SERVICE) python scripts/populate.py
	@echo "✅ Banco populado com sucesso!"

# Resetar ambiente: limpar DB, recriar, aplicar migrations e popular
reset:
	@echo "🔄 Resetando ambiente completo..."
	$(DOCKER_COMPOSE) down -v
	$(DOCKER_COMPOSE) up -d db
	@echo "⏳ Aguardando banco inicializar..."
	sleep 5
	$(DOCKER_COMPOSE) run --rm $(API_SERVICE) alembic upgrade head
	$(DOCKER_COMPOSE) run --rm $(API_SERVICE) python scripts/populate.py
	@echo "✅ Ambiente resetado com sucesso!"


# Acessar banco
psql:
	@echo "🗄️  Conectando ao banco PostgreSQL..."
	$(DOCKER_COMPOSE) exec -it $(DB_SERVICE) psql -U postgres -d tinder_clone

# =============================================================================
# DESENVOLVIMENTO LOCAL (sem Docker)
# =============================================================================

# Executar backend localmente
run-backend:
	@echo "🐍 Iniciando backend localmente..."
	$(PYTHON) -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Executar frontend localmente
run-frontend:
	@echo "⚛️  Iniciando frontend localmente..."
	cd frontend && $(NPM) start

# Corrigir problemas do frontend
fix-frontend:
	@echo "🔧 Corrigindo problemas do frontend..."
	cd frontend && rm -rf node_modules package-lock.json
	cd frontend && $(NPM) cache clean --force
	cd frontend && $(NPM) install
	@echo "✅ Frontend corrigido!"

# Executar ambos localmente (em paralelo)
run-local: run-backend run-frontend

# =============================================================================
# TESTES
# =============================================================================

# Rodar testes
test:
	@echo "🧪 Executando testes..."
	$(DOCKER_COMPOSE) run --rm $(API_SERVICE) pytest -v
	@echo "✅ Testes concluídos!"

# Rodar testes com coverage
test-coverage:
	@echo "📊 Executando testes com coverage..."
	$(DOCKER_COMPOSE) run --rm $(API_SERVICE) pytest --cov=app --cov-report=html -v
	@echo "✅ Testes com coverage concluídos!"

# =============================================================================
# LOGS E MONITORAMENTO
# =============================================================================

# Logs da API
logs-api:
	@echo "📋 Exibindo logs da API..."
	$(DOCKER_COMPOSE) logs -f $(API_SERVICE)

# Logs do banco
logs-db:
	@echo "📋 Exibindo logs do banco..."
	$(DOCKER_COMPOSE) logs -f $(DB_SERVICE)

# Logs do frontend
logs-frontend:
	@echo "📋 Exibindo logs do frontend..."
	$(DOCKER_COMPOSE) logs -f $(FRONTEND_SERVICE)

# Logs de todos os serviços
logs:
	@echo "📋 Exibindo logs de todos os serviços..."
	$(DOCKER_COMPOSE) logs -f

# =============================================================================
# UTILITÁRIOS
# =============================================================================

# Limpar cache e arquivos temporários
clean:
	@echo "🧹 Limpando cache e arquivos temporários..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	cd frontend && rm -rf node_modules/.cache 2>/dev/null || true
	@echo "✅ Limpeza concluída!"

# Verificar status dos containers
status:
	@echo "📊 Status dos containers:"
	$(DOCKER_COMPOSE) ps

# Mostrar ajuda
help:
	@echo "🚀 Matcha Clone - Comandos disponíveis:"
	@echo ""
	@echo "📦 SETUP:"
	@echo "  make setup           - Setup completo do projeto"
	@echo "  make install-backend - Instalar dependências do backend"
	@echo "  make install-frontend- Instalar dependências do frontend"
	@echo "  make setup-env       - Configurar arquivo .env"
	@echo ""
	@echo "🐳 DOCKER:"
	@echo "  make up              - Subir containers"
	@echo "  make down            - Parar containers"
	@echo "  make build           - Rebuild containers"
	@echo "  make dev             - Modo desenvolvimento"
	@echo ""
	@echo "🗄️  BANCO DE DADOS:"
	@echo "  make migrate         - Aplicar migrations"
	@echo "  make populate        - Popular banco com dados de teste"
	@echo "  make reset           - Reset completo do ambiente"
	@echo "  make psql            - Acessar banco PostgreSQL"
	@echo ""
	@echo "🏃 DESENVOLVIMENTO LOCAL:"
	@echo "  make run-backend     - Executar backend localmente"
	@echo "  make run-frontend    - Executar frontend localmente"
	@echo "  make run-local       - Executar ambos localmente"
	@echo ""
	@echo "🧪 TESTES:"
	@echo "  make test            - Executar testes"
	@echo "  make test-coverage   - Testes com coverage"
	@echo ""
	@echo "📋 LOGS:"
	@echo "  make logs            - Logs de todos os serviços"
	@echo "  make logs-api        - Logs da API"
	@echo "  make logs-db         - Logs do banco"
	@echo "  make logs-frontend   - Logs do frontend"
	@echo ""
	@echo "🔧 UTILITÁRIOS:"
	@echo "  make clean           - Limpar cache e arquivos temporários"
	@echo "  make fix-frontend    - Corrigir problemas do frontend (local)"
	@echo "  make status          - Status dos containers"
	@echo "  make help            - Mostrar esta ajuda"
	@echo ""
	@echo "⚛️  FRONTEND (resolver problemas de cache):"
	@echo "  make frontend-clean-rebuild  - Limpar cache e rebuildar frontend"
	@echo "  make frontend-force-rebuild  - Rebuild completo do frontend"
	@echo "  make frontend-quick-rebuild  - Rebuild rápido (apenas remove build antigo)"
	@echo "  make dev-frontend           - Modo desenvolvimento (rebuild + logs)"
	@echo "  make frontend-logs          - Ver logs do frontend"

# =============================================================================
# FRONTEND - Comandos específicos para resolver problemas de cache
# =============================================================================

# Instalar dependências do frontend no container
frontend-install:
	@echo "📦 Instalando dependências do frontend no container..."
	$(DOCKER_COMPOSE) run --rm $(FRONTEND_SERVICE) npm install
	@echo "✅ Dependências instaladas!"

# Build do frontend no container
frontend-build:
	@echo "🔨 Fazendo build do frontend no container..."
	$(DOCKER_COMPOSE) run --rm $(FRONTEND_SERVICE) npm run build
	@echo "✅ Build concluído!"

# Limpar cache do frontend e rebuild
frontend-clean-rebuild:
	@echo "🧹 Limpando cache do frontend e rebuildando..."
	$(DOCKER_COMPOSE) down $(FRONTEND_SERVICE)
	@echo "🗑️  Removendo build antigo..."
	sudo rm -rf frontend/build/
	@echo "🔨 Rebuildando frontend sem cache..."
	$(DOCKER_COMPOSE) build $(FRONTEND_SERVICE) --no-cache
	$(DOCKER_COMPOSE) up $(FRONTEND_SERVICE) -d
	@echo "✅ Frontend rebuildado com sucesso!"

# Forçar rebuild completo do frontend
frontend-force-rebuild:
	@echo "🚀 Forçando rebuild completo do frontend..."
	$(DOCKER_COMPOSE) down $(FRONTEND_SERVICE)
	@echo "🗑️  Removendo build e node_modules antigos..."
	sudo rm -rf frontend/build/ frontend/node_modules/
	@echo "🔨 Rebuildando frontend do zero..."
	$(DOCKER_COMPOSE) build $(FRONTEND_SERVICE) --no-cache
	$(DOCKER_COMPOSE) up $(FRONTEND_SERVICE) -d
	@echo "✅ Frontend rebuildado do zero com sucesso!"

# Rebuild rápido do frontend (apenas remove build antigo)
frontend-quick-rebuild:
	@echo "⚡ Rebuild rápido do frontend..."
	$(DOCKER_COMPOSE) down $(FRONTEND_SERVICE)
	@echo "🗑️  Removendo build antigo..."
	sudo rm -rf frontend/build/
	@echo "🔨 Rebuildando frontend..."
	$(DOCKER_COMPOSE) up $(FRONTEND_SERVICE) -d
	@echo "✅ Frontend rebuildado rapidamente!"

# Acessar shell do frontend
frontend-shell:
	$(DOCKER_COMPOSE) exec -it $(FRONTEND_SERVICE) /bin/sh

# Ver logs do frontend
frontend-logs:
	@echo "📋 Exibindo logs do frontend..."
	$(DOCKER_COMPOSE) logs -f $(FRONTEND_SERVICE)

# Comando de desenvolvimento - rebuild automático quando há mudanças
dev-frontend:
	@echo "🔄 Iniciando modo desenvolvimento do frontend..."
	@echo "📝 Este comando irá:"
	@echo "   1. Parar o frontend atual"
	@echo "   2. Remover build antigo"
	@echo "   3. Rebuildar sem cache"
	@echo "   4. Iniciar com logs em tempo real"
	@echo ""
	$(DOCKER_COMPOSE) down $(FRONTEND_SERVICE)
	sudo rm -rf frontend/build/
	$(DOCKER_COMPOSE) build $(FRONTEND_SERVICE) --no-cache
	$(DOCKER_COMPOSE) up $(FRONTEND_SERVICE)
