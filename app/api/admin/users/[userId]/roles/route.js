import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET user's roles
export async function GET(request, { params }) {
    try {
        const { userId } = await params;
        const db = getDb();
        const roles = db.prepare(`
            SELECT r.id, r.name, r.color
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = ?
        `).all(userId);
        return NextResponse.json({ roles });
    } catch (error) {
        console.error('User roles GET error:', error);
        return NextResponse.json({ error: 'ロール取得に失敗' }, { status: 500 });
    }
}

// ASSIGN role to user
export async function POST(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const { userId } = await params;
        const { roleId } = await request.json();

        const db = getDb();
        const existing = db.prepare('SELECT id FROM user_roles WHERE user_id = ? AND role_id = ?').get(userId, roleId);
        if (existing) {
            return NextResponse.json({ error: 'このロールは既に割り当て済みです' }, { status: 400 });
        }

        const id = uuidv4();
        db.prepare('INSERT INTO user_roles (id, user_id, role_id) VALUES (?, ?, ?)').run(id, userId, roleId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('User role assign error:', error);
        return NextResponse.json({ error: 'ロール割り当てに失敗' }, { status: 500 });
    }
}

// REMOVE role from user
export async function DELETE(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const { userId } = await params;
        const { searchParams } = new URL(request.url);
        const roleId = searchParams.get('roleId');

        const db = getDb();
        db.prepare('DELETE FROM user_roles WHERE user_id = ? AND role_id = ?').run(userId, roleId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('User role remove error:', error);
        return NextResponse.json({ error: 'ロール解除に失敗' }, { status: 500 });
    }
}
