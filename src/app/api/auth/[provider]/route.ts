
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
    const { provider } = await params;
    const { searchParams } = new URL(req.url);
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/${provider}`;

    let authUrl = '';
    let clientId = '';
    let scopes = '';
    let extraParams: Record<string, string> = {};

    switch (provider) {
        case 'slack':
            clientId = process.env.SLACK_CLIENT_ID || '';
            scopes = 'chat:write,commands,users:read';
            authUrl = 'https://slack.com/oauth/v2/authorize';
            extraParams = { user_scope: '' };
            break;
        case 'hubspot':
            clientId = process.env.HUBSPOT_CLIENT_ID || '';
            scopes = 'crm.objects.contacts.read crm.objects.contacts.write';
            authUrl = 'https://app.hubspot.com/oauth/authorize';
            break;
        case 'notion':
            clientId = process.env.NOTION_CLIENT_ID || '';
            scopes = ''; // Notion uses internal integrations often, but for public oauth it has no scopes param usually
            authUrl = 'https://api.notion.com/v1/oauth/authorize';
            extraParams = { response_type: 'code', owner: 'user' };
            break;
        case 'zoom':
            clientId = process.env.ZOOM_CLIENT_ID || '';
            authUrl = 'https://zoom.us/oauth/authorize';
            break;
        case 'trello':
            clientId = process.env.TRELLO_API_KEY || ''; // Trello uses API Key as Client ID
            scopes = 'read,write';
            authUrl = 'https://trello.com/1/authorize';
            extraParams = { expiration: 'never', name: 'BloomX' };
            break;
        default:
            return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    if (!clientId) {
        return NextResponse.json({ error: `Missing configuration for ${provider}` }, { status: 500 });
    }

    // Common params
    const queryParams = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopes,
        ...extraParams
    });

    return NextResponse.redirect(`${authUrl}?${queryParams.toString()}`);
}
