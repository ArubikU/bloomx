import { Expansion, ExpansionContext, ExpansionResult, ExpansionServices } from '../types';

async function getZoomCreds(context: ExpansionContext, services: ExpansionServices) {
    const userId = context.userId || (context.userEmail ? await services.user.getIdByEmail(context.userEmail) : null);

    let accountId = services.env.get('EXPANSION_ZOOM_ACCOUNT_ID');
    let clientId = services.env.get('EXPANSION_ZOOM_CLIENT_ID');
    let clientSecret = services.env.get('EXPANSION_ZOOM_CLIENT_SECRET');

    if (userId) {
        const settings = await services.user.getSettings(userId);
        const zoomSettings = settings['core-zoom'];
        if (zoomSettings) {
            if (zoomSettings.zoomAccountId) accountId = zoomSettings.zoomAccountId;
            if (zoomSettings.zoomClientId) clientId = zoomSettings.zoomClientId;
            if (zoomSettings.zoomClientSecret) clientSecret = zoomSettings.zoomClientSecret;
        }
    }

    if (!accountId || !clientId || !clientSecret) return null;
    return { accountId, clientId, clientSecret };
}

async function getZoomToken(creds: { accountId: string, clientId: string, clientSecret: string }) {
    const params = new URLSearchParams();
    params.append('grant_type', 'account_credentials');
    params.append('account_id', creds.accountId);

    const res = await fetch('https://zoom.us/oauth/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64')}`
        },
        body: params
    });

    if (!res.ok) throw new Error('Failed to get Zoom token');
    const data = await res.json();
    return data.access_token;
}

export const ZoomExpansion: Expansion = {
    id: 'core-zoom',
    name: 'Zoom Integration',
    description: 'Insert Zoom meeting links',
    intercepts: [
        {
            type: 'API',
            trigger: 'create_meeting',
            execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
                const creds = await getZoomCreds(context, services);
                if (!creds) return { success: false, message: 'Zoom not configured' };

                try {
                    const token = await getZoomToken(creds);
                    const { topic, duration, startTime } = context.data || {};

                    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            topic: topic || 'New Meeting',
                            type: 1, // Instant meeting by default, 2 for scheduled
                            duration: duration || 60,
                            start_time: startTime, // Optional for type 1
                        })
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        return { success: false, message: err.message || 'Failed to create meeting' };
                    }

                    const data = await response.json();
                    return { success: true, data: { joinUrl: data.join_url, password: data.password } };
                } catch (e: any) {
                    return { success: false, message: e.message };
                }
            }
        }
    ]
};
