import { NextResponse } from 'next/server';
import {
    STATE_COOKIE,
    STATE_MAX_AGE_SEC,
    getDiscordConfig,
    siteUrl,
    generateState,
    stateCookieOptions,
} from '@/lib/discord';

export const dynamic = 'force-dynamic';

// GET /api/auth/discord/login?mode=login|link|register
export async function GET(request) {
    const config = getDiscordConfig();
    if (!config.configured) {
        return NextResponse.redirect(siteUrl('/login?error=discord_not_configured', config.redirectUri));
    }

    const modeParam = request.nextUrl.searchParams.get('mode');
    const mode = ['link', 'register'].includes(modeParam) ? modeParam : 'login';
    const state = generateState();

    const authorizeUrl = new URL('https://discord.com/oauth2/authorize');
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('client_id', config.clientId);
    authorizeUrl.searchParams.set('scope', 'identify');
    authorizeUrl.searchParams.set('state', state);
    authorizeUrl.searchParams.set('redirect_uri', config.redirectUri);

    const response = NextResponse.redirect(authorizeUrl.toString());
    response.cookies.set(STATE_COOKIE, `${state}.${mode}`, stateCookieOptions(STATE_MAX_AGE_SEC));
    return response;
}
