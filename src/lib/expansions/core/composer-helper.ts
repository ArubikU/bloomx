import { Expansion, ExpansionContext, ExpansionResult, ExpansionServices } from '../types';

export const ComposerHelperExpansion: Expansion = {
    id: 'core-composer-helper',
    name: 'Composer Helper',
    description: 'Help write emails in the composer',
    intercepts: [{
        type: 'API',
        trigger: 'generate',
        execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
            if (!context.emailContent) { // This is actually the "Prompt" in this context
                return { success: false, message: 'No prompt provided' };
            }

            const prompt = `Help me write an email.
            User Prompt: ${context.emailContent}
            
            Write a professional email body based on this prompt.`;

            try {
                const generated = await services.ai.generate('You are a helpful writing assistant.', prompt);

                return {
                    success: true,
                    data: generated
                };
            } catch (error: any) {
                return { success: false, message: error.message };
            }
        }
    }]
};
