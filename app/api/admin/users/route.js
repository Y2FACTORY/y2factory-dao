import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

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
        u.display_role,
        u.discord_id,
        u.raw_password,
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

        const { email, password, displayName, memberNumber, discordId } = await request.json();
        if (!email || !password || !displayName) {
            return NextResponse.json({ error: 'メール、パスワード、表示名は必須です' }, { status: 400 });
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
            'INSERT INTO users (id, email, password_hash, display_name, avatar_color, member_number, discord_id, raw_password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(id, email, passwordHash, displayName, avatarColor, memberNumber || '', discordId || '', String(password));

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

        const { userId, displayName, email, password, memberNumber, adminMemo, displayRole, discordId } = await request.json();
        if (!userId) {
            return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
        }

        const db = getDb();
        const target = db.prepare('SELECT id, email FROM users WHERE id = ?').get(userId);
        if (!target) {
            return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
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
            db.prepare('UPDATE users SET password_hash = ?, raw_password = ? WHERE id = ?').run(passwordHash, String(password), userId);
        }
        if (adminMemo !== undefined) {
            db.prepare('UPDATE users SET admin_memo = ? WHERE id = ?').run(adminMemo, userId);
        }
        if (displayRole !== undefined) {
            db.prepare('UPDATE users SET display_role = ? WHERE id = ?').run(displayRole, userId);
            // Sync internal role: '管理者' → admin, others → member
            const internalRole = displayRole === '管理者' ? 'admin' : 'member';
            db.prepare('UPDATE users SET role = ? WHERE id = ?').run(internalRole, userId);
        }
        if (discordId !== undefined) {
            db.prepare('UPDATE users SET discord_id = ? WHERE id = ?').run(discordId, userId);
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
