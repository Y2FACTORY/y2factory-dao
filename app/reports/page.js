'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';

// Helper: render content with clickable URLs and images
function renderContent(text) {
    if (!text) return null;
    const regex = /(!\[[^\]]*\]\([^)]+\))|(https?:\/\/[^\s<]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
        }
        if (match[1]) {
            const imgMatch = match[1].match(/!\[([^\]]*)\]\(([^)]+)\)/);
            if (imgMatch) {
                parts.push({ type: 'image', alt: imgMatch[1], url: imgMatch[2] });
            }
        } else if (match[2]) {
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

export default function ReportsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('roadmap');

    const fetchData = useCallback(async () => {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (!userData.user) { router.push('/login'); return; }
        setUser(userData.user);

        const postRes = await fetch('/api/posts');
        const postData = await postRes.json();
        const filtered = (postData.posts || [])
            .filter(p => p.post_type === 'announcement' || p.post_type === 'roadmap')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setPosts(filtered);
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
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}日前`;
        return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const filteredPosts = category === 'progress'
        ? posts.filter(p => p.post_type === 'announcement')
        : posts.filter(p => p.post_type === 'roadmap');

    const categoryConfig = {
        roadmap: { label: '🗺️ ロードマップ', color: '#43E97B', emptyIcon: '🗺️', emptyTitle: 'まだロードマップがありません', emptyDesc: 'ロードマップが投稿されると、ここに表示されます。' },
        progress: { label: '📋 進捗報告', color: 'var(--accent-primary)', emptyIcon: '📋', emptyTitle: 'まだ進捗報告がありません', emptyDesc: '運営から投稿があると、ここに表示されます。' },
    };
    const cfg = categoryConfig[category];

    if (!user) return null;

    return (
        <>
            <Navbar />
            <div className="page-container">
                <div className="page-header animate-fade-in">
                    <h1 className="page-title">📋 進捗報告</h1>
                    <p className="page-subtitle">運営からのお知らせ・ロードマップ</p>
                </div>

                {/* Category Tabs */}
                <div style={{
                    display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
                    background: 'var(--bg-secondary)', padding: '0.375rem',
                    borderRadius: 'var(--radius-md)', width: 'fit-content',
                }} className="animate-fade-in">
                    {Object.entries(categoryConfig).map(([key, val]) => (
                        <button
                            key={key}
                            onClick={() => setCategory(key)}
                            style={{
                                padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-sm)',
                                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                                border: 'none', transition: 'var(--transition)',
                                background: category === key ? 'var(--bg-card)' : 'transparent',
                                color: category === key ? val.color : 'var(--text-muted)',
                                boxShadow: category === key ? 'var(--shadow-sm)' : 'none',
                            }}
                        >
                            {val.label}
                            <span style={{
                                marginLeft: '0.5rem', fontSize: '0.7rem',
                                padding: '0.1rem 0.4rem', borderRadius: '99px',
                                background: category === key ? val.color + '22' : 'transparent',
                                color: category === key ? val.color : 'var(--text-muted)',
                            }}>
                                {key === 'progress'
                                    ? posts.filter(p => p.post_type === 'announcement').length
                                    : posts.filter(p => p.post_type === 'roadmap').length}
                            </span>
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="loading-spinner"><div className="spinner"></div></div>
                ) : filteredPosts.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-icon">{cfg.emptyIcon}</div>
                            <div className="empty-title">{cfg.emptyTitle}</div>
                            <div className="empty-desc">{cfg.emptyDesc}</div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {filteredPosts.map((post, index) => (
                            <article key={post.id} className="card animate-fade-in" style={{
                                borderLeft: `4px solid ${cfg.color}`,
                                animationDelay: `${index * 0.05}s`,
                            }}>
                                {/* Header */}
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    marginBottom: '1rem', paddingBottom: '0.75rem',
                                    borderBottom: '1px solid var(--border)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                            padding: '0.25rem 0.75rem', borderRadius: '99px',
                                            fontSize: '0.75rem', fontWeight: 600,
                                            background: cfg.color + '18',
                                            color: cfg.color,
                                        }}>
                                            {cfg.label}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {post.display_name}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {formatDate(post.created_at)}
                                    </span>
                                </div>

                                {/* Title */}
                                {post.title && (
                                    <h2 style={{
                                        fontSize: '1.2rem', fontWeight: 700,
                                        marginBottom: '0.75rem', color: 'var(--text-primary)',
                                    }}>{post.title}</h2>
                                )}

                                {/* Content */}
                                <div style={{
                                    fontSize: '0.95rem', lineHeight: 1.8,
                                    whiteSpace: 'pre-wrap', color: 'var(--text-primary)',
                                }}>
                                    {renderContent(post.content)}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
