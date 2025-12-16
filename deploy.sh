#!/bin/bash
set -e

# Configuration
SERVER_IP="46.224.41.2"
SERVER_USER="root"
REMOTE_DIR="/opt/solistech"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Deploying SolisTech Pro to $SERVER_IP (Remote Build Strategy)${NC}"

# Check for .env.production
if [ ! -f .env.production ]; then
    echo -e "${RED}Error: .env.production file not found!${NC}"
    exit 1
fi

echo "Copying files to server..."
# Using rsync if available, otherwise scp
# Exclude node_modules, .next, .git
scp -r \
    package.json \
    package-lock.json \
    next.config.ts \
    tsconfig.json \
    tailwind.config.ts \
    postcss.config.mjs \
    public \
    src \
    Dockerfile \
    docker-compose.prod.yml \
    setup-prod.sh \
    .env.production \
    $SERVER_USER@$SERVER_IP:$REMOTE_DIR/

echo -e "${GREEN}Files copied. Executing server setup and remote build...${NC}"
ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && chmod +x setup-prod.sh && ./setup-prod.sh && docker-compose -f docker-compose.prod.yml up -d --build"

echo -e "${GREEN}DEPLOYMENT COMPLETE!${NC}"
echo "Check status at http://$SERVER_IP"
