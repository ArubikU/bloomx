import { Expansion, ExpansionContext, ExpansionResult, ExpansionServices } from '../types';

export const WebhookExpansion: Expansion = {
    id: 'core-webhooks',
    name: 'Webhook Integration',
    description: 'Forward email events to external webhooks',
    intercepts: [
        {
            type: 'BACKGROUND',
            trigger: 'email_received',
            execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
                const webhookUrl = services.env.get('EXPANSION_WEBHOOK_URL');
                if (!webhookUrl) {
                    return { success: false, message: 'No webhook URL configured' };
                }

                // Fire and forget
                fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: 'email_received',
                        data: {
                            emailId: context.emailId,
                            userId: context.userId,
                            timestamp: new Date().toISOString()
                        }
                    })
                }).catch(err => console.error('Webhook failed', err));

                return { success: true, message: 'Webhook triggered' };
            }
        }
    ]
};
