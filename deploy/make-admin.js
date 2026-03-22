#!/usr/bin/env node
const db = require('better-sqlite3')('./data/y2factory.db');
const users = db.prepare('SELECT id, display_name, role, display_role FROM users').all();

if (users.length === 0) {
    console.log('ユーザーが見つかりません。先に登録してください。');
    process.exit(1);
}

console.log('現在のユーザー:');
users.forEach(u => console.log(`  ${u.display_name} (role: ${u.role}, display_role: ${u.display_role})`));

// 最初のユーザーを管理者に設定
db.prepare("UPDATE users SET role='admin', display_role='管理者' WHERE id=?").run(users[0].id);
console.log(`\n✅ ${users[0].display_name} を管理者に設定しました！`);
