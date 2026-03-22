import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, createSession } from '@/lib/auth';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'メールアドレスとパスワードを入力してください' }, { status: 400 });
        }

        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user || !verifyPassword(password, user.password_hash)) {
            return NextResponse.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, { status: 401 });
        }

        const { sessionId, expiresAt } = createSession(user.id);

        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name,
                role: user.role,
            },
        });
        response.cookies.set('session_id', sessionId, {
            httpOnly: true,
            path: '/',
            expires: new Date(expiresAt),
            sameSite: 'lax',
        });
        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'ログインに失敗しました' }, { status: 500 });
    }
}
