import Link from 'next/link';

export default function Home() {
    return (
        <main>
            <section className="landing-hero">
                <div className="landing-badge">
                    <img src="/logo.png" alt="" style={{ width: '20px', height: '20px', borderRadius: '4px' }} /> Y2FACTORY DAO
                </div>
                <h1 className="landing-title">
                    みんながワイワイ楽しめる世界を
                </h1>
                <p className="landing-desc">
                    「みんながワイワイ楽しめる世界を」をミッションに、参加者が主体的に関与し共創を通じて価値を創出し、楽しい世界の実現と拡張を担うクリエイティブな共創コミュニティです。
                </p>
                <div className="landing-buttons">
                    <Link href="/login" className="btn btn-primary btn-lg">
                        ログイン →
                    </Link>
                </div>
            </section>
        </main>
    );
}

