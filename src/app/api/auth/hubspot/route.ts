import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/hubspot`;

    if (!clientId) {
        return NextResponse.json({ error: 'Missing HUBSPOT_CLIENT_ID' }, { status: 500 });
    }

    const scopes = 'crm.objects.contacts.read crm.objects.companies.read';

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scopes,
        response_type: 'code'
    });

    return NextResponse.redirect(`https://app.hubspot.com/oauth/authorize?${params.toString()}`);
}
