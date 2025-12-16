@echo off
echo ==========================================
echo   SOLUCION FINAL SSL
echo ==========================================
echo.
echo Vamos a usar solo motorgap.es (sin www)
echo y configurar Caddy para el desafio HTTP correctamente.
echo.

ssh root@46.224.41.2 "rm -rf /root/.local/share/caddy /var/lib/caddy; cat > /etc/caddy/Caddyfile << 'EOF'
{
  email admin@motorgap.es
  acme_ca https://acme-v02.api.letsencrypt.org/directory
}

motorgap.es {
  reverse_proxy 127.0.0.1:3000
}

www.motorgap.es {
  redir https://motorgap.es{uri} permanent
}
EOF
systemctl restart caddy && sleep 3 && systemctl status caddy --no-pager | head -20"

echo.
echo ==========================================
echo   Caddy intentara obtener el certificado
echo   en segundo plano. Espera 2-3 minutos
echo   y prueba: https://motorgap.es
echo ==========================================
pause
