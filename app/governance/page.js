'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';

export default function GovernancePage() {
    const router = useRouter();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetch('/api/auth/me').then(r => r.json()).then(d => {
            if (!d.user) router.push('/login');
        });
        fetchProposals();
    }, [router]);

    const fetchProposals = async () => {
        const res = await fetch('/api/proposals');
        const data = await res.json();
        setProposals(data.proposals || []);
        setLoading(false);
    };

    const now = new Date();
    const getEffectiveStatus = (p) => {
        if (p.status === 'active' && p.deadline && new Date(p.deadline) < now) return 'closed';
        return p.status;
    };

    const filtered = filter === 'all'
        ? proposals
        : proposals.filter(p => getEffectiveStatus(p) === filter);

    return (
        <>
            <Navbar />
            <div className="page-container">
                <div className="page-header animate-fade-in">
                    <div className="flex-between">
                        <div>
                            <h1 className="page-title">🗳️ ガバナンス</h1>
                            <p className="page-subtitle">コミュニティの意思決定に参加しよう</p>
                        </div>
                    </div>
                </div>

                <div className="tab-nav">
                    <button className={`tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                        すべて
                    </button>
                    <button className={`tab-btn ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>
                        投票受付中
                    </button>
                    <button className={`tab-btn ${filter === 'closed' ? 'active' : ''}`} onClick={() => setFilter('closed')}>
                        終了
                    </button>
                </div>

                {loading ? (
                    <div className="loading-spinner"><div className="spinner"></div></div>
                ) : filtered.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-icon">🗳️</div>
                            <div className="empty-title">プロポーザルがありません</div>
                            <div className="empty-desc">運営がプロポーザルを作成すると、ここに表示されます</div>
                        </div>
                    </div>
                ) : (
                    <div className="grid-2">
                        {filtered.map(p => {
                            const effStatus = getEffectiveStatus(p);
                            return (
                                <div key={p.id} className="proposal-card animate-fade-in" onClick={() => router.push(`/governance/${p.id}`)}>
                                    <div className="flex-between">
                                        <span className={`proposal-status ${effStatus === 'active' ? 'status-active' : 'status-closed'}`}>
                                            {effStatus === 'active' ? '🟢 投票受付中' : '⬜ 終了'}
                                        </span>
                                        {p.deadline && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                期限: {new Date(p.deadline).toLocaleDateString('ja-JP')}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="proposal-title">{p.title}</h3>
                                    <p className="proposal-desc">
                                        {p.description.length > 100 ? p.description.slice(0, 100) + '...' : p.description}
                                    </p>
                                    <div className="proposal-stats">
                                        <span className="proposal-stat">👤 {p.voter_count} 投票者</span>
                                        <span className="proposal-stat">⚡ {p.total_votes?.toLocaleString()} pt</span>
                                        <span className="proposal-stat">📊 {p.options?.length} 選択肢</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
