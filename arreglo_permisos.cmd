@echo off
echo ==========================================
echo   ARREGLO DE PERMISOS CADDY
echo ==========================================
echo.

ssh root@46.224.41.2 "mkdir -p /var/lib/caddy/.local/share/caddy; chown -R caddy:caddy /var/lib/caddy; chmod -R 0770 /var/lib/caddy; systemctl restart caddy && sleep 5 && systemctl status caddy --no-pager | head -20 && echo '' && echo '=== LOGS CERTIFICADO ===' && sleep 10 && journalctl -u caddy -n 20 --no-pager | grep -i 'certificate\|obtain\|error'"

echo.
echo ==========================================
echo   Espera 2 minutos y prueba:
echo   https://motorgap.es
echo ==========================================
pause
