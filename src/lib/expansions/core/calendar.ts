import { Expansion, ExpansionContext, ExpansionResult, ExpansionServices } from '../types';

export const CalendarServerExpansion: Expansion = {
    id: 'core-server-calendar',
    name: 'Calendar Intelligence',
    description: 'Extracts event details from emails',
    intercepts: [
        {
            type: 'API',
            trigger: 'extract_event',
            execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
                const content = context.emailContent || '';
                if (!content) return { success: false, message: 'No content' };

                const prompt = `
Extract the following event details from the email content below. 
Return ONLY valid JSON with keys: title, startDate (ISO), endDate (ISO), description, location. 
If no date is found, try to infer from 'tomorrow' etc relative to now (${new Date().toISOString()}).
If absolutely no event, return null.

Email:
${content.substring(0, 2000)}
`;

                try {
                    const jsonStr = await services.ai.generate('You are a JSON extractor.', prompt);
                    // Sanitize jsonStr (sometimes MD blocks usually stripped by AI service or we strip here)
                    const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
                    const data = JSON.parse(cleanJson);

                    return { success: true, data };
                } catch (e) {
                    return { success: false, message: 'Failed to extract event' };
                }
            }
        }
    ]
};
