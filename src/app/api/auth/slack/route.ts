import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/slack`;

    if (!clientId) {
        return NextResponse.json({ error: 'Missing SLACK_CLIENT_ID' }, { status: 500 });
    }

    // Slack scopes need to be defined. Assuming bot scopes for now.
    const scopes = 'chat:write,commands,users:read';
    const userScopes = ''; // If needed

    const params = new URLSearchParams({
        client_id: clientId,
        scope: scopes,
        user_scope: userScopes,
        redirect_uri: redirectUri,
    });

    return NextResponse.redirect(`https://slack.com/oauth/v2/authorize?${params.toString()}`);
}
