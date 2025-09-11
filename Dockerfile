FROM python:3.11-slim

# Criar diretório da aplicação
WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Variáveis padrão (podem ser sobrescritas no compose)
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/tinder_clone

# Comando para rodar a API
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
