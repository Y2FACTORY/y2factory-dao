'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(r => r.json())
            .then(d => { if (d.user) setUser(d.user); })
            .catch(() => { });

        // Fetch notification count
        const fetchNotifs = () => {
            fetch('/api/notifications')
                .then(r => r.json())
                .then(d => { if (d.unreadCount !== undefined) setUnreadCount(d.unreadCount); })
                .catch(() => { });
        };
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
        router.refresh();
    };

    const links = [
        { href: '/dashboard', label: '投票', shortLabel: '投票', icon: '🗳️' },
        { href: '/suggestions', label: '提案', shortLabel: '提案', icon: '💡' },
        { href: '/reports', label: '進捗報告', shortLabel: '報告', icon: '📋' },
        { href: '/ranking', label: 'ランキング', shortLabel: 'ランク', icon: '🏆' },
        { href: '/mypage', label: 'マイページ', shortLabel: 'マイページ', icon: '👤' },
    ];

    if (user?.role === 'admin') {
        links.push({ href: '/admin', label: '管理者', shortLabel: '管理', icon: '⚙️' });
    }

    return (
        <>
            {/* Desktop Navbar */}
            <nav className="navbar">
                <a href="/dashboard" className="navbar-brand" style={{ textDecoration: 'none' }}>
                    <img src="/logo.png" alt="Y2FACTORY DAO" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                    Y2FACTORY DAO
                </a>
                <div className="navbar-nav">
                    {links.map(link => (
                        <a
                            key={link.href}
                            href={link.href}
                            className={`nav-link ${pathname === link.href ? 'active' : ''}`}
                        >
                            <span>{link.icon}</span>
                            {link.label}
                        </a>
                    ))}
                </div>
                <div className="navbar-user">
                    {user && (
                        <>
                            {/* Notification Bell */}
                            <button
                                onClick={() => router.push('/mypage?tab=notifications')}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontSize: '1.2rem', position: 'relative', padding: '0.25rem 0.5rem',
                                    color: 'var(--text-primary)',
                                }}
                                title="通知"
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span style={{
                                        position: 'absolute', top: -2, right: -2,
                                        background: 'var(--danger, #ff4757)', color: 'white',
                                        fontSize: '0.6rem', fontWeight: 700,
                                        width: 18, height: 18, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '2px solid var(--bg-primary)',
                                    }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {user.avatar_image ? (
                                <div className="user-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                                    <img src={user.avatar_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ) : (
                                <div className="user-avatar" style={{ background: user.avatar_color, fontSize: user.avatar_emoji ? '1.2rem' : undefined }}>
                                    {user.avatar_emoji || user.display_name?.charAt(0)}
                                </div>
                            )}
                            <div className="user-info">
                                <span className="user-name">{user.display_name}</span>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                                ログアウト
                            </button>
                        </>
                    )}
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            {user && (
                <nav className="mobile-bottom-nav">
                    {links.map(link => (
                        <a
                            key={link.href}
                            href={link.href}
                            className={`mobile-nav-item ${pathname === link.href ? 'active' : ''}`}
                        >
                            <span className="mobile-nav-icon">{link.icon}</span>
                            <span className="mobile-nav-label">{link.shortLabel}</span>
                        </a>
                    ))}
                    <button
                        className={`mobile-nav-item ${pathname === '/mypage' && typeof window !== 'undefined' && window.location.search.includes('notifications') ? 'active' : ''}`}
                        onClick={() => router.push('/mypage?tab=notifications')}
                        style={{ background: 'none', border: 'none', fontFamily: 'inherit', cursor: 'pointer', position: 'relative' }}
                    >
                        <span className="mobile-nav-icon">🔔</span>
                        <span className="mobile-nav-label">通知</span>
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute', top: 2, right: '50%', marginRight: '-16px',
                                background: 'var(--danger)', color: 'white',
                                fontSize: '0.55rem', fontWeight: 700,
                                width: 16, height: 16, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                </nav>
            )}
        </>
    );
}
