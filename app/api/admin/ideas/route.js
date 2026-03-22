import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET - fetch all idea requests + submissions (admin)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = getDb();
    const requests = db.prepare(
      'SELECT r.*, u.display_name as creator_name FROM idea_requests r LEFT JOIN users u ON r.created_by = u.id ORDER BY r.created_at DESC'
    ).all();

    for (const r of requests) {
      r.target_roles = JSON.parse(r.target_roles || '[]');
      r.submissions = db.prepare(
        'SELECT s.*, u.display_name, u.display_role FROM idea_submissions s LEFT JOIN users u ON s.user_id = u.id WHERE s.request_id = ? ORDER BY s.created_at DESC'
      ).all(r.id);
    }

    return NextResponse.json({ requests });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST - create idea request
export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { title, description, targetRoles, deadline } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: 'タイトルを入力してください' }, { status: 400 });

    const db = getDb();
    const id = uuidv4();
    db.prepare(
      'INSERT INTO idea_requests (id, title, description, target_roles, deadline, created_by) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, title.trim(), description?.trim() || '', JSON.stringify(targetRoles || []), deadline || null, user.id);

    return NextResponse.json({ success: true, id });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT - toggle active
export async function PUT(req) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id, isActive } = await req.json();
    const db = getDb();
    db.prepare('UPDATE idea_requests SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE - delete idea request
export async function DELETE(req) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await req.json();
    const db = getDb();
    db.prepare('DELETE FROM idea_submissions WHERE request_id = ?').run(id);
    db.prepare('DELETE FROM idea_requests WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
