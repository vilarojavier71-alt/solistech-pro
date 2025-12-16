@echo off
echo ==========================================
echo   ULTIMA OPCION: HTTP-ONLY CHALLENGE
echo ==========================================
echo.

ssh root@46.224.41.2 "rm -rf /var/lib/caddy/.local/share/caddy; cat > /etc/caddy/Caddyfile << 'EOF'
{
  email admin@motorgap.es
  acme_ca https://acme-v02.api.letsencrypt.org/directory
  servers {
    protocols h1 h2
  }
}

http://motorgap.es {
  redir https://{host}{uri} permanent
}

motorgap.es {
  tls {
    protocols tls1.2 tls1.3
  }
  reverse_proxy 127.0.0.1:3000
}
EOF
systemctl restart caddy && sleep 10 && journalctl -u caddy -n 30 --no-pager | grep -E 'certificate|obtain|error|success'"

echo.
echo ==========================================
echo   Espera 2 minutos y prueba:
echo   https://motorgap.es
echo ==========================================
pause
