import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { getCurrentUser, hashPassword, createSession } from '@/lib/auth';
import {
    STATE_COOKIE,
    getDiscordConfig,
    siteUrl,
    safeEqual,
    stateCookieOptions,
    sessionCookieOptions,
    isValidDiscordId,
} from '@/lib/discord';

export const dynamic = 'force-dynamic';

class DiscordAuthError extends Error {
    constructor(code) {
        super(code);
        this.code = code;
    }
}

function clearStateCookie(response) {
    response.cookies.set(STATE_COOKIE, '', stateCookieOptions(0));
    return response;
}

async function exchangeCode(code, config) {
    const body = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.redirectUri,
    });
    const res = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: body.toString(),
        cache: 'no-store',
    });
    if (!res.ok) {
        console.error('Discord token exchange failed: status', res.status);
        throw new DiscordAuthError('token_failed');
    }
    const data = await res.json();
    if (!data.access_token) throw new DiscordAuthError('token_failed');
    return data.access_token;
}

async function fetchDiscordUser(accessToken) {
    const res = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
    });
    if (!res.ok) {
        console.error('Discord user fetch failed: status', res.status);
        throw new DiscordAuthError('profile_failed');
    }
    const data = await res.json();
    if (!data || !isValidDiscordId(data.id)) throw new DiscordAuthError('profile_failed');
    return {
        id: String(data.id),
        username: String(data.username || ''),
        globalName: data.global_name ? String(data.global_name) : '',
    };
}

// GET /api/auth/discord/callback
export async function GET(request) {
    const config = getDiscordConfig();
    const params = request.nextUrl.searchParams;

    // state cookie: "<state>.<mode>"
    const rawState = request.cookies.get(STATE_COOKIE)?.value || '';
    const dot = rawState.lastIndexOf('.');
    const savedState = dot > 0 ? rawState.slice(0, dot) : '';
    const mode = dot > 0 && rawState.slice(dot + 1) === 'link' ? 'link' : 'login';

    // link モードでログイン中ならエラーはマイページに返す（それ以外はログインページ）
    let currentUser = null;
    if (mode === 'link') {
        currentUser = await getCurrentUser();
    }
    const fail = (code) => {
        const target = mode === 'link' && currentUser
            ? `/mypage?discord_error=${encodeURIComponent(code)}`
            : `/login?error=${encodeURIComponent(code)}`;
        return clearStateCookie(NextResponse.redirect(siteUrl(target, config.redirectUri)));
    };

    try {
        if (!config.configured) return fail('discord_not_configured');

        if (params.get('error')) return fail('discord_denied');

        const code = params.get('code');
        const state = params.get('state');
        if (!code || !state || !savedState || !safeEqual(state, savedState)) {
            return fail('state_mismatch');
        }

        const accessToken = await exchangeCode(code, config);
        const discordUser = await fetchDiscordUser(accessToken);
        const db = getDb();

        // ===== 連携モード =====
        if (mode === 'link') {
            if (!currentUser) return fail('not_logged_in');

            const linkTx = db.transaction(() => {
                const other = db.prepare(
                    'SELECT id FROM users WHERE discord_id = ? AND discord_verified = 1 AND id != ?'
                ).get(discordUser.id, currentUser.id);
                if (other) throw new DiscordAuthError('already_linked');
                db.prepare(
                    "UPDATE users SET discord_id = ?, discord_verified = 1, discord_username = ?, updated_at = datetime('now') WHERE id = ?"
                ).run(discordUser.id, discordUser.username, currentUser.id);
            });
            linkTx();

            return clearStateCookie(NextResponse.redirect(siteUrl('/mypage?linked=1', config.redirectUri)));
        }

        // ===== ログインモード =====
        let user = db.prepare(
            'SELECT id FROM users WHERE discord_id = ? AND discord_verified = 1'
        ).get(discordUser.id);

        if (user) {
            // 表示用のユーザー名を最新に更新
            db.prepare('UPDATE users SET discord_username = ? WHERE id = ?').run(discordUser.username, user.id);
        } else {
            // 未連携だが同じ Discord ID が手入力で登録済みの既存ユーザーがいる → 二重アカウントを作らず、メールログイン後の連携を促す
            const unverified = db.prepare(
                'SELECT id FROM users WHERE discord_id = ? AND (discord_verified IS NULL OR discord_verified = 0)'
            ).get(discordUser.id);
            if (unverified) return fail('link_required');

            // 未登録 → 新規ユーザーを自動作成（メール/パスワードではログインできない状態）
            const id = uuidv4();
            const email = `discord_${discordUser.id}@users.y2factory-dao.local`;
            const passwordHash = await hashPassword(crypto.randomBytes(32).toString('hex'));
            const displayName = (discordUser.globalName || discordUser.username || 'Discordユーザー').slice(0, 50);
            const colors = ['#6C63FF', '#FF6584', '#43E97B', '#F9A826', '#00C9FF', '#E040FB'];
            const avatarColor = colors[Math.floor(Math.random() * colors.length)];

            const createTx = db.transaction(() => {
                const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
                if (existing) {
                    // プレースホルダーメールを他人が先に作っていた場合に乗っ取られないよう、既存アカウントは流用しない
                    throw new DiscordAuthError('account_conflict');
                }
                db.prepare(
                    'INSERT INTO users (id, email, password_hash, display_name, role, avatar_color, raw_password, discord_id, discord_verified, discord_username) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
                ).run(id, email, passwordHash, displayName, 'member', avatarColor, '', discordUser.id, 1, discordUser.username);

                // Give initial welcome points（メール登録時と同じ）
                db.prepare(
                    'INSERT INTO points (id, user_id, db_name, amount, reason) VALUES (?, ?, ?, ?, ?)'
                ).run(uuidv4(), id, 'default', 500, 'ウェルカムボーナス');
                return id;
            });
            user = { id: createTx() };
        }

        const { sessionId, expiresAt } = createSession(user.id);
        const response = NextResponse.redirect(siteUrl('/dashboard', config.redirectUri));
        response.cookies.set('session_id', sessionId, sessionCookieOptions(expiresAt));
        return clearStateCookie(response);
    } catch (error) {
        if (error instanceof DiscordAuthError) {
            return fail(error.code);
        }
        console.error('Discord callback error:', error && error.message);
        return fail('server_error');
    }
}
