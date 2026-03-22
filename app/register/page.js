'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('パスワードは6文字以上で入力してください');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, displayName }),
            });
            const data = await res.json();
            if (data.success) {
                window.location.href = '/dashboard';
            } else {
                setError(data.error || '登録に失敗しました');
            }
        } catch {
            setError('登録に失敗しました');
        }
        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-card animate-slide-up">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><img src="/logo.png" alt="Y2FACTORY DAO" style={{ width: '48px', height: '48px', borderRadius: '10px' }} /></div>
                </div>
                <h1 className="auth-title">参加しよう</h1>
                <p className="auth-subtitle">Y2FACTORY DAOの一員になろう</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">表示名</label>
                        <input
                            type="text"
                            className="form-input"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            placeholder="あなたのニックネーム"
                            required
                        />
                    </div>
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
                            placeholder="6文字以上"
                            required
                            minLength={6}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                        {loading ? '登録中...' : 'アカウントを作成'}
                    </button>
                </form>

                <div className="auth-footer">
                    既にアカウントをお持ちの方は <Link href="/login">ログイン</Link>
                </div>
            </div>
        </div>
    );
}
