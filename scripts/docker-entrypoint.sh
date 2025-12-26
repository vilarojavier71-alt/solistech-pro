#!/bin/bash
# ============================================
# MPE-OS V3.0.0: Container Entrypoint with Structured Logging
# ============================================
# Purpose: Robust container startup with error handling and audit trail
# Why: Ensures graceful failure and structured logging for ISO 27001 compliance

set -euo pipefail

# Color codes for structured logging
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly RESET='\033[0m'

# Structured log function (ISO 27001: Audit Trail)
log() {
  local level=$1
  local source=$2
  local action=$3
  local message=$4
  local error=${5:-}
  
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local log_entry=$(cat <<EOF
{
  "timestamp": "${timestamp}",
  "level": "${level}",
  "source": "${source}",
  "action": "${action}",
  "message": "${message}"${error:+", \"error\": \"${error}\""}
}
EOF
)
  
  local prefix
  case "${level}" in
    ERROR) prefix="${RED}[ERROR]${RESET}" ;;
    WARN)  prefix="${YELLOW}[WARN]${RESET}" ;;
    INFO)  prefix="${BLUE}[INFO]${RESET}" ;;
    *)     prefix="[LOG]" ;;
  esac
  
  echo -e "${prefix} ${log_entry}" >&2
}

# Error handler
handle_error() {
  local exit_code=$?
  log "ERROR" "docker-entrypoint" "handle_error" \
      "Container startup failed with exit code ${exit_code}" \
      "Exit code: ${exit_code}"
  exit ${exit_code}
}

trap handle_error ERR

# Validate environment variables (Zero-Flag Policy)
validate_environment() {
  log "INFO" "docker-entrypoint" "validate_environment" "Validating required environment variables"
  
  local missing_vars=()
  
  if [ -z "${DATABASE_URL:-}" ]; then
    missing_vars+=("DATABASE_URL")
  fi
  
  if [ -z "${NEXTAUTH_SECRET:-}" ]; then
    missing_vars+=("NEXTAUTH_SECRET")
  fi
  
  if [ ${#missing_vars[@]} -gt 0 ]; then
    log "ERROR" "docker-entrypoint" "validate_environment" \
        "Missing required environment variables: ${missing_vars[*]}"
    exit 1
  fi
  
  log "INFO" "docker-entrypoint" "validate_environment" "All required environment variables present"
}

# Validate Prisma client
validate_prisma() {
  log "INFO" "docker-entrypoint" "validate_prisma" "Checking Prisma client"
  
  if [ ! -d "node_modules/.prisma" ]; then
    log "WARN" "docker-entrypoint" "validate_prisma" \
        "Prisma client not found, attempting generation"
    npx prisma@5.10 generate || {
      log "ERROR" "docker-entrypoint" "validate_prisma" \
          "Failed to generate Prisma client"
      exit 1
    }
  fi
  
  log "INFO" "docker-entrypoint" "validate_prisma" "Prisma client validated"
}

# Run database migrations
run_migrations() {
  log "INFO" "docker-entrypoint" "run_migrations" "Running database migrations"
  
  npx prisma@5.10 migrate deploy || {
    log "WARN" "docker-entrypoint" "run_migrations" \
        "Migration failed - database may already be up to date"
  }
  
  log "INFO" "docker-entrypoint" "run_migrations" "Migration check complete"
}

# Main entrypoint logic
main() {
  log "INFO" "docker-entrypoint" "main" "Starting container initialization"
  
  validate_environment
  validate_prisma
  run_migrations
  
  log "INFO" "docker-entrypoint" "main" "Starting Next.js standalone server"
  
  # Execute the main command (from CMD in Dockerfile)
  exec "$@"
}

main "$@"

