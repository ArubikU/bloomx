import { Expansion, ExpansionContext, ExpansionResult, ExpansionServices } from '../types';

export const NotionExpansion: Expansion = {
    id: 'core-notion',
    name: 'Notion Integration',
    description: 'Save emails to Notion Database',
    intercepts: [
        {
            type: 'API',
            trigger: 'get_notion_schema',
            execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
                const userId = context.userId || (context.userEmail ? await services.user.getIdByEmail(context.userEmail) : null);

                let notionKey = services.env.get('EXPANSION_NOTION_API_KEY');
                let databaseId = services.env.get('EXPANSION_NOTION_DATABASE_ID');

                if (userId) {
                    const settings = await services.user.getSettings(userId);
                    const notionSettings = settings['core-notion'];
                    if (notionSettings) {
                        if (notionSettings.notionKey) notionKey = notionSettings.notionKey;
                        if (notionSettings.databaseId) databaseId = notionSettings.databaseId;
                    }
                }

                if (!notionKey || !databaseId) {
                    return { success: false, message: 'Notion not configured' };
                }

                try {
                    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${notionKey}`,
                            'Notion-Version': '2022-06-28'
                        }
                    });

                    if (!response.ok) return { success: false, message: 'Failed to fetch database' };

                    const data = await response.json();
                    return {
                        success: true,
                        data: {
                            title: data.title?.[0]?.plain_text || 'Untitled Database',
                            url: data.url
                        }
                    };
                } catch (e: any) {
                    return { success: false, message: e.message };
                }
            }
        },
        {
            type: 'API',
            trigger: 'save_to_notion',
            execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
                // 1. Get User ID & Settings
                const userId = context.userId || (context.userEmail ? await services.user.getIdByEmail(context.userEmail) : null);

                let notionKey = services.env.get('EXPANSION_NOTION_API_KEY');
                let databaseId = services.env.get('EXPANSION_NOTION_DATABASE_ID');

                if (userId) {
                    const settings = await services.user.getSettings(userId);
                    const notionSettings = settings['core-notion'];
                    if (notionSettings) {
                        if (notionSettings.notionKey) notionKey = notionSettings.notionKey;
                        if (notionSettings.databaseId) databaseId = notionSettings.databaseId;
                    }
                }

                if (!notionKey || !databaseId) {
                    return { success: false, message: 'Notion API Key or Database ID not configured.' };
                }

                if (!context.emailContent) { // Context needs subject/content. 
                    // Usually Context has emailContent string. We might need subject too.
                    // context is populated in route.ts from body if available, or just standard fields.
                    // api/expansions/route.ts POST passes `data: body`.
                    // So we expect client to pass { subject, content, ... } in body.
                }

                // Read from data payload mainly, fallback to context
                const { subject, content, from, link } = context.data || {};
                const safeSubject = subject || 'Untitled Email';
                const safeContent = content || context.emailContent || '';

                // Truncate content for text block limit (2000 chars approx)
                const textContent = safeContent.substring(0, 1800);

                try {
                    const response = await fetch('https://api.notion.com/v1/pages', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${notionKey}`,
                            'Content-Type': 'application/json',
                            'Notion-Version': '2022-06-28'
                        },
                        body: JSON.stringify({
                            parent: { database_id: databaseId },
                            properties: {
                                Name: {
                                    title: [
                                        { text: { content: safeSubject } }
                                    ]
                                },
                                From: {
                                    rich_text: [
                                        { text: { content: from || 'Unknown' } }
                                    ]
                                },
                                Link: {
                                    url: link || null
                                }
                            },
                            children: [
                                {
                                    object: 'block',
                                    type: 'paragraph',
                                    paragraph: {
                                        rich_text: [
                                            { text: { content: textContent } }
                                        ]
                                    }
                                }
                            ]
                        })
                    });

                    if (!response.ok) {
                        const err = await response.text();
                        console.error('Notion API Error', err);
                        return { success: false, message: `Notion Error: ${response.statusText}` };
                    }

                    return { success: true, message: 'Saved to Notion' };

                } catch (e: any) {
                    return { success: false, message: e.message };
                }
            }
        }
    ]
};
