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
    const [createUserMsg, setCreateUserMsg] = useState('');

    // Edit user
    const [editUser, setEditUser] = useState(null);
    const [editUserName, setEditUserName] = useState('');
    const [editUserEmail, setEditUserEmail] = useState('');
    const [editUserPassword, setEditUserPassword] = useState('');
    const [editUserMemberNum, setEditUserMemberNum] = useState('');
    const [editUserMemo, setEditUserMemo] = useState('');
    const [editUserDisplayRole, setEditUserDisplayRole] = useState('Y2FDメンバー');
    const [editUserDiscordId, setEditUserDiscordId] = useState('');
    const [editUserMsg, setEditUserMsg] = useState('');

    // Inquiries management
    const [adminInquiries, setAdminInquiries] = useState([]);
    const [replyingInq, setReplyingInq] = useState(null);
    const [inqReplyText, setInqReplyText] = useState('');
    const [inqReplyMsg, setInqReplyMsg] = useState('');

    // Direct message to user
    const [dmUser, setDmUser] = useState(null);
    const [dmTitle, setDmTitle] = useState('');
    const [dmMessage, setDmMessage] = useState('');
    const [dmMsg, setDmMsg] = useState('');

    // Shop management
    const [shopItems, setShopItems] = useState([]);
    const [shopTitle, setShopTitle] = useState('');
    const [shopImageUrl, setShopImageUrl] = useState('');
    const [shopLinkUrl, setShopLinkUrl] = useState('');
    const [shopDesc, setShopDesc] = useState('');
    const [shopMsg, setShopMsg] = useState('');
    const [shopUploading, setShopUploading] = useState(false);
    const [editingShop, setEditingShop] = useState(null);

    // Idea collection
    const [ideaRequests, setIdeaRequests] = useState([]);
    const [ideaTitle, setIdeaTitle] = useState('');
    const [ideaDesc, setIdeaDesc] = useState('');
    const [ideaDeadline, setIdeaDeadline] = useState(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    });
    const [ideaRoles, setIdeaRoles] = useState([]);
    const [ideaMsg, setIdeaMsg] = useState('');
    const [expandedIdea, setExpandedIdea] = useState(null);
    const allRoles = ['Y2FDメンバー', '主任', '部長', '役員', '管理者'];

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

        const postsRes = await fetch('/api/posts');
        const postsData = await postsRes.json();
        setPosts(postsData.posts || []);

        const allUsersRes = await fetch('/api/admin/users');
        const allUsersData = await allUsersRes.json();
        const fetchedUsers = allUsersData.users || [];
        setAllUsers(fetchedUsers);

        try {
            const inqRes = await fetch('/api/admin/inquiries');
            const inqData = await inqRes.json();
            setAdminInquiries(inqData.inquiries || []);
        } catch(e) { console.log('inquiries fetch error:', e); }

        try {
            const shopRes = await fetch('/api/admin/shop');
            const shopData = await shopRes.json();
            setShopItems(shopData.items || []);
        } catch(e) { console.log('shop fetch error:', e); }

        try {
            const ideaRes = await fetch('/api/admin/ideas');
            const ideaData = await ideaRes.json();
            setIdeaRequests(ideaData.requests || []);
        } catch(e) { console.log('ideas fetch error:', e); }

    }, [router]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // === Display Role Change ===
    const changeDisplayRole = async (userId, newDisplayRole, displayName) => {
        if (!confirm(`${displayName} のロールを「${newDisplayRole}」に変更しますか？`)) return;
        const res = await fetch('/api/admin/roles', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, displayRole: newDisplayRole }),
        });
        const data = await res.json();
        if (data.success) {
            fetchAll();
        } else {
            alert(data.error || 'ロール変更に失敗しました');
        }
    };

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
        return u.display_name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || (u.display_role || '').toLowerCase().includes(s);
    });

    const exportCSV = () => {
        const headers = ['ID', 'メール', 'パスワード', '表示名', 'ロール', 'Discord ID', 'ポイント', '投稿数', 'コメント数', '投票数', 'リアクション数', '登録日', 'メモ'];
        const rows = filteredUsers.map(u => [
            u.id,
            u.email,
            u.raw_password ? `="${String(u.raw_password)}"` : '',
            u.display_name,
            u.display_role || u.role,
            u.discord_id || '',
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
                    <button className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
                        📢 進捗報告管理
                    </button>
                    <button className={`tab-btn ${activeTab === 'roadmap' ? 'active' : ''}`} onClick={() => setActiveTab('roadmap')}>
                        🗺️ ロードマップ管理
                    </button>
                    <button className={`tab-btn ${activeTab === 'inquiries' ? 'active' : ''}`} onClick={() => setActiveTab('inquiries')} style={{ position: 'relative' }}>
                        💬 お問い合わせ
                        {adminInquiries.filter(i => i.status === 'open').length > 0 && (
                            <span style={{
                                marginLeft: '0.35rem',
                                background: 'var(--danger, #ff4757)', color: 'white',
                                fontSize: '0.65rem', fontWeight: 700,
                                padding: '0.1rem 0.4rem', borderRadius: '99px',
                            }}>{adminInquiries.filter(i => i.status === 'open').length}</span>
                        )}
                    </button>
                    <button className={`tab-btn ${activeTab === 'shop' ? 'active' : ''}`} onClick={() => setActiveTab('shop')}>
                        🛍️ ショップ管理
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
                                    body: JSON.stringify({ email: newUserEmail, password: newUserPassword, displayName: newUserName, memberNumber: newUserMemberNum, discordId: newUserDiscordId }),
                                });
                                const d = await res.json();
                                if (d.success) {
                                    setCreateUserMsg('✅ ユーザーを作成しました');
                                    setNewUserEmail(''); setNewUserPassword(''); setNewUserName(''); setNewUserMemberNum(''); setNewUserDiscordId('');
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
                                        <label className="form-label">Discord ID</label>
                                        <input type="text" className="form-input" placeholder="例: username" value={newUserDiscordId} onChange={e => setNewUserDiscordId(e.target.value)} />
                                    </div>
                                </div>
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
                                    const displayRole = u.display_role || 'Y2FDメンバー';
                                    const roleColorMap = { 'Y2FDメンバー': '#43E97B', '主任': '#00C9FF', '部長': '#F9A826', '役員': '#E040FB', '管理者': '#6C63FF' };
                                    const roleColor = roleColorMap[displayRole] || '#6C63FF';
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
                                                        <select
                                                            value={displayRole}
                                                            onChange={e => changeDisplayRole(u.id, e.target.value, u.display_name)}
                                                            style={{
                                                                padding: '0.15rem 0.4rem', borderRadius: '99px', fontSize: '0.65rem', fontWeight: 600,
                                                                background: roleColor + '22', border: `1px solid ${roleColor}44`, color: roleColor,
                                                                cursor: 'pointer', outline: 'none', appearance: 'none',
                                                                WebkitAppearance: 'none', MozAppearance: 'none',
                                                                paddingRight: '1.2rem',
                                                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24'%3E%3Cpath fill='${encodeURIComponent(roleColor)}' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
                                                                backgroundRepeat: 'no-repeat',
                                                                backgroundPosition: 'right 0.3rem center',
                                                            }}
                                                        >
                                                            <option value="Y2FDメンバー">Y2FDメンバー</option>
                                                            <option value="主任">主任</option>
                                                            <option value="部長">部長</option>
                                                            <option value="役員">役員</option>
                                                            <option value="管理者">管理者</option>
                                                        </select>
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                                    {u.raw_password ? (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                            <span style={{ fontWeight: 600 }}>🔑 PW:</span> <code style={{ fontSize: '0.7rem', padding: '0.1rem 0.3rem', background: 'rgba(255,255,255,0.06)', borderRadius: '3px' }}>{u.raw_password}</code>
                                                        </div>
                                                    ) : (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', opacity: 0.5 }}>
                                                            <span style={{ fontWeight: 600 }}>🔑 PW:</span> 未設定
                                                        </div>
                                                    )}
                                                    {u.discord_id && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                                            <span style={{ color: '#5865F2', fontWeight: 600 }}>Discord:</span> {u.discord_id}
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
                                                        setEditUserDisplayRole(u.display_role || 'Y2FDメンバー');
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
                                                displayRole: editUserDisplayRole,
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
                                                <label className="form-label">役職</label>
                                                <select className="form-input" value={editUserDisplayRole} onChange={e => setEditUserDisplayRole(e.target.value)}>
                                                    <option value="Y2FDメンバー">Y2FDメンバー</option>
                                                    <option value="主任">主任</option>
                                                    <option value="部長">部長</option>
                                                    <option value="役員">役員</option>
                                                    <option value="管理者">管理者</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="form-label">Discord ID</label>
                                                <input type="text" className="form-input" placeholder="例: username#1234 または username" value={editUserDiscordId} onChange={e => setEditUserDiscordId(e.target.value)} />
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

                {/* ===== POSTS TAB ===== */}
                {activeTab === 'posts' && (
                    <div className="animate-fade-in">
                        <div className="admin-grid">
                            <div className="admin-section">
                                <h3 className="admin-section-title">📝 新規投稿作成</h3>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    setPostMsg('');
                                    if (!postContent.trim()) { setPostMsg('❌ 内容を入力してください'); return; }
                                    const res = await fetch('/api/posts', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ content: postContent, postType: 'announcement', title: postTitle }),
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                        setPostMsg('✅ お知らせを投稿しました');
                                        setPostContent('');
                                        setPostTitle('');
                                        fetchAll();
                                    } else {
                                        setPostMsg(`❌ ${data.error}`);
                                    }
                                }}>
                                    <div className="form-group">
                                        <label className="form-label">タイトル</label>
                                        <input type="text" className="form-input" value={postTitle} onChange={e => setPostTitle(e.target.value)} placeholder="タイトルを入力（任意）" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">内容</label>
                                        <textarea className="form-textarea" value={postContent} onChange={e => setPostContent(e.target.value)} placeholder="運営からのお知らせを記入..." required style={{ minHeight: '120px' }} />
                                        <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem' }}
                                            disabled={uploading}
                                            onClick={async () => {
                                                const input = document.createElement('input');
                                                input.type = 'file';
                                                input.accept = 'image/jpeg,image/png,image/gif,image/webp';
                                                input.onchange = async (ev) => {
                                                    const file = ev.target.files?.[0];
                                                    if (!file) return;
                                                    setUploading(true);
                                                    const formData = new FormData();
                                                    formData.append('image', file);
                                                    try {
                                                        const res = await fetch('/api/posts/upload', { method: 'POST', body: formData });
                                                        const data = await res.json();
                                                        setUploading(false);
                                                        if (data.imageUrl) {
                                                            setPostContent(prev => prev + `\n![画像](${data.imageUrl})`);
                                                        } else {
                                                            alert(data.error || 'アップロード失敗');
                                                        }
                                                    } catch { setUploading(false); alert('アップロード失敗'); }
                                                };
                                                input.click();
                                            }}
                                        >{uploading ? '⏳ アップロード中...' : '🖼️ 画像を挿入'}</button>
                                        {extractDescImages(postContent).length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                                {extractDescImages(postContent).map((img, i) => (
                                                    <div key={i} style={{ position: 'relative', width: '100px', height: '100px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                                        <img src={img.url} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <button type="button" onClick={() => removeDescImage(setPostContent, img.url)}
                                                            style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        >✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {postMsg && <div className={postMsg.startsWith('✅') ? 'success-message' : 'error-message'}>{postMsg}</div>}
                                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>📢 お知らせを投稿</button>
                                </form>
                            </div>
                            <div className="admin-section">
                                <h3 className="admin-section-title">📄 投稿一覧（{posts.filter(p => p.post_type !== 'roadmap').length}件）</h3>
                                {posts.filter(p => p.post_type !== 'roadmap').length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">📝</div>
                                        <div className="empty-title">まだ投稿がありません</div>
                                    </div>
                                ) : (
                                    <div>
                                        {posts.filter(p => p.post_type !== 'roadmap').map(p => (
                                            <div key={p.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                            <span style={{
                                                                padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 600,
                                                                background: p.post_type === 'announcement' ? 'rgba(249, 168, 38, 0.15)' : 'rgba(108, 99, 255, 0.1)',
                                                                color: p.post_type === 'announcement' ? 'var(--warning)' : 'var(--accent-primary)',
                                                            }}>
                                                                {p.post_type === 'announcement' ? '📢 お知らせ' : '💬 通常'}
                                                            </span>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                {p.display_name} · {new Date(p.created_at).toLocaleString('ja-JP')}
                                                            </span>
                                                        </div>
                                                        {editingPostId === p.id ? (
                                                            <div>
                                                                <input type="text" className="form-input" value={editingPostTitle} onChange={e => setEditingPostTitle(e.target.value)} placeholder="タイトル" style={{ marginBottom: '0.5rem' }} />
                                                                <textarea className="form-textarea" value={editingPostContent} onChange={e => setEditingPostContent(e.target.value)} rows={5} style={{ marginBottom: '0.5rem' }} />
                                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                    <button className="btn btn-primary btn-sm" onClick={async () => {
                                                                        const res = await fetch(`/api/posts/${p.id}`, {
                                                                            method: 'PUT',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ content: editingPostContent, title: editingPostTitle }),
                                                                        });
                                                                        const data = await res.json();
                                                                        if (data.success) { setEditingPostId(null); fetchAll(); }
                                                                        else alert(data.error || '更新に失敗しました');
                                                                    }}>💾 保存</button>
                                                                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingPostId(null)}>キャンセル</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {p.title && <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{p.title}</div>}
                                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                                                    {p.content.length > 150 ? p.content.slice(0, 150) + '...' : p.content}
                                                                </div>
                                                                {extractDescImages(p.content).length > 0 && (
                                                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                                                        {extractDescImages(p.content).map((img, i) => (
                                                                            <img key={i} src={img.url} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }} />
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                    ❤️ {p.like_count} · 💬 {p.comment_count}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    {editingPostId !== p.id && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flexShrink: 0 }}>
                                                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditingPostId(p.id); setEditingPostContent(p.content); setEditingPostTitle(p.title || ''); }}>✏️ 編集</button>
                                                            <button className="btn btn-danger btn-sm"
                                                                onClick={async () => {
                                                                    if (!confirm(`この投稿を削除しますか？\nコメントやリアクションも全て削除されます。`)) return;
                                                                    const res = await fetch(`/api/posts/${p.id}`, { method: 'DELETE' });
                                                                    const data = await res.json();
                                                                    if (data.success) fetchAll();
                                                                    else alert(data.error || '削除に失敗しました');
                                                                }}
                                                            >🗑️ 削除</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== ROADMAP TAB ===== */}
                {activeTab === 'roadmap' && (
                    <div className="animate-fade-in">
                        <div className="admin-grid">
                            <div className="admin-section">
                                <h3 className="admin-section-title">🗺️ ロードマップ投稿</h3>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const content = e.target.roadmapContent.value.trim();
                                    const title = e.target.roadmapTitle.value.trim();
                                    if (!content) return;
                                    const res = await fetch('/api/posts', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ content, postType: 'roadmap', title }),
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                        e.target.roadmapContent.value = '';
                                        e.target.roadmapTitle.value = '';
                                        fetchAll();
                                    } else {
                                        alert(data.error || '投稿に失敗しました');
                                    }
                                }}>
                                    <div className="form-group">
                                        <label className="form-label">タイトル</label>
                                        <input type="text" name="roadmapTitle" className="form-input" placeholder="タイトルを入力（任意）" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">内容</label>
                                        <textarea name="roadmapContent" className="form-textarea" rows={6} placeholder="ロードマップの内容を入力（Markdown画像: ![alt](url) 対応）" required></textarea>
                                    </div>
                                    <div className="form-group">
                                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = 'image/jpeg,image/png,image/gif,image/webp';
                                            input.onchange = async (ev) => {
                                                const file = ev.target.files?.[0];
                                                if (!file) return;
                                                const formData = new FormData();
                                                formData.append('image', file);
                                                const res = await fetch('/api/posts/upload', { method: 'POST', body: formData });
                                                const data = await res.json();
                                                if (data.imageUrl) {
                                                    const ta = document.querySelector('textarea[name="roadmapContent"]');
                                                    ta.value += `\n![画像](${data.imageUrl})`;
                                                    ta.focus();
                                                }
                                            };
                                            input.click();
                                        }}>📷 画像を追加</button>
                                    </div>
                                    <button type="submit" className="btn btn-primary">🗺️ ロードマップを投稿</button>
                                </form>
                            </div>
                            <div className="admin-section">
                                <h3 className="admin-section-title">📄 ロードマップ一覧（{posts.filter(p => p.post_type === 'roadmap').length}件）</h3>
                                {posts.filter(p => p.post_type === 'roadmap').length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">🗺️</div>
                                        <div className="empty-title">まだロードマップがありません</div>
                                    </div>
                                ) : (
                                    <div>
                                        {posts.filter(p => p.post_type === 'roadmap').map(p => (
                                            <div key={p.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                            <span style={{
                                                                padding: '0.15rem 0.5rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 600,
                                                                background: 'rgba(67, 233, 123, 0.15)', color: '#43E97B',
                                                            }}>
                                                                🗺️ ロードマップ
                                                            </span>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                {p.display_name} · {new Date(p.created_at).toLocaleString('ja-JP')}
                                                            </span>
                                                        </div>
                                                        {editingPostId === p.id ? (
                                                            <div>
                                                                <input type="text" className="form-input" value={editingPostTitle} onChange={e => setEditingPostTitle(e.target.value)} placeholder="タイトル" style={{ marginBottom: '0.5rem' }} />
                                                                <textarea className="form-textarea" value={editingPostContent} onChange={e => setEditingPostContent(e.target.value)} rows={5} style={{ marginBottom: '0.5rem' }} />
                                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                    <button className="btn btn-primary btn-sm" onClick={async () => {
                                                                        const res = await fetch(`/api/posts/${p.id}`, {
                                                                            method: 'PUT',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ content: editingPostContent, title: editingPostTitle }),
                                                                        });
                                                                        const data = await res.json();
                                                                        if (data.success) { setEditingPostId(null); fetchAll(); }
                                                                        else alert(data.error || '更新に失敗しました');
                                                                    }}>💾 保存</button>
                                                                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingPostId(null)}>キャンセル</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {p.title && <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{p.title}</div>}
                                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                                                    {p.content.length > 150 ? p.content.slice(0, 150) + '...' : p.content}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    {editingPostId !== p.id && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flexShrink: 0 }}>
                                                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditingPostId(p.id); setEditingPostContent(p.content); setEditingPostTitle(p.title || ''); }}>✏️ 編集</button>
                                                            <button className="btn btn-danger btn-sm"
                                                                onClick={async () => {
                                                                    if (!confirm('このロードマップを削除しますか？')) return;
                                                                    const res = await fetch(`/api/posts/${p.id}`, { method: 'DELETE' });
                                                                    const data = await res.json();
                                                                    if (data.success) fetchAll();
                                                                    else alert(data.error || '削除に失敗しました');
                                                                }}
                                                            >🗑️ 削除</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
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

                {/* ===== INQUIRIES TAB ===== */}
                {activeTab === 'inquiries' && (
                    <div className="animate-fade-in">
                        <div className="admin-section">
                            <h3 className="admin-section-title">💬 お問い合わせ一覧（{adminInquiries.length}件）</h3>
                            {adminInquiries.length === 0 ? (
                                <div className="card">
                                    <div className="empty-state">
                                        <div className="empty-icon">💬</div>
                                        <div className="empty-title">お問い合わせはありません</div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {adminInquiries.map((inq) => (
                                        <div key={inq.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                            <div style={{
                                                padding: '1rem 1.25rem',
                                                borderBottom: '1px solid var(--border)',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'start',
                                                background: inq.status === 'open' ? 'rgba(249,168,38,0.05)' : 'transparent',
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{inq.subject}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                        👤 {inq.user_name} · {new Date(inq.created_at).toLocaleString('ja-JP')}
                                                    </div>
                                                </div>
                                                <span style={{
                                                    padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 600, flexShrink: 0,
                                                    background: inq.status === 'open' ? 'rgba(249,168,38,0.15)' : inq.status === 'replied' ? 'rgba(67,233,123,0.15)' : 'rgba(108,99,255,0.1)',
                                                    color: inq.status === 'open' ? '#F9A826' : inq.status === 'replied' ? '#43E97B' : 'var(--text-muted)',
                                                }}>
                                                    {inq.status === 'open' ? '⏳ 未返信' : inq.status === 'replied' ? '✅ 返信済み' : '🔒 完了'}
                                                </span>
                                            </div>
                                            <div style={{ padding: '1rem 1.25rem' }}>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.7, marginBottom: '1rem' }}>
                                                    {inq.message}
                                                </div>

                                                {inq.admin_reply && (
                                                    <div style={{
                                                        padding: '0.75rem 1rem', marginBottom: '1rem',
                                                        background: 'rgba(67,233,123,0.06)', border: '1px solid rgba(67,233,123,0.2)',
                                                        borderRadius: 'var(--radius-md)',
                                                    }}>
                                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#43E97B', marginBottom: '0.375rem' }}>
                                                            💬 返信済み（{inq.replied_by_name}）{inq.replied_at && ` · ${new Date(inq.replied_at).toLocaleString('ja-JP')}`}
                                                        </div>
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                                                            {inq.admin_reply}
                                                        </div>
                                                    </div>
                                                )}

                                                {replyingInq === inq.id ? (
                                                    <div>
                                                        <textarea
                                                            className="form-textarea"
                                                            value={inqReplyText} onChange={e => setInqReplyText(e.target.value)}
                                                            placeholder="返信内容を入力..."
                                                            style={{ minHeight: '80px', marginBottom: '0.5rem' }}
                                                        />
                                                        {inqReplyMsg && <div className={inqReplyMsg.startsWith('✅') ? 'success-message' : 'error-message'} style={{ marginBottom: '0.5rem' }}>{inqReplyMsg}</div>}
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button className="btn btn-primary btn-sm" onClick={async () => {
                                                                const res = await fetch(`/api/admin/inquiries/${inq.id}`, {
                                                                    method: 'PUT',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ admin_reply: inqReplyText, status: 'replied' }),
                                                                });
                                                                const d = await res.json();
                                                                if (d.success) {
                                                                    setInqReplyMsg('✅ 返信しました');
                                                                    setReplyingInq(null); setInqReplyText('');
                                                                    fetchAll();
                                                                } else {
                                                                    setInqReplyMsg('❌ ' + d.error);
                                                                }
                                                            }}>📩 返信する</button>
                                                            <button className="btn btn-ghost btn-sm" onClick={() => {
                                                                setReplyingInq(null); setInqReplyText(''); setInqReplyMsg('');
                                                            }}>キャンセル</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button className="btn btn-primary btn-sm" onClick={() => {
                                                            setReplyingInq(inq.id);
                                                            setInqReplyText(inq.admin_reply || '');
                                                            setInqReplyMsg('');
                                                        }}>
                                                            {inq.admin_reply ? '✏️ 返信を編集' : '💬 返信する'}
                                                        </button>
                                                        {inq.status !== 'closed' && (
                                                            <button className="btn btn-ghost btn-sm" onClick={async () => {
                                                                const res = await fetch(`/api/admin/inquiries/${inq.id}`, {
                                                                    method: 'PUT',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ admin_reply: inq.admin_reply || '対応済み', status: 'closed' }),
                                                                });
                                                                if ((await res.json()).success) fetchAll();
                                                            }}>🔒 完了にする</button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'shop' && (
                    <div className="animate-fade-in">
                        <div className="admin-section">
                            <h3 className="admin-section-title">➕ ショップアイテム追加</h3>
                            <div className="grid-form-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div>
                                    <label className="form-label">タイトル *</label>
                                    <input type="text" className="form-input" value={shopTitle} onChange={e => setShopTitle(e.target.value)} placeholder="商品名" />
                                </div>
                                <div>
                                    <label className="form-label">リンク先URL *</label>
                                    <input type="url" className="form-input" value={shopLinkUrl} onChange={e => setShopLinkUrl(e.target.value)} placeholder="https://..." />
                                </div>
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                                <label className="form-label">説明文（任意）</label>
                                <input type="text" className="form-input" value={shopDesc} onChange={e => setShopDesc(e.target.value)} placeholder="簡単な説明" />
                            </div>
                            <div style={{ marginBottom: '0.75rem' }}>
                                <label className="form-label">画像 *</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input type="file" accept="image/*" id="shop-image-upload" style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            setShopUploading(true);
                                            const formData = new FormData();
                                            formData.append('image', file);
                                            try {
                                                const res = await fetch('/api/admin/shop/upload', { method: 'POST', body: formData });
                                                const d = await res.json();
                                                if (d.imageUrl) { setShopImageUrl(d.imageUrl); setShopMsg('✅ 画像アップロード完了'); }
                                                else setShopMsg('❌ ' + d.error);
                                            } catch { setShopMsg('❌ アップロード失敗'); }
                                            setShopUploading(false);
                                        }}
                                    />
                                    <button className="btn btn-secondary btn-sm" onClick={() => document.getElementById('shop-image-upload').click()} disabled={shopUploading}>
                                        {shopUploading ? 'アップロード中...' : '📷 画像を選択'}
                                    </button>
                                    {shopImageUrl && <img src={shopImageUrl} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} />}
                                </div>
                            </div>
                            {shopMsg && <div className={shopMsg.startsWith('✅') ? 'success-message' : 'error-message'} style={{ marginBottom: '0.5rem' }}>{shopMsg}</div>}
                            <button className="btn btn-primary" disabled={!shopTitle.trim() || !shopImageUrl || !shopLinkUrl.trim()}
                                onClick={async () => {
                                    const res = await fetch('/api/admin/shop', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ title: shopTitle, imageUrl: shopImageUrl, linkUrl: shopLinkUrl, description: shopDesc }),
                                    });
                                    const d = await res.json();
                                    if (d.success) {
                                        setShopMsg('✅ アイテムを追加しました');
                                        setShopTitle(''); setShopImageUrl(''); setShopLinkUrl(''); setShopDesc('');
                                        fetchAll();
                                    } else setShopMsg('❌ ' + d.error);
                                    setTimeout(() => setShopMsg(''), 3000);
                                }}
                            >➕ アイテムを追加</button>
                        </div>

                        <div className="admin-section">
                            <h3 className="admin-section-title">🛍️ ショップアイテム一覧（{shopItems.length}件）</h3>
                            {shopItems.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>アイテムがありません</div>
                            ) : (
                                <div className="grid-shop" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                    {shopItems.map(item => (
                                        <div key={item.id} className="card" style={{
                                            padding: 0, overflow: 'hidden', opacity: item.is_active ? 1 : 0.5,
                                            border: item.is_active ? undefined : '2px dashed var(--text-muted)',
                                        }}>
                                            <img src={editingShop?.id === item.id ? (editingShop.image_url || item.image_url) : item.image_url} alt={item.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                                            {editingShop?.id === item.id ? (
                                                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <input type="text" className="form-input" value={editingShop.title} onChange={e => setEditingShop({...editingShop, title: e.target.value})} placeholder="タイトル" style={{ fontSize: '0.8rem' }} />
                                                    <input type="url" className="form-input" value={editingShop.link_url} onChange={e => setEditingShop({...editingShop, link_url: e.target.value})} placeholder="URL" style={{ fontSize: '0.8rem' }} />
                                                    <input type="text" className="form-input" value={editingShop.description || ''} onChange={e => setEditingShop({...editingShop, description: e.target.value})} placeholder="説明（任意）" style={{ fontSize: '0.8rem' }} />
                                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                        <input type="file" accept="image/*" id={`shop-edit-img-${item.id}`} style={{ display: 'none' }}
                                                            onChange={async (e) => {
                                                                const file = e.target.files[0];
                                                                if (!file) return;
                                                                const formData = new FormData();
                                                                formData.append('image', file);
                                                                const res = await fetch('/api/admin/shop/upload', { method: 'POST', body: formData });
                                                                const d = await res.json();
                                                                if (d.imageUrl) setEditingShop(prev => ({...prev, image_url: d.imageUrl}));
                                                            }}
                                                        />
                                                        <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.6rem' }} onClick={() => document.getElementById(`shop-edit-img-${item.id}`).click()}>📷 画像変更</button>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                        <button className="btn btn-primary btn-sm" style={{ fontSize: '0.65rem', flex: 1 }}
                                                            onClick={async () => {
                                                                await fetch('/api/admin/shop', {
                                                                    method: 'PUT',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ id: editingShop.id, title: editingShop.title, imageUrl: editingShop.image_url, linkUrl: editingShop.link_url, description: editingShop.description }),
                                                                });
                                                                setEditingShop(null);
                                                                fetchAll();
                                                            }}
                                                        >💾 保存</button>
                                                        <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.65rem' }} onClick={() => setEditingShop(null)}>✕</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ padding: '0.75rem' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>{item.title}</div>
                                                    {item.description && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.375rem' }}>{item.description}</div>}
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', wordBreak: 'break-all', marginBottom: '0.5rem' }}>{item.link_url}</div>
                                                    <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                                        <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.65rem' }}
                                                            onClick={() => setEditingShop({...item})}
                                                        >✏️ 編集</button>
                                                        <button className="btn btn-secondary btn-sm" style={{ fontSize: '0.65rem' }}
                                                            onClick={async () => {
                                                                await fetch('/api/admin/shop', {
                                                                    method: 'PUT',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ id: item.id, isActive: !item.is_active }),
                                                                });
                                                                fetchAll();
                                                            }}
                                                        >{item.is_active ? '🔇 非表示' : '✅ 表示'}</button>
                                                        <button className="btn btn-danger btn-sm" style={{ fontSize: '0.65rem' }}
                                                            onClick={async () => {
                                                                if (!confirm('このアイテムを削除しますか？')) return;
                                                                await fetch('/api/admin/shop', {
                                                                    method: 'DELETE',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ id: item.id }),
                                                                });
                                                                fetchAll();
                                                            }}
                                                        >🗑 削除</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
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
                            <div className="grid-form-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div>
                                    <label className="form-label">提出期限（任意）</label>
                                    <input type="datetime-local" className="form-input" value={ideaDeadline} onChange={e => setIdeaDeadline(e.target.value)} />
                                </div>
                                <div>
                                    <label className="form-label">対象ロール（未選択=全員）</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                        {allRoles.map(role => (
                                            <button key={role}
                                                className={`btn btn-sm ${ideaRoles.includes(role) ? 'btn-primary' : 'btn-secondary'}`}
                                                style={{ fontSize: '0.7rem' }}
                                                onClick={() => setIdeaRoles(prev =>
                                                    prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
                                                )}
                                            >{role}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {ideaMsg && <div className={ideaMsg.startsWith('✅') ? 'success-message' : 'error-message'} style={{ marginBottom: '0.5rem' }}>{ideaMsg}</div>}
                            <button className="btn btn-primary" disabled={!ideaTitle.trim()}
                                onClick={async () => {
                                    const res = await fetch('/api/admin/ideas', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ title: ideaTitle, description: ideaDesc, targetRoles: ideaRoles, deadline: ideaDeadline || null }),
                                    });
                                    const d = await res.json();
                                    if (d.success) {
                                        setIdeaMsg('✅ 募集を作成しました');
                                        setIdeaTitle(''); setIdeaDesc(''); setIdeaDeadline(''); setIdeaRoles([]);
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
                                                            {r.deadline && `📅 ${new Date(r.deadline).toLocaleString('ja-JP')} `}
                                                            {r.target_roles?.length > 0 && `👥 ${r.target_roles.join(', ')} `}
                                                            📝 {r.submissions?.length || 0}件の提出
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
                                                                    const header = '名前,ロール,提出日時,内容\n';
                                                                    const rows = r.submissions.map(s =>
                                                                        `"${(s.display_name || '').replace(/"/g, '""')}","${(s.display_role || '').replace(/"/g, '""')}","${new Date(s.created_at).toLocaleString('ja-JP')}","${(s.content || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
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
                                                                            {s.display_role && `${s.display_role} ・ `}{new Date(s.created_at).toLocaleString('ja-JP')}
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
