import React, { useEffect, useState } from 'react';
import { ClientExpansionContext } from '@/lib/expansions/client/types';
import { Users } from 'lucide-react';
import { MailGroupsSettings } from './MailGroupsSettings';
import { toast } from 'sonner';
import { useExpansionSettings } from '@/hooks/useExpansionSettings';

export const MailGroupsClientExpansion = ({ context }: { context: ClientExpansionContext }) => {
    const [groups, setGroups] = useState<Record<string, string[]>>({});
    const [loaded, setLoaded] = useState(false);

    const { settings, loading } = useExpansionSettings('core-mail-groups');

    // Load groups from settings
    useEffect(() => {
        if (loading) return;

        const rawGroups = settings?.groups || [];
        const groupMap: Record<string, string[]> = {};
        rawGroups.forEach((g: any) => {
            if (g.name && g.emails) {
                const emails = g.emails.split(',').map((e: string) => e.trim()).filter(Boolean);
                groupMap[g.name.toLowerCase()] = emails;
            }
        });
        setGroups(groupMap);
        setLoaded(true);
    }, [settings, loading]);

    // Watchers for To/Cc/Bcc
    // NOTE: This assumes context.to is updated on each render or we are re-rendered when it changes.
    // In ComposeModal, client expansions are re-rendered when state changes because they are children?
    // Yes, ComposeModal re-renders on toTags change, causing this to re-render with new context.

    // We need to detect if any tag matches a group
    useEffect(() => {
        if (!loaded) return;
        checkAndExpand(context.to, context.onUpdateTo, 'To');
    }, [context.to, loaded]);

    useEffect(() => {
        if (!loaded) return;
        checkAndExpand(context.cc, context.onUpdateCc, 'Cc');
    }, [context.cc, loaded]);

    useEffect(() => {
        if (!loaded) return;
        checkAndExpand(context.bcc, context.onUpdateBcc, 'Bcc');
    }, [context.bcc, loaded]);

    const checkAndExpand = (tags: string[] | undefined, updater: ((t: string[]) => void) | undefined, fieldName: string) => {
        if (!tags || !updater) return;

        let hasExpansion = false;
        const newTags: string[] = [];

        tags.forEach(tag => {
            const lower = tag.toLowerCase();
            if (groups[lower]) {
                hasExpansion = true;
                newTags.push(...groups[lower]);
                toast.success(`Expanded group ${tag} to ${groups[lower].length} recipients`);
            } else {
                newTags.push(tag);
            }
        });

        if (hasExpansion) {
            updater(newTags);
        }
    };

    return null; // Headless
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
        }
    ]
};
