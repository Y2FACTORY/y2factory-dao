export default function NotFound() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary, #0a0a0a)',
            color: 'var(--text-primary, #ffffff)',
            fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        }}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h2 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    404
                </h2>
                <p style={{ color: 'var(--text-secondary, #888)', marginBottom: '1.5rem' }}>
                    ページが見つかりませんでした。
                </p>
                <a
                    href="/"
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'var(--accent, #3b82f6)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontSize: '1rem',
                    }}
                >
                    トップに戻る
                </a>
            </div>
        </div>
    );
}
