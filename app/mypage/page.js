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
    const VALID_TABS = ['manual', 'notifications', 'governance', 'points'];
    const initialTab = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(VALID_TABS.includes(initialTab) ? initialTab : 'manual');

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
                    {(() => {
                        const displayRole = user.display_role || 'Y2FDメンバー';
                        const roleColorMap = { 'Y2FDメンバー': '#43E97B', '主任': '#00C9FF', '部長': '#F9A826', '役員': '#E040FB', '管理者': '#6C63FF' };
                        const roleColor = roleColorMap[displayRole] || '#6C63FF';
                        return (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center',
                                    padding: '0.2rem 0.75rem', borderRadius: '99px',
                                    background: roleColor + '22', border: `1px solid ${roleColor}55`,
                                    color: roleColor, fontSize: '0.75rem', fontWeight: 600,
                                }}>
                                    {displayRole}
                                </span>
                            </div>
                        );
                    })()}

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
                    <button className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')}>📖 マニュアル</button>
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
                    <button className={`tab-btn ${activeTab === 'governance' ? 'active' : ''}`} onClick={() => setActiveTab('governance')}>🗳️ ガバナンス</button>
                    <button className={`tab-btn ${activeTab === 'points' ? 'active' : ''}`} onClick={() => setActiveTab('points')}>ポイント履歴</button>
                </div>

                {activeTab === 'manual' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Header */}
                        <div className="card" style={{ padding: '1.25rem 1.5rem', background: 'rgba(108,99,255,0.05)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>📖 Y2FACTORY DAO 利用マニュアル</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>プラットフォームの使い方ガイド</p>
                        </div>

                        {/* ポイント獲得一覧 */}
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                <span style={{ fontSize: '1.25rem' }}>📊</span>
                                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>ポイント獲得一覧</span>
                            </div>
                            {[
                                { icon: '🎉', name: 'ウェルカムボーナス', desc: '新規登録時に付与', pts: '500P', color: 'var(--success)' },
                                { icon: '🤝', name: '友達紹介ボーナス', desc: '紹介者と被紹介者の両方に付与', pts: '1,000P', color: 'var(--success)' },
                                { icon: '⚔️', name: 'ランブル報酬', desc: '1勝利ごとに付与', pts: '50P', color: 'var(--success)' },
                                { icon: '👋', name: '挨拶ミッション報酬', desc: 'ミッション達成時に付与', pts: '1,000P', color: 'var(--success)' },
                                { icon: '⬆️', name: 'レベルアップ報酬', desc: 'レベル × 100P', pts: 'Lv × 100P', color: 'var(--info)' },
                            ].map((item, i) => (
                                <div key={i} style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: item.color, background: item.color === 'var(--info)' ? 'rgba(0,201,255,0.1)' : 'rgba(67,233,123,0.1)', padding: '0.2rem 0.6rem', borderRadius: '99px' }}>{item.pts}</div>
                                </div>
                            ))}
                            <div style={{ padding: '0.75rem 1.25rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '1.25rem' }}>👑</span>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>役職報酬</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>毎月付与</div>
                                    </div>
                                </div>
                                <div style={{ marginLeft: '2rem', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                    {[
                                        { role: 'レクレーションスタッフ', points: '月 2,000P', color: '#43E97B' },
                                        { role: 'コミュニティマネージャー', points: '月 3,000P', color: '#00C9FF' },
                                    ].map((r, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: i < 1 ? '1px solid var(--border)' : 'none' }}>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: r.color }}>{r.role}</span>
                                            <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--success)' }}>{r.points}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Section 1: はじめに */}
                        {[{
                            icon: '🌟', title: 'はじめに',
                            items: [
                                { q: 'Y2FACTORY DAOとは？', a: 'Y2FACTORY DAOは、コミュニティメンバーがポイントを獲得し、投票を通じて意思決定に参加できるSNS型ガバナンスプラットフォームです。' },
                                { q: 'ログイン方法', a: 'ご登録の際のメールアドレスと運営から共有されたパスワードでログインできます。初回ログイン時にウェルカムボーナスとして500Pが付与されます。' },
                            ]
                        }, {
                            icon: '🗳️', title: '投票の仕組み',
                            items: [
                                { q: '投票とは？', a: '運営から提案された議題に対して、保有ポイントを配分して投票できます。各選択肢にポイントを振り分けることで、あなたの意見を反映できます。投票に使用したポイントは消費されます。' },
                                { q: '投票方法', a: '1. 「投票」ページで開催中の議題を確認\n2. 議題をクリックして詳細ページへ移動\n3. 各選択肢にスライダーまたは数値入力でポイントを配分\n   ・「全額」ボタン：1つの選択肢に全ポイント投入\n   ・「均等配分」ボタン：全選択肢に均等配分\n   ・「リセット」ボタン：配分をやり直し\n4. 「○○ptを消費して投票する」ボタンで確定' },
                                { q: '投票期限について', a: '各議題には投票期限が設定されています。期限が過ぎると自動的に終了し、結果が確定します。' },
                                { q: '注意事項', a: '⚠️ 一度投票すると取り消しはできません。投票に使ったポイントは保有ポイントから差し引かれます（累計ポイントには影響しません）。' },
                            ]
                        }, {
                            icon: '💰', title: 'ポイントについて',
                            items: [
                                { q: 'ポイントの種類', a: '「累計ポイント」は運営から付与されたポイントの合計です。「保有ポイント」は投票に使える現在の残高です。' },
                                { q: 'ポイント獲得方法', a: 'ポイント表タブで各種報酬の詳細を確認できます。ウェルカムボーナス、友達紹介ボーナス（紹介者と被紹介者の両方に付与）、ランブル勝利、レベルアップ、役職報酬などがあります。' },
                                { q: 'ポイントの消費', a: '投票時に指定したポイントが保有ポイントから差し引かれます。ただし累計ポイントには影響しません。' },
                            ]
                        }, {
                            icon: '👤', title: 'マイページの使い方',
                            items: [
                                { q: 'アイコンの変更', a: 'アイコンをクリックすると編集パネルが開きます。絵文字と背景カラーを選んで設定できます。' },
                                { q: 'ポイント履歴', a: '「ポイント履歴」タブで過去のポイント付与・消費の詳細を確認できます。' },
                                { q: '投票履歴', a: '「投票履歴」タブで過去の投票内容を確認できます。' },
                                { q: '通知', a: '「通知」タブで運営からのお知らせや投票の開始・終了通知を確認できます。未読の通知はバッジで表示されます。' },
                            ]
                        }, {
                            icon: '❓', title: 'よくある質問',
                            items: [
                                { q: 'ポイントが反映されない', a: 'ポイントの付与は運営が行います。反映までに時間がかかる場合があります。お待ちください。' },
                                { q: '投票を取り消したい', a: '一度投票した内容は取り消せません。慎重に投票してください。' },
                                { q: '困ったときは？', a: 'ご不明な点は、Discord で運営までご連絡ください。' },
                            ]
                        }].map((section, si) => (
                            <div key={si} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{
                                    padding: '1rem 1.25rem',
                                    borderBottom: '1px solid var(--border)',
                                    background: 'rgba(255,255,255,0.02)',
                                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                                }}>
                                    <span style={{ fontSize: '1.25rem' }}>{section.icon}</span>
                                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{section.title}</span>
                                </div>
                                {section.items.map((item, ii) => (
                                    <div key={ii} style={{
                                        padding: '1rem 1.25rem',
                                        borderBottom: ii < section.items.length - 1 ? '1px solid var(--border)' : 'none',
                                    }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--accent-primary)', marginBottom: '0.375rem' }}>
                                            Q. {item.q}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                                            {item.a}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

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



                {activeTab === 'governance' && (() => {
                    const now = new Date();
                    const getEffectiveStatus = (p) => {
                        if (p.status === 'active' && p.deadline && new Date(p.deadline) < now) return 'closed';
                        return p.status;
                    };
                    const filtered = proposalFilter === 'all'
                        ? proposals
                        : proposals.filter(p => getEffectiveStatus(p) === proposalFilter);
                    return (
                        <div className="animate-fade-in">
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                                <button className={`btn ${proposalFilter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setProposalFilter('all')}>すべて</button>
                                <button className={`btn ${proposalFilter === 'active' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setProposalFilter('active')}>投票受付中</button>
                                <button className={`btn ${proposalFilter === 'closed' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setProposalFilter('closed')}>終了</button>
                            </div>
                            {filtered.length === 0 ? (
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
                                            <div key={p.id} className="proposal-card" onClick={() => router.push(`/governance/${p.id}`)} style={{ cursor: 'pointer' }}>
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
                    );
                })()}

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
