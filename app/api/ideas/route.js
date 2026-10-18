import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// GET - fetch idea requests (every logged-in member sees all active requests)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const requests = db.prepare(
      "SELECT r.id, r.title, r.description, r.deadline, r.is_active, r.reward_points, r.created_by, r.created_at, u.display_name as creator_name FROM idea_requests r LEFT JOIN users u ON r.created_by = u.id WHERE r.is_active = 1 ORDER BY r.created_at DESC"
    ).all();

    // Check which ones user already submitted to
    const submissions = db.prepare(
      'SELECT request_id FROM idea_submissions WHERE user_id = ?'
    ).all(user.id);
    const submittedIds = new Set(submissions.map(s => s.request_id));

    const result = requests.map(r => ({
      ...r,
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

    // 1つの募集に提出できるのは1人1回（複数の案は1回の提出にまとめてもらう）
    const exists = db.prepare(
      'SELECT 1 FROM idea_submissions WHERE request_id = ? AND user_id = ?'
    ).get(requestId, user.id);
    if (exists) return NextResponse.json({ error: 'この募集にはすでに提出済みです' }, { status: 400 });

    const id = uuidv4();
    const reward = request.reward_points || 0;
    const reason = `💡 案募集の応募報酬：${request.title}`;
    // 応募報酬はサイトとDiscordを連携している人だけ（ランブル報酬などと同じルール）
    const canReward = reward > 0 && user.discord_verified === 1;
    db.transaction(() => {
      db.prepare(
        'INSERT INTO idea_submissions (id, request_id, user_id, content) VALUES (?, ?, ?, ?)'
      ).run(id, requestId, user.id, content.trim());
      if (canReward) {
        db.prepare(
          'INSERT INTO points (id, user_id, db_name, amount, reason, granted_by) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(uuidv4(), user.id, 'default', reward, reason, request.created_by);
      }
    })();

    return NextResponse.json({
      success: true,
      id,
      rewarded: canReward ? reward : 0,
      rewardPending: reward > 0 && !canReward,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
