'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';

export default function ProposalDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [user, setUser] = useState(null);
    const [data, setData] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [voteMessage, setVoteMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Image rendering helpers
    const renderDescription = (desc) => {
        if (!desc) return null;
        const parts = desc.split(/(!\[.*?\]\(.*?\))/);
        return parts.map((part, i) => {
            const match = part.match(/!\[(.*)\]\((.+)\)/);
            if (match) {
                return <img key={i} src={match[2]} alt={match[1]} style={{ maxWidth: '100%', borderRadius: 'var(--radius-md)', margin: '0.75rem 0', display: 'block' }} />;
            }
            return part ? <span key={i}>{part}</span> : null;
        });
    };

    const renderOptionLabel = (option) => {
        const imgMatch = option.match(/\[img:(.+?)\]/);
        const text = option.replace(/\s*\[img:.+?\]/, '').trim();
        return (
            <>
                <span>{text}</span>
                {imgMatch && <img src={imgMatch[1]} alt={text} style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem', display: 'block', objectFit: 'cover' }} />}
            </>
        );
    };

    // Point distribution state
    const [allocations, setAllocations] = useState({});

    const fetchData = useCallback(async () => {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (!userData.user) { router.push('/login'); return; }
        setUser(userData.user);

        const res = await fetch(`/api/proposals/${params.id}/results`);
        const d = await res.json();
        setData(d);

        const voted = d.individualVotes?.some(v => v.display_name === userData.user.display_name);
        setHasVoted(voted);

        // Initialize allocations to 0 for each option
        if (d.proposal?.options) {
            const init = {};
            d.proposal.options.forEach(opt => { init[opt] = 0; });
            setAllocations(init);
        }
        setLoading(false);
    }, [router, params.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Allocation helpers
    const totalAllocated = Object.values(allocations).reduce((sum, v) => sum + (v || 0), 0);
    const userPoints = user?.points || 0;
    const remaining = userPoints - totalAllocated;

    const setAllocation = (option, value) => {
        const num = Math.max(0, Math.min(parseInt(value) || 0, userPoints));
        setAllocations(prev => ({ ...prev, [option]: num }));
    };

    const setAllToOne = (option) => {
        const newAlloc = {};
        Object.keys(allocations).forEach(opt => { newAlloc[opt] = 0; });
        newAlloc[option] = userPoints;
        setAllocations(newAlloc);
    };

    const distributeEvenly = () => {
        const options = Object.keys(allocations);
        const each = Math.floor(userPoints / options.length);
        const remainder = userPoints - each * options.length;
        const newAlloc = {};
        options.forEach((opt, i) => {
            newAlloc[opt] = each + (i === 0 ? remainder : 0);
        });
        setAllocations(newAlloc);
    };

    const resetAllocations = () => {
        const newAlloc = {};
        Object.keys(allocations).forEach(opt => { newAlloc[opt] = 0; });
        setAllocations(newAlloc);
    };

    const handleVote = async () => {
        if (totalAllocated === 0) return;
        if (totalAllocated > userPoints) {
            setVoteMessage('❌ 配分ポイントが保有ポイントを超えています');
            return;
        }
        setSubmitting(true);
        const allocationArray = Object.entries(allocations)
            .filter(([, pts]) => pts > 0)
            .map(([option, points]) => ({ option, points }));

        const res = await fetch(`/api/proposals/${params.id}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allocations: allocationArray }),
        });
        const d = await res.json();
        if (d.success) {
            setVoteMessage(`✅ ${d.totalAllocated?.toLocaleString()}ptを消費して投票しました！`);
            setHasVoted(true);
            fetchData();
        } else {
            setVoteMessage(`❌ ${d.error}`);
        }
        setSubmitting(false);
    };

    if (loading) return (
        <>
            <Navbar />
            <div className="page-container"><div className="loading-spinner"><div className="spinner"></div></div></div>
        </>
    );

    if (!data || !data.proposal) return (
        <>
            <Navbar />
            <div className="page-container">
                <div className="card"><div className="empty-state"><div className="empty-title">プロポーザルが見つかりません</div></div></div>
            </div>
        </>
    );

    const { proposal, results, totalWeight, totalVoters, individualVotes } = data;

    return (
        <>
            <Navbar />
            <div className="page-container">
                <button className="btn btn-ghost" onClick={() => router.back()} style={{ marginBottom: '1rem' }}>
                    ← 戻る
                </button>

                <div className="dashboard-layout">
                    <div>
                        {/* Proposal Info */}
                        <div className="card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
                            <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                <span className={`proposal-status ${proposal.status === 'active' && !(proposal.deadline && new Date(proposal.deadline) < new Date()) ? 'status-active' : 'status-closed'}`}>
                                    {proposal.status === 'active' && !(proposal.deadline && new Date(proposal.deadline) < new Date()) ? '🟢 投票受付中' : '⬜ 終了'}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    提案者: {proposal.creator_name}
                                </span>
                            </div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>{proposal.title}</h1>
                            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{renderDescription(proposal.description)}</div>
                            {proposal.deadline && (
                                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    📅 投票期限: {new Date(proposal.deadline).toLocaleString('ja-JP')}
                                </div>
                            )}
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                📊 参照DB: {proposal.db_name}
                            </div>
                        </div>

                        {/* Vote Panel - Distribution Mode */}
                        {proposal.status === 'active' && !(proposal.deadline && new Date(proposal.deadline) < new Date()) && !hasVoted && (
                            <div className="card animate-slide-up" style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>🗳️ ポイント消費投票</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                                    各選択肢にポイントを配分して投票できます。全額を1つに集中することも可能です。
                                </p>
                                <div style={{
                                    padding: '0.6rem 0.85rem',
                                    background: 'rgba(255, 170, 0, 0.08)',
                                    border: '1px solid rgba(255, 170, 0, 0.3)',
                                    borderRadius: 'var(--radius-sm)',
                                    marginBottom: '1rem',
                                    fontSize: '0.8rem',
                                    color: '#e0a000',
                                    lineHeight: 1.5,
                                }}>
                                    ⚠️ 投票するとポイントが消費されます。消費したポイントは元に戻りません。
                                </div>

                                {/* Points Summary Bar */}
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    background: 'var(--bg-input)',
                                    borderRadius: 'var(--radius-sm)',
                                    marginBottom: '1.25rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: '0.5rem',
                                }}>
                                    <div style={{ fontSize: '0.85rem' }}>
                                        保有: <strong style={{ color: 'var(--accent-primary)' }}>{userPoints.toLocaleString()}pt</strong>
                                    </div>
                                    <div style={{ fontSize: '0.85rem' }}>
                                        配分済: <strong style={{ color: totalAllocated > userPoints ? 'var(--danger)' : 'var(--success)' }}>{totalAllocated.toLocaleString()}pt</strong>
                                    </div>
                                    <div style={{ fontSize: '0.85rem' }}>
                                        残り: <strong style={{ color: remaining < 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{remaining.toLocaleString()}pt</strong>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div style={{ height: '6px', background: 'var(--bg-input)', borderRadius: '99px', marginBottom: '1.25rem', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${Math.min((totalAllocated / userPoints) * 100, 100)}%`,
                                        background: totalAllocated > userPoints ? 'var(--danger)' : 'var(--accent-gradient)',
                                        borderRadius: '99px',
                                        transition: 'width 0.3s ease',
                                    }} />
                                </div>

                                {/* Quick Actions */}
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                                    <button className="btn btn-ghost btn-sm" onClick={distributeEvenly}>⚖️ 均等配分</button>
                                    <button className="btn btn-ghost btn-sm" onClick={resetAllocations}>🔄 リセット</button>
                                </div>

                                {/* Option Allocators */}
                                {proposal.options.map((option, idx) => {
                                    const pts = allocations[option] || 0;
                                    const pct = userPoints > 0 ? (pts / userPoints) * 100 : 0;
                                    return (
                                        <div key={idx} style={{
                                            padding: '1rem',
                                            background: pts > 0 ? 'rgba(108, 99, 255, 0.06)' : 'var(--bg-input)',
                                            border: pts > 0 ? '2px solid var(--accent-primary)' : '2px solid var(--border)',
                                            borderRadius: 'var(--radius-md)',
                                            marginBottom: '0.75rem',
                                            transition: 'var(--transition)',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{renderOptionLabel(option)}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <button
                                                        className="btn btn-ghost btn-sm"
                                                        onClick={() => setAllToOne(option)}
                                                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                                                    >
                                                        全額
                                                    </button>
                                                    <input
                                                        type="number"
                                                        value={pts}
                                                        onChange={e => setAllocation(option, e.target.value)}
                                                        min="0"
                                                        max={userPoints}
                                                        style={{
                                                            width: '90px',
                                                            padding: '0.35rem 0.5rem',
                                                            background: 'var(--bg-secondary)',
                                                            border: '1px solid var(--border)',
                                                            borderRadius: 'var(--radius-sm)',
                                                            color: 'var(--text-primary)',
                                                            fontFamily: 'inherit',
                                                            fontSize: '0.9rem',
                                                            fontWeight: 700,
                                                            textAlign: 'right',
                                                            outline: 'none',
                                                        }}
                                                    />
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>pt</span>
                                                </div>
                                            </div>
                                            {/* Slider */}
                                            <input
                                                type="range"
                                                min="0"
                                                max={userPoints}
                                                value={pts}
                                                onChange={e => setAllocation(option, e.target.value)}
                                                style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                                            />
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                {pct.toFixed(0)}%
                                            </div>
                                        </div>
                                    );
                                })}

                                {voteMessage && (
                                    <div className={voteMessage.startsWith('✅') ? 'success-message' : 'error-message'} style={{ marginTop: '1rem' }}>
                                        {voteMessage}
                                    </div>
                                )}
                                <button
                                    className="btn btn-primary btn-lg"
                                    style={{ width: '100%', marginTop: '1rem' }}
                                    onClick={handleVote}
                                    disabled={totalAllocated === 0 || totalAllocated > userPoints || submitting}
                                >
                                    {submitting ? '投票中...' : `${totalAllocated.toLocaleString()}ptを消費して投票する`}
                                </button>
                            </div>
                        )}

                        {hasVoted && (
                            <div className="success-message animate-fade-in" style={{ marginBottom: '1.5rem' }}>
                                ✅ この提案に投票済みです
                            </div>
                        )}

                        {/* Results */}
                        <div className="card animate-fade-in">
                            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>📊 投票結果</h3>
                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>総投票ポイント</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                        {totalWeight?.toLocaleString()}pt
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>投票者数</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{totalVoters}人</div>
                                </div>
                            </div>
                            {results?.map((r, i) => (
                                <div key={i} className="result-bar-container">
                                    <div className="result-bar-header">
                                        <span className="result-bar-label">{renderOptionLabel(r.option)}</span>
                                        <span className="result-bar-value">{r.percentage}% ({r.totalWeight?.toLocaleString()}pt / {r.voterCount}票)</span>
                                    </div>
                                    <div className="result-bar">
                                        <div className="result-bar-fill" style={{ width: `${r.percentage}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Transparency Sidebar */}
                    <div className="sidebar-card">
                        <div className="card">
                            <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>🔍 投票の透明性</h3>
                            <div className="transparency-list">
                                {individualVotes && individualVotes.length > 0 ? (
                                    individualVotes.map((v, i) => (
                                        <div key={i} className="transparency-item">
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{v.display_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.chosen_option?.replace(/\s*\[img:.+?\]/, '')}</div>
                                            </div>
                                            <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
                                                {v.point_weight?.toLocaleString()}pt
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        まだ投票がありません
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
