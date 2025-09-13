# Dockerfile para React Frontend
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Verificar se os arquivos estão no lugar correto
RUN ls -la /app/
RUN ls -la /app/public/

# Expor porta 3000
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]
