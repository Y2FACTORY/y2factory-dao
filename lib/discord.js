const crypto = require('crypto');

// Discord OAuth2 の共通処理
// 秘密情報は環境変数からリクエスト時に読む（ハードコード・ログ出力しない）
const DEFAULT_REDIRECT_URI = 'https://y2factory-dao.com/api/auth/discord/callback';
const STATE_COOKIE = 'discord_oauth_state';
const STATE_COOKIE_PATH = '/api/auth/discord';
const STATE_MAX_AGE_SEC = 10 * 60; // 10分

function getDiscordConfig() {
    const clientId = process.env.DISCORD_CLIENT_ID || '';
    const clientSecret = process.env.DISCORD_CLIENT_SECRET || '';
    const redirectUri = process.env.DISCORD_REDIRECT_URI || DEFAULT_REDIRECT_URI;
    return {
        clientId,
        clientSecret,
        redirectUri,
        configured: Boolean(clientId && clientSecret),
    };
}

// リダイレクト先の絶対URL（リバースプロキシ配下でも公開ドメインになるよう、redirect URI のオリジンを使う）
function siteUrl(path, redirectUri) {
    return new URL(path, redirectUri || getDiscordConfig().redirectUri);
}

function generateState() {
    return crypto.randomBytes(32).toString('hex');
}

function safeEqual(a, b) {
    const bufA = Buffer.from(String(a || ''), 'utf8');
    const bufB = Buffer.from(String(b || ''), 'utf8');
    if (bufA.length === 0 || bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

function stateCookieOptions(maxAge) {
    return {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: STATE_COOKIE_PATH,
        maxAge,
    };
}

function sessionCookieOptions(expiresAt) {
    return {
        httpOnly: true,
        secure: true,
        path: '/',
        expires: new Date(expiresAt),
        sameSite: 'lax',
    };
}

// Discord のユーザーID（snowflake）は 17〜20 桁の数字
function isValidDiscordId(id) {
    return /^\d{17,20}$/.test(String(id || ''));
}

module.exports = {
    STATE_COOKIE,
    STATE_MAX_AGE_SEC,
    getDiscordConfig,
    siteUrl,
    generateState,
    safeEqual,
    stateCookieOptions,
    sessionCookieOptions,
    isValidDiscordId,
};
