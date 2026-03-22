import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('avatar');

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'ファイルを選択してください' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'JPEG、PNG、GIF、WebP画像のみアップロード可能です' }, { status: 400 });
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: 'ファイルサイズは2MB以下にしてください' }, { status: 400 });
        }

        // Ensure upload directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Generate unique filename
        const ext = file.name.split('.').pop();
        const filename = `${user.id}-${uuidv4().slice(0, 8)}.${ext}`;
        const filepath = path.join(uploadDir, filename);

        // Write file
        const bytes = await file.arrayBuffer();
        await writeFile(filepath, Buffer.from(bytes));

        // Update database
        const avatarUrl = `/uploads/avatars/${filename}`;
        const db = getDb();
        db.prepare("UPDATE users SET avatar_image = ?, updated_at = datetime('now') WHERE id = ?").run(avatarUrl, user.id);

        return NextResponse.json({ success: true, avatarUrl });
    } catch (error) {
        console.error('Avatar upload error:', error);
        return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 });
    }
}
