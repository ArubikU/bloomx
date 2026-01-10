import React, { useState, useEffect } from 'react';
import { ClientExpansionContext } from '@/lib/expansions/client/types';
import { Database, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useExpansionUI } from '@/contexts/ExpansionUIContext';
import { NotionSettings } from './NotionSettings';
import { useExpansionSettings } from '@/hooks/useExpansionSettings';

const NotionSaveModal = ({ context, onClose }: { context: ClientExpansionContext, onClose: () => void }) => {
    const { settings, loading: settingsLoading } = useExpansionSettings('core-notion');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [dbInfo, setDbInfo] = useState<{ title: string, url: string } | null>(null);
    const [subject, setSubject] = useState('');
    const [configError, setConfigError] = useState<string | null>(null);

    React.useEffect(() => {
        setSubject(typeof context.subject === 'string' ? context.subject : `Email from ${context.from || 'Unknown'}`);
        if (!settingsLoading) {
            checkConnection();
        }
    }, [settingsLoading]);

    const checkConnection = async () => {
        setVerifying(true);
        setConfigError(null);
        try {
            const res = await fetch(`/api/expansions?trigger=get_notion_schema`);
            const json = await res.json();
            if (json.success) {
                setDbInfo(json.data);
            } else {
                setConfigError(json.message || 'Notion not configured or invalid credentials.');
            }
        } catch (e) {
            setConfigError('Failed to connect to Notion.');
        } finally {
            setVerifying(false);
        }
    };

    const saveToNotion = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/expansions?trigger=save_to_notion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject,
                    content: context.emailContent || '',
                    from: context.from,
                    link: window.location.href
                })
            });

            const json = await res.json();
            if (res.ok && json.success) {
                toast.success('Saved to Notion');
                onClose();
            } else {
                toast.error(json.message || 'Failed to save');
            }
        } catch (e) {
            toast.error('Error saving to Notion');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background rounded-lg shadow-lg w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Save to Notion
                </h3>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="p-6 space-y-4">
                {verifying ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connecting to Notion...
                    </div>
                ) : configError ? (
                    <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2">
                        <span>{configError}</span>
                    </div>
                ) : (
                    <>
                        <div className="p-3 bg-green-50/50 text-green-700 text-sm rounded-md border border-green-100 flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            Connected to: <strong>{dbInfo?.title}</strong>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Page Title</label>
                            <input
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>
                    </>
                )}
            </div>

            <div className="px-6 py-4 bg-muted/20 flex justify-end gap-2">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={saveToNotion}
                    disabled={loading || !!configError || verifying}
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save to Database
                </button>
            </div>
        </div>
    );
};

export const NotionClientExpansion = ({ context }: { context: ClientExpansionContext }) => {
    const { openModal, closeModal } = useExpansionUI();

    if (!context.emailContent) return null;

    return (
        <button
            onClick={() => openModal(<NotionSaveModal context={context} onClose={closeModal} />)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 text-muted-foreground"
            title="Save to Notion"
        >
            <Database className="h-4 w-4" />
        </button>
    );
};

export const NotionClientExpansionDefinition = {
    id: 'core-notion',
    mounts: [
        {
            point: 'EMAIL_TOOLBAR',
            Component: NotionClientExpansion,
            title: 'Save to Notion',
            icon: Database // Or just rely on the component? The registry expects 'icon' usually as Lucide component or similar.
            // Wait, Notion.tsx imports { Database } from lucide-react. I should use that or similar.
            // Let's check imports. NotionClientExpansionDefinition uses Component: NotionSettings which has icon: Database.
        },
        {
            point: 'CUSTOM_SETTINGS_TAB',
            Component: NotionSettings,
            title: 'Notion',
            icon: Database
        }
    ]
};
