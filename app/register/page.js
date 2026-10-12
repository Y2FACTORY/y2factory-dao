'use client';
import Link from 'next/link';
import DiscordIcon from '@/app/components/DiscordIcon';

// メールアドレスでの新規登録は終了。Discord ログインで自動登録される
export default function RegisterPage() {
    return (
        <div className="auth-page">
            <div className="auth-card animate-slide-up">
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><img src="/logo.png" alt="Y2FACTORY DAO" style={{ width: '48px', height: '48px', borderRadius: '10px' }} /></div>
                </div>
                <h1 className="auth-title">参加しよう</h1>
                <p className="auth-subtitle">Y2FACTORY DAOの一員になろう</p>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '1.5rem 0', textAlign: 'center' }}>
                    メンバー登録はDiscordアカウントで行います。<br />
                    下のボタンからDiscordでログインすると、自動で登録されます。
                </p>

                <a href="/api/auth/discord/login?mode=login" className="auth-discord-btn">
                    <DiscordIcon size={20} />
                    <span>Discordで登録 / ログイン</span>
                </a>
                <p className="auth-discord-note">
                    メールアドレスでの新規登録は終了しました。
                </p>

                <div className="auth-footer">
                    既にアカウントをお持ちの方は <Link href="/login">ログイン</Link>
                </div>
            </div>
        </div>
    );
}
