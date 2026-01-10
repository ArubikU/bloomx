import { clientExpansionRegistry } from './registry';
import { ComposerHelperClientExpansion } from '@/components/expansions/ComposerHelper';
import { SummarizerClientExpansion } from '@/components/expansions/Summarizer';
import { OrganizerClientExpansion } from '@/components/expansions/Organizer';
import { SmartReplyClientExpansion } from '@/components/expansions/SmartReply';
import { SignatureClientExpansion } from '@/components/expansions/Signature';
import { GoogleDriveClientExpansion } from '@/components/expansions/GoogleDrive';
import { NotionClientExpansionDefinition } from '@/components/expansions/Notion';
import { CalendarClientExpansionDefinition } from '@/components/expansions/Calendar';
import { SlackClientExpansionDefinition } from '@/components/expansions/Slack';
import { TrelloClientExpansionDefinition } from '@/components/expansions/Trello';
import { HubSpotClientExpansionDefinition } from '@/components/expansions/HubSpot';
import { ZoomClientExpansionDefinition } from '@/components/expansions/Zoom';
import { MailGroupsClientExpansionDefinition } from '@/components/expansions/MailGroups';
import { ConfidentialClientExpansionDefinition } from '@/components/expansions/Confidential';
import { SlashCommandsClientExpansionDefinition } from '@/components/expansions/SlashCommands';
import { GiphyClientExpansionDefinition } from '@/components/expansions/Giphy';
export function ensureClientExpansions() {
    // Client-side can only see NEXT_PUBLIC_ vars.
    // User might strictly want EXPANSION_... but Next.js won't inline them unless prefixed.
    // For now we assume if server disables it, the client component might still register but won't work?
    // OR we enforce NEXT_PUBLIC_ for client control.
    const isEnabled = (id: string) => {
        const envKey = `NEXT_PUBLIC_EXPANSION_${id.toUpperCase().replace(/-/g, '_')}`;
        return process.env[envKey] !== 'false';
    };

    if (isEnabled(ComposerHelperClientExpansion.id)) clientExpansionRegistry.register(ComposerHelperClientExpansion);
    if (isEnabled(SummarizerClientExpansion.id)) clientExpansionRegistry.register(SummarizerClientExpansion);
    if (isEnabled(OrganizerClientExpansion.id)) clientExpansionRegistry.register(OrganizerClientExpansion);
    if (isEnabled(SmartReplyClientExpansion.id)) clientExpansionRegistry.register(SmartReplyClientExpansion);
    if (isEnabled(SignatureClientExpansion.id)) clientExpansionRegistry.register(SignatureClientExpansion);
    if (isEnabled(GoogleDriveClientExpansion.id)) clientExpansionRegistry.register(GoogleDriveClientExpansion);
    if (isEnabled(NotionClientExpansionDefinition.id)) clientExpansionRegistry.register(NotionClientExpansionDefinition as any);
    if (isEnabled(CalendarClientExpansionDefinition.id)) clientExpansionRegistry.register(CalendarClientExpansionDefinition as any);
    if (isEnabled(SlackClientExpansionDefinition.id)) clientExpansionRegistry.register(SlackClientExpansionDefinition as any);
    if (isEnabled(TrelloClientExpansionDefinition.id)) clientExpansionRegistry.register(TrelloClientExpansionDefinition as any);
    if (isEnabled(HubSpotClientExpansionDefinition.id)) clientExpansionRegistry.register(HubSpotClientExpansionDefinition as any);
    if (isEnabled(ZoomClientExpansionDefinition.id)) clientExpansionRegistry.register(ZoomClientExpansionDefinition as any);
    if (isEnabled(MailGroupsClientExpansionDefinition.id)) clientExpansionRegistry.register(MailGroupsClientExpansionDefinition as any);
    if (isEnabled(ConfidentialClientExpansionDefinition.id)) clientExpansionRegistry.register(ConfidentialClientExpansionDefinition as any);
    if (isEnabled(SlashCommandsClientExpansionDefinition.id)) clientExpansionRegistry.register(SlashCommandsClientExpansionDefinition as any);
    if (isEnabled(GiphyClientExpansionDefinition.id)) clientExpansionRegistry.register(GiphyClientExpansionDefinition as any);
}
