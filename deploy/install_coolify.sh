#!/bin/bash

# ==============================================================================
# SOLISTECH PRO - COOLIFY INSTALLER (UBUNTU 22.04/24.04)
# ==============================================================================
# Este script prepara un VPS virgen e instala Coolify.
# Ejecutar como ROOT.
# ==============================================================================

set -e

echo ">>> [1/4] Actualizando sistema..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl wget git

echo ">>> [2/4] Instalando Docker Engine (Si no existe)..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "Docker instalado correctamente."
else
    echo "Docker ya estaba instalado."
fi

echo ">>> [3/4] Instalando Coolify (Latest)..."
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

echo ">>> [4/4] Finalizando..."
PUBLIC_IP=$(curl -s https://api.ipify.org)

echo ""
echo "=============================================================================="
echo "   ¡INSTALACIÓN COMPLETADA CON ÉXITO!"
echo "=============================================================================="
echo ""
echo "   Accede a tu panel de control Coolify en:"
echo "   http://$PUBLIC_IP:8000"
echo ""
echo "   1. Registra tu cuenta de administrador."
echo "   2. Conecta tu cuenta de GitHub."
echo "   3. Crea un recurso 'Git Source' apuntando a este repositorio."
echo "=============================================================================="
