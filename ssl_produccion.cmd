@echo off
echo ==========================================
echo   CONFIGURACION SSL PRODUCCION
echo ==========================================
echo.
echo Vamos a configurar SSL correctamente
echo usando el servidor de PRODUCCION de Let's Encrypt.
echo.

ssh root@46.224.41.2 "rm -rf /root/.local/share/caddy; cat > /etc/caddy/Caddyfile << 'EOF'
{
  email admin@motorgap.es
  acme_ca https://acme-v02.api.letsencrypt.org/directory
}

motorgap.es, www.motorgap.es {
  reverse_proxy 127.0.0.1:3000
}
EOF
systemctl restart caddy && sleep 5 && systemctl status caddy --no-pager && echo '' && echo '=== ESPERANDO CERTIFICADO (30 seg) ===' && sleep 30 && journalctl -u caddy -n 30 --no-pager | grep -i 'certificate\|error\|obtain'"

echo.
echo ==========================================
echo   Espera a que termine (puede tardar 1 min)
echo   Luego prueba: https://motorgap.es
echo ==========================================
pause
