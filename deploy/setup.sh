#!/bin/bash
# Y2FACTORY DAO - VPS セットアップスクリプト
# サーバー: 160.251.216.242
# 使い方: sudo bash setup.sh

set -e
echo "=========================================="
echo " Y2FACTORY DAO - サーバーセットアップ"
echo "=========================================="

# 1. システム更新
echo "[1/7] システム更新中..."
apt update && apt upgrade -y

# 2. Node.js 20 インストール
echo "[2/7] Node.js インストール中..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
echo "Node.js $(node -v) インストール完了"

# 3. PM2 インストール
echo "[3/7] PM2 インストール中..."
npm install -g pm2
echo "PM2 インストール完了"

# 4. Nginx インストール
echo "[4/7] Nginx インストール中..."
apt install -y nginx
systemctl enable nginx
echo "Nginx インストール完了"

# 5. アプリをクローン
echo "[5/7] アプリをクローン中..."
cd /var/www
git clone https://github.com/Y2FACTORY/y2factory-dao.git
cd y2factory-dao

# 6. ビルド
echo "[6/7] npm install & ビルド中..."
npm install
npm run build

# アップロード用ディレクトリ作成
mkdir -p public/uploads/posts
mkdir -p public/uploads/shop
mkdir -p public/uploads/proposals
mkdir -p data

# 7. PM2で起動
echo "[7/7] PM2で起動中..."
pm2 start npm --name "y2factory" -- start
pm2 save
pm2 startup systemd -u root --hp /root

echo ""
echo "=========================================="
echo " セットアップ完了！"
echo "=========================================="
echo ""
echo "アプリは http://160.251.216.242:3000 で起動中"
echo ""
echo "次のステップ: Nginx設定 (sudo bash setup-nginx.sh)"
