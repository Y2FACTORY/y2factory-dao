import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/auth';

export async function POST() {
    try {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get('session_id')?.value;
        if (sessionId) {
            deleteSession(sessionId);
        }
        const response = NextResponse.json({ success: true });
        response.cookies.delete('session_id');
        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'ログアウトに失敗しました' }, { status: 500 });
    }
}
