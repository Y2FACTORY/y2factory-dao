import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        // discordId は受け付けない（Discord連携は OAuth2 の連携ボタン経由のみ）
        const { avatarColor, avatarEmoji, avatarImage, displayName } = await request.json();

        const db = getDb();
        const updates = [];
        const values = [];

        if (avatarColor !== undefined) { updates.push('avatar_color = ?'); values.push(avatarColor); }
        if (avatarEmoji !== undefined) { updates.push('avatar_emoji = ?'); values.push(avatarEmoji); }
        // 画像アイコン機能は廃止。既存画像のクリア（空文字）のみ受け付ける
        if (avatarImage !== undefined) {
            if (avatarImage !== '') {
                return NextResponse.json({ error: '画像アイコンは設定できません' }, { status: 400 });
            }
            updates.push('avatar_image = ?'); values.push('');
        }
        if (displayName !== undefined && displayName.trim()) { updates.push('display_name = ?'); values.push(displayName.trim()); }

        if (updates.length === 0) {
            return NextResponse.json({ error: '更新する項目がありません' }, { status: 400 });
        }

        values.push(user.id);
        db.prepare(`UPDATE users SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...values);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Profile PUT error:', error);
        return NextResponse.json({ error: 'プロフィール更新に失敗' }, { status: 500 });
    }
}
