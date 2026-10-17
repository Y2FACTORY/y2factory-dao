'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';

export default function AdminPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [databases, setDatabases] = useState([]); // still needed for proposal DB selects
    const [activeTab, setActiveTab] = useState('points');

    // Points form
    const [selectedUser, setSelectedUser] = useState('');
    const [pointAmount, setPointAmount] = useState('');
    const [pointReason, setPointReason] = useState('');
    const [pointDb, setPointDb] = useState('default');
    const [pointMsg, setPointMsg] = useState('');
    const [pointMode, setPointMode] = useState('grant'); // 'grant' or 'deduct'
    const [editingPostId, setEditingPostId] = useState(null);
    const [editingPostContent, setEditingPostContent] = useState('');
    const [editingPostTitle, setEditingPostTitle] = useState('');

    // Point history modal
    const [historyUser, setHistoryUser] = useState(null);
    const [pointHistory, setPointHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyMsg, setHistoryMsg] = useState('');

    // Proposal form
    const [propTitle, setPropTitle] = useState('');
    const [propDesc, setPropDesc] = useState('');
    const [propOptions, setPropOptions] = useState(['', '']);
    const [propDb, setPropDb] = useState('default');
    const [propDeadline, setPropDeadline] = useState(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    });
    const [propMsg, setPropMsg] = useState('');

    // Proposal list & edit
    const [proposals, setProposals] = useState([]);
    const [editingProp, setEditingProp] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editOptions, setEditOptions] = useState([]);
    const [editDb, setEditDb] = useState('default');
    const [editDeadline, setEditDeadline] = useState('');
    const [editStatus, setEditStatus] = useState('active');
    const [editMsg, setEditMsg] = useState('');

    // Image upload state
    const [uploading, setUploading] = useState(false);

    // Posts management
    const [posts, setPosts] = useState([]);
    const [postContent, setPostContent] = useState('');
    const [postTitle, setPostTitle] = useState('');
    const [postMsg, setPostMsg] = useState('');


    // User management
    const [allUsers, setAllUsers] = useState([]);
    const [userSearch, setUserSearch] = useState('');

    // Create user
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [newUserMemberNum, setNewUserMemberNum] = useState('');
    const [newUserDiscordId, setNewUserDiscordId] = useState('');
    const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);
    const [createUserMsg, setCreateUserMsg] = useState('');

    // Edit user
    const [editUser, setEditUser] = useState(null);
    const [editUserName, setEditUserName] = useState('');
    const [editUserEmail, setEditUserEmail] = useState('');
    const [editUserPassword, setEditUserPassword] = useState('');
    const [editUserMemberNum, setEditUserMemberNum] = useState('');
    const [editUserMemo, setEditUserMemo] = useState('');
    const [editUserIsAdmin, setEditUserIsAdmin] = useState(false);
    const [editUserDiscordId, setEditUserDiscordId] = useState('');
    const [editUserMsg, setEditUserMsg] = useState('');

    // Direct message to user
    const [dmUser, setDmUser] = useState(null);
    const [dmTitle, setDmTitle] = useState('');
    const [dmMessage, setDmMessage] = useState('');
    const [dmMsg, setDmMsg] = useState('');

    // Idea collection
    const [ideaRequests, setIdeaRequests] = useState([]);
    const [ideaTitle, setIdeaTitle] = useState('');
    const [ideaDesc, setIdeaDesc] = useState('');
    const [ideaDeadline, setIdeaDeadline] = useState(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    });
    const [ideaMsg, setIdeaMsg] = useState('');
    const [expandedIdea, setExpandedIdea] = useState(null);

    const fetchAll = useCallback(async () => {
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (!userData.user || userData.user.role !== 'admin') {
            router.push('/dashboard');
            return;
        }
        setUser(userData.user);

        const usersRes = await fetch('/api/admin/points');
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);

        const dbRes = await fetch('/api/admin/databases');
        const dbData = await dbRes.json();
        setDatabases(dbData.databases || []);

        const propRes = await fetch('/api/proposals');
        const propData = await propRes.json();
        setProposals(propData.proposals || []);

        const allUsersRes = await fetch('/api/admin/users');
        const allUsersData = await allUsersRes.json();
        const fetchedUsers = allUsersData.users || [];
        setAllUsers(fetchedUsers);

        try {
            const ideaRes = await fetch('/api/admin/ideas');
            const ideaData = await ideaRes.json();
            setIdeaRequests(ideaData.requests || []);
        } catch(e) { console.log('ideas fetch error:', e); }

    }, [router]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // === Point Grant / Deduct ===
    const handleGrantPoints = async (e) => {
        e.preventDefault();
        setPointMsg('');
        const finalAmount = pointMode === 'deduct' ? -Math.abs(parseInt(pointAmount)) : Math.abs(parseInt(pointAmount));
        const res = await fetch('/api/admin/points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: selectedUser, amount: finalAmount, reason: pointReason, dbName: pointDb }),
        });
        const data = await res.json();
        if (data.success) {
            setPointMsg(pointMode === 'deduct' ? '✅ ポイントを控除しました' : '✅ ポイントを付与しました');
            setPointAmount('');
            setPointReason('');
            fetchAll();
        } else {
            setPointMsg(`❌ ${data.error}`);
        }
    };

    // === Point History ===
    const openHistory = async (u) => {
        setHistoryUser(u);
        setHistoryLoading(true);
        setHistoryMsg('');
        const res = await fetch(`/api/admin/points/${u.id}`);
        const data = await res.json();
        setPointHistory(data.history || []);
        setHistoryLoading(false);
    };

    const closeHistory = () => {
        setHistoryUser(null);
        setPointHistory([]);
        setHistoryMsg('');
    };

    const deletePointRecord = async (pointId) => {
        if (!confirm('このポイント記録を削除しますか？')) return;
        const res = await fetch(`/api/admin/points/${historyUser.id}?pointId=${pointId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            setHistoryMsg('✅ 記録を削除しました');
            openHistory(historyUser);
            fetchAll();
        } else {
            setHistoryMsg(`❌ ${data.error}`);
        }
    };

    const resetAllPoints = async (targetUser, dbName = 'default') => {
        const name = targetUser.display_name;
        if (!confirm(`${name} の「${dbName}」DBのポイントを全てリセットしますか？この操作は取り消せません。`)) return;
        const res = await fetch(`/api/admin/points/${targetUser.id}?resetAll=true&db=${dbName}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            const msg = `✅ ${name} のポイントをリセットしました（${data.deleted}件削除）`;
            if (historyUser) {
                setHistoryMsg(msg);
                openHistory(historyUser);
            } else {
                setPointMsg(msg);
            }
            fetchAll();
        } else {
            const errMsg = `❌ ${data.error}`;
            if (historyUser) setHistoryMsg(errMsg);
            else setPointMsg(errMsg);
        }
    };

    // === Proposal ===
    const handleCreateProposal = async (e) => {
        e.preventDefault();
        setPropMsg('');
        const filteredOptions = propOptions.filter(o => o.trim());
        if (filteredOptions.length < 2) {
            setPropMsg('❌ 選択肢は2つ以上必要です');
            return;
        }
        const res = await fetch('/api/proposals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: propTitle,
                description: propDesc,
                options: filteredOptions,
                dbName: propDb,
                deadline: propDeadline || null,
            }),
        });
        const data = await res.json();
        if (data.success) {
            setPropMsg('✅ プロポーザルを作成しました');
            setPropTitle('');
            setPropDesc('');
            setPropOptions(['', '']);
            setPropDeadline('');
            fetchAll();
        } else {
            setPropMsg(`❌ ${data.error}`);
        }
    };





    // === Image Upload for Proposals ===
    const uploadProposalImage = async () => {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/jpeg,image/png,image/gif,image/webp';
            input.onchange = async (e) => {
                const file = e.target.files?.[0];
                if (!file) { resolve(null); return; }
                setUploading(true);
                const formData = new FormData();
                formData.append('image', file);
                try {
                    const res = await fetch('/api/proposals/upload', { method: 'POST', body: formData });
                    const data = await res.json();
                    setUploading(false);
                    if (data.imageUrl) { resolve(data.imageUrl); }
                    else { alert(data.error || 'アップロード失敗'); resolve(null); }
                } catch { setUploading(false); alert('アップロード失敗'); resolve(null); }
            };
            input.click();
        });
    };

    // === Image Preview Helpers ===
    const extractDescImages = (desc) => {
        if (!desc) return [];
        const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        const images = [];
        let m;
        while ((m = regex.exec(desc)) !== null) {
            images.push({ alt: m[1], url: m[2], full: m[0] });
        }
        return images;
    };

    const removeDescImage = (setter, url) => {
        setter(prev => prev.replace(new RegExp(`\\n?!\\[[^\\]]*\\]\\(${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'), '').trim());
    };

    const extractOptionImage = (opt) => {
        const m = opt?.match(/\[img:(.+?)\]/);
        return m ? m[1] : null;
    };

    const removeOptionImage = (options, setOptions, index) => {
        const newOpts = [...options];
        newOpts[index] = newOpts[index].replace(/\s*\[img:.+?\]/, '').trim();
        setOptions(newOpts);
    };

    const addOption = () => setPropOptions([...propOptions, '']);
    const updateOption = (i, val) => {
        const newOpts = [...propOptions];
        newOpts[i] = val;
        setPropOptions(newOpts);
    };
    const removeOption = (i) => {
        if (propOptions.length <= 2) return;
        setPropOptions(propOptions.filter((_, idx) => idx !== i));
    };

    // === Proposal Edit / Delete ===
    const openEditProp = (p) => {
        setEditingProp(p);
        setEditTitle(p.title);
        setEditDesc(p.description);
        setEditOptions([...p.options]);
        setEditDb(p.db_name);
        setEditDeadline(p.deadline || '');
        setEditStatus(p.status);
        setEditMsg('');
    };

    const closeEditProp = () => {
        setEditingProp(null);
        setEditMsg('');
    };

    const addEditOption = () => setEditOptions([...editOptions, '']);
    const updateEditOption = (i, val) => {
        const newOpts = [...editOptions];
        newOpts[i] = val;
        setEditOptions(newOpts);
    };
    const removeEditOption = (i) => {
        if (editOptions.length <= 2) return;
        setEditOptions(editOptions.filter((_, idx) => idx !== i));
    };

    const handleUpdateProp = async (e) => {
        e.preventDefault();
        setEditMsg('');
        const filteredOptions = editOptions.filter(o => o.trim());
        if (filteredOptions.length < 2) {
            setEditMsg('❌ 選択肢は2つ以上必要です');
            return;
        }
        const res = await fetch(`/api/proposals/${editingProp.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: editTitle,
                description: editDesc,
                options: filteredOptions,
                dbName: editDb,
                deadline: editDeadline || null,
                status: editStatus,
            }),
        });
        const data = await res.json();
        if (data.success) {
            setEditMsg('✅ 更新しました');
            fetchAll();
            setTimeout(closeEditProp, 800);
        } else {
            setEditMsg(`❌ ${data.error}`);
        }
    };

    const handleDeleteProp = async (p) => {
        if (!confirm(`「${p.title}」を削除しますか？関連する投票もすべて削除されます。`)) return;
        const res = await fetch(`/api/proposals/${p.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            setPropMsg('✅ プロポーザルを削除しました');
            fetchAll();
        } else {
            setPropMsg(`❌ ${data.error}`);
        }
    };

    const handleStatusChange = async (p, newStatus) => {
        const res = await fetch(`/api/proposals/${p.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        const data = await res.json();
        if (data.success) fetchAll();
    };

    // === User Management / CSV ===
    const filteredUsers = allUsers.filter(u => {
        if (!userSearch) return true;
        const s = userSearch.toLowerCase();
        return u.display_name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s);
    });

    const exportCSV = () => {
        const headers = ['ID', '会員番号', 'メール', '表示名', '権限', 'Discord ID', 'Discord連携', 'Discordユーザー名', 'ポイント', '投稿数', 'コメント数', '投票数', 'リアクション数', '登録日', 'メモ'];
        const rows = filteredUsers.map(u => [
            u.id,
            u.member_number || '',
            u.email,
            u.display_name,
            u.role === 'admin' ? '管理者' : 'メンバー',
            u.discord_id || '',
            Number(u.discord_verified) === 1 ? '連携済み' : '未連携',
            u.discord_username || '',
            u.total_points,
            u.post_count,
            u.comment_count,
            u.vote_count,
            u.reaction_count,
            u.created_at,
            u.admin_memo || '',
        ]);
        const bom = '\uFEFF';
        const csv = bom + [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `y2factory_users_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!user) return null;

    return (
        <>
            <Navbar />
            <div className="page-container">
                <div className="page-header animate-fade-in">
                    <h1 className="page-title">⚙️ 管理者パネル</h1>
                    <p className="page-subtitle">ポイント管理・プロポーザル作成・ユーザー管理</p>
                </div>

                <div className="tab-nav">
                    <button className={`tab-btn ${activeTab === 'points' ? 'active' : ''}`} onClick={() => setActiveTab('points')}>
                        💰 ポイント管理
                    </button>
                    <button className={`tab-btn ${activeTab === 'proposal' ? 'active' : ''}`} onClick={() => setActiveTab('proposal')}>
                        📋 プロポーザル管理
                    </button>
                    <button className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
                        👥 ユーザー管理
                    </button>
                    <button className={`tab-btn ${activeTab === 'ideas' ? 'active' : ''}`} onClick={() => setActiveTab('ideas')}>
                        💡 案募集
                    </button>
                    </div>

                {/* ===== POINTS TAB ===== */}
                {activeTab === 'points' && (
                    <div className="animate-fade-in">
                        <div className="admin-grid">
                            <div className="admin-section">
                                <h3 className="admin-section-title">💰 ポイント付与・控除</h3>
                                <form onSubmit={handleGrantPoints}>
                                    <div className="form-group">
                                        <label className="form-label">対象ユーザー</label>
                                        <select className="form-select" value={selectedUser} onChange={e => setSelectedUser(e.target.value)} required>
                                            <option value="">ユーザーを選択</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.display_name} ({u.total_points}pt)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">モード</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button type="button" className={`btn ${pointMode === 'grant' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setPointMode('grant')}>➕ 付与</button>
                                            <button type="button" className={`btn ${pointMode === 'deduct' ? 'btn-danger' : 'btn-ghost'} btn-sm`} onClick={() => setPointMode('deduct')}>➖ 控除</button>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">ポイント数</label>
                                        <input type="number" className="form-input" value={pointAmount} onChange={e => setPointAmount(e.target.value)} min="1" required placeholder="例: 100" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">理由</label>
                                        <input type="text" className="form-input" value={pointReason} onChange={e => setPointReason(e.target.value)} required placeholder="例: タスク完了報酬" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">参照DB</label>
                                        <select className="form-select" value={pointDb} onChange={e => setPointDb(e.target.value)}>
                                            {databases.map(db => (
                                                <option key={db.name} value={db.name}>{db.description || db.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {pointMsg && <div className={pointMsg.startsWith('✅') ? 'success-message' : 'error-message'}>{pointMsg}</div>}
                                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                                        {pointMode === 'deduct' ? '➖ ポイントを控除' : '➕ ポイントを付与'}
                                    </button>
                                </form>
                            </div>
                            <div className="admin-section">
                                <h3 className="admin-section-title">📊 ユーザーポイント一覧</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                    {users.map(u => (
                                        <div key={u.id} className="card" style={{ padding: '0.75rem 1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ fontWeight: 700 }}>{u.display_name}</span>
                                                <span style={{ marginLeft: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '1.1rem' }}>{u.total_points?.toLocaleString()}pt</span>
                                            </div>
                                            <button className="btn btn-ghost btn-sm" onClick={() => openHistory(u)}>📋 履歴</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* ===== MEMBERS TAB ===== */}
                {activeTab === 'members' && (
                    <div className="animate-fade-in">
                        {/* Create User Form */}
                        <div className="admin-section">
                            <h3 className="admin-section-title">➕ 新規ユーザー登録</h3>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                setCreateUserMsg('');
                                if (!newUserEmail || !newUserPassword || !newUserName) { setCreateUserMsg('❌ 必須項目を入力してください'); return; }
                                const res = await fetch('/api/admin/users', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ email: newUserEmail, password: newUserPassword, displayName: newUserName, memberNumber: newUserMemberNum, discordId: newUserDiscordId, role: newUserIsAdmin ? 'admin' : 'member' }),
                                });
                                const d = await res.json();
                                if (d.success) {
                                    setCreateUserMsg('✅ ユーザーを作成しました');
                                    setNewUserEmail(''); setNewUserPassword(''); setNewUserName(''); setNewUserMemberNum(''); setNewUserDiscordId(''); setNewUserIsAdmin(false);
                                    fetchAll();
                                } else {
                                    setCreateUserMsg(`❌ ${d.error}`);
                                }
                                setTimeout(() => setCreateUserMsg(''), 3000);
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div>
                                        <label className="form-label">表示名 *</label>
                                        <input type="text" className="form-input" placeholder="例: 田中太郎" value={newUserName} onChange={e => setNewUserName(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="form-label">メールアドレス *</label>
                                        <input type="email" className="form-input" placeholder="user@example.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="form-label">パスワード *</label>
                                        <input type="text" className="form-input" placeholder="初期パスワード" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="form-label">会員番号</label>
                                        <input type="text" className="form-input" placeholder="No.00001" value={newUserMemberNum} onChange={e => setNewUserMemberNum(e.target.value)} style={{ fontFamily: 'monospace' }} />
                                    </div>
                                    <div>
                                        <label className="form-label">Discord ID <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>（任意・数字のユーザーID。入力すると連携済みになります）</span></label>
                                        <input type="text" className="form-input" placeholder="例: 123456789012345678" value={newUserDiscordId} onChange={e => setNewUserDiscordId(e.target.value)} inputMode="numeric" />
                                    </div>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                                    <input type="checkbox" checked={newUserIsAdmin} onChange={e => setNewUserIsAdmin(e.target.checked)} />
                                    管理者権限を付与する
                                </label>
                                {createUserMsg && <div className={createUserMsg.startsWith('✅') ? 'success-message' : 'error-message'} style={{ marginBottom: '0.5rem' }}>{createUserMsg}</div>}
                                <button type="submit" className="btn btn-primary">➕ ユーザーを作成</button>
                            </form>
                        </div>

                        {/* User List */}
                        <div className="admin-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <h3 className="admin-section-title" style={{ margin: 0 }}>👥 全ユーザー一覧（{filteredUsers.length}件）</h3>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="🔍 名前・メールで検索"
                                        value={userSearch}
                                        onChange={e => setUserSearch(e.target.value)}
                                        style={{ maxWidth: '240px', fontSize: '0.8rem' }}
                                    />
                                    <button className="btn btn-secondary btn-sm" onClick={exportCSV} style={{ whiteSpace: 'nowrap' }}>📥 CSV</button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {filteredUsers.map(u => {
                                    const isAdmin = u.role === 'admin';
                                    const roleColor = isAdmin ? '#6C63FF' : '#43E97B';
                                    return (
                                        <div key={u.id} className="card" style={{ padding: '1rem', marginBottom: '0.75rem', borderLeft: `4px solid ${roleColor}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                                <div style={{ flex: 1, minWidth: '200px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                                                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{u.display_name}</span>
                                                        {u.member_number && (
                                                            <span style={{
                                                                padding: '0.1rem 0.5rem', borderRadius: '99px',
                                                                background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)',
                                                                color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'monospace',
                                                            }}>{u.member_number}</span>
                                                        )}
                                                        {isAdmin && (
                                                            <span style={{
                                                                padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 600,
                                                                background: roleColor + '22', border: `1px solid ${roleColor}44`, color: roleColor,
                                                            }}>管理者</span>
                                                        )}
                                                        {Number(u.discord_verified) === 1 ? (
                                                            <span style={{
                                                                padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 600,
                                                                background: 'rgba(88,101,242,0.15)', border: '1px solid rgba(88,101,242,0.4)', color: '#5865F2',
                                                            }}>Discord連携済み{u.discord_username ? ` (${u.discord_username})` : ''}</span>
                                                        ) : (
                                                            <span style={{
                                                                padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 600,
                                                                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-muted)',
                                                            }}>未連携</span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                                    {u.discord_id && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                            <span style={{ color: '#5865F2', fontWeight: 600 }}>Discord:</span> {u.discord_id}{Number(u.discord_verified) === 1 ? '' : '（未確認）'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{u.total_points?.toLocaleString()}</div>
                                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>pt</div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        <span>📝{u.post_count}</span>
                                                        <span>💬{u.comment_count}</span>
                                                        <span>🗳️{u.vote_count}</span>
                                                        <span>❤️{u.reaction_count}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(u.created_at).toLocaleDateString('ja-JP')}</div>
                                                </div>
                                                <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.7rem' }}
                                                    onClick={() => {
                                                        setEditUser(u);
                                                        setEditUserName(u.display_name);
                                                        setEditUserEmail(u.email);
                                                        setEditUserPassword('');
                                                        setEditUserMemberNum(u.member_number || '');
                                                        setEditUserMemo(u.admin_memo || '');
                                                        setEditUserIsAdmin(u.role === 'admin');
                                                        setEditUserDiscordId(u.discord_id || '');
                                                        setEditUserMsg('');
                                                    }}
                                                >✏️ 編集</button>
                                                <button className="btn btn-danger btn-sm" style={{ fontSize: '0.7rem' }}
                                                    onClick={async () => {
                                                        if (u.id === user.id) { alert('自分自身は削除できません'); return; }
                                                        if (!confirm(`「${u.display_name}」を削除しますか？\n\nこのユーザーの投稿・コメント・投票・ポイント履歴など、すべてのデータが削除されます。\nこの操作は元に戻せません。`)) return;
                                                        const res = await fetch('/api/admin/users', {
                                                            method: 'DELETE',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ userId: u.id }),
                                                        });
                                                        const d = await res.json();
                                                        if (d.success) {
                                                            alert(`${d.deletedName} を削除しました`);
                                                            fetchAll();
                                                        } else {
                                                            alert(`❌ ${d.error}`);
                                                        }
                                                    }}
                                                >🗑️ 削除</button>
                                                <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.7rem' }}
                                                    onClick={() => {
                                                        setDmUser(dmUser?.id === u.id ? null : u);
                                                        setDmTitle(''); setDmMessage(''); setDmMsg('');
                                                    }}
                                                >📩 メッセージ</button>
                                            </div>
                                            {dmUser?.id === u.id && (
                                                <div style={{
                                                    marginTop: '0.75rem', padding: '0.75rem',
                                                    background: 'rgba(108,99,255,0.05)', border: '1px solid var(--border)',
                                                    borderRadius: 'var(--radius-md)',
                                                }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                                                        📩 {u.display_name} にメッセージ送信
                                                    </div>
                                                    <input
                                                        type="text" className="form-input"
                                                        value={dmTitle} onChange={e => setDmTitle(e.target.value)}
                                                        placeholder="タイトル"
                                                        style={{ marginBottom: '0.5rem', fontSize: '0.8rem' }}
                                                    />
                                                    <textarea
                                                        className="form-textarea"
                                                        value={dmMessage} onChange={e => setDmMessage(e.target.value)}
                                                        placeholder="メッセージ内容..."
                                                        style={{ minHeight: '60px', marginBottom: '0.5rem', fontSize: '0.8rem' }}
                                                    />
                                                    {dmMsg && <div className={dmMsg.startsWith('✅') ? 'success-message' : 'error-message'} style={{ marginBottom: '0.5rem', fontSize: '0.8rem' }}>{dmMsg}</div>}
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button className="btn btn-primary btn-sm" disabled={!dmTitle.trim() || !dmMessage.trim()}
                                                            onClick={async () => {
                                                                const res = await fetch('/api/admin/notifications', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ userId: u.id, title: dmTitle, message: dmMessage }),
                                                                });
                                                                const d = await res.json();
                                                                if (d.success) {
                                                                    setDmMsg('✅ 送信しました');
                                                                    setDmTitle(''); setDmMessage('');
                                                                    setTimeout(() => { setDmUser(null); setDmMsg(''); }, 1500);
                                                                } else {
                                                                    setDmMsg('❌ ' + d.error);
                                                                }
                                                            }}
                                                        >📩 送信</button>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => { setDmUser(null); setDmMsg(''); }}>キャンセル</button>
                                                    </div>
                                                </div>
                                            )}
                                            {u.admin_memo && (
                                                <div style={{
                                                    marginTop: '0.5rem', padding: '0.5rem 0.75rem',
                                                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                                                    borderRadius: 'var(--radius-sm)', fontSize: '0.8rem',
                                                    color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                                                }}>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>📝メモ:</span>
                                                    {u.admin_memo}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Edit User Modal */}
                        {editUser && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                zIndex: 1000, padding: '1rem',
                            }} onClick={(e) => { if (e.target === e.currentTarget) setEditUser(null); }}>
                                <div className="card" style={{ maxWidth: 500, width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
                                    <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                        <h3 style={{ fontWeight: 700 }}>✏️ {editUser.display_name} を編集</h3>
                                        <button className="btn btn-ghost btn-sm" onClick={() => setEditUser(null)}>✕</button>
                                    </div>
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        setEditUserMsg('');
                                        const res = await fetch('/api/admin/users', {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                userId: editUser.id,
                                                displayName: editUserName,
                                                email: editUserEmail,
                                                password: editUserPassword || undefined,
                                                memberNumber: editUserMemberNum,
                                                adminMemo: editUserMemo,
                                                role: editUserIsAdmin ? 'admin' : 'member',
                                                discordId: editUserDiscordId,
                                            }),
                                        });
                                        const d = await res.json();
                                        if (d.success) {
                                            setEditUserMsg('✅ 更新しました');
                                            fetchAll();
                                            setTimeout(() => { setEditUser(null); setEditUserMsg(''); }, 1500);
                                        } else {
                                            setEditUserMsg(`❌ ${d.error}`);
                                        }
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div>
                                                <label className="form-label">表示名</label>
                                                <input type="text" className="form-input" value={editUserName} onChange={e => setEditUserName(e.target.value)} required />
                                            </div>
                                            <div>
                                                <label className="form-label">メールアドレス</label>
                                                <input type="email" className="form-input" value={editUserEmail} onChange={e => setEditUserEmail(e.target.value)} required />
                                            </div>
                                            <div>
                                                <label className="form-label">パスワード <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>（変更する場合のみ入力）</span></label>
                                                <input type="text" className="form-input" placeholder="新しいパスワード" value={editUserPassword} onChange={e => setEditUserPassword(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="form-label">会員番号</label>
                                                <input type="text" className="form-input" placeholder="No.00001" value={editUserMemberNum} onChange={e => setEditUserMemberNum(e.target.value)} style={{ fontFamily: 'monospace' }} />
                                            </div>
                                            <div>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: editUser.id === user.id ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}>
                                                    <input type="checkbox" checked={editUserIsAdmin} disabled={editUser.id === user.id} onChange={e => setEditUserIsAdmin(e.target.checked)} />
                                                    管理者権限を付与する
                                                </label>
                                                {editUser.id === user.id && (
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>自分自身の管理者権限は外せません</div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="form-label">Discord ID <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>（数字のユーザーID。変更すると連携済みになります／空にすると連携解除）</span></label>
                                                <input type="text" className="form-input" placeholder="例: 123456789012345678" value={editUserDiscordId} onChange={e => setEditUserDiscordId(e.target.value)} inputMode="numeric" />
                                            </div>
                                            <div>
                                                <label className="form-label">📝 メモ <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(管理者のみ閲覧可能)</span></label>
                                                <textarea className="form-input" rows={3} placeholder="自由にメモを記入..." value={editUserMemo} onChange={e => setEditUserMemo(e.target.value)} style={{ resize: 'vertical', minHeight: '80px' }} />
                                            </div>
                                        </div>
                                        {editUserMsg && <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: editUserMsg.startsWith('✅') ? 'var(--success)' : 'var(--danger)' }}>{editUserMsg}</div>}
                                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                            <button type="submit" className="btn btn-primary">💾 保存</button>
                                            <button type="button" className="btn btn-secondary" onClick={() => setEditUser(null)}>キャンセル</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== PROPOSAL TAB ===== */}
                {activeTab === 'proposal' && (
                    <div className="animate-fade-in">
                        <div className="admin-grid">
                            <div className="admin-section">
                                <h3 className="admin-section-title">📋 新規プロポーザル作成</h3>
                                <form onSubmit={handleCreateProposal}>
                                    <div className="form-group">
                                        <label className="form-label">タイトル</label>
                                        <input type="text" className="form-input" value={propTitle} onChange={e => setPropTitle(e.target.value)} required placeholder="例: 新機能の追加について" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">説明</label>
                                        <textarea className="form-textarea" value={propDesc} onChange={e => setPropDesc(e.target.value)} placeholder="プロポーザルの詳細を記入..." style={{ minHeight: '100px' }} />
                                        <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem' }} disabled={uploading}
                                            onClick={async () => {
                                                const url = await uploadProposalImage();
                                                if (url) setPropDesc(prev => prev + `\n![画像](${url})`);
                                            }}
                                        >{uploading ? '⏳ アップロード中...' : '🖼️ 画像を挿入'}</button>
                                        {extractDescImages(propDesc).length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                                {extractDescImages(propDesc).map((img, i) => (
                                                    <div key={i} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                                        <img src={img.url} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <button type="button" onClick={() => removeDescImage(setPropDesc, img.url)}
                                                            style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        >✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">選択肢</label>
                                        {propOptions.map((opt, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                                <input type="text" className="form-input" value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`選択肢 ${i + 1}`} style={{ flex: 1 }} />
                                                <button type="button" className="btn btn-ghost btn-sm" disabled={uploading}
                                                    onClick={async () => {
                                                        const url = await uploadProposalImage();
                                                        if (url) updateOption(i, opt + ` [img:${url}]`);
                                                    }}
                                                >🖼️</button>
                                                {extractOptionImage(opt) && (
                                                    <div style={{ position: 'relative', width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                                                        <img src={extractOptionImage(opt)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <button type="button" onClick={() => removeOptionImage(propOptions, setPropOptions, i)}
                                                            style={{ position: 'absolute', top: '-2px', right: '-2px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        >✕</button>
                                                    </div>
                                                )}
                                                {propOptions.length > 2 && (
                                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeOption(i)}>✕</button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-ghost btn-sm" onClick={addOption}>＋ 選択肢を追加</button>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">参照DB</label>
                                        <select className="form-select" value={propDb} onChange={e => setPropDb(e.target.value)}>
                                            {databases.map(db => (
                                                <option key={db.name} value={db.name}>{db.description || db.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">投票期限（任意）</label>
                                        <input type="datetime-local" className="form-input" value={propDeadline} onChange={e => setPropDeadline(e.target.value)} />
                                    </div>
                                    {propMsg && <div className={propMsg.startsWith('✅') ? 'success-message' : 'error-message'}>{propMsg}</div>}
                                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>📋 プロポーザルを作成</button>
                                </form>
                            </div>
                            <div className="admin-section">
                                <h3 className="admin-section-title">📄 プロポーザル一覧（{proposals.length}件）</h3>
                                {proposals.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">📋</div>
                                        <div className="empty-title">まだプロポーザルがありません</div>
                                    </div>
                                ) : (
                                    <div>
                                        {proposals.map(p => (
                                            <div key={p.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                            <span style={{ fontWeight: 700 }}>{p.title}</span>
                                                            <select value={p.status} onChange={e => handleStatusChange(p, e.target.value)}
                                                                style={{
                                                                    padding: '0.1rem 0.3rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer',
                                                                    background: p.status === 'active' ? 'rgba(67,233,123,0.15)' : 'rgba(255,71,87,0.15)',
                                                                    color: p.status === 'active' ? 'var(--success)' : 'var(--danger)',
                                                                    border: `1px solid ${p.status === 'active' ? 'rgba(67,233,123,0.3)' : 'rgba(255,71,87,0.3)'}`,
                                                                }}
                                                            >
                                                                <option value="active">投票中</option>
                                                                <option value="closed">終了</option>
                                                            </select>
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                            {p.options?.length}選択肢 · {p.total_votes || 0}票 · {new Date(p.created_at).toLocaleDateString('ja-JP')}
                                                            {p.deadline && <span> · 期限: {new Date(p.deadline).toLocaleString('ja-JP')}</span>}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                        <button className="btn btn-ghost btn-sm" onClick={() => openEditProp(p)}>✏️</button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteProp(p)}>🗑️</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        {editingProp && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                zIndex: 1000, padding: '1rem',
                            }} onClick={(e) => { if (e.target === e.currentTarget) closeEditProp(); }}>
                                <div className="card" style={{ maxWidth: 600, width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
                                    <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                        <h3 style={{ fontWeight: 700 }}>✏️ プロポーザル編集</h3>
                                        <button className="btn btn-ghost btn-sm" onClick={closeEditProp}>✕</button>
                                    </div>
                                    <form onSubmit={handleUpdateProp}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div className="form-group">
                                                <label className="form-label">タイトル</label>
                                                <input type="text" className="form-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">説明</label>
                                                <textarea className="form-textarea" value={editDesc} onChange={e => setEditDesc(e.target.value)} style={{ minHeight: '80px' }} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">選択肢</label>
                                                {editOptions.map((opt, i) => (
                                                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                                        <input type="text" className="form-input" value={opt} onChange={e => updateEditOption(i, e.target.value)} style={{ flex: 1 }} />
                                                        {editOptions.length > 2 && (
                                                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeEditOption(i)}>✕</button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" className="btn btn-ghost btn-sm" onClick={addEditOption}>＋ 選択肢を追加</button>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">参照DB</label>
                                                <select className="form-select" value={editDb} onChange={e => setEditDb(e.target.value)}>
                                                    {databases.map(db => (
                                                        <option key={db.name} value={db.name}>{db.description || db.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">ステータス</label>
                                                <select className="form-select" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                                                    <option value="active">投票中</option>
                                                    <option value="closed">終了</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">投票期限（任意）</label>
                                                <input type="datetime-local" className="form-input" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} />
                                            </div>
                                        </div>
                                        {editMsg && <div className={editMsg.startsWith('✅') ? 'success-message' : 'error-message'} style={{ marginTop: '0.75rem' }}>{editMsg}</div>}
                                        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1rem' }}>変更を保存</button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== POINT HISTORY MODAL ===== */}
                {historyUser && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, padding: '2rem',
                    }} onClick={(e) => { if (e.target === e.currentTarget) closeHistory(); }}>
                        <div className="card animate-slide-up" style={{
                            maxWidth: '800px', width: '100%', maxHeight: '80vh',
                            display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
                                <div>
                                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                        📋 {historyUser.display_name} のポイント履歴
                                    </h3>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                        現在: <strong style={{ color: 'var(--accent-primary)' }}>{historyUser.total_points?.toLocaleString()}pt</strong>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-danger btn-sm" onClick={() => resetAllPoints(historyUser)}>🗑️ 全リセット</button>
                                    <button className="btn btn-ghost btn-sm" onClick={closeHistory}>✕ 閉じる</button>
                                </div>
                            </div>
                            {historyMsg && <div className={historyMsg.startsWith('✅') ? 'success-message' : 'error-message'}>{historyMsg}</div>}
                            <div style={{ overflow: 'auto', flex: 1 }}>
                                {historyLoading ? (
                                    <div className="loading-spinner"><div className="spinner"></div></div>
                                ) : pointHistory.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">📋</div>
                                        <div className="empty-title">ポイント履歴がありません</div>
                                    </div>
                                ) : (
                                    <table className="history-table">
                                        <thead>
                                            <tr>
                                                <th>日時</th>
                                                <th>ポイント</th>
                                                <th>理由</th>
                                                <th>DB</th>
                                                <th>付与者</th>
                                                <th>操作</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pointHistory.map(h => (
                                                <tr key={h.id}>
                                                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(h.created_at).toLocaleString('ja-JP')}</td>
                                                    <td style={{ color: h.amount > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                                                        {h.amount > 0 ? '+' : ''}{h.amount}
                                                    </td>
                                                    <td>{h.reason}</td>
                                                    <td><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{h.db_name}</span></td>
                                                    <td>{h.granted_by_name || '—'}</td>
                                                    <td>
                                                        <button className="btn btn-danger btn-sm" onClick={() => deletePointRecord(h.id)}
                                                            title="この記録を削除" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                                                        >削除</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ideas' && (
                    <div className="animate-fade-in">
                        <div className="admin-section">
                            <h3 className="admin-section-title">➕ 新しい案募集を作成</h3>
                            <div style={{ marginBottom: '0.75rem' }}>
                                <label className="form-label">タイトル *</label>
                                <input type="text" className="form-input" value={ideaTitle} onChange={e => setIdeaTitle(e.target.value)} placeholder="募集タイトル" />
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                                <label className="form-label">説明（任意）</label>
                                <textarea className="form-textarea" value={ideaDesc} onChange={e => setIdeaDesc(e.target.value)} placeholder="募集内容の説明..." style={{ minHeight: '80px' }} />
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                                <label className="form-label">提出期限（任意）</label>
                                <input type="datetime-local" className="form-input" value={ideaDeadline} onChange={e => setIdeaDeadline(e.target.value)} />
                            </div>
                            {ideaMsg && <div className={ideaMsg.startsWith('✅') ? 'success-message' : 'error-message'} style={{ marginBottom: '0.5rem' }}>{ideaMsg}</div>}
                            <button className="btn btn-primary" disabled={!ideaTitle.trim()}
                                onClick={async () => {
                                    const res = await fetch('/api/admin/ideas', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ title: ideaTitle, description: ideaDesc, deadline: ideaDeadline || null }),
                                    });
                                    const d = await res.json();
                                    if (d.success) {
                                        setIdeaMsg('✅ 募集を作成しました');
                                        setIdeaTitle(''); setIdeaDesc(''); setIdeaDeadline('');
                                        fetchAll();
                                    } else setIdeaMsg('❌ ' + d.error);
                                    setTimeout(() => setIdeaMsg(''), 3000);
                                }}
                            >💡 募集を作成</button>
                        </div>

                        <div className="admin-section">
                            <h3 className="admin-section-title">💡 案募集一覧（{ideaRequests.length}件）</h3>
                            {ideaRequests.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>募集がありません</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {ideaRequests.map(r => (
                                        <div key={r.id} className="card" style={{ padding: 0, overflow: 'hidden', opacity: r.is_active ? 1 : 0.5 }}>
                                            <div style={{ padding: '1rem 1.25rem', cursor: 'pointer', borderBottom: expandedIdea === r.id ? '1px solid var(--border)' : 'none' }}
                                                onClick={() => setExpandedIdea(expandedIdea === r.id ? null : r.id)}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.title}</div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                            {r.deadline && `📅 ${new Date(r.deadline).toLocaleString('ja-JP')} `}                                                            📝 {r.submissions?.length || 0}件の提出
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                                                        <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.6rem' }}
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                await fetch('/api/admin/ideas', {
                                                                    method: 'PUT',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ id: r.id, isActive: !r.is_active }),
                                                                });
                                                                fetchAll();
                                                            }}
                                                        >{r.is_active ? '🔇 終了' : '✅ 再開'}</button>
                                                        <button className="btn btn-danger btn-sm" style={{ fontSize: '0.6rem' }}
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (!confirm('この募集を削除しますか？')) return;
                                                                await fetch('/api/admin/ideas', {
                                                                    method: 'DELETE',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ id: r.id }),
                                                                });
                                                                fetchAll();
                                                            }}
                                                        >🗑</button>
                                                    </div>
                                                </div>
                                            </div>
                                            {expandedIdea === r.id && (
                                                <div style={{ padding: '1rem 1.25rem', background: 'rgba(108,99,255,0.03)' }}>
                                                    {r.description && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{r.description}</div>}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>📝 提出一覧（{r.submissions?.length || 0}件）</div>
                                                        {r.submissions?.length > 0 && (
                                                            <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.65rem' }}
                                                                onClick={() => {
                                                                    const header = '名前,提出日時,内容\n';
                                                                    const rows = r.submissions.map(s =>
                                                                        `"${(s.display_name || '').replace(/"/g, '""')}","${new Date(s.created_at).toLocaleString('ja-JP')}","${(s.content || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
                                                                    ).join('\n');
                                                                    const bom = '\uFEFF';
                                                                    const blob = new Blob([bom + header + rows], { type: 'text/csv;charset=utf-8;' });
                                                                    const url = URL.createObjectURL(blob);
                                                                    const a = document.createElement('a');
                                                                    a.href = url;
                                                                    a.download = `${r.title}_提出一覧.csv`;
                                                                    a.click();
                                                                    URL.revokeObjectURL(url);
                                                                }}
                                                            >📥 CSV出力</button>
                                                        )}
                                                    </div>
                                                    {(!r.submissions || r.submissions.length === 0) ? (
                                                        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>まだ提出がありません</div>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                            {r.submissions.map(s => (
                                                                <div key={s.id} style={{
                                                                    padding: '0.75rem 1rem', background: 'var(--bg-secondary)',
                                                                    borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                                                                }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                                                                        <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--accent-primary)' }}>{s.display_name}</span>
                                                                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                                                            {new Date(s.created_at).toLocaleString('ja-JP')}
                                                                        </span>
                                                                    </div>
                                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{s.content}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
