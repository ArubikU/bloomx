import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/hubspot`;

    if (!code || !clientId || !clientSecret) {
        return NextResponse.json({ error: 'Missing parameters or configuration' }, { status: 400 });
    }

    const form = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code
    });

    const tokenRes = await fetch('https://api.hubapi.com/oauth/v1/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form
    });

    const data = await tokenRes.json();
    if (!tokenRes.ok) {
        return NextResponse.json(data, { status: tokenRes.status });
    }

    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.redirect(new URL('/login?error=LoginRequired', req.url));
    }

    await prisma.account.upsert({
        where: {
            provider_providerAccountId: {
                provider: 'hubspot',
                providerAccountId: user.id // Ideally fetch HubSpot Portal ID/User ID
            }
        },
        update: {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: Math.floor(Date.now() / 1000 + data.expires_in),
            token_type: 'Bearer',
            scope: data.scope || ''
        },
        create: {
            userId: user.id,
            type: 'oauth',
            provider: 'hubspot',
            providerAccountId: user.id,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: Math.floor(Date.now() / 1000 + data.expires_in),
            token_type: 'Bearer',
            scope: data.scope || ''
        }
    });

    return NextResponse.redirect(new URL('/settings', req.url));
}
