import { ClientExpansionContext } from '@/lib/expansions/client/types';

export const SlashCommandsClientExpansionDefinition = {
    id: 'core-slash-commands',
    mounts: [
        {
            point: 'SLASH_COMMAND',
            execute: (context: ClientExpansionContext) => {
                context.onInsertBody?.('¯\\_(ツ)_/¯');
                context.onClose?.();
            },
            slashCommand: { key: 'shrug', description: 'Insert ¯\\_(ツ)_/¯' }
        },
        {
            point: 'SLASH_COMMAND',
            execute: (context: ClientExpansionContext) => {
                context.onInsertBody?.('😊');
                context.onClose?.();
            },
            slashCommand: { key: 'smile', description: 'Insert 😊' }
        },
        {
            point: 'SLASH_COMMAND',
            execute: (context: ClientExpansionContext) => {
                context.onInsertBody?.('<hr class="my-4"/>');
                context.onClose?.();
            },
            slashCommand: { key: 'hr', description: 'Insert Horizontal Rule' }
        }
    ]
};
