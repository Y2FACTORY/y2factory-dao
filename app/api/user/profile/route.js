import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        const { avatarColor, avatarEmoji, avatarImage, displayName, discordId } = await request.json();

        const db = getDb();
        const updates = [];
        const values = [];

        if (avatarColor !== undefined) { updates.push('avatar_color = ?'); values.push(avatarColor); }
        if (avatarEmoji !== undefined) { updates.push('avatar_emoji = ?'); values.push(avatarEmoji); }
        if (avatarImage !== undefined) { updates.push('avatar_image = ?'); values.push(avatarImage); }
        if (displayName !== undefined && displayName.trim()) { updates.push('display_name = ?'); values.push(displayName.trim()); }
        if (discordId !== undefined) { updates.push('discord_id = ?'); values.push(discordId); }

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
