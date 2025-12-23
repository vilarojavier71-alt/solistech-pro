# 🔧 COOLIFY BUILD FIX - Permission Issues

## 🐛 Error Detectado

```
npm error EACCES: permission denied, mkdir '/nonexistent'
```

Este error ocurre cuando npm intenta crear directorios en rutas no válidas en el contenedor de Coolify.

---

## ✅ SOLUCIONES

### Solución 1: Configurar Variables de Entorno en Coolify (RECOMENDADO)

En la configuración de Coolify, añade estas variables de entorno:

```bash
NPM_CONFIG_CACHE=/tmp/.npm
NPM_CONFIG_TMP=/tmp
NPM_CONFIG_PREFIX=/tmp/.npm-global
HOME=/app
```

### Solución 2: Modificar Build Command

En lugar de:
```bash
npm install && prisma generate && npx prisma migrate deploy && npm run build
```

Usa:
```bash
NPM_CONFIG_CACHE=/tmp/.npm NPM_CONFIG_TMP=/tmp npm install && prisma generate && npx prisma migrate deploy && npm run build
```

### Solución 3: Usar Build Command con Permisos

```bash
mkdir -p /tmp/.npm && chmod -R 777 /tmp/.npm && npm install --cache /tmp/.npm && prisma generate && npx prisma migrate deploy && npm run build
```

### Solución 4: Crear Dockerfile Personalizado (Si Coolify lo permite)

Crea un `Dockerfile` en la raíz del proyecto:

```dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set npm config to use /tmp
ENV NPM_CONFIG_CACHE=/tmp/.npm
ENV NPM_CONFIG_TMP=/tmp
ENV NPM_CONFIG_PREFIX=/tmp/.npm-global
ENV HOME=/app

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

## 📋 CHECKLIST PARA COOLIFY

### Variables de Entorno Requeridas:
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `AUTH_SECRET` - NextAuth secret
- [ ] `NPM_CONFIG_CACHE=/tmp/.npm` - Fix permissions
- [ ] `NPM_CONFIG_TMP=/tmp` - Fix permissions
- [ ] `HOME=/app` - Fix permissions

### Build Command Recomendado:
```bash
NPM_CONFIG_CACHE=/tmp/.npm NPM_CONFIG_TMP=/tmp npm install && prisma generate && npx prisma migrate deploy && npm run build
```

### Start Command:
```bash
npm start
```

### Port:
```
3000
```

---

## 🔍 VERIFICACIÓN

Después del deploy, verifica:
1. ✅ Build completado sin errores
2. ✅ Migraciones ejecutadas (`npx prisma migrate deploy`)
3. ✅ Aplicación iniciada correctamente
4. ✅ Health check responde

---

## 📝 NOTAS

- El archivo `.npmrc` ha sido creado para configurar npm
- Si el problema persiste, verifica los permisos del usuario en Coolify
- Considera usar `npm ci` en lugar de `npm install` para builds más reproducibles

