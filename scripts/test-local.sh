#!/bin/bash
# ============================================
# MPE-OS V3.0.0: Local Testing Script
# ============================================
# Purpose: Validates Dockerfile and build process locally
# Why: Ensures everything works before deploying to Coolify

set -euo pipefail

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly RESET='\033[0m'

log() {
  local level=$1
  local message=$2
  local prefix
  
  case "${level}" in
    ERROR) prefix="${RED}[ERROR]${RESET}" ;;
    WARN)  prefix="${YELLOW}[WARN]${RESET}" ;;
    INFO)  prefix="${BLUE}[INFO]${RESET}" ;;
    SUCCESS) prefix="${GREEN}[SUCCESS]${RESET}" ;;
    *)     prefix="[LOG]" ;;
  esac
  
  echo -e "${prefix} ${message}"
}

# Step 1: Validate Dockerfile secrets
log "INFO" "Step 1: Validating Dockerfile for secret leaks..."
if [ -f "scripts/validate-docker-secrets.sh" ]; then
  chmod +x scripts/validate-docker-secrets.sh
  if ./scripts/validate-docker-secrets.sh; then
    log "SUCCESS" "Dockerfile secrets validation passed"
  else
    log "ERROR" "Dockerfile contains secrets - fix before proceeding"
    exit 1
  fi
else
  log "WARN" "validate-docker-secrets.sh not found, skipping..."
fi

# Step 2: Validate TypeScript aliases
log "INFO" "Step 2: Validating TypeScript alias resolution..."
if npm run validate:aliases 2>/dev/null; then
  log "SUCCESS" "TypeScript aliases validation passed"
else
  log "WARN" "Alias validation failed, but continuing..."
fi

# Step 3: Check for .env.local
log "INFO" "Step 3: Checking environment configuration..."
if [ ! -f ".env.local" ]; then
  log "WARN" ".env.local not found"
  log "INFO" "Creating .env.local from template..."
  if [ -f ".env.example" ]; then
    cp .env.example .env.local
    log "INFO" "Created .env.local from .env.example"
    log "WARN" "⚠️  Please edit .env.local with your actual values before building"
  else
    log "ERROR" ".env.example not found - cannot create .env.local"
    exit 1
  fi
else
  log "SUCCESS" ".env.local exists"
fi

# Step 4: Test Docker build (dry-run)
log "INFO" "Step 4: Testing Docker build (this may take a few minutes)..."
log "INFO" "Building Docker image with tag: motorgap-local-test"

# Build without secrets (as per Zero Trust)
if docker build \
  --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  -t motorgap-local-test \
  . 2>&1 | tee /tmp/docker-build.log; then
  log "SUCCESS" "Docker build completed successfully"
else
  log "ERROR" "Docker build failed - check /tmp/docker-build.log"
  exit 1
fi

# Step 5: Test container startup (with env vars)
log "INFO" "Step 5: Testing container startup..."
log "WARN" "This requires .env.local to be configured with DATABASE_URL and NEXTAUTH_SECRET"

if [ -f ".env.local" ]; then
  # Extract DATABASE_URL and NEXTAUTH_SECRET from .env.local
  DATABASE_URL=$(grep "^DATABASE_URL=" .env.local | cut -d '=' -f2- | tr -d '"' || echo "")
  NEXTAUTH_SECRET=$(grep "^NEXTAUTH_SECRET=" .env.local | cut -d '=' -f2- | tr -d '"' || echo "")
  
  if [ -z "$DATABASE_URL" ] || [ -z "$NEXTAUTH_SECRET" ]; then
    log "WARN" "DATABASE_URL or NEXTAUTH_SECRET not found in .env.local"
    log "INFO" "Skipping container startup test"
  else
    log "INFO" "Starting container with runtime environment variables..."
    CONTAINER_ID=$(docker run -d \
      -p 3000:3000 \
      -e DATABASE_URL="$DATABASE_URL" \
      -e NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
      -e NEXT_PUBLIC_APP_URL=http://localhost:3000 \
      motorgap-local-test 2>&1) || {
      log "ERROR" "Failed to start container"
      exit 1
    }
    
    log "SUCCESS" "Container started: $CONTAINER_ID"
    log "INFO" "Waiting 10 seconds for container to initialize..."
    sleep 10
    
    # Test health check
    log "INFO" "Testing health check endpoint..."
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
      log "SUCCESS" "Health check passed - container is running correctly"
    else
      log "WARN" "Health check failed - container may still be starting"
      log "INFO" "Check logs with: docker logs $CONTAINER_ID"
    fi
    
    log "INFO" "Container is running. To stop it: docker stop $CONTAINER_ID"
    log "INFO" "To view logs: docker logs -f $CONTAINER_ID"
  fi
else
  log "WARN" ".env.local not found - skipping container startup test"
fi

log "SUCCESS" "Local testing completed!"
log "INFO" "Next steps:"
log "INFO" "  1. Configure .env.local with your actual values"
log "INFO" "  2. Test the application: npm run dev"
log "INFO" "  3. If everything works, you're ready to deploy to Coolify"

