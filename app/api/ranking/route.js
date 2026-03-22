import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        const db = getDb();

        // Cumulative ranking: sum all points EXCEPT vote spending
        // Vote spending = granted_by IS NULL AND amount < 0 (negative points with no granter)
        // This INCLUDES: admin grants, admin deductions, welcome bonuses
        // This EXCLUDES: vote spending (negative, no granted_by)
        const ranking = db.prepare(`
            SELECT 
                u.id,
                u.display_name,
                u.avatar_color,
                u.avatar_emoji,
                u.avatar_image,
                u.member_number,
                u.display_role,
                COALESCE(
                    (SELECT SUM(p.amount) FROM points p 
                     WHERE p.user_id = u.id 
                     AND NOT (p.granted_by IS NULL AND p.amount < 0)),
                    0
                ) as cumulative_points
            FROM users u
            WHERE u.role != 'admin'
            ORDER BY cumulative_points DESC
        `).all();

        return NextResponse.json({ ranking });
    } catch (error) {
        console.error('Ranking GET error:', error);
        return NextResponse.json({ error: 'ランキング取得に失敗' }, { status: 500 });
    }
}
