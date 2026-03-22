'use client';

export default function Error({ error, reset }) {
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
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                    エラーが発生しました
                </h2>
                <p style={{ color: 'var(--text-secondary, #888)', marginBottom: '1.5rem' }}>
                    {error?.message || '予期しないエラーが発生しました。'}
                </p>
                <button
                    onClick={() => reset()}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'var(--accent, #3b82f6)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                    }}
                >
                    もう一度試す
                </button>
            </div>
        </div>
    );
}
