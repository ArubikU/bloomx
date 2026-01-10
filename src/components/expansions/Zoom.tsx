import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ClientExpansionContext } from '@/lib/expansions/client/types';
import { Video, Loader2, Plus, X, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useExpansionUI } from '@/contexts/ExpansionUIContext';
import { ZoomSettings } from './ZoomSettings';
import { useExpansionSettings } from '@/hooks/useExpansionSettings';

// Helper to check if zoom is configured
const isZoomConfigured = (settings: any) => {
    return !!(settings && settings.zoomAccountId && settings.zoomClientId && settings.zoomClientSecret);
};

const ZoomCreateModal = ({ context, onClose }: { context: ClientExpansionContext, onClose: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [topic, setTopic] = useState('Meeting');
    const [duration, setDuration] = useState('30');
    const { settings, loading: settingsLoading } = useExpansionSettings('core-zoom');

    const configured = useMemo(() => isZoomConfigured(settings), [settings]);

    const handleCreate = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/expansions?trigger=create_meeting`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    duration: parseInt(duration)
                })
            });
            const json = await res.json();
            if (json.success) {
                const meetingHtml = `
                    <a href="${json.data.joinUrl}" target="_blank" contenteditable="false" style="color: #1e40af; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 2px 6px; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.4; vertical-align: middle; margin: 2px 4px 2px 0; white-space: nowrap;">
                        <span style="font-size: 14px; line-height: 1;">📹</span>
                        <span style="font-weight: 500;">Zoom: ${topic}</span>
                    </a>&nbsp;
                `;

                if (context.execute) {
                    context.execute();
                }

                if (context.onInsertBody) context.onInsertBody(meetingHtml);
                else if (context.onAppendBody) context.onAppendBody(meetingHtml);
                else if (context.onUpdateBody) context.onUpdateBody(context.emailContent + meetingHtml);

                toast.success('Meeting inserted');

                if (!context.execute) {
                    onClose();
                }
            } else {
                toast.error(json.message || 'Failed to create meeting');
            }
        } catch (e) {
            toast.error('Error creating meeting');
        } finally {
            setLoading(false);
        }
    };

    if (settingsLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;
    }

    if (!configured) {
        return <ZoomSettingsWrapper />;
    }

    return (
        <div className="bg-background rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 font-sans">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/20">
                <h3 className="font-semibold flex items-center gap-2">
                    <Video className="h-4 w-4 text-blue-500" />
                    New Zoom Meeting
                </h3>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="p-6 space-y-4">
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Topic</label>
                    <input
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        autoFocus
                    />
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Duration (minutes)</label>
                    <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <option value="15">15 mins</option>
                        <option value="30">30 mins</option>
                        <option value="45">45 mins</option>
                        <option value="60">1 hour</option>
                    </select>
                </div>
            </div>

            <div className="px-6 py-4 bg-muted/20 flex justify-end gap-2 border-t">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleCreate}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Insert Meeting
                </button>
            </div>
        </div>
    );
};

// Wrapper for Settings in Global Modal
const ZoomSettingsWrapper = () => {
    const { settings, saveSettings, loading, saving } = useExpansionSettings('core-zoom');
    const { closeModal } = useExpansionUI();

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;

    return (
        <div className="bg-background rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 font-sans">
            <div className="px-4 py-3 flex items-center justify-between bg-muted/20">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Video className="w-4 h-4 text-blue-500" />
                    Zoom Settings
                </h3>
                <button onClick={closeModal} className="p-1 hover:bg-muted rounded transition-colors">
                    <X className="w-4 h-4 text-gray-500" />
                </button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto">
                <ZoomSettings settings={settings} onSave={saveSettings} saving={saving} />
            </div>
        </div>
    );
};

// Inline version for Slash Command (Auto-Execute or Global Modal)
const ZoomInline = ({ context, onClose, args }: { context: ClientExpansionContext, onClose?: () => void, args?: string }) => {
    const { settings, loading: settingsLoading } = useExpansionSettings('core-zoom');
    const { openModal } = useExpansionUI();
    const processed = useRef(false);

    useEffect(() => {
        // PREVENTION: If we are just a preview (no context) OR already ran OR still loading settings
        if (!context || processed.current || settingsLoading) return;

        // Mark as processed immediately to prevent any re-render from triggering this again
        processed.current = true;

        const run = async () => {
            if (isZoomConfigured(settings)) {
                // Topic from args or default
                const topic = args || 'Meeting';

                try {
                    const res = await fetch(`/api/expansions?trigger=create_meeting`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ topic, duration: 30 })
                    });
                    const json = await res.json();

                    if (json.success) {
                        const meetingHtml = `
                            <a href="${json.data.joinUrl}" target="_blank" contenteditable="false" style="color: #1e40af; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 2px 6px; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.4; vertical-align: middle; margin: 2px 4px 2px 0; white-space: nowrap;">
                                <span style="font-size: 14px; line-height: 1;">📹</span>
                                <span style="font-weight: 500;">Zoom: ${topic}</span>
                            </a>&nbsp;
                        `;
                        if (context.execute) {
                            context.execute();
                        }

                        if (context.onInsertBody) context.onInsertBody(meetingHtml);
                        else if (context.onAppendBody) context.onAppendBody(meetingHtml);

                        toast.success('Meeting inserted');

                        if (!context.execute) {
                            onClose?.();
                        }
                    } else {
                        toast.error(json.message || 'Failed to create meeting');
                    }
                } catch (e) {
                    toast.error('Error contacting Zoom API');
                }
                onClose?.();
            } else {
                // Not Configured -> Open Settings UI in Modal
                openModal(<ZoomSettingsWrapper />);
                onClose?.();
            }
        };

        run();
    }, [context, settings, settingsLoading, args, openModal, onClose]);

    // Render nothing or a small status while auto-executing
    return null;
};

export const ZoomClientExpansion = ({ context }: { context: ClientExpansionContext }) => {
    const { openModal, closeModal } = useExpansionUI();

    return (
        <button
            onClick={() => openModal(<ZoomCreateModal context={context} onClose={closeModal} />)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 text-muted-foreground"
            title="Insert Zoom Meeting"
        >
            <Video className="h-4 w-4" />
        </button>
    );
};

export const ZoomClientExpansionDefinition = {
    id: 'core-zoom',
    mounts: [
        {
            point: 'COMPOSER_TOOLBAR',
            Component: ZoomClientExpansion,
            title: 'Insert Zoom',
            icon: Video
        },
        {
            point: 'SLASH_COMMAND',
            Component: ZoomInline,
            slashCommand: {
                key: 'zoom',
                description: 'Create Zoom Meeting',
                arguments: 'Topic'
            }
        },
        {
            point: 'CUSTOM_SETTINGS_TAB',
            Component: ZoomSettings,
            title: 'Zoom',
            icon: Video
        }
    ]
};
