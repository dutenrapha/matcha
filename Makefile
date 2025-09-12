# Variáveis
DOCKER_COMPOSE = docker-compose
API_SERVICE = api
DB_SERVICE = db
FRONTEND_SERVICE = frontend

# Subir containers
up:
	$(DOCKER_COMPOSE) up -d

# Derrubar containers
down:
	$(DOCKER_COMPOSE) down

# Rebuild total
build:
	$(DOCKER_COMPOSE) up --build -d

# Logs da API
logs-api:
	$(DOCKER_COMPOSE) logs -f $(API_SERVICE)

# Logs do banco
logs-db:
	$(DOCKER_COMPOSE) logs -f $(DB_SERVICE)

# Logs do frontend
logs-frontend:
	$(DOCKER_COMPOSE) logs -f $(FRONTEND_SERVICE)

# Acessar banco
psql:
	$(DOCKER_COMPOSE) exec -it $(DB_SERVICE) psql -U postgres -d tinder_clone

# Aplicar migrations
migrate:
	$(DOCKER_COMPOSE) run --rm $(API_SERVICE) alembic upgrade head

# Criar nova migration
migration:
	$(DOCKER_COMPOSE) run --rm $(API_SERVICE) alembic revision --autogenerate -m "$(name)"

# Rodar testes
test:
	$(DOCKER_COMPOSE) run --rm $(API_SERVICE) pytest -v

# Popular DB com 500 usuários fake
populate:
	$(DOCKER_COMPOSE) run --rm $(API_SERVICE) python scripts/populate.py

# Resetar ambiente: limpar DB, recriar, aplicar migrations e popular
reset:
	$(DOCKER_COMPOSE) down -v
	$(DOCKER_COMPOSE) up -d db
	sleep 5
	$(DOCKER_COMPOSE) run --rm $(API_SERVICE) alembic upgrade head
	$(DOCKER_COMPOSE) run --rm $(API_SERVICE) python scripts/populate.py

# Subir com logs (foreground)
dev:
	$(DOCKER_COMPOSE) up

# Comandos específicos do frontend
frontend-install:
	$(DOCKER_COMPOSE) run --rm $(FRONTEND_SERVICE) npm install

frontend-build:
	$(DOCKER_COMPOSE) run --rm $(FRONTEND_SERVICE) npm run build

# Acessar shell do frontend
frontend-shell:
	$(DOCKER_COMPOSE) exec -it $(FRONTEND_SERVICE) /bin/sh
