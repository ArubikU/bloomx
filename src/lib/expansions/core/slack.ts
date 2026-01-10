import { Expansion, ExpansionContext, ExpansionResult, ExpansionServices } from '../types';

async function getSlackToken(context: ExpansionContext, services: ExpansionServices): Promise<string | null> {
    const userId = context.userId || (context.userEmail ? await services.user.getIdByEmail(context.userEmail) : null);

    let token = services.env.get('EXPANSION_SLACK_TOKEN');

    if (userId) {
        const settings = await services.user.getSettings(userId);
        const slackSettings = settings['core-slack'];
        if (slackSettings?.slackToken) token = slackSettings.slackToken;
    }

    return token || null;
}

export const SlackExpansion: Expansion = {
    id: 'core-slack',
    name: 'Slack Integration',
    description: 'Share emails to Slack channels',
    intercepts: [
        {
            type: 'API',
            trigger: 'get_slack_channels',
            execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
                const token = await getSlackToken(context, services);
                if (!token) return { success: false, message: 'Slack not configured' };

                try {
                    const response = await fetch('https://slack.com/api/conversations.list?types=public_channel,private_channel', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();

                    if (!data.ok) return { success: false, message: `Slack Error: ${data.error}` };

                    const channels = data.channels.map((c: any) => ({ id: c.id, name: c.name }));
                    return { success: true, data: channels };
                } catch (e: any) {
                    return { success: false, message: e.message };
                }
            }
        },
        {
            type: 'API',
            trigger: 'share_to_slack',
            execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
                const token = await getSlackToken(context, services);
                if (!token) return { success: false, message: 'Slack not configured' };

                const { channelId, message } = context.data || {};

                if (!channelId || !message) {
                    return { success: false, message: 'Missing channel or message' };
                }

                try {
                    const response = await fetch('https://slack.com/api/chat.postMessage', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            channel: channelId,
                            text: message
                        })
                    });

                    const data = await response.json();
                    if (!data.ok) return { success: false, message: `Slack Error: ${data.error}` };

                    return { success: true, message: 'Message sent' };
                } catch (e: any) {
                    return { success: false, message: e.message };
                }
            }
        }
    ]
};
