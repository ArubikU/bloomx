import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const clientId = process.env.ZOOM_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/zoom`;

    if (!clientId) {
        return NextResponse.json({ error: 'Missing ZOOM_CLIENT_ID' }, { status: 500 });
    }

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
    });

    return NextResponse.redirect(`https://zoom.us/oauth/authorize?${params.toString()}`);
}
