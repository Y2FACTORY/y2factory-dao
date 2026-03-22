import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('image');

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'ファイルを選択してください' }, { status: 400 });
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'JPEG、PNG、GIF、WebP画像のみアップロード可能です' }, { status: 400 });
        }

        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'ファイルサイズは5MB以下にしてください' }, { status: 400 });
        }

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'shop');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const ext = file.name.split('.').pop();
        const filename = `${uuidv4().slice(0, 12)}.${ext}`;
        const filepath = path.join(uploadDir, filename);

        const bytes = await file.arrayBuffer();
        await writeFile(filepath, Buffer.from(bytes));

        const imageUrl = `/uploads/shop/${filename}`;
        return NextResponse.json({ success: true, imageUrl });
    } catch (error) {
        console.error('Shop image upload error:', error);
        return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 });
    }
}
