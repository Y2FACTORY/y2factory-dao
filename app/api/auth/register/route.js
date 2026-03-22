import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
    try {
        const { email, password, displayName } = await request.json();

        if (!email || !password || !displayName) {
            return NextResponse.json({ error: 'すべてのフィールドを入力してください' }, { status: 400 });
        }

        const db = getDb();
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return NextResponse.json({ error: 'このメールアドレスは既に登録されています' }, { status: 409 });
        }

        const id = uuidv4();
        const passwordHash = await hashPassword(password);
        const colors = ['#6C63FF', '#FF6584', '#43E97B', '#F9A826', '#00C9FF', '#E040FB'];
        const avatarColor = colors[Math.floor(Math.random() * colors.length)];

        db.prepare(
            'INSERT INTO users (id, email, password_hash, display_name, avatar_color, raw_password) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(id, email, passwordHash, displayName, avatarColor, password);

        // Give initial welcome points
        const pId = uuidv4();
        db.prepare(
            'INSERT INTO points (id, user_id, db_name, amount, reason) VALUES (?, ?, ?, ?, ?)'
        ).run(pId, id, 'default', 500, 'ウェルカムボーナス');

        const { sessionId, expiresAt } = createSession(id);

        const response = NextResponse.json({ success: true, user: { id, email, displayName } });
        response.cookies.set('session_id', sessionId, {
            httpOnly: true,
            path: '/',
            expires: new Date(expiresAt),
            sameSite: 'lax',
        });
        return response;
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json({ error: '登録に失敗しました' }, { status: 500 });
    }
}
