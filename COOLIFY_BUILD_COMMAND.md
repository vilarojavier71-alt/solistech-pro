# 🔧 COOLIFY BUILD COMMAND - SOLUCIÓN DEFINITIVA

## ❌ PROBLEMA

```
npm error EACCES: permission denied, mkdir '/nonexistent'
```

npm intenta crear directorios en `/nonexistent` que no existe o no tiene permisos.

---

## ✅ SOLUCIÓN 1: Build Command con Variables de Entorno (RECOMENDADO)

**En Coolify, usa este Build Command:**

```bash
mkdir -p /tmp/.npm && chmod -R 777 /tmp/.npm && NPM_CONFIG_CACHE=/tmp/.npm NPM_CONFIG_TMP=/tmp HOME=/app npm install && prisma generate && npx prisma migrate deploy && npm run build
```

---

## ✅ SOLUCIÓN 2: Usar Script de package.json

**En Coolify, usa este Build Command:**

```bash
npm run build:coolify
```

Este script está definido en `package.json` y maneja automáticamente los permisos.

---

## ✅ SOLUCIÓN 3: Variables de Entorno en Coolify

**Añade estas variables de entorno en la configuración de Coolify:**

```bash
NPM_CONFIG_CACHE=/tmp/.npm
NPM_CONFIG_TMP=/tmp
HOME=/app
```

**Luego usa el Build Command normal:**

```bash
npm install && prisma generate && npx prisma migrate deploy && npm run build
```

---

## ✅ SOLUCIÓN 4: Dockerfile Personalizado (Si Coolify lo permite)

Si Coolify permite usar Dockerfile personalizado, crea uno en la raíz:

```dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set npm config to use /tmp
ENV NPM_CONFIG_CACHE=/tmp/.npm
ENV NPM_CONFIG_TMP=/tmp
ENV NPM_CONFIG_PREFIX=/tmp/.npm-global
ENV HOME=/app

# Create npm cache directory with proper permissions
RUN mkdir -p /tmp/.npm && chmod -R 777 /tmp/.npm

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --cache /tmp/.npm

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

---

## 🎯 RECOMENDACIÓN FINAL

**Usa la SOLUCIÓN 1** (Build Command con variables inline). Es la más directa y no requiere configuración adicional.

**Build Command:**
```bash
mkdir -p /tmp/.npm && chmod -R 777 /tmp/.npm && NPM_CONFIG_CACHE=/tmp/.npm NPM_CONFIG_TMP=/tmp HOME=/app npm install && prisma generate && npx prisma migrate deploy && npm run build
```

---

## 📋 CHECKLIST

- [ ] Build Command actualizado en Coolify
- [ ] Variables de entorno configuradas (opcional, si usas Solución 3)
- [ ] Redeploy iniciado
- [ ] Build completado sin errores EACCES
- [ ] Migraciones ejecutadas correctamente

---

## 🔍 VERIFICACIÓN POST-DEPLOY

Después del deploy exitoso, verifica:

1. ✅ Build completado sin errores
2. ✅ Migración `created_by` ejecutada
3. ✅ Aplicación iniciada en puerto 3000
4. ✅ Health check responde

---

**Nota:** El archivo `.npmrc` está en el repositorio, pero en algunos casos npm no lo lee correctamente en contenedores. Por eso es mejor usar variables de entorno explícitas.

