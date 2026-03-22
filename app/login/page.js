'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (data.success) {
                window.location.href = '/dashboard';
            } else {
                setError(data.error || 'ログインに失敗しました');
            }
        } catch {
            setError('ログインに失敗しました');
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-card animate-slide-up">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><img src="/logo.png" alt="Y2FACTORY DAO" style={{ width: '48px', height: '48px', borderRadius: '10px' }} /></div>
                </div>
                <h1 className="auth-title">おかえりなさい</h1>
                <p className="auth-subtitle">Y2FACTORY DAOにログイン</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">メールアドレス</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">パスワード</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'ログイン中...' : 'ログイン'}
                    </button>
                </form>

                <div className="auth-footer" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    ※ アカウントは管理者が登録します
                </div>
            </div>
        </div>
    );
}
