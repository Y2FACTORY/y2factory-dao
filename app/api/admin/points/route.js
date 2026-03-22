import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const db = getDb();
        const users = db.prepare(`
      SELECT u.id, u.email, u.display_name, u.role, u.created_at,
        (SELECT COALESCE(SUM(amount), 0) FROM points WHERE user_id = u.id AND db_name = 'default') as total_points
      FROM users u
      ORDER BY total_points DESC
    `).all();

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Admin points GET error:', error);
        return NextResponse.json({ error: 'ユーザー一覧取得に失敗' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const { userId, amount, reason, dbName } = await request.json();
        if (!userId || !amount || !reason) {
            return NextResponse.json({ error: 'ユーザーID、ポイント数、理由を入力してください' }, { status: 400 });
        }

        const db = getDb();
        const id = uuidv4();
        db.prepare(
            'INSERT INTO points (id, user_id, db_name, amount, reason, granted_by) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(id, userId, dbName || 'default', parseInt(amount), reason, user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin points POST error:', error);
        return NextResponse.json({ error: 'ポイント付与に失敗' }, { status: 500 });
    }
}
