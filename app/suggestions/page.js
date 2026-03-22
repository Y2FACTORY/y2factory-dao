'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';

export default function SuggestionsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [requests, setRequests] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [submitText, setSubmitText] = useState('');
    const [submitMsg, setSubmitMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (!userData.user) { router.push('/login'); return; }
        setUser(userData.user);

        const res = await fetch('/api/ideas');
        const d = await res.json();
        setRequests(d.requests || []);
    }, [router]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (!user) return null;

    const now = new Date();
    const localNow = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + 'T' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0');

    return (
        <>
            <Navbar />
            <div className="page-container">
                <div className="page-header animate-fade-in">
                    <h1 className="page-title">💡 提案</h1>
                    <p className="page-subtitle">運営からの案募集に対して、あなたのアイデアを提出できます</p>
                </div>

                {requests.length === 0 ? (
                    <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💡</div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>現在募集中の案件はありません</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            運営が案を募集すると、ここに表示されます
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {requests.map(r => {
                            const isExpired = r.deadline && localNow > r.deadline;
                            const isExpanded = expandedId === r.id;
                            return (
                                <div key={r.id} className="card animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
                                    {/* Header */}
                                    <div
                                        style={{
                                            padding: '1.25rem 1.5rem', cursor: 'pointer',
                                            borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                                        }}
                                        onClick={() => { setExpandedId(isExpanded ? null : r.id); setSubmitText(''); setSubmitMsg(''); }}
                                    >
                                        <div className="suggestion-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>💡 {r.title}</h3>
                                            <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                                                {r.already_submitted && (
                                                    <span style={{
                                                        padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 600,
                                                        background: 'rgba(67,233,123,0.15)', color: '#43E97B',
                                                    }}>✅ 提出済み</span>
                                                )}
                                                {isExpired ? (
                                                    <span style={{
                                                        padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 600,
                                                        background: 'rgba(255,71,87,0.15)', color: '#ff4757',
                                                    }}>⏰ 期限切れ</span>
                                                ) : (
                                                    <span style={{
                                                        padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 600,
                                                        background: 'rgba(108,99,255,0.15)', color: 'var(--accent-primary)',
                                                    }}>📝 募集中</span>
                                                )}
                                            </div>
                                        </div>
                                        {r.description && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line', marginBottom: '0.5rem' }}>{r.description}</div>}
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            {r.deadline && <span>📅 期限: {new Date(r.deadline).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                                            {r.target_roles?.length > 0 && <span>👥 対象: {r.target_roles.join(', ')}</span>}
                                        </div>
                                    </div>

                                    {/* Expanded submission form */}
                                    {isExpanded && !isExpired && !r.already_submitted && (
                                        <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(108,99,255,0.03)' }}>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>あなたの提案</label>
                                            <textarea
                                                className="form-textarea"
                                                value={submitText}
                                                onChange={e => setSubmitText(e.target.value)}
                                                placeholder="アイデアや提案を入力してください..."
                                                style={{ minHeight: '120px', marginBottom: '0.75rem' }}
                                            />
                                            {submitMsg && <div className={submitMsg.startsWith('✅') ? 'success-message' : 'error-message'} style={{ marginBottom: '0.5rem' }}>{submitMsg}</div>}
                                            <button
                                                className="btn btn-primary"
                                                disabled={submitting || !submitText.trim()}
                                                onClick={async () => {
                                                    setSubmitting(true); setSubmitMsg('');
                                                    try {
                                                        const res = await fetch('/api/ideas', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ requestId: r.id, content: submitText }),
                                                        });
                                                        const d = await res.json();
                                                        if (d.success) {
                                                            setSubmitMsg('✅ 提案を送信しました！');
                                                            setSubmitText('');
                                                            fetchData();
                                                        } else setSubmitMsg('❌ ' + d.error);
                                                    } catch { setSubmitMsg('❌ 送信に失敗しました'); }
                                                    setSubmitting(false);
                                                }}
                                            >
                                                {submitting ? '送信中...' : '📩 提案を送信'}
                                            </button>
                                        </div>
                                    )}

                                    {isExpanded && r.already_submitted && (
                                        <div style={{ padding: '1.25rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            ✅ この案件にはすでに提出済みです
                                        </div>
                                    )}

                                    {isExpanded && isExpired && !r.already_submitted && (
                                        <div style={{ padding: '1.25rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            ⏰ 提出期限を過ぎています
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
