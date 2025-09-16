# 🚀 Guia de Setup - Matcha Clone

Este guia garante que qualquer pessoa possa baixar e executar o projeto Matcha Clone em qualquer computador.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Docker** (versão 20.10+)
- **Docker Compose** (versão 2.0+)
- **Make** (geralmente já instalado no Linux/macOS)
- **Git** (para clonar o repositório)

### Verificar Instalações

```bash
# Verificar Docker
docker --version
docker-compose --version

# Verificar Make
make --version

# Verificar Git
git --version
```

## 🎯 Setup Rápido (4 Comandos)

Para uma pessoa nova no projeto, execute apenas estes comandos:

```bash
# 1. Clone o repositório
git clone <repository-url>
cd matcha4

# 2. Setup completo (instala dependências e configura ambiente)
make setup

# 3. Subir containers
make up

# 4. Aplicar migrações e popular banco
make migrate
make populate
```

**Pronto!** O projeto estará rodando em:
- 🌐 **Frontend**: http://localhost:3000
- 🔧 **API**: http://localhost:8000
- 📚 **Documentação**: http://localhost:8000/docs
- 📧 **Mailhog**: http://localhost:8025

## 📖 Comandos Detalhados

### Setup Inicial

```bash
# Setup completo (recomendado para primeira vez)
make setup

# Ou passo a passo:
make install-backend   # Instalar dependências Python
make install-frontend  # Instalar dependências Node.js
make setup-env         # Configurar arquivo .env
```

### Execução

```bash
# Subir containers
make up

# Aplicar migrações do banco
make migrate

# Popular banco com dados de teste
make populate

# Adicionar usuários específicos (Bob, Alice, Carol)
make add-users
```

### Desenvolvimento

```bash
# Ver logs em tempo real
make dev

# Ver status dos containers
make status

# Parar containers
make down
```

## 🔧 Configuração

### Arquivo .env

O comando `make setup` cria automaticamente o arquivo `.env` a partir do `env.example`. 

**Importante**: Para funcionalidades completas, configure:

```bash
# Editar arquivo .env
nano .env

# Configurar Google OAuth (opcional)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

### Usuários de Teste

Após executar `make populate` e `make add-users`, você terá:

- **500 usuários fake** com dados realistas
- **3 usuários específicos** para testes:
  - **Bob** (username: `bob`, senha: `StrongPass123!`) - gosta de mulheres
  - **Alice** (username: `alice`, senha: `StrongPass123!`) - gosta de homens  
  - **Carol** (username: `carol`, senha: `StrongPass123!`) - gosta de ambos

## 🚨 Solução de Problemas

### Containers não sobem

```bash
# Parar tudo e rebuildar
make down
make build
make up
```

### Problemas de permissão

```bash
# Limpar e reconfigurar
make clean
sudo chown -R $USER:$USER .
make setup
```

### Banco de dados corrompido

```bash
# Reset completo
make reset
```

### Dependências desatualizadas

```bash
# Limpar e reinstalar
make clean
make install-backend
make install-frontend
```

### Frontend com problemas

```bash
# Rebuild do frontend
make frontend-clean-rebuild
```

## 📊 Verificação de Funcionamento

Após o setup, verifique se tudo está funcionando:

```bash
# 1. Verificar containers
make status

# 2. Testar API
curl http://localhost:8000/docs

# 3. Testar Frontend
curl http://localhost:3000

# 4. Verificar banco
make psql
# No psql: \dt (listar tabelas)
```

## 🎯 Fluxo Completo de Teste

Para garantir que tudo funciona:

```bash
# 1. Setup inicial
make setup

# 2. Subir containers
make up

# 3. Aguardar containers iniciarem (30 segundos)
sleep 30

# 4. Aplicar migrações
make migrate

# 5. Popular banco
make populate

# 6. Adicionar usuários específicos
make add-users

# 7. Verificar status
make status

# 8. Testar endpoints
curl http://localhost:8000/docs
curl http://localhost:3000
```

## 📚 Comandos Úteis

```bash
# Ver todos os comandos disponíveis
make help

# Logs em tempo real
make logs

# Logs específicos
make logs-api
make logs-db
make logs-frontend

# Acessar banco
make psql

# Executar testes
make test

# Limpar cache
make clean
```

## ✅ Checklist de Verificação

Antes de considerar o setup completo, verifique:

- [ ] Docker e Docker Compose instalados
- [ ] Comando `make setup` executado com sucesso
- [ ] Comando `make up` executado sem erros
- [ ] Comando `make migrate` aplicou todas as migrações
- [ ] Comando `make populate` criou usuários de teste
- [ ] API acessível em http://localhost:8000
- [ ] Frontend acessível em http://localhost:3000
- [ ] Documentação acessível em http://localhost:8000/docs
- [ ] Mailhog acessível em http://localhost:8025

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique os logs**: `make logs`
2. **Consulte o README.md** para mais detalhes
3. **Execute `make help`** para ver todos os comandos
4. **Use `make reset`** para resetar completamente

---

**🎉 Parabéns!** Se seguiu todos os passos, o Matcha Clone está rodando perfeitamente!
