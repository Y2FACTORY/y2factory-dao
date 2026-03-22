'use client';
import { useState } from 'react';

function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'たった今';
    if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}日前`;
    return date.toLocaleDateString('ja-JP');
}

export default function PostCard({ post, onUpdate }) {
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [loading, setLoading] = useState(false);

    const toggleLike = async () => {
        const res = await fetch(`/api/posts/${post.id}/reactions`, { method: 'POST' });
        if (res.ok && onUpdate) onUpdate();
    };

    const loadComments = async () => {
        if (!showComments) {
            setLoading(true);
            const res = await fetch(`/api/posts/${post.id}/comments`);
            const data = await res.json();
            setComments(data.comments || []);
            setLoading(false);
        }
        setShowComments(!showComments);
    };

    const submitComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        const res = await fetch(`/api/posts/${post.id}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: commentText }),
        });
        if (res.ok) {
            setCommentText('');
            const data = await fetch(`/api/posts/${post.id}/comments`).then(r => r.json());
            setComments(data.comments || []);
            if (onUpdate) onUpdate();
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="post-card">
                <div className="post-header">
                    <div className="user-avatar" style={{ background: post.avatar_color, width: 40, height: 40 }}>
                        {post.display_name?.charAt(0)}
                    </div>
                    <div className="post-meta">
                        <span className="post-author">
                            {post.display_name}
                            {post.role === 'admin' && (
                                <span style={{ color: 'var(--accent-primary)', fontSize: '0.7rem', marginLeft: '0.5rem' }}>🛡️ 運営</span>
                            )}
                        </span>
                        <span className="post-time">{timeAgo(post.created_at)}</span>
                    </div>
                    {post.post_type === 'announcement' && (
                        <span className="post-type-badge post-type-announcement">📢 お知らせ</span>
                    )}
                </div>
                <div className="post-content">{post.content}</div>
                <div className="post-actions">
                    <button className={`post-action ${post.liked ? 'liked' : ''}`} onClick={toggleLike}>
                        {post.liked ? '❤️' : '🤍'} {post.like_count || 0}
                    </button>
                    <button className="post-action" onClick={loadComments}>
                        💬 {post.comment_count || 0}
                    </button>
                </div>
            </div>
            {showComments && (
                <div className="comments-section animate-fade-in">
                    {loading ? (
                        <div className="loading-spinner"><div className="spinner"></div></div>
                    ) : (
                        <>
                            {comments.map(c => (
                                <div key={c.id} className="comment-item">
                                    <div className="comment-avatar" style={{ background: c.avatar_color }}>{c.display_name?.charAt(0)}</div>
                                    <div className="comment-content">
                                        <div className="comment-author">{c.display_name}</div>
                                        <div className="comment-text">{c.content}</div>
                                        <div className="comment-time">{timeAgo(c.created_at)}</div>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    まだコメントはありません
                                </div>
                            )}
                            <form className="comment-form" onSubmit={submitComment}>
                                <input
                                    type="text"
                                    placeholder="コメントを入力..."
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                />
                                <button type="submit" className="btn btn-primary btn-sm">送信</button>
                            </form>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
