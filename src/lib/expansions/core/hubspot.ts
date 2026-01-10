import { Expansion, ExpansionContext, ExpansionResult, ExpansionServices } from '../types';

async function getHubSpotCreds(context: ExpansionContext, services: ExpansionServices) {
    const userId = context.userId || (context.userEmail ? await services.user.getIdByEmail(context.userEmail) : null);

    let token = services.env.get('EXPANSION_HUBSPOT_TOKEN');

    if (userId) {
        const settings = await services.user.getSettings(userId);
        const hubSettings = settings['core-hubspot'];
        if (hubSettings && hubSettings.hubspotAccessToken) {
            token = hubSettings.hubspotAccessToken;
        }
    }

    if (!token) return null;
    return { token };
}

export const HubSpotExpansion: Expansion = {
    id: 'core-hubspot',
    name: 'HubSpot CRM',
    description: 'Create and manage HubSpot contacts from emails',
    intercepts: [
        {
            type: 'API',
            trigger: 'check_contact',
            execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
                const creds = await getHubSpotCreds(context, services);
                if (!creds) return { success: false, message: 'HubSpot not configured' };

                const { email } = context.data || {};
                if (!email) return { success: false, message: 'Email required' };

                try {
                    // Search for contact by email
                    const response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/search`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${creds.token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            filterGroups: [{
                                filters: [{
                                    propertyName: 'email',
                                    operator: 'EQ',
                                    value: email
                                }]
                            }]
                        })
                    });

                    if (!response.ok) return { success: false, message: 'Failed to search contacts' };

                    const data = await response.json();
                    if (data.total > 0) {
                        return { success: true, data: { found: true, contact: data.results[0] } };
                    } else {
                        return { success: true, data: { found: false } };
                    }
                } catch (e: any) {
                    return { success: false, message: e.message };
                }
            }
        },
        {
            type: 'API',
            trigger: 'create_contact',
            execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
                const creds = await getHubSpotCreds(context, services);
                if (!creds) return { success: false, message: 'HubSpot not configured' };

                const { email, firstname, lastname, phone } = context.data || {};
                if (!email) return { success: false, message: 'Email required' };

                try {
                    const response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${creds.token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            properties: {
                                email,
                                firstname,
                                lastname,
                                phone
                            }
                        })
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        return { success: false, message: err.message || 'Failed to create contact' };
                    }

                    const data = await response.json();
                    return { success: true, data };
                } catch (e: any) {
                    return { success: false, message: e.message };
                }
            }
        }
    ]
};
