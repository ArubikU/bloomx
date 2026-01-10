import { Expansion, ExpansionContext, ExpansionResult, ExpansionServices } from '../types';

async function getTrelloCreds(context: ExpansionContext, services: ExpansionServices) {
    const userId = context.userId || (context.userEmail ? await services.user.getIdByEmail(context.userEmail) : null);

    let key = services.env.get('EXPANSION_TRELLO_KEY');
    let token = services.env.get('EXPANSION_TRELLO_TOKEN');

    if (userId) {
        const settings = await services.user.getSettings(userId);
        const trelloSettings = settings['core-trello'];
        if (trelloSettings) {
            if (trelloSettings.trelloKey) key = trelloSettings.trelloKey;
            if (trelloSettings.trelloToken) token = trelloSettings.trelloToken;
        }
    }

    if (!key || !token) return null;
    return { key, token };
}

export const TrelloExpansion: Expansion = {
    id: 'core-trello',
    name: 'Trello Integration',
    description: 'Create Trello cards from emails',
    intercepts: [
        {
            type: 'API',
            trigger: 'get_trello_boards',
            execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
                const creds = await getTrelloCreds(context, services);
                if (!creds) return { success: false, message: 'Trello not configured' };

                try {
                    const response = await fetch(`https://api.trello.com/1/members/me/boards?key=${creds.key}&token=${creds.token}&fields=name,id`, {
                        method: 'GET'
                    });

                    if (!response.ok) return { success: false, message: 'Failed to fetch boards' };

                    const data = await response.json();
                    return { success: true, data };
                } catch (e: any) {
                    return { success: false, message: e.message };
                }
            }
        },
        {
            type: 'API',
            trigger: 'get_trello_lists',
            execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
                const creds = await getTrelloCreds(context, services);
                if (!creds) return { success: false, message: 'Trello not configured' };

                const { boardId } = context.data || {};
                if (!boardId) return { success: false, message: 'Board ID required' };

                try {
                    const response = await fetch(`https://api.trello.com/1/boards/${boardId}/lists?key=${creds.key}&token=${creds.token}&fields=name,id`, {
                        method: 'GET'
                    });

                    if (!response.ok) return { success: false, message: 'Failed to fetch lists' };

                    const data = await response.json();
                    return { success: true, data };
                } catch (e: any) {
                    return { success: false, message: e.message };
                }
            }
        },
        {
            type: 'API',
            trigger: 'create_trello_card',
            execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
                const creds = await getTrelloCreds(context, services);
                if (!creds) return { success: false, message: 'Trello not configured' };

                const { listId, name, desc } = context.data || {};
                if (!listId || !name) return { success: false, message: 'List and Name required' };

                try {
                    const url = new URL('https://api.trello.com/1/cards');
                    url.searchParams.set('key', creds.key);
                    url.searchParams.set('token', creds.token);
                    url.searchParams.set('idList', listId);
                    url.searchParams.set('name', name);
                    if (desc) url.searchParams.set('desc', desc);

                    const response = await fetch(url.toString(), {
                        method: 'POST'
                    });

                    if (!response.ok) return { success: false, message: 'Failed to create card' };

                    const data = await response.json();
                    return { success: true, data: { url: data.shortUrl } };
                } catch (e: any) {
                    return { success: false, message: e.message };
                }
            }
        }
    ]
};
