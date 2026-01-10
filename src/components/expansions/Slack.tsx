import React, { useState } from 'react';
import { ClientExpansionContext } from '@/lib/expansions/client/types';
import { Hash, Loader2, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { useExpansionUI } from '@/contexts/ExpansionUIContext';
import { SlackSettings } from './SlackSettings';
import { useExpansionSettings } from '@/hooks/useExpansionSettings';

const SlackShareModal = ({ context, onClose }: { context: ClientExpansionContext, onClose: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [fetchingChannels, setFetchingChannels] = useState(false);
    const [channels, setChannels] = useState<{ id: string, name: string }[]>([]);
    const [selectedChannel, setSelectedChannel] = useState('');
    const [message, setMessage] = useState('');
    const [configError, setConfigError] = useState<string | null>(null);

    const { settings, loading: settingsLoading } = useExpansionSettings('core-slack');

    React.useEffect(() => {
        setMessage(`Check out this email: "${typeof context.subject === 'string' ? context.subject : 'No Subject'}" from ${context.from || 'Unknown'}.\n\nLink: ${window.location.href}`);
        if (!settingsLoading) {
            fetchChannels();
        }
    }, [settingsLoading]);

    const fetchChannels = async () => {
        setFetchingChannels(true);
        setConfigError(null);
        try {
            const res = await fetch(`/api/expansions?trigger=get_slack_channels`);
            const json = await res.json();
            if (json.success) {
                setChannels(json.data);
                if (json.data.length > 0) setSelectedChannel(json.data[0].id);
            } else {
                setConfigError(json.message || 'Slack not configured.');
            }
        } catch (e) {
            setConfigError('Failed to connect to Slack.');
        } finally {
            setFetchingChannels(false);
        }
    };

    const shareToSlack = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/expansions?trigger=share_to_slack`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: selectedChannel,
                    message: message
                })
            });

            const json = await res.json();
            if (res.ok && json.success) {
                toast.success('Shared to Slack');
                onClose();
            } else {
                toast.error(json.message || 'Failed to share');
            }
        } catch (e) {
            toast.error('Error sharing to Slack');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background rounded-lg shadow-xl w-[calc(100vw-2rem)] sm:max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/20">
                <h3 className="font-semibold flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Share to Slack
                </h3>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="p-6 space-y-4">
                {fetchingChannels ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading channels...
                    </div>
                ) : configError ? (
                    <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                        {configError} . Configure in Settings.
                    </div>
                ) : (
                    <>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Channel</label>
                            <select
                                value={selectedChannel}
                                onChange={(e) => setSelectedChannel(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {channels.map(ch => (
                                    <option key={ch.id} value={ch.id}>#{ch.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>
                    </>
                )}
            </div>

            <div className="px-6 py-4 bg-muted/20 flex justify-end gap-2 border-t">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={shareToSlack}
                    disabled={loading || !!configError || fetchingChannels}
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Share
                </button>
            </div>
        </div>
    );
};

export const SlackClientExpansion = ({ context }: { context: ClientExpansionContext }) => {
    const { openModal, closeModal } = useExpansionUI();

    if (!context.emailContent) return null;

    return (
        <button
            onClick={() => openModal(<SlackShareModal context={context} onClose={closeModal} />)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 text-muted-foreground"
            title="Share to Slack"
        >
            <Hash className="h-4 w-4" />
        </button>
    );
};

export const SlackClientExpansionDefinition = {
    id: 'core-slack',
    mounts: [
        {
            point: 'EMAIL_TOOLBAR',
            Component: SlackClientExpansion,
            title: 'Share to Slack',
            icon: Hash
        },
        {
            point: 'CUSTOM_SETTINGS_TAB',
            Component: SlackSettings,
            title: 'Slack',
            icon: Hash
        }
    ]
};
