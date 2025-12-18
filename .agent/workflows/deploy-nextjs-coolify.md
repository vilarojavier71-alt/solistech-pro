# Guía de Despliegue: Next.js + Prisma en Coolify (VPS 8GB)

## Pre-requisitos en el Servidor VPS

### 1. Añadir SWAP (OBLIGATORIO para Next.js builds)

```bash
# Crear 4GB de swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Hacer permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verificar
free -h
```

### 2. Coolify instalado y funcionando

- Proxy (Traefik) corriendo
- Dominio apuntando al servidor

---

## Dockerfile Optimizado (COPIAR ESTE)

```dockerfile
FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Optimizaciones de memoria
ENV NEXT_TELEMETRY_DISABLED=1
ENV GENERATE_SOURCEMAP=false
ENV SKIP_TYPE_CHECK=true

RUN npm exec prisma generate
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

---

## next.config.mjs Optimizado

```javascript
const nextConfig = {
  output: 'standalone',  // OBLIGATORIO
  productionBrowserSourceMaps: false,  // Reduce memoria
  eslint: { ignoreDuringBuilds: true },  // Reduce memoria
  typescript: { ignoreBuildErrors: true },  // Evita fallos en CI
};
```

---

## Pasos en Coolify

### 1. Crear Base de Datos

- New → Database → PostgreSQL
- Anotar credenciales generadas

### 2. Crear Aplicación

- New → Application → GitHub
- Build Pack: **Dockerfile** (no Nixpacks)
- Domain: tu-dominio.com

### 3. Variables de Entorno

```
DATABASE_URL=postgres://user:pass@hostname:5432/dbname
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=<generar con: openssl rand -base64 32>
NODE_ENV=production
```

### 4. Configuración Avanzada

- [x] Disable Build Cache (primera vez)
- [x] SSL/TLS automático

### 5. Deploy

- Click "Deploy"
- Esperar ~5-10 minutos

---

## Post-Despliegue

### Ejecutar Migraciones

```bash
# En SSH del servidor
docker exec -it <container_app> npx prisma migrate deploy
```

Si el container es standalone (no tiene Prisma CLI):

```bash
# Conectar directo a PostgreSQL
docker exec -it <container_postgres> psql -U postgres -d dbname
# Ejecutar SQL manualmente
```

---

## Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| `SIGKILL` | OOM (sin memoria) | Añadir SWAP, reducir memory limit |
| `502 Bad Gateway` | Proxy no conecta | Restart Traefik, verificar puerto |
| `Port 80 in use` | Caddy/Nginx ocupando | `systemctl stop caddy nginx` |
| Auth error 500 | DB vacía | Ejecutar migraciones |

---

## Comandos Útiles SSH

```bash
# Ver contenedores
docker ps

# Logs de la app
docker logs -f <container_id>

# Reiniciar container
docker restart <container_id>

# Memoria del sistema
free -h

# Qué usa puerto 80
lsof -i :80
```
