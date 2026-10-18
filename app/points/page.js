import Navbar from '@/app/components/Navbar';

export const metadata = {
    title: 'ポイントのルール | Y2FACTORY DAO',
};

// ポイントのもらい方・使い方（2026-10-18 時点のルール。変わったらここを直す）
const EARN = [
    { icon: '🎉', title: 'ウェルカムボーナス', amount: '500P', note: '新規登録したとき' },
    { icon: '⚔️', title: 'ランブル', amount: '1勝 50P', note: '勝ったら申請フォームから申請（開催から7日以内）。毎日まとめて付与' },
    { icon: '💡', title: '案募集への提出', amount: '募集ごとに設定', note: '提出した瞬間に自動で付与（例：名前募集は30P）' },
    { icon: '🏆', title: '案が採用されたら', amount: '500P', note: '投票などで採用が決まったあとに付与' },
    { icon: '🛠️', title: 'スタッフ報酬', amount: '月 2,000P〜3,000P', note: 'レクレーションスタッフ 月2,000P／コミュニティマネージャー 月3,000P' },
    { icon: '⬆️', title: 'レベルアップ', amount: '調整中', note: 'Discordのレベルアップ報酬は内容を見直し中です' },
];

export default function PointsGuidePage() {
    return (
        <>
            <Navbar />
            <div className="page-container">
                <div className="page-header animate-fade-in">
                    <h1 className="page-title">🪙 ポイントのルール</h1>
                    <p className="page-subtitle">コミュニティに参加・貢献するとポイントがもらえて、投票で使えます</p>
                </div>

                <div className="card animate-fade-in" style={{ marginBottom: '1rem', borderColor: 'var(--border-active)' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>⚠️ ポイントがもらえるのは、サイトとDiscordを連携しているアカウントだけです</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        まだの方はマイページの「Discordと連携する」から連携してください。連携前の分は保留になっていて、連携後に付与します。
                    </div>
                </div>

                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '1.5rem 0 0.75rem' }}>もらい方</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {EARN.map(e => (
                        <div key={e.title} className="card animate-fade-in" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem 1.25rem' }}>
                            <div style={{ fontSize: '1.6rem', flexShrink: 0 }}>{e.icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700 }}>{e.title}</span>
                                    <span style={{ fontWeight: 800, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{e.amount}</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.5 }}>{e.note}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '1.75rem 0 0.75rem' }}>使い方</h2>
                <div className="card animate-fade-in" style={{ padding: '1rem 1.25rem', lineHeight: 1.7, fontSize: '0.9rem' }}>
                    🗳️ <b>投票</b>：持っているポイントを選択肢に振り分けて投票できます。たくさん振り分けるほど、その選択肢を強く推せます。<br />
                    投票に使ったポイントはなくなります。
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                    <a href="/governance" className="btn btn-primary">🗳️ 投票を見る</a>
                    <a href="/suggestions" className="btn btn-secondary">💡 案募集を見る</a>
                    <a href="/mypage" className="btn btn-secondary">👤 ポイント履歴</a>
                </div>
            </div>
        </>
    );
}
