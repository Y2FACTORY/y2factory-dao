import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }
        const { id } = await params;
        const { content, title } = await request.json();
        if (!content || !content.trim()) {
            return NextResponse.json({ error: '内容を入力してください' }, { status: 400 });
        }
        const db = getDb();
        db.prepare('UPDATE posts SET content = ?, title = ? WHERE id = ?').run(content.trim(), (title || '').trim(), id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Post PUT error:', error);
        return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const db = getDb();

        // Delete comments and reactions first
        db.prepare('DELETE FROM comments WHERE post_id = ?').run(params.id);
        db.prepare('DELETE FROM reactions WHERE post_id = ?').run(params.id);
        db.prepare('DELETE FROM posts WHERE id = ?').run(params.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Post DELETE error:', error);
        return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
    }
}
