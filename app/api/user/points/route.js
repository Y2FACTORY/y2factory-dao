import { NextResponse } from 'next/server';
import { getDb, getUserPoints } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const dbName = searchParams.get('db') || 'default';

        const db = getDb();
        const points = getUserPoints(user.id, dbName);

        // Get point history (including vote consumption deductions)
        const history = db.prepare(`
      SELECT p.amount, p.reason, p.db_name, p.created_at, u.display_name as granted_by_name
      FROM points p
      LEFT JOIN users u ON p.granted_by = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT 50
    `).all(user.id);

        // Get vote history
        const votes = db.prepare(`
      SELECT v.chosen_option, v.point_weight, v.created_at, pr.title as proposal_title
      FROM votes v
      JOIN proposals pr ON v.proposal_id = pr.id
      WHERE v.user_id = ?
      ORDER BY v.created_at DESC
      LIMIT 50
    `).all(user.id);

        // Get all databases for switching
        const databases = db.prepare('SELECT name, description FROM databases WHERE is_active = 1').all();

        // Cumulative points (excludes vote spending only)
        const cumulativeResult = db.prepare(`
            SELECT COALESCE(SUM(amount), 0) as total FROM points 
            WHERE user_id = ? AND NOT (granted_by IS NULL AND amount < 0)
        `).get(user.id);
        const cumulativePoints = cumulativeResult.total;

        return NextResponse.json({
            points,
            cumulativePoints,
            history,
            votes,
            databases,
            currentDb: dbName,
        });
    } catch (error) {
        console.error('User points GET error:', error);
        return NextResponse.json({ error: 'ポイント情報取得に失敗' }, { status: 500 });
    }
}
