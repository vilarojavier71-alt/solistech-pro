# 🔧 COOLIFY DOCKER BUILD FIX - Error 6735

## ❌ ERROR DETECTADO

```
unknown flag: --progress
DEPRECATED: The legacy builder is deprecated
```

Coolify está intentando usar `docker build --progress` pero la versión de Docker no lo soporta.

---

## ✅ SOLUCIÓN 1: Usar Nixpacks (Build Nativo) - RECOMENDADO

**En Coolify, desactiva el uso de Dockerfile:**

1. Ve a tu aplicación en Coolify
2. Edita la configuración
3. En "Build Pack" o "Build Method", selecciona **"Nixpacks"** (no Dockerfile)
4. Asegúrate de que `nixpacks.toml` esté en la raíz del proyecto (✅ ya existe)

**Build Command:**
```bash
npm install && prisma generate && npx prisma migrate deploy && npm run build
```

---

## ✅ SOLUCIÓN 2: Actualizar Docker en el Servidor

Si necesitas usar Dockerfile, actualiza Docker en el servidor:

```bash
# SSH al servidor donde está Coolify
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl restart docker

# O instalar Docker Engine más reciente
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl restart docker
```

Luego reinicia Coolify:
```bash
sudo systemctl restart coolify
```

---

## ✅ SOLUCIÓN 3: Usar Dockerfile Sin Flags Problemáticas

Si Coolify permite editar el build script, crea un `Dockerfile` simplificado:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Set npm config
ENV NPM_CONFIG_CACHE=/tmp/.npm
ENV NPM_CONFIG_TMP=/tmp
ENV HOME=/app

# Install dependencies
COPY package*.json ./
RUN mkdir -p /tmp/.npm && npm ci --cache /tmp/.npm

# Generate Prisma
COPY prisma ./prisma/
RUN npx prisma generate

# Copy and build
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

---

## ✅ SOLUCIÓN 4: Deshabilitar Dockerfile en Coolify

**En la configuración de Coolify:**

1. Ve a "Settings" o "Configuration"
2. Busca "Dockerfile Detection" o "Build Method"
3. **Desactiva** "Auto-detect Dockerfile"
4. Selecciona **"Nixpacks"** como método de build

---

## 🎯 RECOMENDACIÓN FINAL

**Usa SOLUCIÓN 1 (Nixpacks)** porque:
- ✅ Ya tienes `nixpacks.toml` configurado
- ✅ No requiere actualizar Docker
- ✅ Es el método nativo de Coolify
- ✅ Maneja automáticamente permisos y configuraciones

---

## 📋 CHECKLIST

- [ ] Cambiar Build Method a "Nixpacks" en Coolify
- [ ] Verificar que `nixpacks.toml` existe en la raíz
- [ ] Build Command: `npm install && prisma generate && npx prisma migrate deploy && npm run build`
- [ ] Variables de entorno configuradas (NPM_CONFIG_CACHE, etc.)
- [ ] Redeploy iniciado
- [ ] Build completado sin errores

---

## 🔍 VERIFICACIÓN

Después del deploy exitoso:
1. ✅ Build completado sin errores Docker
2. ✅ Migraciones ejecutadas
3. ✅ Aplicación iniciada correctamente

---

**Nota:** El error `--progress` es un problema de compatibilidad de Docker. Nixpacks evita este problema completamente.

