import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        const db = getDb();
        const databases = db.prepare('SELECT * FROM databases ORDER BY created_at DESC').all();
        return NextResponse.json({ databases });
    } catch (error) {
        console.error('Databases GET error:', error);
        return NextResponse.json({ error: 'DB一覧取得に失敗' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const { name, description } = await request.json();
        if (!name) {
            return NextResponse.json({ error: 'DB名を入力してください' }, { status: 400 });
        }

        const db = getDb();
        const existing = db.prepare('SELECT id FROM databases WHERE name = ?').get(name);
        if (existing) {
            return NextResponse.json({ error: 'この名前のDBは既に存在します' }, { status: 409 });
        }

        const id = uuidv4();
        db.prepare(
            'INSERT INTO databases (id, name, description) VALUES (?, ?, ?)'
        ).run(id, name, description || '');

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error('Databases POST error:', error);
        return NextResponse.json({ error: 'DB作成に失敗' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const { name } = await request.json();
        if (!name) {
            return NextResponse.json({ error: 'DB名を指定してください' }, { status: 400 });
        }
        if (name === 'default') {
            return NextResponse.json({ error: 'デフォルトDBは削除できません' }, { status: 400 });
        }

        const db = getDb();
        const existing = db.prepare('SELECT id FROM databases WHERE name = ?').get(name);
        if (!existing) {
            return NextResponse.json({ error: 'DBが見つかりません' }, { status: 404 });
        }

        // Delete related data
        const proposals = db.prepare('SELECT id FROM proposals WHERE db_name = ?').all(name);
        for (const p of proposals) {
            db.prepare('DELETE FROM votes WHERE proposal_id = ?').run(p.id);
        }
        db.prepare('DELETE FROM proposals WHERE db_name = ?').run(name);
        db.prepare('DELETE FROM points WHERE db_name = ?').run(name);
        db.prepare('DELETE FROM databases WHERE name = ?').run(name);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Databases DELETE error:', error);
        return NextResponse.json({ error: 'DB削除に失敗' }, { status: 500 });
    }
}
