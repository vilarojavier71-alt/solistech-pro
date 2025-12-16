@echo off
echo ==========================================
echo   INVESTIGACION DEL 404
echo ==========================================
echo.
echo Vamos a ver si el error esta en la portada
echo o en la pagina de login.
echo.

ssh root@46.224.41.2 "echo '1. TEST RAIZ'; curl -I http://127.0.0.1:3000/; echo '2. TEST LOGIN'; curl -I http://127.0.0.1:3000/auth/login; echo '3. TEST HTTPS LOCAL'; curl -I -k https://127.0.0.1/"

echo.
echo ==========================================
echo   MANDAME LA CAPTURA
echo ==========================================
pause
