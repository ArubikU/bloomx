import { Expansion, ExpansionContext, ExpansionResult, ExpansionServices } from '../types';

export const CRMExpansion: Expansion = {
    id: 'core-crm',
    name: 'CRM Connector',
    description: 'Log emails to external CRM',
    intercepts: [
        {
            type: 'BACKGROUND',
            trigger: 'email_received',
            execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
                const crmUrl = services.env.get('EXPANSION_CRM_URL');
                const crmKey = services.env.get('EXPANSION_CRM_API_KEY');

                if (!crmUrl || !crmKey) {
                    return { success: false, message: 'CRM not configured' };
                }

                console.log(`[CRM] Logging email ${context.emailId} to ${crmUrl}`);

                // Simulate CRM call
                // await fetch(crmUrl, ...);

                return { success: true, message: 'Logged to CRM' };
            }
        }
    ]
};
