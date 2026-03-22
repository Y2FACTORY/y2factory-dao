import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const db = getDb();
        const comments = db.prepare(`
      SELECT c.*, u.display_name, u.avatar_color
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(id);

        return NextResponse.json({ comments });
    } catch (error) {
        console.error('Comments GET error:', error);
        return NextResponse.json({ error: 'コメント取得に失敗' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        const { id: postId } = await params;
        const { content } = await request.json();
        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'コメントを入力してください' }, { status: 400 });
        }

        const db = getDb();
        const commentId = uuidv4();
        db.prepare(
            'INSERT INTO comments (id, post_id, user_id, content) VALUES (?, ?, ?, ?)'
        ).run(commentId, postId, user.id, content.trim());

        return NextResponse.json({ success: true, id: commentId });
    } catch (error) {
        console.error('Comments POST error:', error);
        return NextResponse.json({ error: 'コメント送信に失敗' }, { status: 500 });
    }
}
