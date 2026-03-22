import { NextResponse } from 'next/server';
import { getDb, getUserPoints } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
        }

        const { id: proposalId } = await params;
        const body = await request.json();

        const db = getDb();
        const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(proposalId);
        if (!proposal) {
            return NextResponse.json({ error: 'プロポーザルが見つかりません' }, { status: 404 });
        }
        if (proposal.status !== 'active') {
            return NextResponse.json({ error: 'この投票は終了しています' }, { status: 400 });
        }
        if (proposal.deadline && new Date(proposal.deadline) < new Date()) {
            return NextResponse.json({ error: '投票期限を過ぎています' }, { status: 400 });
        }

        const existingVote = db.prepare(
            'SELECT id FROM votes WHERE proposal_id = ? AND user_id = ?'
        ).get(proposalId, user.id);
        if (existingVote) {
            return NextResponse.json({ error: '既に投票済みです' }, { status: 409 });
        }

        const userPoints = getUserPoints(user.id, proposal.db_name);
        if (userPoints <= 0) {
            return NextResponse.json({ error: 'ポイントが不足しています' }, { status: 400 });
        }

        const options = JSON.parse(proposal.options);

        // Support both formats:
        // 1. Distribution: { allocations: [{option: "A", points: 50}, {option: "B", points: 30}] }
        // 2. Legacy single: { chosenOption: "A" }
        if (body.allocations && Array.isArray(body.allocations)) {
            // Distribution mode
            const allocations = body.allocations.filter(a => a.points > 0);

            if (allocations.length === 0) {
                return NextResponse.json({ error: '1つ以上の選択肢にポイントを配分してください' }, { status: 400 });
            }

            // Validate options exist
            for (const a of allocations) {
                if (!options.includes(a.option)) {
                    return NextResponse.json({ error: `無効な選択肢: ${a.option}` }, { status: 400 });
                }
                if (!Number.isInteger(a.points) || a.points < 0) {
                    return NextResponse.json({ error: 'ポイントは0以上の整数で入力してください' }, { status: 400 });
                }
            }

            const totalAllocated = allocations.reduce((sum, a) => sum + a.points, 0);
            if (totalAllocated > userPoints) {
                return NextResponse.json({ error: `配分ポイントの合計(${totalAllocated})が保有ポイント(${userPoints})を超えています` }, { status: 400 });
            }

            // Insert a vote record per allocated option + deduct points
            const insertStmt = db.prepare(
                'INSERT INTO votes (id, proposal_id, user_id, chosen_option, point_weight) VALUES (?, ?, ?, ?, ?)'
            );
            const pointDeductStmt = db.prepare(
                'INSERT INTO points (id, user_id, db_name, amount, reason, granted_by) VALUES (?, ?, ?, ?, ?, ?)'
            );
            const insertMany = db.transaction((items) => {
                for (const a of items) {
                    insertStmt.run(uuidv4(), proposalId, user.id, a.option, a.points);
                }
                // ポイント消費レコードを挿入（マイナス値）
                pointDeductStmt.run(
                    uuidv4(), user.id, proposal.db_name,
                    -totalAllocated,
                    `🗳️ 投票消費: ${proposal.title}`,
                    null
                );
            });
            insertMany(allocations);

            return NextResponse.json({ success: true, totalAllocated, mode: 'distribution' });

        } else if (body.chosenOption) {
            // Legacy single-choice mode
            const voteId = uuidv4();
            db.prepare(
                'INSERT INTO votes (id, proposal_id, user_id, chosen_option, point_weight) VALUES (?, ?, ?, ?, ?)'
            ).run(voteId, proposalId, user.id, body.chosenOption, userPoints);

            // ポイント消費レコードを挿入（マイナス値）
            db.prepare(
                'INSERT INTO points (id, user_id, db_name, amount, reason, granted_by) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(uuidv4(), user.id, proposal.db_name, -userPoints, `🗳️ 投票消費: ${proposal.title}`, null);

            return NextResponse.json({ success: true, pointWeight: userPoints, mode: 'single' });

        } else {
            return NextResponse.json({ error: '投票データが不正です' }, { status: 400 });
        }
    } catch (error) {
        console.error('Vote POST error:', error);
        return NextResponse.json({ error: '投票に失敗しました' }, { status: 500 });
    }
}
