FROM node:20-alpine

# Instalar compatibilidad para Prisma y OpenSSL (Alpine)
# Instalar compatibilidad para Prisma y OpenSSL (Alpine)
RUN apk add --no-cache openssl libc6-compat

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

# Copiar el resto del código
COPY . .

# Declarar ARGs para que estén disponibles en el build
ARG DATABASE_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG NEXTAUTH_SECRET

# Asignarlos a ENV para que Next.js los vea
ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET

# Construir la aplicacion
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Comando de inicio CORRECTO para modo standalone
CMD ["node", ".next/standalone/server.js"]
