const { getDb } = require('./db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const SESSION_DURATION_HOURS = 24 * 7; // 7 days

async function hashPassword(password) {
    return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}

function createSession(userId) {
    const db = getDb();
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000).toISOString();

    db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(sessionId, userId, expiresAt);
    return { sessionId, expiresAt };
}

async function getCurrentUser() {
    try {
        // Dynamic import to ensure next/headers works correctly in route handlers
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const sessionId = cookieStore.get('session_id')?.value;
        if (!sessionId) return null;

        const db = getDb();
        const session = db.prepare(
            "SELECT * FROM sessions WHERE id = ? AND expires_at > datetime('now')"
        ).get(sessionId);

        if (!session) return null;

        const user = db.prepare(
            'SELECT id, email, display_name, role, rank, avatar_color, avatar_emoji, avatar_image, member_number, discord_id, display_role, created_at FROM users WHERE id = ?'
        ).get(session.user_id);

        return user || null;
    } catch (e) {
        console.error('getCurrentUser error:', e);
        return null;
    }
}

function deleteSession(sessionId) {
    const db = getDb();
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

module.exports = { hashPassword, verifyPassword, createSession, getCurrentUser, deleteSession };
