import { Expansion, ExpansionContext, ExpansionResult, ExpansionServices } from '../types';

export const SummarizerExpansion: Expansion = {
    id: 'core-summarizer',
    name: 'Summarize',
    description: 'Summarize the email content using AI',
    intercepts: [{
        type: 'API',
        trigger: 'summarize',
        execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
            if (!context.emailContent) {
                return { success: false, message: 'No email content provided' };
            }

            const prompt = `Summarize this email in 3 bullet points:\n\n${context.emailContent}`;
            try {
                const summary = await services.ai.generate('You are a helpful assistant.', prompt);
                return {
                    success: true,
                    data: summary
                };
            } catch (e: any) {
                return { success: false, message: e.message };
            }
        }
    }]
};
