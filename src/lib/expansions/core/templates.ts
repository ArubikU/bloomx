import { Expansion, ExpansionContext, ExpansionResult, ExpansionServices } from '../types';

export const TemplatesExpansion: Expansion = {
    id: 'core-templates',
    name: 'Templates',
    description: 'Manage and insert reusable email templates',
    intercepts: [
        {
            type: 'API',
            trigger: 'list_templates',
            execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
                if (!context.userId) return { success: false, message: 'User context required' };

                const settings = await services.user.getSettings(context.userId);
                const templates = settings?.templates || [];

                return {
                    success: true,
                    data: templates
                };
            }
        },
        {
            type: 'API',
            trigger: 'save_template',
            execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
                if (!context.userId) return { success: false, message: 'User context required' };

                const { id, title, content } = context.data || {};

                if (!title || !content) return { success: false, message: 'Title and content required' };

                const settings = await services.user.getSettings(context.userId);
                let templates = settings.templates || [];

                if (id) {
                    templates = templates.map((t: any) => t.id === id ? { ...t, title, content } : t);
                } else {
                    templates.push({ id: crypto.randomUUID(), title, content });
                }

                await services.user.updateSettings(context.userId, { ...settings, templates });

                return { success: true, message: 'Template saved' };
            }
        },
        {
            type: 'API',
            trigger: 'delete_template',
            execute: async (context: ExpansionContext, services: ExpansionServices): Promise<ExpansionResult> => {
                if (!context.userId) return { success: false, message: 'User context required' };
                const { id } = context.data || {};

                const settings = await services.user.getSettings(context.userId);
                const templates = (settings.templates || []).filter((t: any) => t.id !== id);

                await services.user.updateSettings(context.userId, { ...settings, templates });
                return { success: true, message: 'Template deleted' };
            }
        }
    ]
};
