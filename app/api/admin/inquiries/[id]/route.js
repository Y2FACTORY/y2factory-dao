import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// PUT - admin reply to an inquiry
export async function PUT(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const { admin_reply, status } = await req.json();

    if (!admin_reply?.trim()) {
      return NextResponse.json({ error: '返信内容を入力してください' }, { status: 400 });
    }

    const db = getDb();
    db.prepare(`
      UPDATE inquiries SET admin_reply = ?, status = ?, replied_by = ?, replied_at = datetime('now')
      WHERE id = ?
    `).run(admin_reply.trim(), status || 'replied', user.id, id);

    // Send notification to the user who submitted the inquiry
    const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id);
    if (inquiry) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, 'inquiry_reply', ?, ?, '/mypage?tab=inquiry')
      `).run(uuidv4(), inquiry.user_id, '💬 お問い合わせに返信がありました', `「${inquiry.subject}」に対する返信があります。マイページのお問い合わせタブをご確認ください。`);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
