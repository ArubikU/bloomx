import { Expansion, ExpansionContext, ExpansionResult, ExpansionServices } from '../types';

export const TranslatorExpansion: Expansion = {
    id: 'core-translator',
    name: 'Translator',
    description: 'Translate email content to English',
    intercepts: [{
        type: 'API',
        trigger: 'translate',
        execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
            if (!context.emailContent) {
                return { success: false, message: 'No content to translate' };
            }

            const prompt = `Translate the following email to English (or preserve if already English). Maintain tone and basic formatting.\n\n${context.emailContent}`;
            try {
                const translation = await services.ai.generate('You are a professional translator.', prompt);
                return {
                    success: true,
                    data: translation
                };
            } catch (e: any) {
                return { success: false, message: e.message };
            }
        }
    }]
};
