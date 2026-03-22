#!/bin/bash
# Y2FACTORY DAO - 更新スクリプト
# コード更新時にサーバーで実行
# 使い方: bash update.sh

set -e
cd /var/www/y2factory-dao

echo "コードを更新中..."
git pull

echo "依存関係を更新中..."
npm install

echo "ビルド中..."
npm run build

echo "再起動中..."
pm2 restart y2factory

echo ""
echo "✅ 更新完了！"
