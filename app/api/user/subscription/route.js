import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        const userId = user.id;

        const db = getDb();
        const activeSub = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? AND status = ?').get(userId, 'ACTIVE');

        if (activeSub) {
            return NextResponse.json({ success: true, subscription: activeSub });
        }
        
        return NextResponse.json({ success: true, subscription: null });
    } catch (e) {
        console.error("Subscription API block failed:", e);
        return NextResponse.json({ success: false, error: 'Failed to find subscription' }, { status: 500 });
    }
}
