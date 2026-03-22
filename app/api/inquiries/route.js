import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET - get user's own inquiries
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const inquiries = db.prepare(`
      SELECT i.*, u.display_name as replied_by_name
      FROM inquiries i
      LEFT JOIN users u ON i.replied_by = u.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
    `).all(user.id);

    return NextResponse.json({ inquiries });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST - submit new inquiry
export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { subject, message } = await req.json();
    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: '件名と内容を入力してください' }, { status: 400 });
    }

    const db = getDb();
    const id = uuidv4();
    db.prepare(`
      INSERT INTO inquiries (id, user_id, subject, message)
      VALUES (?, ?, ?, ?)
    `).run(id, user.id, subject.trim(), message.trim());

    return NextResponse.json({ success: true, id });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
