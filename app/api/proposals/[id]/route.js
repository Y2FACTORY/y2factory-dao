import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET single proposal
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const db = getDb();
        const proposal = db.prepare(`
      SELECT p.*, u.display_name as creator_name
      FROM proposals p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(id);

        if (!proposal) {
            return NextResponse.json({ error: 'プロポーザルが見つかりません' }, { status: 404 });
        }
        proposal.options = JSON.parse(proposal.options);
        return NextResponse.json({ proposal });
    } catch (error) {
        console.error('Proposal GET error:', error);
        return NextResponse.json({ error: '取得に失敗' }, { status: 500 });
    }
}

// UPDATE proposal
export async function PUT(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const { id } = await params;
        const { title, description, options, status, dbName, deadline } = await request.json();

        const db = getDb();
        const existing = db.prepare('SELECT * FROM proposals WHERE id = ?').get(id);
        if (!existing) {
            return NextResponse.json({ error: 'プロポーザルが見つかりません' }, { status: 404 });
        }

        const updates = [];
        const values = [];

        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (options !== undefined) {
            if (options.length < 2) {
                return NextResponse.json({ error: '選択肢は2つ以上必要です' }, { status: 400 });
            }
            updates.push('options = ?'); values.push(JSON.stringify(options));
        }
        if (status !== undefined) { updates.push('status = ?'); values.push(status); }
        if (dbName !== undefined) { updates.push('db_name = ?'); values.push(dbName); }
        if (deadline !== undefined) { updates.push('deadline = ?'); values.push(deadline || null); }

        if (updates.length === 0) {
            return NextResponse.json({ error: '更新する項目がありません' }, { status: 400 });
        }

        values.push(id);
        db.prepare(`UPDATE proposals SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        // 投票終了時に全ユーザーに通知を送る
        if (status === 'closed') {
            try {
                const allUsers = db.prepare('SELECT id FROM users').all();
                const proposalTitle = title || existing.title;
                console.log(`[Notification] Proposal closed: "${proposalTitle}", sending to ${allUsers.length} users`);
                const insertNotif = db.prepare(
                    'INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)'
                );
                const insertAll = db.transaction((userList) => {
                    for (const u of userList) {
                        insertNotif.run(
                            uuidv4(),
                            u.id,
                            'vote_result',
                            '📊 投票結果が確定しました',
                            `「${proposalTitle}」の投票が終了しました。結果を確認しましょう。`,
                            `/governance/${id}`
                        );
                    }
                });
                insertAll(allUsers);
                console.log(`[Notification] Successfully sent ${allUsers.length} notifications`);
            } catch (notifErr) {
                console.error('[Notification] Failed to send close notifications:', notifErr);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Proposal PUT error:', error);
        return NextResponse.json({ error: '更新に失敗' }, { status: 500 });
    }
}

// DELETE proposal (and associated votes)
export async function DELETE(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const { id } = await params;
        const db = getDb();

        const existing = db.prepare('SELECT * FROM proposals WHERE id = ?').get(id);
        if (!existing) {
            return NextResponse.json({ error: 'プロポーザルが見つかりません' }, { status: 404 });
        }

        // Delete votes first (foreign key)
        db.prepare('DELETE FROM votes WHERE proposal_id = ?').run(id);
        db.prepare('DELETE FROM proposals WHERE id = ?').run(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Proposal DELETE error:', error);
        return NextResponse.json({ error: '削除に失敗' }, { status: 500 });
    }
}
