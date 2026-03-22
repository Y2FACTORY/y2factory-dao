import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET notifications for current user
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        const db = getDb();
        const notifications = db.prepare(`
            SELECT * FROM notifications
            WHERE user_id = ?
            ORDER BY is_read ASC, created_at DESC
            LIMIT 50
        `).all(user.id);

        const unreadCount = db.prepare(
            'SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0'
        ).get(user.id).cnt;

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Notifications GET error:', error);
        return NextResponse.json({ error: '通知取得に失敗' }, { status: 500 });
    }
}

// PUT - mark notifications as read
export async function PUT(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        const { notificationId, markAllRead } = await request.json();
        const db = getDb();

        if (markAllRead) {
            db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(user.id);
        } else if (notificationId) {
            db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(notificationId, user.id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Notifications PUT error:', error);
        return NextResponse.json({ error: '通知更新に失敗' }, { status: 500 });
    }
}
