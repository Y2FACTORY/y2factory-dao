#!/bin/bash
# Y2FACTORY DAO - Nginx設定スクリプト
# ドメインなしの場合（IPアクセス用）
# 使い方: sudo bash setup-nginx.sh

set -e

echo "Nginx設定中..."

cat > /etc/nginx/sites-available/y2factory << 'EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# デフォルト設定を無効化し、y2factoryを有効化
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/y2factory /etc/nginx/sites-enabled/

# 文法チェック & 再起動
nginx -t
systemctl restart nginx

echo ""
echo "=========================================="
echo " Nginx設定完了！"
echo "=========================================="
echo ""
echo "http://160.251.216.242 でアクセスできます"
echo ""
echo "※ドメインを設定した後、SSL(HTTPS)を有効にする場合:"
echo "  sudo apt install certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d yourdomain.com"
