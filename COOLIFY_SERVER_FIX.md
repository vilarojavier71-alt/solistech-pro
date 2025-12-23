# 🔧 COOLIFY SERVER FIX - Actualizar Docker Buildx

## ❌ PROBLEMA PERSISTENTE

Coolify sigue intentando usar `docker build --progress` incluso después de renombrar Dockerfile.

**Error:**
```
unknown flag: --progress
DEPRECATED: The legacy builder is deprecated
```

Esto indica que **Docker en el servidor necesita actualizarse** para soportar BuildKit/buildx.

---

## ✅ SOLUCIÓN: Actualizar Docker en el Servidor

### Paso 1: Conectarse al Servidor

```bash
ssh root@<TU_IP_VPS>
# o
ssh usuario@<TU_IP_VPS>
```

### Paso 2: Instalar Docker Buildx

```bash
# Actualizar Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-buildx-plugin docker-compose-plugin

# O instalar Docker Engine más reciente
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar buildx plugin
mkdir -p ~/.docker/cli-plugins/
curl -SL https://github.com/docker/buildx/releases/latest/download/buildx-v0.12.1.linux-amd64 -o ~/.docker/cli-plugins/docker-buildx
chmod +x ~/.docker/cli-plugins/docker-buildx

# Reiniciar Docker
sudo systemctl restart docker
```

### Paso 3: Reiniciar Coolify

```bash
# Reiniciar Coolify para que detecte buildx
sudo systemctl restart coolify
# o si está en Docker
docker restart coolify
```

### Paso 4: Verificar Buildx

```bash
# Verificar que buildx está instalado
docker buildx version

# Crear builder si no existe
docker buildx create --use --name coolify-builder
docker buildx inspect --bootstrap
```

---

## ✅ SOLUCIÓN ALTERNATIVA: Forzar Nixpacks en Coolify

Si no puedes actualizar Docker, fuerza Nixpacks desde la configuración de Coolify:

### Opción 1: Configuración en Coolify UI

1. Ve a tu aplicación en Coolify
2. **Settings** → **Build Settings**
3. Busca **"Build Pack"** o **"Build Method"**
4. Selecciona **"Nixpacks"** explícitamente
5. **Guarda** la configuración
6. **Elimina** cualquier referencia a Dockerfile en la configuración

### Opción 2: Verificar que no hay Dockerfile en el repo

```bash
# En tu máquina local, verifica que no hay Dockerfile
cd solistech-pro
ls -la | grep -i dockerfile

# Debería mostrar solo Dockerfile.backup
# Si hay Dockerfile, elimínalo:
# rm Dockerfile
```

### Opción 3: Actualizar Coolify

```bash
# En el servidor, actualizar Coolify a la última versión
cd /var/www/html
git pull origin main
php artisan migrate
php artisan config:clear
php artisan cache:clear
```

---

## 🎯 RECOMENDACIÓN FINAL

**Actualiza Docker en el servidor** (Solución 1) porque:
- ✅ Resuelve el problema de raíz
- ✅ Permite usar Dockerfile en el futuro si lo necesitas
- ✅ Coolify funcionará correctamente con cualquier build method

---

## 📋 CHECKLIST POST-FIX

Después de actualizar Docker:

- [ ] Docker buildx instalado y funcionando
- [ ] Coolify reiniciado
- [ ] Build Method configurado como "Nixpacks" en Coolify
- [ ] Redeploy iniciado
- [ ] Build completado sin errores `--progress`
- [ ] Aplicación iniciada correctamente

---

## 🔍 VERIFICACIÓN

Después del fix, verifica en los logs de Coolify:

**✅ CORRECTO:**
```
Using Nixpacks buildpack
Detected Node.js project
Installing dependencies...
```

**❌ SI AÚN FALLA:**
- Verifica que Docker buildx está instalado: `docker buildx version`
- Verifica que Coolify está usando la última versión
- Contacta con soporte de Coolify si el problema persiste

---

**Nota:** El problema es que la versión de Docker en el servidor es antigua y no soporta la flag `--progress`. Actualizar Docker resuelve esto definitivamente.

