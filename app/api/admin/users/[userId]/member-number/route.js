import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// PUT - update member number
export async function PUT(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const { userId } = await params;
        const { memberNumber } = await request.json();

        const db = getDb();
        db.prepare('UPDATE users SET member_number = ? WHERE id = ?').run(memberNumber || '', userId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Member number update error:', error);
        return NextResponse.json({ error: '会員番号の更新に失敗' }, { status: 500 });
    }
}
