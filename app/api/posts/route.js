import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 20;
        const offset = (page - 1) * limit;

        const db = getDb();
        const posts = db.prepare(`
      SELECT p.*, u.display_name, u.avatar_color, u.role,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM reactions WHERE post_id = p.id AND type = 'like') as like_count
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

        const user = await getCurrentUser();
        if (user) {
            for (const post of posts) {
                const reaction = db.prepare(
                    'SELECT id FROM reactions WHERE post_id = ? AND user_id = ? AND type = ?'
                ).get(post.id, user.id, 'like');
                post.liked = !!reaction;
            }
        }

        return NextResponse.json({ posts });
    } catch (error) {
        console.error('Posts GET error:', error);
        return NextResponse.json({ error: '投稿の取得に失敗' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        const { content, postType, title } = await request.json();
        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: '投稿内容を入力してください' }, { status: 400 });
        }

        const validAdminTypes = ['announcement', 'roadmap'];
        const type = (validAdminTypes.includes(postType) && user.role === 'admin') ? postType : 'normal';

        const db = getDb();
        const id = uuidv4();
        db.prepare(
            'INSERT INTO posts (id, user_id, content, post_type, title) VALUES (?, ?, ?, ?, ?)'
        ).run(id, user.id, content.trim(), type, (title || '').trim());

        // Send notification to all users
        const allUsers = db.prepare('SELECT id FROM users').all();
        const insertNotif = db.prepare(
            'INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)'
        );
        const preview = content.trim().replace(/!\[.*?\]\(.*?\)/g, '[画像]').slice(0, 80);
        const notifTitles = {
            announcement: '📋 進捗報告が投稿されました',
            roadmap: '🗺️ ロードマップが更新されました',
            normal: `📝 ${user.display_name}が投稿しました`,
        };
        const notifTitle = notifTitles[type] || notifTitles.normal;
        const sendNotifs = db.transaction(() => {
            for (const u of allUsers) {
                insertNotif.run(uuidv4(), u.id, 'post', notifTitle, preview, '/reports');
            }
        });
        sendNotifs();
        console.log(`[Post Notification] Sent to ${allUsers.length} users`);

        return NextResponse.json({ success: true, id });
    } catch (error) {
        console.error('Posts POST error:', error);
        return NextResponse.json({ error: '投稿に失敗しました' }, { status: 500 });
    }
}
