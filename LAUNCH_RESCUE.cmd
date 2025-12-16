@echo off
TITLE SOLISTECH RESCUE LAUNCHER
color 0A

echo ==========================================
echo   SOLISTECH PRO - DIFICULTADES TECNICAS
echo ==========================================
echo.
echo 1. Deteniendo procesos Node.js huerfanos...
taskkill /F /IM node.exe >nul 2>&1

echo 2. Limpiando cache corrupta (.next)...
if exist .next rd /s /q .next

echo 3. Instalando dependencias faltantes (rapido)...
call npm install

echo.
echo ==========================================
echo   INICIANDO SERVIDOR
echo ==========================================
echo.
echo ESTADO: El servidor se iniciara en el puerto 3000.
echo BINDING: 0.0.0.0 (Escuchando en todas las interfaces)
echo.
echo IMPORTANTE:
echo - NO CIERRES ESTA VENTANA NEGRA.
echo - Abre tu navegador y prueba estos DOS enlaces:
echo   1. http://localhost:3000
echo   2. http://127.0.0.1:3000
echo.

call npm run dev -- -H 0.0.0.0 -p 3000

echo.
echo El servidor se ha detenido.
pause
