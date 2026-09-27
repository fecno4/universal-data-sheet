#!/usr/bin/env bash
set -euo pipefail

TARGET_HOST="${TARGET_HOST:-10.88.30.63}"
TARGET_DIR="${TARGET_DIR:-/opt/universal-datasheet}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> [1/5] Preparando diretório remoto em ${TARGET_HOST}:${TARGET_DIR}..."
ssh root@"${TARGET_HOST}" "mkdir -p ${TARGET_DIR}"

echo "==> [2/5] Sincronizando arquivos do Universal DataSheet Studio..."
rsync -avz --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.DS_Store' \
  "${SCRIPT_DIR}/" "root@${TARGET_HOST}:${TARGET_DIR}/"

echo "==> [3/5] Configurando serviço systemd universal-datasheet..."
ssh root@"${TARGET_HOST}" bash -c "'
  cp ${TARGET_DIR}/systemd/universal-datasheet.service /etc/systemd/system/
  systemctl daemon-reload
  systemctl enable universal-datasheet.service
  systemctl restart universal-datasheet.service
'"

echo "==> [4/5] Configurando Nginx reverso na porta 80..."
ssh root@"${TARGET_HOST}" bash -c "'
  cat << \"EOF\" > /etc/nginx/sites-available/universal-datasheet
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8098;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
}
EOF
  rm -f /etc/nginx/sites-enabled/default
  ln -sf /etc/nginx/sites-available/universal-datasheet /etc/nginx/sites-enabled/
  nginx -t && systemctl restart nginx
'"

echo "==> [5/5] Validando saúde da aplicação..."
ssh root@"${TARGET_HOST}" bash -c "'
  systemctl is-active universal-datasheet.service
  systemctl is-active nginx.service
'"

echo "==> Testando resposta HTTP direta (porta 8098)..."
curl -I --connect-timeout 5 "http://${TARGET_HOST}:8098/" || true

echo "==> Testando resposta HTTP via Nginx (porta 80)..."
curl -I --connect-timeout 5 "http://${TARGET_HOST}/" || true

echo "==> Deploy concluído com sucesso em http://${TARGET_HOST}!"
