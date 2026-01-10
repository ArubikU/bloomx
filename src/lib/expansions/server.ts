import { expansionRegistry } from './registry';
import { SummarizerExpansion } from './core/summarizer';
import { SmartReplyExpansion } from './core/smart-reply';
import { AutoOrganizerExpansion } from './core/organizer';
import { ComposerHelperExpansion } from './core/composer-helper';
import { TranslatorExpansion } from './core/translator';
import { GoogleDriveExpansion } from './core/google-drive';
import { WebhookExpansion } from './core/webhooks';
import { TemplatesExpansion } from './core/templates';
import { CRMExpansion } from './core/crm';
import { NotionExpansion } from './core/notion';
import { DLPExpansion } from './core/dlp';
import { FollowupExpansion } from './core/followup';
import { CalendarServerExpansion } from './core/calendar';
import { SlackExpansion } from './core/slack';
import { TrelloExpansion } from './core/trello';
import { HubSpotExpansion } from './core/hubspot';
import { ZoomExpansion } from './core/zoom';

// Function to ensure all core expansions are registered
// This should be called before accessing the registry in API context
export function ensureCoreExpansions() {
    const isEnabled = (id: string) => {
        // e.g. core-organizer -> EXPANSION_CORE_ORGANIZER
        const envKey = `EXPANSION_${id.toUpperCase().replace(/-/g, '_')}`;
        // Default to TRUE if not specified, only disable if explicitly 'false'
        return process.env[envKey] !== 'false';
    };

    if (isEnabled(SummarizerExpansion.id)) expansionRegistry.register(SummarizerExpansion);
    if (isEnabled(SmartReplyExpansion.id)) expansionRegistry.register(SmartReplyExpansion);
    if (isEnabled(AutoOrganizerExpansion.id)) expansionRegistry.register(AutoOrganizerExpansion);
    if (isEnabled(ComposerHelperExpansion.id)) expansionRegistry.register(ComposerHelperExpansion);

    // New Expansions
    if (isEnabled(TranslatorExpansion.id)) expansionRegistry.register(TranslatorExpansion);
    if (isEnabled(GoogleDriveExpansion.id)) expansionRegistry.register(GoogleDriveExpansion);
    if (isEnabled(WebhookExpansion.id)) expansionRegistry.register(WebhookExpansion);
    if (isEnabled(TemplatesExpansion.id)) expansionRegistry.register(TemplatesExpansion);
    if (isEnabled(CRMExpansion.id)) expansionRegistry.register(CRMExpansion);
    if (isEnabled(NotionExpansion.id)) expansionRegistry.register(NotionExpansion);
    if (isEnabled(DLPExpansion.id)) expansionRegistry.register(DLPExpansion);
    if (isEnabled(FollowupExpansion.id)) expansionRegistry.register(FollowupExpansion);
    // Let's just always register for now or use isEnabled with literal ID
    expansionRegistry.register(CalendarServerExpansion);
    expansionRegistry.register(SlackExpansion);
    expansionRegistry.register(TrelloExpansion);
    expansionRegistry.register(HubSpotExpansion);
    expansionRegistry.register(ZoomExpansion);
}

// Export the registry for convenience
export { expansionRegistry };
