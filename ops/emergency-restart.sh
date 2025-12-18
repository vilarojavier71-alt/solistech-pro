#!/bin/bash
# ==============================================================================
# SOLISTECH PRO - PROTOCOLO DE REINICIO DE EMERGENCIA
# ==============================================================================
# Instrucciones:
# 1. Copia este script al servidor (o copia el contenido).
# 2. Ejecútalo con permisos de root: sudo ./emergency-restart.sh
# ==============================================================================

echo "🔧 INICIANDO PROTOCOLO DE REINICIO..."
echo "----------------------------------------"

# 1. Comprobación de Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker no está instalado."
    exit 1
fi

# 2. Reinicio Seguro de Contenedores
echo "🔄 Reiniciando todos los contenedores activos..."
# Obtenemos IDs de todos los contenedores corriendo
CONTAINERS=$(docker ps -q)

if [ -z "$CONTAINERS" ]; then
    echo "⚠️ No hay contenedores corriendo. Iniciando servicio Docker..."
    systemctl restart docker
else
    docker restart $CONTAINERS
    echo "✅ Contenedores reiniciados."
fi

# 3. Limpieza de Memoria (Opcional pero recomendado tras fallos de build)
echo "🧹 Ejecutando limpieza de sistema (Prune)..."
# Elimina contenedores parados, redes no usadas y caché de build (dangling)
docker system prune -f

# 4. Verificación de logs recientes (últimas 20 líneas de la app)
echo "----------------------------------------"
echo "📊 Estado actual (docker ps):"
docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "----------------------------------------"
echo "✅ REINICIO COMPLETADO."
echo "👉 Si Coolify no detecta el cambio, ve al panel y pulsa 'Redeploy' forzado."
