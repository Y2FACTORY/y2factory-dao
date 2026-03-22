import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        const { id: postId } = await params;
        const db = getDb();

        const existing = db.prepare(
            'SELECT id FROM reactions WHERE post_id = ? AND user_id = ? AND type = ?'
        ).get(postId, user.id, 'like');

        if (existing) {
            db.prepare('DELETE FROM reactions WHERE id = ?').run(existing.id);
            return NextResponse.json({ liked: false });
        } else {
            const reactionId = uuidv4();
            db.prepare(
                'INSERT INTO reactions (id, post_id, user_id, type) VALUES (?, ?, ?, ?)'
            ).run(reactionId, postId, user.id, 'like');
            return NextResponse.json({ liked: true });
        }
    } catch (error) {
        console.error('Reactions POST error:', error);
        return NextResponse.json({ error: 'リアクションに失敗' }, { status: 500 });
    }
}
