# ============================================
# MPE-OS V3.0.0: Quick Local Test (PowerShell)
# ============================================
# Script rápido para probar el build local

Write-Host "`n🌌 MPE-OS V3.0.0: Quick Local Test`n" -ForegroundColor Cyan

# 1. Verificar Docker
Write-Host "[1/5] Verificando Docker..." -ForegroundColor Yellow
if (Get-Command docker -ErrorAction SilentlyContinue) {
    $dockerVersion = docker --version
    Write-Host "✅ Docker encontrado: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Docker no está instalado o no está en PATH" -ForegroundColor Red
    exit 1
}

# 2. Verificar .env.local
Write-Host "`n[2/5] Verificando configuración de entorno..." -ForegroundColor Yellow
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local no encontrado" -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Write-Host "📝 Creando .env.local desde .env.example..." -ForegroundColor Cyan
        Copy-Item ".env.example" ".env.local"
        Write-Host "✅ .env.local creado" -ForegroundColor Green
        Write-Host "⚠️  IMPORTANTE: Edita .env.local con tus valores reales" -ForegroundColor Yellow
    } else {
        Write-Host "❌ .env.example no encontrado" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ .env.local existe" -ForegroundColor Green
}

# 3. Validar aliases TypeScript
Write-Host "`n[3/5] Validando aliases de TypeScript..." -ForegroundColor Yellow
try {
    npm run validate:aliases 2>&1 | Out-Null
    Write-Host "✅ Aliases validados correctamente" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Validación de aliases falló (continuando...)" -ForegroundColor Yellow
}

# 4. Build de Docker (sin secretos)
Write-Host "`n[4/5] Construyendo imagen Docker (esto puede tardar varios minutos)..." -ForegroundColor Yellow
Write-Host "📦 Build sin secretos (Zero Trust Policy)" -ForegroundColor Cyan

try {
    docker build `
        --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 `
        -t motorgap-local-test `
        . 2>&1 | Tee-Object -FilePath "docker-build.log"
    
    Write-Host "✅ Build de Docker completado exitosamente" -ForegroundColor Green
} catch {
    Write-Host "❌ Build de Docker falló - revisa docker-build.log" -ForegroundColor Red
    exit 1
}

# 5. Verificar imagen
Write-Host "`n[5/5] Verificando imagen creada..." -ForegroundColor Yellow
if (docker images motorgap-local-test --format "{{.Repository}}" | Select-Object -First 1) {
    Write-Host "✅ Imagen 'motorgap-local-test' creada correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Imagen no encontrada" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 Prueba local completada exitosamente!`n" -ForegroundColor Green
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Edita .env.local con tus valores reales (DATABASE_URL, NEXTAUTH_SECRET, etc.)" -ForegroundColor White
Write-Host "  2. Para probar el contenedor:" -ForegroundColor White
Write-Host "     docker run -d -p 3000:3000 --env-file .env.local -e NEXT_PUBLIC_APP_URL=http://localhost:3000 motorgap-local-test" -ForegroundColor Gray
Write-Host "  3. Verifica el health check:" -ForegroundColor White
Write-Host "     curl http://localhost:3000/api/health" -ForegroundColor Gray
Write-Host "  4. O prueba con desarrollo local:" -ForegroundColor White
Write-Host "     npm run dev" -ForegroundColor Gray
Write-Host ""

