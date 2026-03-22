import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET - fetch all shop items (admin)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = getDb();
    const items = db.prepare('SELECT * FROM shop_items ORDER BY sort_order ASC, created_at DESC').all();
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST - create shop item
export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { title, imageUrl, linkUrl, description } = await req.json();
    if (!title?.trim() || !imageUrl?.trim() || !linkUrl?.trim()) {
      return NextResponse.json({ error: 'タイトル、画像、URLを入力してください' }, { status: 400 });
    }

    const db = getDb();
    const id = uuidv4();
    db.prepare(
      'INSERT INTO shop_items (id, title, image_url, link_url, description, created_by) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, title.trim(), imageUrl.trim(), linkUrl.trim(), description?.trim() || '', user.id);

    return NextResponse.json({ success: true, id });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE - delete shop item
export async function DELETE(req) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await req.json();
    const db = getDb();
    db.prepare('DELETE FROM shop_items WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT - update shop item (toggle active, edit)
export async function PUT(req) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id, title, imageUrl, linkUrl, description, isActive } = await req.json();
    const db = getDb();

    if (isActive !== undefined) {
      db.prepare('UPDATE shop_items SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, id);
    } else {
      db.prepare(
        'UPDATE shop_items SET title = ?, image_url = ?, link_url = ?, description = ? WHERE id = ?'
      ).run(title?.trim(), imageUrl?.trim(), linkUrl?.trim(), description?.trim() || '', id);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
