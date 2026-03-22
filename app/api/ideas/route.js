import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET - fetch idea requests (user sees active only with role filter)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const requests = db.prepare(
      "SELECT r.*, u.display_name as creator_name FROM idea_requests r LEFT JOIN users u ON r.created_by = u.id WHERE r.is_active = 1 ORDER BY r.created_at DESC"
    ).all();

    // Filter by role - show requests where user's role is in target_roles or target_roles is empty
    const userRole = user.display_role || 'Y2FDメンバー';
    const filtered = requests.filter(r => {
      const roles = JSON.parse(r.target_roles || '[]');
      return roles.length === 0 || roles.includes(userRole);
    });

    // Check which ones user already submitted to
    const submissions = db.prepare(
      'SELECT request_id FROM idea_submissions WHERE user_id = ?'
    ).all(user.id);
    const submittedIds = new Set(submissions.map(s => s.request_id));

    const result = filtered.map(r => ({
      ...r,
      target_roles: JSON.parse(r.target_roles || '[]'),
      already_submitted: submittedIds.has(r.id),
    }));

    return NextResponse.json({ requests: result });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST - submit idea to a request
export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { requestId, content } = await req.json();
    if (!requestId || !content?.trim()) {
      return NextResponse.json({ error: '内容を入力してください' }, { status: 400 });
    }

    const db = getDb();
    const request = db.prepare('SELECT * FROM idea_requests WHERE id = ? AND is_active = 1').get(requestId);
    if (!request) return NextResponse.json({ error: '募集が見つかりません' }, { status: 404 });

    // Check deadline
    if (request.deadline) {
      const now = new Date();
      const localNow = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + 'T' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0');
      if (localNow > request.deadline) {
        return NextResponse.json({ error: '提出期限を過ぎています' }, { status: 400 });
      }
    }

    // Check role
    const roles = JSON.parse(request.target_roles || '[]');
    const userRole = user.display_role || 'Y2FDメンバー';
    if (roles.length > 0 && !roles.includes(userRole)) {
      return NextResponse.json({ error: '対象ロールではありません' }, { status: 403 });
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO idea_submissions (id, request_id, user_id, content) VALUES (?, ?, ?, ?)'
    ).run(id, requestId, user.id, content.trim());

    return NextResponse.json({ success: true, id });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
