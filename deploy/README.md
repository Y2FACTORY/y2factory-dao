# Y2FACTORY DAO - デプロイ情報

## サーバー情報
- **VPS**: ConoHa VPS (Ubuntu 22.04)
- **IP**: `160.251.207.209`
- **ドメイン**: `y2factory-dao.com`
- **URL**: https://y2factory-dao.com
- **SSH**: `ssh root@160.251.207.209`

## アプリ構成
- **フレームワーク**: Next.js (App Router)
- **データベース**: SQLite (better-sqlite3) → `/var/www/y2factory-dao/data/y2factory.db`
- **プロセス管理**: PM2 (`pm2 status` で確認)
- **リバースプロキシ**: Nginx → ポート3000に転送
- **SSL**: Let's Encrypt (certbot、自動更新)

## コード更新手順

### ① ローカルでプッシュ
```bash
cd "C:\Users\y2web\OneDrive\Desktop\Y2FACTORY DAO"
git add .
git commit -m "変更内容"
git push
```

### ② サーバーで反映
```bash
ssh root@160.251.207.209
cd /var/www/y2factory-dao && git pull && npm run build && pm2 restart y2factory
```

## 便利コマンド（サーバー上）
```bash
pm2 status          # アプリの状態確認
pm2 logs y2factory  # ログ確認
pm2 restart y2factory  # 再起動
```

## スクリプト一覧
| ファイル | 用途 |
|---|---|
| `deploy/setup.sh` | 初回VPSセットアップ |
| `deploy/setup-nginx.sh` | Nginx設定 |
| `deploy/update.sh` | サーバー上の更新スクリプト |
| `deploy/make-admin.js` | ユーザーを管理者に設定 |
