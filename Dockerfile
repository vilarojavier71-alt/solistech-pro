FROM node:20-alpine

WORKDIR /app

# Variables para evitar problemas de permisos de npm
ENV NPM_CONFIG_CACHE=/tmp/.npm
ENV NPM_CONFIG_TMP=/tmp
ENV HOME=/app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN mkdir -p /tmp/.npm && npm ci --legacy-peer-deps --no-audit --no-fund

# Generar cliente Prisma
RUN npx prisma generate

# Copiar el resto del cÃ³digo
COPY . .

# Construir la aplicaciÃ³n
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
