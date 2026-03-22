import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request, { params }) {
    try {
        const { id: proposalId } = await params;
        const db = getDb();

        const proposal = db.prepare(`
      SELECT p.*, u.display_name as creator_name
      FROM proposals p
      JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(proposalId);

        if (!proposal) {
            return NextResponse.json({ error: 'プロポーザルが見つかりません' }, { status: 404 });
        }

        proposal.options = JSON.parse(proposal.options);

        // Get vote results per option
        const votes = db.prepare(`
      SELECT v.chosen_option, SUM(v.point_weight) as total_weight, COUNT(*) as voter_count
      FROM votes v
      WHERE v.proposal_id = ?
      GROUP BY v.chosen_option
    `).all(proposalId);

        // Get individual votes for transparency
        const individualVotes = db.prepare(`
      SELECT v.chosen_option, v.point_weight, v.created_at, u.display_name
      FROM votes v
      JOIN users u ON v.user_id = u.id
      WHERE v.proposal_id = ?
      ORDER BY v.created_at DESC
    `).all(proposalId);

        const totalWeight = votes.reduce((sum, v) => sum + v.total_weight, 0);
        const totalVoters = db.prepare(
            'SELECT COUNT(DISTINCT user_id) as cnt FROM votes WHERE proposal_id = ?'
        ).get(proposalId).cnt;

        const results = proposal.options.map(option => {
            const voteData = votes.find(v => v.chosen_option === option) || { total_weight: 0, voter_count: 0 };
            return {
                option,
                totalWeight: voteData.total_weight,
                voterCount: voteData.voter_count,
                percentage: totalWeight > 0 ? Math.round((voteData.total_weight / totalWeight) * 100) : 0,
            };
        });

        return NextResponse.json({
            proposal,
            results,
            totalWeight,
            totalVoters,
            individualVotes,
        });
    } catch (error) {
        console.error('Results GET error:', error);
        return NextResponse.json({ error: '結果取得に失敗' }, { status: 500 });
    }
}
