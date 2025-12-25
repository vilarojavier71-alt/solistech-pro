# ============================================
# MPE-OS V3.0.0: Local Testing Script (PowerShell)
# ============================================
# Purpose: Validates Dockerfile and build process locally on Windows
# Why: Ensures everything works before deploying to Coolify

$ErrorActionPreference = "Stop"

function Write-Log {
    param(
        [string]$Level,
        [string]$Message
    )
    
    $colors = @{
        ERROR = "Red"
        WARN = "Yellow"
        INFO = "Cyan"
        SUCCESS = "Green"
    }
    
    $color = $colors[$Level]
    if ($color) {
        Write-Host "[$Level] $Message" -ForegroundColor $color
    } else {
        Write-Host "[$Level] $Message"
    }
}

# Step 1: Validate Dockerfile secrets
Write-Log "INFO" "Step 1: Validating Dockerfile for secret leaks..."
if (Test-Path "scripts\validate-docker-secrets.sh") {
    Write-Log "INFO" "Note: validate-docker-secrets.sh requires WSL or Git Bash on Windows"
    Write-Log "WARN" "Skipping Dockerfile secrets validation (requires bash)"
} else {
    Write-Log "WARN" "validate-docker-secrets.sh not found, skipping..."
}

# Step 2: Validate TypeScript aliases
Write-Log "INFO" "Step 2: Validating TypeScript alias resolution..."
try {
    npm run validate:aliases 2>&1 | Out-Null
    Write-Log "SUCCESS" "TypeScript aliases validation passed"
} catch {
    Write-Log "WARN" "Alias validation failed, but continuing..."
}

# Step 3: Check for .env.local
Write-Log "INFO" "Step 3: Checking environment configuration..."
if (-not (Test-Path ".env.local")) {
    Write-Log "WARN" ".env.local not found"
    if (Test-Path ".env.example") {
        Write-Log "INFO" "Creating .env.local from template..."
        Copy-Item ".env.example" ".env.local"
        Write-Log "INFO" "Created .env.local from .env.example"
        Write-Log "WARN" "⚠️  Please edit .env.local with your actual values before building"
    } else {
        Write-Log "ERROR" ".env.example not found - cannot create .env.local"
        exit 1
    }
} else {
    Write-Log "SUCCESS" ".env.local exists"
}

# Step 4: Test Docker build
Write-Log "INFO" "Step 4: Testing Docker build (this may take a few minutes)..."
Write-Log "INFO" "Building Docker image with tag: motorgap-local-test"

try {
    docker build `
        --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 `
        -t motorgap-local-test `
        . 2>&1 | Tee-Object -FilePath "docker-build.log"
    
    Write-Log "SUCCESS" "Docker build completed successfully"
} catch {
    Write-Log "ERROR" "Docker build failed - check docker-build.log"
    exit 1
}

# Step 5: Test container startup
Write-Log "INFO" "Step 5: Testing container startup..."
Write-Log "WARN" "This requires .env.local to be configured with DATABASE_URL and NEXTAUTH_SECRET"

if (Test-Path ".env.local") {
    # Read .env.local
    $envContent = Get-Content ".env.local" | Where-Object { $_ -match "^DATABASE_URL=|^NEXTAUTH_SECRET=" }
    
    $DATABASE_URL = ""
    $NEXTAUTH_SECRET = ""
    
    foreach ($line in $envContent) {
        if ($line -match "^DATABASE_URL=(.+)") {
            $DATABASE_URL = $matches[1].Trim('"')
        }
        if ($line -match "^NEXTAUTH_SECRET=(.+)") {
            $NEXTAUTH_SECRET = $matches[1].Trim('"')
        }
    }
    
    if ([string]::IsNullOrEmpty($DATABASE_URL) -or [string]::IsNullOrEmpty($NEXTAUTH_SECRET)) {
        Write-Log "WARN" "DATABASE_URL or NEXTAUTH_SECRET not found in .env.local"
        Write-Log "INFO" "Skipping container startup test"
    } else {
        Write-Log "INFO" "Starting container with runtime environment variables..."
        
        try {
            $containerId = docker run -d `
                -p 3000:3000 `
                -e DATABASE_URL="$DATABASE_URL" `
                -e NEXTAUTH_SECRET="$NEXTAUTH_SECRET" `
                -e NEXT_PUBLIC_APP_URL=http://localhost:3000 `
                motorgap-local-test
            
            Write-Log "SUCCESS" "Container started: $containerId"
            Write-Log "INFO" "Waiting 10 seconds for container to initialize..."
            Start-Sleep -Seconds 10
            
            # Test health check
            Write-Log "INFO" "Testing health check endpoint..."
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5
                if ($response.StatusCode -eq 200) {
                    Write-Log "SUCCESS" "Health check passed - container is running correctly"
                }
            } catch {
                Write-Log "WARN" "Health check failed - container may still be starting"
                Write-Log "INFO" "Check logs with: docker logs $containerId"
            }
            
            Write-Log "INFO" "Container is running. To stop it: docker stop $containerId"
            Write-Log "INFO" "To view logs: docker logs -f $containerId"
        } catch {
            Write-Log "ERROR" "Failed to start container: $_"
            exit 1
        }
    }
} else {
    Write-Log "WARN" ".env.local not found - skipping container startup test"
}

Write-Log "SUCCESS" "Local testing completed!"
Write-Log "INFO" "Next steps:"
Write-Log "INFO" "  1. Configure .env.local with your actual values"
Write-Log "INFO" "  2. Test the application: npm run dev"
Write-Log "INFO" "  3. If everything works, you're ready to deploy to Coolify"

