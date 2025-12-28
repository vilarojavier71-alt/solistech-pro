#!/bin/bash
# ==========================================
# MANUAL DEPLOYMENT SCRIPT (BYPASS COOLIFY)
# ==========================================

# Configuration
VPS_USER="root"
VPS_HOST="46.224.41.2"
REMOTE_DIR="/var/www/solistech-pro"

echo "🚀 Starting Manual Deployment to $VPS_HOST..."

# 1. Create remote directory
echo "📂 Creating remote directory..."
ssh $VPS_USER@$VPS_HOST "mkdir -p $REMOTE_DIR"

# 2. Transfer essential files
echo "kp Transferring configuration files..."
scp docker-compose.prod.yml $VPS_USER@$VPS_HOST:$REMOTE_DIR/docker-compose.yml
scp Dockerfile $VPS_USER@$VPS_HOST:$REMOTE_DIR/
scp -r scripts $VPS_USER@$VPS_HOST:$REMOTE_DIR/
scp -r prisma $VPS_USER@$VPS_HOST:$REMOTE_DIR/
scp package.json package-lock.json next.config.mjs $VPS_USER@$VPS_HOST:$REMOTE_DIR/
# Note: Source code is needed for build
echo "📦 Transferring source code (this may take a moment)..."
# Exclude heavy folders using rsync if possible, fallback to scp with careful selection
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' . $VPS_USER@$VPS_HOST:$REMOTE_DIR/

# 3. Trigger remote build & deploy
echo "🏗️  building and starting remote container..."
ssh $VPS_USER@$VPS_HOST << 'EOF'
    cd /var/www/solistech-pro
    
    # Ensure .env exists (User must create it manually once or we append secrets here)
    if [ ! -f .env ]; then
        echo "⚠️  WARNING: .env file missing! Creating dummy or copying from env inputs..."
        # In a real pipeline, we'd inject secrets here. 
        # For now, we assume the user maintains the .env on the server or we instruct them.
    fi
    
    # Docker Compose Up (Build + Detach)
    docker compose down
    docker compose up -d --build --remove-orphans
    
    # Check status
    docker compose ps
EOF

echo "✅ Manual Deployment commands sent!"
echo "👉 Please ensure '.env' exists at $REMOTE_DIR on the server."
