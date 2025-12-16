@echo off
echo ==========================================
echo   DIAGNOSTICO COMPLETO DEL SISTEMA
echo ==========================================
echo.

ssh root@46.224.41.2 "echo '=== 1. ESTADO DE SERVICIOS ==='; systemctl status caddy --no-pager | head -15; echo ''; echo '=== 2. PM2 STATUS ==='; pm2 list; echo ''; echo '=== 3. PUERTOS ESCUCHANDO ==='; netstat -tulpn | grep -E ':(80|443|3000)'; echo ''; echo '=== 4. PRUEBA INTERNA HTTP ==='; curl -I http://127.0.0.1:3000 2>&1 | head -10; echo ''; echo '=== 5. PRUEBA INTERNA CADDY ==='; curl -I http://127.0.0.1:80 2>&1 | head -10; echo ''; echo '=== 6. CADDYFILE ACTUAL ==='; cat /etc/caddy/Caddyfile; echo ''; echo '=== 7. DNS RESOLUTION ==='; nslookup motorgap.es 8.8.8.8; echo ''; echo '=== 8. PRUEBA EXTERNA HTTP ==='; curl -I http://motorgap.es 2>&1 | head -10; echo ''; echo '=== 9. CERTIFICADOS CADDY ==='; ls -la /var/lib/caddy/.local/share/caddy/certificates/ 2>&1 | head -10"

echo.
echo ==========================================
echo   ANALISIS COMPLETO TERMINADO
echo ==========================================
pause
