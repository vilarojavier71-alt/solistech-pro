# 🔧 FORZAR NIXPACKS EN COOLIFY - Solución Definitiva

## ❌ PROBLEMA

Coolify sigue detectando `Dockerfile` y lo usa automáticamente, incluso después de seleccionar Nixpacks.

**Error:**
```
unknown flag: --progress
DEPRECATED: The legacy builder is deprecated
```

---

## ✅ SOLUCIÓN APLICADA

### 1. Dockerfile Renombrado

El `Dockerfile` ha sido renombrado a `Dockerfile.backup` para que Coolify no lo detecte automáticamente.

### 2. Nixpacks Configurado

El archivo `nixpacks.toml` está configurado con:
- ✅ Fixes de permisos npm
- ✅ Migraciones de Prisma incluidas
- ✅ Build optimizado para Next.js standalone

---

## 📋 PASOS EN COOLIFY

### 1. Verificar Configuración

1. Ve a tu aplicación en Coolify
2. Edita la configuración
3. Verifica que **"Build Pack"** esté en **"Nixpacks"**
4. **Build Command** debe estar **VACÍO** (Nixpacks usa `nixpacks.toml` automáticamente)

### 2. Redeploy

1. Haz clic en **"Redeploy"** o **"Deploy"**
2. Coolify ahora debería usar Nixpacks (ya no detectará Dockerfile)

---

## 🔍 VERIFICACIÓN

Después del deploy, verifica en los logs:

**✅ CORRECTO (Nixpacks):**
```
Detected Node.js project
Using Nixpacks buildpack
Installing dependencies...
```

**❌ INCORRECTO (Dockerfile):**
```
Building Docker image...
docker build --progress...
```

---

## 🛠️ SI AÚN DETECTA DOCKERFILE

Si Coolify sigue detectando Dockerfile después de renombrarlo:

### Opción 1: Eliminar Dockerfile.backup temporalmente

```bash
# En el servidor o en un commit
rm Dockerfile.backup
```

### Opción 2: Verificar configuración en Coolify

1. Ve a **Settings** → **Build Settings**
2. Busca **"Dockerfile Detection"**
3. **Desactiva** "Auto-detect Dockerfile"
4. Fuerza **"Nixpacks"** como único método

### Opción 3: Actualizar Docker en el servidor

Si necesitas usar Dockerfile en el futuro:

```bash
# SSH al servidor
sudo apt-get update
sudo apt-get install -y docker.io docker-buildx-plugin
sudo systemctl restart docker
sudo systemctl restart coolify
```

---

## 📊 CONFIGURACIÓN FINAL

### Build Method:
- ✅ **Nixpacks** (forzado)

### Build Command:
- ✅ **Vacío** (Nixpacks usa `nixpacks.toml`)

### Variables de Entorno:
```bash
DATABASE_URL=postgresql://...
AUTH_SECRET=...
NPM_CONFIG_CACHE=/tmp/.npm
NPM_CONFIG_TMP=/tmp
HOME=/app
```

---

## ✅ RESULTADO ESPERADO

Después del redeploy:
1. ✅ Build usa Nixpacks (no Dockerfile)
2. ✅ Sin errores `--progress`
3. ✅ Migraciones ejecutadas automáticamente
4. ✅ Aplicación iniciada correctamente

---

**Nota:** El `Dockerfile.backup` se mantiene por si necesitas usarlo en el futuro. Para forzar Nixpacks, simplemente no debe existir un archivo llamado `Dockerfile` en la raíz.

