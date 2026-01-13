import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const clientId = process.env.NOTION_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/notion`;

    if (!clientId) {
        return NextResponse.json({ error: 'Missing NOTION_CLIENT_ID' }, { status: 500 });
    }

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        owner: 'user'
    });

    return NextResponse.redirect(`https://api.notion.com/v1/oauth/authorize?${params.toString()}`);
}
