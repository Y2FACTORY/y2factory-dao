import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const VALID_ROLES = ['Y2FDメンバー', '主任', '部長', '役員', '管理者'];

// UPDATE user's display_role (and sync internal role for admin access)
export async function PUT(request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const { userId, displayRole } = await request.json();
        if (!userId || !displayRole || !VALID_ROLES.includes(displayRole)) {
            return NextResponse.json({ error: '無効なパラメータです' }, { status: 400 });
        }

        if (userId === user.id) {
            return NextResponse.json({ error: '自分自身のロールは変更できません' }, { status: 400 });
        }

        const db = getDb();
        // Sync internal role: '管理者' → admin, others → member
        const internalRole = displayRole === '管理者' ? 'admin' : 'member';
        db.prepare('UPDATE users SET display_role = ?, role = ?, updated_at = datetime(\'now\') WHERE id = ?').run(displayRole, internalRole, userId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Role PUT error:', error);
        return NextResponse.json({ error: 'ロール変更に失敗' }, { status: 500 });
    }
}
