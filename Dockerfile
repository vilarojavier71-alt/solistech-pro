FROM node:20-alpine

# Instalar dependencias del sistema para Prisma y healthcheck
RUN apk add --no-cache openssl libc6-compat wget

WORKDIR /app

# Copiar archivos de dependencias primero (para cache de Docker)
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci --legacy-peer-deps

# Generar cliente Prisma
RUN npx prisma generate

# Copiar el resto del codigo
COPY . .

# Variables de build
ARG DATABASE_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXTAUTH_SECRET

ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build de la aplicacion
RUN npm run build

# Puerto
EXPOSE 3000

# Comando de inicio para modo standalone
CMD ["node", ".next/standalone/server.js"]
