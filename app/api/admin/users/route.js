import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { isValidDiscordId } from '@/lib/discord';

// 管理者による Discord ID 手動設定のチェック（連携済みユーザー間で重複させない）
function checkAdminDiscordId(db, discordId, excludeUserId) {
    if (!isValidDiscordId(discordId)) {
        return { error: 'Discord ID は数字のユーザーID（17〜20桁）で入力してください', status: 400 };
    }
    const dup = db.prepare(
        'SELECT id FROM users WHERE discord_id = ? AND discord_verified = 1 AND id != ?'
    ).get(discordId, excludeUserId || '');
    if (dup) {
        return { error: 'このDiscord IDは既に別のユーザーと連携済みです', status: 409 };
    }
    return null;
}

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const db = getDb();
        const users = db.prepare(`
      SELECT 
        u.id,
        u.email,
        u.display_name,
        u.role,
        u.member_number,
        u.admin_memo,
        u.discord_id,
        COALESCE(u.discord_verified, 0) as discord_verified,
        COALESCE(u.discord_username, '') as discord_username,
        u.created_at,
        (SELECT COALESCE(SUM(amount), 0) FROM points WHERE user_id = u.id AND db_name = 'default') as total_points,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count,
        (SELECT COUNT(*) FROM comments WHERE user_id = u.id) as comment_count,
        (SELECT COUNT(*) FROM votes WHERE user_id = u.id) as vote_count,
        (SELECT COUNT(*) FROM reactions WHERE user_id = u.id) as reaction_count
      FROM users u
      ORDER BY u.created_at DESC
    `).all();

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Admin users GET error:', error);
        return NextResponse.json({ error: 'ユーザー一覧取得に失敗' }, { status: 500 });
    }
}

// POST - create new user from admin
export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const { email, password, displayName, memberNumber, discordId, role } = await request.json();
        if (!email || !password || !displayName) {
            return NextResponse.json({ error: 'メール、パスワード、表示名は必須です' }, { status: 400 });
        }
        // Discord自動登録用のプレースホルダーメールは予約済み
        if (String(email).toLowerCase().endsWith('@users.y2factory-dao.local')) {
            return NextResponse.json({ error: 'このメールアドレスは使用できません' }, { status: 400 });
        }
        if (role !== undefined && role !== 'admin' && role !== 'member') {
            return NextResponse.json({ error: '権限の値が不正です' }, { status: 400 });
        }
        const newRole = role === 'admin' ? 'admin' : 'member';

        const db = getDb();
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return NextResponse.json({ error: 'このメールアドレスは既に登録されています' }, { status: 409 });
        }

        // 管理者が入力した Discord ID は連携済み扱い
        const newDiscordId = discordId ? String(discordId).trim() : '';
        if (newDiscordId) {
            const err = checkAdminDiscordId(db, newDiscordId, null);
            if (err) return NextResponse.json({ error: err.error }, { status: err.status });
        }

        const id = uuidv4();
        const passwordHash = await hashPassword(password);
        const colors = ['#6C63FF', '#FF6584', '#43E97B', '#F9A826', '#00C9FF', '#E040FB'];
        const avatarColor = colors[Math.floor(Math.random() * colors.length)];

        db.prepare(
            'INSERT INTO users (id, email, password_hash, display_name, role, avatar_color, member_number, discord_id, discord_verified, raw_password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(id, email, passwordHash, displayName, newRole, avatarColor, memberNumber || '', newDiscordId, newDiscordId ? 1 : 0, '');

        // Give welcome points
        db.prepare(
            'INSERT INTO points (id, user_id, db_name, amount, reason) VALUES (?, ?, ?, ?, ?)'
        ).run(uuidv4(), id, 'default', 500, 'ウェルカムボーナス');

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error('Admin create user error:', error);
        return NextResponse.json({ error: 'ユーザー作成に失敗しました' }, { status: 500 });
    }
}

// PUT - edit existing user from admin
export async function PUT(request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const { userId, displayName, email, password, memberNumber, adminMemo, role, discordId } = await request.json();
        if (!userId) {
            return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
        }
        if (role !== undefined && role !== 'admin' && role !== 'member') {
            return NextResponse.json({ error: '権限の値が不正です' }, { status: 400 });
        }
        if (role === 'member' && userId === user.id) {
            return NextResponse.json({ error: '自分自身の管理者権限は外せません' }, { status: 400 });
        }

        const db = getDb();
        const target = db.prepare('SELECT id, email, discord_id FROM users WHERE id = ?').get(userId);
        if (!target) {
            return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
        }

        // Discord ID: 値が変わったときだけ更新する（未確認の古い手入力値を、他項目の編集ついでに連携済みにしないため）
        let discordUpdate = null;
        if (discordId !== undefined) {
            const newDiscordId = String(discordId ?? '').trim();
            if (newDiscordId !== String(target.discord_id || '')) {
                if (newDiscordId) {
                    const err = checkAdminDiscordId(db, newDiscordId, userId);
                    if (err) return NextResponse.json({ error: err.error }, { status: err.status });
                }
                discordUpdate = newDiscordId;
            }
        }

        // Check email uniqueness if changed
        if (email && email !== target.email) {
            const dup = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, userId);
            if (dup) {
                return NextResponse.json({ error: 'このメールアドレスは既に使われています' }, { status: 409 });
            }
        }

        // Build update
        if (displayName) {
            db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(displayName, userId);
        }
        if (email) {
            db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, userId);
        }
        if (memberNumber !== undefined) {
            db.prepare('UPDATE users SET member_number = ? WHERE id = ?').run(memberNumber, userId);
        }
        if (password && password.trim()) {
            const passwordHash = await hashPassword(password);
            // 平文パスワードは保存しない
            db.prepare("UPDATE users SET password_hash = ?, raw_password = '' WHERE id = ?").run(passwordHash, userId);
        }
        if (adminMemo !== undefined) {
            db.prepare('UPDATE users SET admin_memo = ? WHERE id = ?').run(adminMemo, userId);
        }
        if (role !== undefined) {
            db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
        }
        if (discordUpdate !== null) {
            // 管理者が設定 → 連携済み（空なら連携解除）。ユーザー名は次回 Discord ログイン時に入る
            db.prepare('UPDATE users SET discord_id = ?, discord_verified = ?, discord_username = ? WHERE id = ?')
                .run(discordUpdate, discordUpdate ? 1 : 0, '', userId);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin edit user error:', error);
        return NextResponse.json({ error: 'ユーザー更新に失敗しました' }, { status: 500 });
    }
}

// DELETE - delete user and all associated data
export async function DELETE(request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const { userId } = await request.json();
        if (!userId) {
            return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
        }
        if (userId === user.id) {
            return NextResponse.json({ error: '自分自身は削除できません' }, { status: 400 });
        }

        const db = getDb();
        const target = db.prepare('SELECT id, display_name FROM users WHERE id = ?').get(userId);
        if (!target) {
            return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
        }

        // Temporarily disable foreign keys for clean deletion
        db.pragma('foreign_keys = OFF');
        
        // Delete all associated data in a transaction
        const deleteUser = db.transaction(() => {
            // Delete reactions & comments on this user's posts (by other users)
            const userPostIds = db.prepare('SELECT id FROM posts WHERE user_id = ?').all(userId).map(p => p.id);
            for (const postId of userPostIds) {
                db.prepare('DELETE FROM reactions WHERE post_id = ?').run(postId);
                db.prepare('DELETE FROM comments WHERE post_id = ?').run(postId);
            }
            // Nullify granted_by references in points (this user granted points to others)
            db.prepare('UPDATE points SET granted_by = NULL WHERE granted_by = ?').run(userId);
            // Now delete user's own data
            db.prepare('DELETE FROM reactions WHERE user_id = ?').run(userId);
            db.prepare('DELETE FROM comments WHERE user_id = ?').run(userId);
            db.prepare('DELETE FROM votes WHERE user_id = ?').run(userId);
            db.prepare('DELETE FROM points WHERE user_id = ?').run(userId);
            db.prepare('DELETE FROM posts WHERE user_id = ?').run(userId);
            db.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
            db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
            db.prepare('DELETE FROM users WHERE id = ?').run(userId);
        });
        deleteUser();
        
        // Re-enable foreign keys
        db.pragma('foreign_keys = ON');

        return NextResponse.json({ success: true, deletedName: target.display_name });
    } catch (error) {
        console.error('Admin delete user error:', error);
        return NextResponse.json({ error: 'ユーザー削除に失敗しました' }, { status: 500 });
    }
}
