#!/bin/bash
# ============================================================================
# SOLISTECH PRO - MANUAL DEPLOY SCRIPT (FALLBACK)
# ============================================================================
# Execute inside tmux session on VPS:
#   tmux new -s build_mission
#   ./deploy_manual.sh
# ============================================================================

set -e

cd /root/solistech-pro

echo "============================================"
echo "  SOLISTECH PRO - MANUAL DEPLOY"
echo "  $(date)"
echo "============================================"

echo ""
echo "=== PASO 1: Instalando dependencias ==="
npm ci --legacy-peer-deps

echo ""
echo "=== PASO 2: Generando Prisma Client ==="
npx prisma generate

echo ""
echo "=== PASO 3: Build con límite de memoria (3.5GB) ==="
NODE_OPTIONS="--max-old-space-size=3584" npm run build

echo ""
echo "=== PASO 4: Ejecutando migraciones de DB ==="
npx prisma migrate deploy

echo ""
echo "=== PASO 5: Iniciando con PM2 ==="
pm2 delete solistech-prod 2>/dev/null || true
pm2 start npm --name "solistech-prod" -- start -- -p 3000
pm2 save
pm2 startup

echo ""
echo "============================================"
echo "  ✅ DEPLOY COMPLETO"
echo "  App corriendo en puerto 3000"
echo "  Siguiente paso: Configurar Caddy"
echo "============================================"
