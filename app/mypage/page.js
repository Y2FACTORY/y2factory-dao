'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';

const EMOJI_OPTIONS = [
    '', '😀', '😎', '🤖', '👾', '🦊', '🐱', '🐶', '🐼', '🦁',
    '🐸', '🦄', '🐲', '🌟', '⚡', '🔥', '💎', '🎮', '🎯', '🚀',
    '🎸', '🎨', '🏆', '👑', '🌈', '🍀', '🌙', '☀️', '🌊', '🎪',
];

const COLOR_OPTIONS = [
    '#6C63FF', '#9D4EDD', '#C77DFF', '#FF6584', '#FF4757',
    '#43E97B', '#00C9FF', '#F9A826', '#FF6B6B', '#4ECDC4',
    '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E9', '#82E0AA', '#F8C471',
];

function MyPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState(null);
    const [data, setData] = useState(null);
    const [currentDb, setCurrentDb] = useState('default');
    const VALID_TABS = ['notifications', 'points'];
    const initialTab = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(VALID_TABS.includes(initialTab) ? initialTab : 'notifications');

    // Governance
    const [proposals, setProposals] = useState([]);
    const [proposalFilter, setProposalFilter] = useState('all');

    // Notifications
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Avatar editor
    const [showAvatarEditor, setShowAvatarEditor] = useState(false);
    const [selectedEmoji, setSelectedEmoji] = useState('');
    const [selectedColor, setSelectedColor] = useState('#6C63FF');
    const [avatarImage, setAvatarImage] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [userRoles, setUserRoles] = useState([]);

    // Discord 連携エラー（/api/auth/discord/callback から ?discord_error=... で戻る）
    const DISCORD_ERROR_MESSAGES = {
        discord_not_configured: 'Discord連携は現在準備中です。しばらくしてからお試しください',
        discord_denied: 'Discordでの認証がキャンセルされました',
        state_mismatch: '認証の有効期限が切れたか、不正なリクエストです。もう一度お試しください',
        token_failed: 'Discordとの認証に失敗しました。もう一度お試しください',
        profile_failed: 'Discordのユーザー情報を取得できませんでした',
        already_linked: 'このDiscordアカウントは既に別のユーザーと連携されています',
        server_error: 'Discord連携中にエラーが発生しました',
    };
    const discordErrorCode = searchParams.get('discord_error');
    const discordErrorMsg = discordErrorCode ? (DISCORD_ERROR_MESSAGES[discordErrorCode] || 'Discord連携に失敗しました') : '';

    const fetchData = useCallback(async (db) => {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (!userData.user) { router.push('/login'); return; }
        setUser(userData.user);
        setSelectedEmoji(userData.user.avatar_emoji || '');
        setSelectedColor(userData.user.avatar_color || '#6C63FF');
        setAvatarImage(userData.user.avatar_image || '');

        const res = await fetch(`/api/user/points?db=${db}`);
        const d = await res.json();
        setData(d);

        // Fetch proposals for governance tab
        const proposalsRes = await fetch('/api/proposals');
        const proposalsData = await proposalsRes.json();
        setProposals(proposalsData.proposals || []);

        // Fetch notifications
        const notifRes = await fetch('/api/notifications');
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
        setUnreadCount(notifData.unreadCount || 0);
    }, [router]);

    useEffect(() => {
        fetchData(currentDb);
    }, [currentDb, fetchData]);

    const handleDbChange = (db) => { setCurrentDb(db); };

    const saveAvatar = async () => {
        setSaving(true);
        setSaveMsg('');
        const res = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            // 画像アイコン機能は廃止。保存時に既存の画像設定はクリアする
            body: JSON.stringify({ avatarColor: selectedColor, avatarEmoji: selectedEmoji, avatarImage: '' }),
        });
        const d = await res.json();
        if (d.success) {
            setAvatarImage('');
            setSaveMsg('✅ アイコンを変更しました');
            fetchData(currentDb);
            setTimeout(() => { setShowAvatarEditor(false); setSaveMsg(''); }, 1000);
        } else {
            setSaveMsg(`❌ ${d.error}`);
        }
        setSaving(false);
    };

    // Avatar display helper
    const renderAvatar = (size, fontSize) => {
        if (avatarImage) {
            return (
                <div style={{
                    width: size, height: size,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    margin: '0 auto 0.75rem',
                    cursor: 'pointer',
                    position: 'relative',
                    border: '3px solid var(--border)',
                }} onClick={() => setShowAvatarEditor(!showAvatarEditor)} title="クリックしてアイコンを変更">
                    <img src={avatarImage} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{
                        position: 'absolute', bottom: -2, right: -2,
                        width: 24, height: 24, borderRadius: '50%',
                        background: 'var(--accent-gradient)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', border: '2px solid var(--bg-card)',
                    }}>✏️</div>
                </div>
            );
        }
        return (
            <div
                onClick={() => setShowAvatarEditor(!showAvatarEditor)}
                style={{
                    width: size, height: size, borderRadius: '50%',
                    background: selectedColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: selectedEmoji ? fontSize * 1.2 : fontSize,
                    fontWeight: 700, color: 'white',
                    margin: '0 auto 0.75rem', cursor: 'pointer',
                    transition: 'var(--transition)', border: '3px solid transparent',
                    position: 'relative',
                }}
                title="クリックしてアイコンを変更"
            >
                {selectedEmoji || user?.display_name?.charAt(0)}
                <div style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'var(--accent-gradient)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', border: '2px solid var(--bg-card)',
                }}>✏️</div>
            </div>
        );
    };

    if (!user || !data) return (
        <>
            <Navbar />
            <div className="page-container"><div className="loading-spinner"><div className="spinner"></div></div></div>
        </>
    );

    return (
        <>
            <Navbar />
            <div className="page-container">
                <div className="page-header animate-fade-in">
                    <h1 className="page-title">マイページ</h1>
                    <p className="page-subtitle">あなたのステータスと活動履歴</p>
                </div>

                {/* Profile Card */}
                <div className="card animate-fade-in" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2rem' }}>
                    {renderAvatar(80, 32)}
                    {user.member_number && (
                        <div style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.75rem',
                            borderRadius: '99px',
                            background: 'rgba(108, 99, 255, 0.12)',
                            border: '1px solid rgba(108, 99, 255, 0.3)',
                            color: 'var(--accent-primary)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            marginBottom: '0.5rem',
                            fontFamily: 'monospace',
                        }}>{user.member_number}</div>
                    )}
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user.display_name}</div>

                    {/* Discord 連携 */}
                    {searchParams.get('linked') === '1' && Number(user.discord_verified) === 1 && (
                        <div className="success-message" style={{ marginTop: '1rem' }}>✅ Discordと連携しました。次回からDiscordでログインしてください</div>
                    )}
                    {discordErrorMsg && (
                        <div className="error-message" style={{ marginTop: '1rem' }}>❌ {discordErrorMsg}</div>
                    )}
                    <div style={{ marginTop: '1rem' }}>
                        {Number(user.discord_verified) === 1 ? (
                            <span style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.75rem', borderRadius: '99px',
                                background: 'rgba(88, 101, 242, 0.15)', border: '1px solid rgba(88, 101, 242, 0.4)',
                                color: '#5865F2', fontSize: '0.8rem', fontWeight: 600,
                            }}>Discord連携済み: {user.discord_username || '（ユーザー名は次回ログイン時に表示）'}</span>
                        ) : (
                            <div>
                                <a href="/api/auth/discord/login?mode=link" className="btn btn-sm" style={{ background: '#5865F2', color: 'white', border: 'none' }}>
                                    Discordと連携する
                                </a>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                    連携すると次回からDiscordでログインできます／メールログインは移行期間終了で廃止
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Avatar Editor */}
                    {showAvatarEditor && (
                        <div className="animate-slide-up" style={{
                            marginTop: '1.5rem', padding: '1.25rem',
                            background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border)', textAlign: 'left',
                        }}>
                            <h4 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>🎨 アイコンを変更</h4>

                            <div style={{ marginBottom: '0.5rem' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                                    {avatarImage ? '📝 絵文字・カラーで設定（保存すると現在の画像アイコンは置き換わります）' : '📝 絵文字・カラーで設定'}
                                </div>
                            </div>

                            {/* Preview */}
                            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                                <div style={{
                                    width: 64, height: 64, borderRadius: '50%',
                                    background: selectedColor,
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: selectedEmoji ? '2rem' : '1.5rem',
                                    fontWeight: 700, color: 'white',
                                }}>
                                    {selectedEmoji || user.display_name?.charAt(0)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>プレビュー</div>
                            </div>

                            {/* Emoji Picker */}
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>アイコン絵文字</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                    {EMOJI_OPTIONS.map((emoji, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedEmoji(emoji)}
                                            style={{
                                                width: 40, height: 40,
                                                borderRadius: 'var(--radius-sm)',
                                                border: selectedEmoji === emoji ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                                                background: selectedEmoji === emoji ? 'rgba(108, 99, 255, 0.15)' : 'var(--bg-card)',
                                                fontSize: emoji ? '1.25rem' : '0.7rem',
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'var(--text-secondary)', transition: 'var(--transition)',
                                            }}
                                        >
                                            {emoji || '文字'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>背景カラー</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                    {COLOR_OPTIONS.map((color, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedColor(color)}
                                            style={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                background: color,
                                                border: selectedColor === color ? '3px solid white' : '2px solid transparent',
                                                boxShadow: selectedColor === color ? '0 0 0 2px var(--accent-primary)' : 'none',
                                                cursor: 'pointer', transition: 'var(--transition)',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {saveMsg && <div className={saveMsg.startsWith('✅') ? 'success-message' : 'error-message'}>{saveMsg}</div>}

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <button className="btn btn-primary" onClick={saveAvatar} disabled={saving} style={{ flex: 1 }}>
                                    {saving ? '保存中...' : '絵文字・カラーで保存'}
                                </button>
                                <button className="btn btn-ghost" onClick={() => { setShowAvatarEditor(false); setSaveMsg(''); }}>
                                    キャンセル
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Overview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }} className="animate-slide-up">
                    <div className="stat-card">
                        <div className="stat-value">{data.cumulativePoints?.toLocaleString() ?? data.points?.toLocaleString()}</div>
                        <div className="stat-label">累計ポイント</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{data.points?.toLocaleString()}</div>
                        <div className="stat-label">保有ポイント</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{data.votes?.length || 0}</div>
                        <div className="stat-label">投票回数</div>
                    </div>
                </div>

                {/* DB Switcher */}
                {data.databases && data.databases.length > 1 && (
                    <div className="card animate-fade-in" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>📊 参照データベースの切り替え</div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {data.databases.map(db => (
                                <button key={db.name} className={`btn ${currentDb === db.name ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => handleDbChange(db.name)}>
                                    {db.description || db.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="tab-nav">
                    <button className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')} style={{ position: 'relative' }}>
                        🔔 通知
                        {unreadCount > 0 && (
                            <span style={{
                                marginLeft: '0.35rem',
                                background: 'var(--danger, #ff4757)', color: 'white',
                                fontSize: '0.65rem', fontWeight: 700,
                                padding: '0.1rem 0.4rem', borderRadius: '99px',
                            }}>{unreadCount}</span>
                        )}
                    </button>
                    <button className={`tab-btn ${activeTab === 'points' ? 'active' : ''}`} onClick={() => setActiveTab('points')}>ポイント履歴</button>
                </div>

                {activeTab === 'points' && (
                    <div className="card animate-fade-in" style={{ overflow: 'auto' }}>
                        {data.history && data.history.length > 0 ? (
                            <table className="history-table">
                                <thead><tr><th>日時</th><th>ポイント</th><th>理由</th><th>DB</th><th>付与者</th></tr></thead>
                                <tbody>
                                    {data.history.map((h, i) => (
                                        <tr key={i}>
                                            <td>{new Date(h.created_at).toLocaleDateString('ja-JP')}</td>
                                            <td style={{ color: h.amount > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                                                {h.amount > 0 ? '+' : ''}{h.amount}
                                            </td>
                                            <td>{h.reason}</td>
                                            <td><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{h.db_name}</span></td>
                                            <td>{h.granted_by_name || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">📋</div>
                                <div className="empty-title">ポイント履歴がありません</div>
                            </div>
                        )}
                    </div>
                )}



                {activeTab === 'notifications' && (
                    <div className="animate-fade-in">
                        {notifications.length > 0 && unreadCount > 0 && (
                            <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={async () => {
                                        await fetch('/api/notifications', {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ markAllRead: true }),
                                        });
                                        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
                                        setUnreadCount(0);
                                    }}
                                >
                                    ✅ すべて既読にする
                                </button>
                            </div>
                        )}
                        {notifications.length === 0 ? (
                            <div className="card">
                                <div className="empty-state">
                                    <div className="empty-icon">🔔</div>
                                    <div className="empty-title">通知はありません</div>
                                    <div className="empty-desc">投票した提案が終了すると、ここに通知が届きます</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className="card"
                                        onClick={async () => {
                                            if (!n.is_read) {
                                                fetch('/api/notifications', {
                                                    method: 'PUT',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ notificationId: n.id }),
                                                });
                                                setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: 1 } : x));
                                                setUnreadCount(prev => Math.max(0, prev - 1));
                                            }
                                            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, _expanded: !x._expanded } : x));
                                        }}
                                        style={{
                                            cursor: 'pointer',
                                            padding: '1rem 1.25rem',
                                            borderLeft: n.is_read ? '3px solid var(--border)' : '3px solid var(--accent-primary)',
                                            opacity: n.is_read ? 0.7 : 1,
                                            transition: 'var(--transition)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: n.is_read ? 500 : 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                                                    {n.title}
                                                </div>
                                                {!n._expanded ? (
                                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                                                        {n.message}
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7,
                                                        whiteSpace: 'pre-line', marginTop: '0.5rem',
                                                        padding: '0.75rem', background: 'rgba(108,99,255,0.04)',
                                                        borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                                                    }}>
                                                        {n.message}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                    {new Date(n.created_at).toLocaleDateString('ja-JP')}
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                    {n._expanded ? '▲ 閉じる' : '▼ 開く'}
                                                </div>
                                            </div>
                                        </div>
                                        {n._expanded && n.link && (
                                            <div style={{ marginTop: '0.75rem' }}>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    style={{ fontSize: '0.75rem' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (n.link.includes('tab=')) {
                                                            const url = new URL(n.link, window.location.origin);
                                                            const tab = url.searchParams.get('tab');
                                                            if (VALID_TABS.includes(tab)) setActiveTab(tab);
                                                        } else {
                                                            router.push(n.link);
                                                        }
                                                    }}
                                                >
                                                    {n.link.includes('/governance/') ? '🗳️ 投票ページを開く' :
                                                     '📄 ページを開く'}
                                                </button>
                                            </div>
                                        )}
                                        {!n.is_read && (
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <span style={{
                                                    fontSize: '0.65rem', fontWeight: 600,
                                                    background: 'rgba(108, 99, 255, 0.15)', color: 'var(--accent-primary)',
                                                    padding: '0.15rem 0.5rem', borderRadius: '99px',
                                                }}>未読</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div >
        </>
    );
}

export default function MyPage() {
    return (
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><div className="spinner"></div></div>}>
            <MyPageContent />
        </Suspense>
    );
}
