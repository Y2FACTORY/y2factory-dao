import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const { userId } = await params;
        const { searchParams } = new URL(request.url);
        const dbName = searchParams.get('db') || null;

        const db = getDb();
        let history;
        if (dbName) {
            history = db.prepare(`
        SELECT p.id, p.amount, p.reason, p.db_name, p.created_at, u.display_name as granted_by_name
        FROM points p
        LEFT JOIN users u ON p.granted_by = u.id
        WHERE p.user_id = ? AND p.db_name = ?
        ORDER BY p.created_at DESC
      `).all(userId, dbName);
        } else {
            history = db.prepare(`
        SELECT p.id, p.amount, p.reason, p.db_name, p.created_at, u.display_name as granted_by_name
        FROM points p
        LEFT JOIN users u ON p.granted_by = u.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
      `).all(userId);
        }

        return NextResponse.json({ history });
    } catch (error) {
        console.error('Point history GET error:', error);
        return NextResponse.json({ error: '履歴取得に失敗' }, { status: 500 });
    }
}

// Delete a single point record
export async function DELETE(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const { userId } = await params;
        const { searchParams } = new URL(request.url);
        const pointId = searchParams.get('pointId');
        const resetAll = searchParams.get('resetAll');
        const dbName = searchParams.get('db') || 'default';

        const db = getDb();

        if (resetAll === 'true') {
            // Reset all points for this user in the given DB
            const result = db.prepare('DELETE FROM points WHERE user_id = ? AND db_name = ?').run(userId, dbName);
            return NextResponse.json({ success: true, deleted: result.changes, mode: 'reset' });
        } else if (pointId) {
            // Delete a specific point record
            const result = db.prepare('DELETE FROM points WHERE id = ? AND user_id = ?').run(pointId, userId);
            if (result.changes === 0) {
                return NextResponse.json({ error: 'ポイント記録が見つかりません' }, { status: 404 });
            }
            return NextResponse.json({ success: true, mode: 'single' });
        } else {
            return NextResponse.json({ error: 'pointIdまたはresetAllを指定してください' }, { status: 400 });
        }
    } catch (error) {
        console.error('Point DELETE error:', error);
        return NextResponse.json({ error: 'ポイント削除に失敗' }, { status: 500 });
    }
}
