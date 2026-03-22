import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// POST - admin sends a direct notification to a user
export async function POST(req) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { userId, title, message } = await req.json();
    if (!userId || !title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'タイトルとメッセージを入力してください' }, { status: 400 });
    }

    const db = getDb();
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, link)
      VALUES (?, ?, 'admin_message', ?, ?, '/mypage')
    `).run(uuidv4(), userId, title.trim(), message.trim());

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
