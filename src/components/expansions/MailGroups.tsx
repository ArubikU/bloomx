import React, { useEffect, useState } from 'react';
import { ClientExpansionContext } from '@/lib/expansions/client/types';
import { Users } from 'lucide-react';
import { MailGroupsSettings } from './MailGroupsSettings';
import { toast } from 'sonner';
import { useExpansionSettings } from '@/hooks/useExpansionSettings';
import { useSession, getSession } from '@/components/SessionProvider';
import { useSecureSync } from '@/hooks/useSecureSync';
import { secureRead } from '@/lib/expansions/client/secure-storage';

// --- Secure Sync Pattern ---
// This component syncs the mail groups into secure storage so the middleware 
// can access them instantly without hitting the API on every recipient change.

export const MailGroupsClientExpansion = ({ context }: { context: ClientExpansionContext }) => {
    const { data: session } = useSession();
    const userId = session?.user?.email || 'default-user';
    const { settings, loading } = useExpansionSettings('core-mail-groups');

    // Storing data for the middleware's use via useSecureSync
    const [_, setStoredGroups] = useSecureSync<Record<string, string[]>>('mail-groups-data', {}, userId);

    useEffect(() => {
        if (loading || !settings) return;

        const rawGroups = settings.groups || [];
        const groupMap: Record<string, string[]> = {};

        if (Array.isArray(rawGroups)) {
            rawGroups.forEach((g: any) => {
                if (g && g.name && typeof g.name === 'string' && g.emails) {
                    const emails = g.emails.split(',').map((e: string) => e.trim()).filter(Boolean);
                    if (emails.length > 0) {
                        groupMap[g.name.trim().toLowerCase()] = emails;
                    }
                }
            });
        }

        setStoredGroups(groupMap);
    }, [settings, loading, setStoredGroups]);

    return null;
};

export const MailGroupsClientExpansionDefinition = {
    id: 'core-mail-groups',
    mounts: [
        {
            point: 'COMPOSER_INIT',
            Component: MailGroupsClientExpansion
        },
        {
            point: 'CUSTOM_SETTINGS_TAB',
            Component: MailGroupsSettings,
            title: 'Mail Groups',
            icon: Users
        },
        {
            point: 'ON_RECIPIENTS_CHANGE_HANDLER',
            priority: 'HIGH',
            handler: async (payload: { to: string[], cc: string[], bcc: string[] }) => {
                const session = await getSession();
                const userId = session?.user?.email || 'default-user';

                // Read from Secure Storage (hydrated by COMPOSER_INIT component)
                const groups = await secureRead('mail-groups-data', userId) || {};

                if (Object.keys(groups).length === 0) return payload;

                let hasChanged = false;
                const expandList = (tags: string[]) => {
                    if (!tags) return [];
                    const newTags: string[] = [];
                    tags.forEach(tag => {
                        const lower = tag.toLowerCase();
                        const unprefixed = lower.startsWith('@') ? lower.slice(1) : lower;
                        const prefixed = lower.startsWith('@') ? lower : '@' + lower;

                        // Match exact, without @, or with @
                        const matchKey = groups[lower] ? lower : (groups[unprefixed] ? unprefixed : (groups[prefixed] ? prefixed : null));

                        if (matchKey) {
                            hasChanged = true;
                            newTags.push(...groups[matchKey]);
                            toast.success(`Expanded group ${tag}`);
                        } else {
                            newTags.push(tag);
                        }
                    });
                    return newTags;
                };

                const newPayload = {
                    to: expandList(payload.to || []),
                    cc: expandList(payload.cc || []),
                    bcc: expandList(payload.bcc || [])
                };

                return hasChanged ? newPayload : payload;
            }
        }
    ]
};
