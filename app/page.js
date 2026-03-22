import Link from 'next/link';

export default function Home() {
    return (
        <main>
            <section className="landing-hero">
                <div className="landing-badge">
                    <img src="/logo.png" alt="" style={{ width: '20px', height: '20px', borderRadius: '4px' }} /> Web2 × DAO ガバナンス
                </div>
                <h1 className="landing-title">
                    あなたの声が<br />
                    <span className="landing-title-accent">組織を動かす</span>
                </h1>
                <p className="landing-desc">
                    Y2FACTORY DAOは、活動を通じてポイントを獲得し、
                    その貢献度でコミュニティの意思決定に参加できる
                    SNS型ガバナンス・プラットフォームです。
                </p>
                <div className="landing-buttons">
                    <Link href="/login" className="btn btn-primary btn-lg">
                        ログイン →
                    </Link>
                </div>
            </section>

            <section className="landing-features">
                <div className="feature-card">
                    <div className="feature-icon">📱</div>
                    <h3 className="feature-title">SNSタイムライン</h3>
                    <p className="feature-desc">
                        メンバーの活動や運営からのお知らせを
                        リアルタイムでキャッチ。コメントやリアクションで交流。
                    </p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">🗳️</div>
                    <h3 className="feature-title">ポイント投票</h3>
                    <p className="feature-desc">
                        獲得したポイント数に応じた重み付き投票。
                        貢献度が高いほど、あなたの意見が反映される。
                    </p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon">🔍</div>
                    <h3 className="feature-title">透明な意思決定</h3>
                    <p className="feature-desc">
                        誰が、どの提案に、どれだけのポイントで投票したか。
                        すべての集計結果が公開されます。
                    </p>
                </div>
            </section>
        </main>
    );
}
