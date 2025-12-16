@echo off
echo ==========================================
echo   ARREGLO DEFINITIVO CADDY
echo ==========================================
echo.
echo Vamos a escribir el Caddyfile correctamente
echo usando un metodo que evita problemas de comillas.
echo.

ssh root@46.224.41.2 "cat > /etc/caddy/Caddyfile << 'EOF'
http://motorgap.es, http://www.motorgap.es {
  reverse_proxy 127.0.0.1:3000
}
EOF
systemctl restart caddy && systemctl status caddy --no-pager && echo '--- TEST LOCAL ---' && curl -I http://127.0.0.1"

echo.
echo ==========================================
echo   Si sale 'active (running)' arriba,
echo   prueba: http://motorgap.es
echo ==========================================
pause
