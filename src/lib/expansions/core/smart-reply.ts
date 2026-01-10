import { Expansion, ExpansionContext, ExpansionResult, ExpansionServices } from '../types';

export const SmartReplyExpansion: Expansion = {
    id: 'core-smart-reply',
    name: 'Smart Reply',
    description: 'Generate quick reply suggestions',
    intercepts: [{
        type: 'API',
        trigger: 'suggest',
        execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
            if (!context.emailContent) {
                return { success: false, message: 'No email content provided' };
            }

            const prompt = `Generate 3 short, professional reply options for this email. 
            Return JSON array of strings e.g. ["Yes, sure", "I will allow it"].
            Email: ${context.emailContent}`;

            try {
                const raw = await services.ai.generate('You are a helpful assistant. Output JSON only.', prompt, { response_format: { type: "json_object" } });

                let replies = [];
                const parsed = JSON.parse(raw);
                replies = parsed.replies || parsed;
                if (!Array.isArray(replies)) replies = [];

                return {
                    success: true,
                    data: replies
                };
            } catch (error: any) {
                return { success: false, message: error.message };
            }
        }
    }]
};
