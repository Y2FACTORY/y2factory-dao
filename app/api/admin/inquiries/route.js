import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - admin: get all inquiries
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = getDb();
    const inquiries = db.prepare(`
      SELECT i.*, u.display_name as user_name, r.display_name as replied_by_name
      FROM inquiries i
      JOIN users u ON i.user_id = u.id
      LEFT JOIN users r ON i.replied_by = r.id
      ORDER BY
        CASE i.status WHEN 'open' THEN 0 WHEN 'replied' THEN 1 ELSE 2 END,
        i.created_at DESC
    `).all();

    return NextResponse.json({ inquiries });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
