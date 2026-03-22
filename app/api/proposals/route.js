import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        const db = getDb();

        // 期限切れの active プロポーザルを自動で closed にする
        // deadline is stored in local time format from datetime-local input (e.g. "2026-03-22T01:45")
        const now = new Date();
        const localNow = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + 'T' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0');
        const expired = db.prepare(
            "SELECT id, title FROM proposals WHERE status = 'active' AND deadline IS NOT NULL AND deadline < ?"
        ).all(localNow);

        if (expired.length > 0) {
            const closeStmt = db.prepare("UPDATE proposals SET status = 'closed' WHERE id = ?");
            const allUsers = db.prepare('SELECT id FROM users').all();
            const insertNotif = db.prepare(
                'INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)'
            );

            const autoClose = db.transaction(() => {
                for (const p of expired) {
                    closeStmt.run(p.id);
                    for (const u of allUsers) {
                        insertNotif.run(
                            uuidv4(),
                            u.id,
                            'vote_result',
                            '📊 投票結果が確定しました',
                            `「${p.title}」の投票期限が終了しました。結果を確認しましょう。`,
                            `/governance/${p.id}`
                        );
                    }
                }
            });
            autoClose();
            console.log(`[Auto-close] Closed ${expired.length} expired proposals`);
        }

        const proposals = db.prepare(`
      SELECT p.*, u.display_name as creator_name,
        (SELECT COUNT(DISTINCT user_id) FROM votes WHERE proposal_id = p.id) as voter_count,
        (SELECT COALESCE(SUM(point_weight), 0) FROM votes WHERE proposal_id = p.id) as total_votes
      FROM proposals p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.created_at DESC
    `).all();

        for (const p of proposals) {
            p.options = JSON.parse(p.options);
        }

        return NextResponse.json({ proposals });
    } catch (error) {
        console.error('Proposals GET error:', error);
        return NextResponse.json({ error: 'プロポーザル取得に失敗' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const { title, description, options, dbName, deadline } = await request.json();
        if (!title || !description || !options || options.length < 2) {
            return NextResponse.json({ error: 'タイトル、説明、選択肢（2つ以上）を入力してください' }, { status: 400 });
        }

        const db = getDb();
        const id = uuidv4();
        db.prepare(
            'INSERT INTO proposals (id, title, description, options, db_name, created_by, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(id, title, description, JSON.stringify(options), dbName || 'default', user.id, deadline || null);

        // 全ユーザーに投票開始通知を送る
        const allUsers = db.prepare('SELECT id FROM users').all();
        const insertNotif = db.prepare(
            'INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)'
        );
        const insertAll = db.transaction((users) => {
            for (const u of users) {
                insertNotif.run(
                    uuidv4(),
                    u.id,
                    'vote_start',
                    '🗳️ 新しい投票が開始されました',
                    `「${title}」への投票が始まりました。参加しましょう！`,
                    `/governance/${id}`
                );
            }
        });
        insertAll(allUsers);

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error('Proposals POST error:', error);
        return NextResponse.json({ error: 'プロポーザル作成に失敗' }, { status: 500 });
    }
}
