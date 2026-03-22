import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, getUserPoints } from '@/lib/db';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ user: null }, { status: 401 });
        }

        const points = getUserPoints(user.id, 'default');

        return NextResponse.json({
            user: {
                ...user,
                points,
            },
        });
    } catch (error) {
        console.error('Me error:', error);
        return NextResponse.json({ error: 'ユーザー情報取得に失敗' }, { status: 500 });
    }
}
