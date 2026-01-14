import { Expansion, ExpansionContext, ExpansionResult, ExpansionServices } from '../types';

export const ComposerHelperExpansion: Expansion = {
    id: 'core-composer-helper',
    name: 'Composer Helper',
    description: 'Help write emails in the composer',
    intercepts: [{
        type: 'API',
        trigger: 'generate',
        execute: async (context: any, services: ExpansionServices): Promise<ExpansionResult> => {
            const userPrompt = context.emailContent; // This is the user's instructions
            const originalDraft = context.originalContent || ""; // This is what's already in the editor

            if (!userPrompt) {
                return { success: false, message: 'No prompt provided' };
            }

            const prompt = `You are helping a user write an email.
            
            ${originalDraft ? `Current Email Draft:\n"""\n${originalDraft}\n"""\n` : ""}
            
            User Instructions: ${userPrompt}
            
            Based on the instructions ${originalDraft ? "and the current draft" : ""}, write a professional email body. 
            If there is a current draft, improve it or continue it as requested. 
            Output ONLY the email body text. Do not include subject lines or extra commentary.`;

            try {
                const generated = await services.ai.generate('You are a professional email writing assistant.', prompt);

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
