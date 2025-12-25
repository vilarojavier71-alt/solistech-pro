#!/bin/bash
# ============================================
# MPE-OS V3.0.0: Pre-Build Docker Secrets Validator
# ============================================
# Purpose: Validates that no secrets are baked into Dockerfile
# Why: Ensures Zero Trust compliance - secrets must be injected at runtime
# ISO 27001: A.8.28 - Secure Development

set -euo pipefail

# ANSI color codes
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly RESET='\033[0m'

# Structured log function
log() {
  local level=$1
  local source=$2
  local action=$3
  local message=$4
  local error=${5:-}
  
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local prefix
  
  case "${level}" in
    ERROR) prefix="${RED}[ERROR]${RESET}" ;;
    WARN)  prefix="${YELLOW}[WARN]${RESET}" ;;
    INFO)  prefix="${BLUE}[INFO]${RESET}" ;;
    *)     prefix="[LOG]" ;;
  esac
  
  echo -e "${prefix} [${timestamp}] ${source}::${action} - ${message}${error:+ (${error})}"
}

# List of forbidden secret patterns in Dockerfile
readonly FORBIDDEN_PATTERNS=(
  "ARG.*DATABASE_URL"
  "ENV.*DATABASE_URL"
  "ARG.*NEXTAUTH_SECRET"
  "ENV.*NEXTAUTH_SECRET"
  "ARG.*AUTH_SECRET"
  "ENV.*AUTH_SECRET"
  "ARG.*STRIPE_SECRET"
  "ENV.*STRIPE_SECRET"
  "ARG.*SERVICE_PASSWORD"
  "ENV.*SERVICE_PASSWORD"
  "ARG.*ENCRYPTION_KEY"
  "ENV.*ENCRYPTION_KEY"
  "ARG.*API_KEY"
  "ENV.*API_KEY"
  "ARG.*PASSWORD"
  "ENV.*PASSWORD"
  "ARG.*SECRET"
  "ENV.*SECRET"
)

# Validate Dockerfile
validate_dockerfile() {
  log "INFO" "validate-dockerfile" "start" "Scanning Dockerfile for secret leaks"
  
  local dockerfile_path="${1:-Dockerfile}"
  local violations=0
  local line_num=0
  
  if [ ! -f "${dockerfile_path}" ]; then
    log "ERROR" "validate-dockerfile" "file_not_found" "Dockerfile not found: ${dockerfile_path}"
    exit 1
  fi
  
  while IFS= read -r line; do
    ((line_num++))
    
    # Skip comments
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    
    # Check each forbidden pattern
    for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
      if echo "$line" | grep -qiE "$pattern"; then
        log "ERROR" "validate-dockerfile" "secret_leak" \
            "Line ${line_num}: Secret detected in Dockerfile" \
            "Pattern: ${pattern}"
        ((violations++))
      fi
    done
  done < "${dockerfile_path}"
  
  if [ ${violations} -eq 0 ]; then
    log "SUCCESS" "validate-dockerfile" "complete" "No secrets detected in Dockerfile"
    return 0
  else
    log "ERROR" "validate-dockerfile" "complete" \
        "Found ${violations} secret leak(s) in Dockerfile"
    return 1
  fi
}

# Validate .env.example exists and has required variables
validate_env_example() {
  log "INFO" "validate-env-example" "start" "Validating .env.example"
  
  local env_example="${1:-.env.example}"
  
  if [ ! -f "${env_example}" ]; then
    log "WARN" "validate-env-example" "file_not_found" \
        ".env.example not found: ${env_example}"
    return 0  # Not critical, just a warning
  fi
  
  local required_vars=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "NEXT_PUBLIC_APP_URL"
    "GMAIL_ENCRYPTION_KEY"
  )
  
  local missing=0
  
  for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" "${env_example}"; then
      log "WARN" "validate-env-example" "missing_var" \
          "Required variable not found in .env.example: ${var}"
      ((missing++))
    fi
  done
  
  if [ ${missing} -eq 0 ]; then
    log "SUCCESS" "validate-env-example" "complete" \
        "All required variables found in .env.example"
    return 0
  else
    log "WARN" "validate-env-example" "complete" \
        "Missing ${missing} required variable(s) in .env.example"
    return 0  # Warning, not error
  fi
}

# Main validation flow
main() {
  log "INFO" "main" "start" "Starting Docker secrets validation"
  
  local dockerfile="${1:-Dockerfile}"
  local env_example="${2:-.env.example}"
  
  validate_dockerfile "${dockerfile}" || exit 1
  validate_env_example "${env_example}"
  
  log "SUCCESS" "main" "complete" "Docker secrets validation passed"
  exit 0
}

main "$@"

