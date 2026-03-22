'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';

const MEDAL_EMOJIS = ['🥇', '🥈', '🥉'];

export default function RankingPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (!userData.user) { router.push('/login'); return; }
        setUser(userData.user);

        const res = await fetch('/api/ranking');
        const data = await res.json();
        setRanking(data.ranking || []);
        setLoading(false);
    }, [router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (!user) return null;

    // Find current user's rank
    const myRankIndex = ranking.findIndex(r => r.id === user.id);
    const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null;
    const myPoints = myRankIndex >= 0 ? ranking[myRankIndex].cumulative_points : 0;
    const topPoints = ranking.length > 0 ? ranking[0].cumulative_points : 1;

    const renderAvatar = (u, size = 40) => {
        if (u.avatar_image) {
            return (
                <div style={{
                    width: size, height: size, borderRadius: '50%',
                    overflow: 'hidden', flexShrink: 0,
                    border: '2px solid var(--border)',
                }}>
                    <img src={u.avatar_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            );
        }
        return (
            <div style={{
                width: size, height: size, borderRadius: '50%',
                background: u.avatar_color || '#6C63FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: u.avatar_emoji ? size * 0.5 : size * 0.4,
                fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
                {u.avatar_emoji || u.display_name?.charAt(0)}
            </div>
        );
    };

    return (
        <>
            <Navbar />
            <div className="page-container">
                <div className="page-header animate-fade-in">
                    <h1 className="page-title">🏆 累計ランキング</h1>
                    <p className="page-subtitle">運営から付与されたポイントの累計ランキング</p>
                </div>

                {/* My Rank Card */}
                {myRank && (
                    <div className="card animate-slide-up" style={{
                        marginBottom: '2rem',
                        background: 'linear-gradient(135deg, rgba(108,99,255,0.12) 0%, rgba(67,233,123,0.08) 100%)',
                        border: '1px solid rgba(108,99,255,0.25)',
                        textAlign: 'center',
                        padding: '1.5rem',
                    }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>あなたの順位</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                            <div>
                                <div style={{
                                    fontSize: '2.5rem', fontWeight: 800,
                                    background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                }}>
                                    {myRank <= 3 ? MEDAL_EMOJIS[myRank - 1] : ''} {myRank}
                                    <span style={{ fontSize: '1rem', fontWeight: 500 }}>位</span>
                                </div>
                            </div>
                            <div style={{ width: '1px', height: '40px', background: 'var(--border)' }} />
                            <div>
                                <div style={{
                                    fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)',
                                }}>
                                    {myPoints.toLocaleString()}
                                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}> pt</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Ranking List */}
                {loading ? (
                    <div className="loading-spinner"><div className="spinner"></div></div>
                ) : ranking.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-icon">🏆</div>
                            <div className="empty-title">まだランキングデータがありません</div>
                            <div className="empty-desc">ポイントが付与されるとランキングが表示されます</div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                        {/* Top 3 Podium */}
                        {ranking.length >= 3 && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '0.75rem',
                                marginBottom: '1.5rem',
                            }}>
                                {[1, 0, 2].map(idx => {
                                    const r = ranking[idx];
                                    if (!r) return null;
                                    const rank = idx + 1;
                                    const isFirst = rank === 1;
                                    const roleColorMap = { 'Y2FDメンバー': '#43E97B', '主任': '#00C9FF', '部長': '#F9A826', '役員': '#E040FB', '管理者': '#6C63FF' };
                                    const roleColor = roleColorMap[r.display_role] || '#6C63FF';
                                    return (
                                        <div key={r.id} className="card" style={{
                                            textAlign: 'center',
                                            padding: isFirst ? '1.5rem 1rem' : '1.25rem 0.75rem',
                                            marginTop: isFirst ? '0' : '1.5rem',
                                            border: isFirst ? '1px solid rgba(249, 168, 38, 0.4)' : undefined,
                                            background: isFirst
                                                ? 'linear-gradient(160deg, rgba(249,168,38,0.1) 0%, rgba(108,99,255,0.05) 100%)'
                                                : undefined,
                                        }}>
                                            <div style={{ fontSize: isFirst ? '2rem' : '1.5rem', marginBottom: '0.5rem' }}>
                                                {MEDAL_EMOJIS[rank - 1]}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                                                {renderAvatar(r, isFirst ? 56 : 44)}
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: isFirst ? '1rem' : '0.9rem', marginBottom: '0.25rem' }}>
                                                {r.display_name}
                                            </div>
                                            {r.display_role && (
                                                <div style={{
                                                    display: 'inline-block',
                                                    padding: '0.1rem 0.5rem', borderRadius: '99px',
                                                    background: roleColor + '22', border: `1px solid ${roleColor}44`,
                                                    color: roleColor, fontSize: '0.65rem', fontWeight: 600,
                                                    marginBottom: '0.5rem',
                                                }}>{r.display_role}</div>
                                            )}
                                            <div style={{
                                                fontSize: isFirst ? '1.4rem' : '1.1rem',
                                                fontWeight: 800,
                                                color: 'var(--accent-primary)',
                                            }}>
                                                {r.cumulative_points.toLocaleString()}
                                                <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)' }}> pt</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Full List */}
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {ranking.map((r, i) => {
                                const rank = i + 1;
                                const isMe = r.id === user.id;
                                const percentage = topPoints > 0 ? (r.cumulative_points / topPoints) * 100 : 0;
                                const roleColorMap = { 'Y2FDメンバー': '#43E97B', '主任': '#00C9FF', '部長': '#F9A826', '役員': '#E040FB', '管理者': '#6C63FF' };
                                const roleColor = roleColorMap[r.display_role] || '#6C63FF';

                                return (
                                    <div key={r.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        padding: '0.875rem 1.25rem',
                                        borderBottom: '1px solid var(--border)',
                                        background: isMe ? 'rgba(108, 99, 255, 0.06)' : 'transparent',
                                        transition: 'background 0.2s',
                                        position: 'relative',
                                    }}>
                                        {/* Rank */}
                                        <div style={{
                                            width: 36, textAlign: 'center', fontWeight: 800,
                                            fontSize: rank <= 3 ? '1.2rem' : '0.9rem',
                                            color: rank <= 3 ? 'var(--accent-primary)' : 'var(--text-muted)',
                                            flexShrink: 0,
                                        }}>
                                            {rank <= 3 ? MEDAL_EMOJIS[rank - 1] : rank}
                                        </div>

                                        {/* Avatar */}
                                        {renderAvatar(r, 36)}

                                        {/* Name & Role */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <span style={{
                                                    fontWeight: isMe ? 700 : 600, fontSize: '0.9rem',
                                                    color: isMe ? 'var(--accent-primary)' : 'var(--text-primary)',
                                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                }}>
                                                    {r.display_name}
                                                    {isMe && <span style={{ fontSize: '0.7rem', marginLeft: '0.25rem' }}>（あなた）</span>}
                                                </span>
                                                {r.member_number && (
                                                    <span style={{
                                                        padding: '0.05rem 0.4rem', borderRadius: '99px',
                                                        background: 'rgba(108,99,255,0.1)', color: 'var(--accent-primary)',
                                                        fontSize: '0.6rem', fontWeight: 600, fontFamily: 'monospace',
                                                    }}>{r.member_number}</span>
                                                )}
                                                {r.display_role && (
                                                    <span style={{
                                                        padding: '0.05rem 0.4rem', borderRadius: '99px',
                                                        background: roleColor + '18', border: `1px solid ${roleColor}33`,
                                                        color: roleColor, fontSize: '0.6rem', fontWeight: 600,
                                                    }}>{r.display_role}</span>
                                                )}
                                            </div>
                                            {/* Progress bar */}
                                            <div style={{
                                                marginTop: '0.35rem', height: 4, borderRadius: 2,
                                                background: 'var(--bg-secondary)', overflow: 'hidden',
                                            }}>
                                                <div style={{
                                                    height: '100%', borderRadius: 2,
                                                    width: `${Math.max(percentage, 2)}%`,
                                                    background: rank <= 3
                                                        ? 'var(--accent-gradient)'
                                                        : 'rgba(108, 99, 255, 0.4)',
                                                    transition: 'width 0.8s ease-out',
                                                }} />
                                            </div>
                                        </div>

                                        {/* Points */}
                                        <div style={{
                                            fontWeight: 800, fontSize: '1rem',
                                            color: rank <= 3 ? 'var(--accent-primary)' : 'var(--text-primary)',
                                            whiteSpace: 'nowrap', flexShrink: 0,
                                        }}>
                                            {r.cumulative_points.toLocaleString()}
                                            <span style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--text-muted)' }}> pt</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div style={{
                            marginTop: '1rem', padding: '0.75rem 1rem',
                            background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                            fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6,
                        }}>
                            ℹ️ 累計ランキングは、運営から付与されたポイントの合計です。投票で消費したポイントは含まれません。運営による控除は反映されます。
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
