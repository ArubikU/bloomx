import { Expansion, ExpansionContext, ExpansionResult, ExpansionServices } from '../types';

export const DLPExpansion: Expansion = {
    id: 'core-dlp',
    name: 'Data Loss Prevention',
    description: 'Block emails containing sensitive keywords',
    intercepts: [
        {
            type: 'BLOCKING',
            trigger: 'EMAIL_PRE_SEND',
            execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
                // Get configured keywords or defaults
                // We use process.env access or services.env
                // Note: services.env.get has allow-list, we updated it to allow EXPANSION_
                const keywordsRaw = services.env.get('EXPANSION_DLP_KEYWORDS') || 'password,secret,credit card';
                const keywords = keywordsRaw.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length > 0);

                if (keywords.length === 0) return { success: true };

                const content = (context.emailContent || '').toLowerCase();
                const subject = (context.subject || '').toLowerCase();

                const violations: string[] = [];

                for (const k of keywords) {
                    if (content.includes(k) || subject.includes(k)) {
                        violations.push(k);
                    }
                }

                if (violations.length > 0) {
                    return {
                        success: false,
                        stop: true,
                        message: `DLP Block: Found sensitive keywords: ${violations.join(', ')}`
                    };
                }

                return { success: true };
            }
        }
    ]
};
