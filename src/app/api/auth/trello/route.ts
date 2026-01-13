import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const apiKey = process.env.TRELLO_API_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    // Trello 'return_url' should point to where the user will be redirected with the token.
    // Trello appends the token as a hash fragment #token=...
    // We redirect them back to /settings, where the client component will parse the hash.
    const returnUrl = `${appUrl}/settings`;
    const appName = 'BloomX';
    const scope = 'read,write';
    const expiration = 'never';

    if (!apiKey) {
        return NextResponse.json({ error: 'Missing TRELLO_API_KEY' }, { status: 500 });
    }

    const params = new URLSearchParams({
        key: apiKey,
        return_url: returnUrl,
        name: appName,
        expiration: expiration,
        scope: scope,
        response_type: 'token'
    });

    return NextResponse.redirect(`https://trello.com/1/authorize?${params.toString()}`);
}
