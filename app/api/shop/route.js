import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - fetch active shop items (public)
export async function GET() {
  try {
    const db = getDb();
    const items = db.prepare(
      'SELECT * FROM shop_items WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC'
    ).all();
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
