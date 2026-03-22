'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';

// Helper: render content with clickable URLs and images
function renderContent(text) {
    if (!text) return null;
    // Split on image markdown and URLs
    const regex = /(!\[[^\]]*\]\([^)]+\))|(https?:\/\/[^\s<]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
        }
        if (match[1]) {
            // Image markdown
            const imgMatch = match[1].match(/!\[([^\]]*)\]\(([^)]+)\)/);
            if (imgMatch) {
                parts.push({ type: 'image', alt: imgMatch[1], url: imgMatch[2] });
            }
        } else if (match[2]) {
            // URL
            parts.push({ type: 'url', value: match[2] });
        }
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
        parts.push({ type: 'text', value: text.slice(lastIndex) });
    }
    return parts.map((p, i) => {
        if (p.type === 'image') {
            return <img key={i} src={p.url} alt={p.alt} style={{ maxWidth: '100%', borderRadius: 'var(--radius-md)', margin: '0.5rem 0', display: 'block' }} />;
        }
        if (p.type === 'url') {
            return <a key={i} href={p.value} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', wordBreak: 'break-all', textDecoration: 'underline' }}>{p.value}</a>;
        }
        return <span key={i}>{p.value}</span>;
    });
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (!userData.user) { router.push('/login'); return; }
        setUser(userData.user);

        // Fetch proposals - only active votes
        const propRes = await fetch('/api/proposals');
        const propData = await propRes.json();
        const now = new Date();
        const activeVotes = (propData.proposals || [])
            .filter(p => p.status === 'active' && !(p.deadline && new Date(p.deadline) < now))
            .map(p => ({
                id: p.id,
                type: 'vote_active',
                title: p.title,
                description: p.description,
                status: p.status,
                options: p.options,
                voter_count: p.voter_count,
                total_votes: p.total_votes,
                deadline: p.deadline,
                db_name: p.db_name,
                creator_name: p.creator_name,
                created_at: p.created_at,
            }))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setTimeline(activeVotes);
        setLoading(false);
    }, [router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatDate = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return 'たった今';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
        return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (!user) return null;

    return (
        <>
            <Navbar />
            <div className="page-container">
                    <div>
                        <div className="page-header animate-fade-in">
                            <h1 className="page-title">🗳️ 開催中の投票</h1>
                            <p className="page-subtitle">現在受付中の投票一覧</p>
                        </div>

                        {loading ? (
                            <div className="loading-spinner"><div className="spinner"></div></div>
                        ) : timeline.length === 0 ? (
                            <div className="card">
                                <div className="empty-state">
                                    <div className="empty-icon">🗳️</div>
                                    <div className="empty-title">現在開催中の投票はありません</div>
                                    <div className="empty-desc">新しい投票が作成されると、ここに表示されます。</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {timeline.map(item => (
                                    <div key={item.id}>
                                        {/* Active Vote */}
                                        {item.type === 'vote_active' && (
                                            <div
                                                className="card card-glow animate-fade-in"
                                                style={{ cursor: 'pointer', borderLeft: '4px solid var(--success)' }}
                                                onClick={() => router.push(`/governance/${item.id}`)}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                    <span className="proposal-status status-active">🟢 投票受付中</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(item.created_at)}</span>
                                                </div>
                                                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{item.title}</h3>
                                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {item.description}
                                                </p>
                                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                                    {item.options?.map((opt, i) => (
                                                        <span key={i} style={{
                                                            padding: '0.3rem 0.75rem',
                                                            background: 'rgba(108, 99, 255, 0.1)',
                                                            border: '1px solid rgba(108, 99, 255, 0.2)',
                                                            borderRadius: '99px',
                                                            fontSize: '0.8rem',
                                                            color: 'var(--accent-primary)',
                                                            fontWeight: 500,
                                                        }}>
                                                            {opt}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    <span>🗳️ {item.voter_count}人が参加</span>
                                                    <span>📊 {item.total_votes?.toLocaleString()}pt</span>
                                                    {item.deadline && <span>⏰ 〜{new Date(item.deadline).toLocaleDateString('ja-JP')}</span>}
                                                </div>
                                                <div style={{ marginTop: '0.75rem' }}>
                                                    <span className="btn btn-primary btn-sm">投票に参加する →</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
            </div>
        </>
    );
}
