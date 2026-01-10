'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Info } from 'lucide-react';

interface ZoomSettingsProps {
    settings: {
        zoomAccountId?: string;
        zoomClientId?: string;
        zoomClientSecret?: string;
    };
    onSave: (settings: any) => Promise<void>;
    saving?: boolean;
}

export function ZoomSettings({ settings, onSave, saving }: ZoomSettingsProps) {
    const [zoomAccountId, setZoomAccountId] = useState(settings?.zoomAccountId || '');
    const [zoomClientId, setZoomClientId] = useState(settings?.zoomClientId || '');
    const [zoomClientSecret, setZoomClientSecret] = useState(settings?.zoomClientSecret || '');
    const [showSecret, setShowSecret] = useState(false);

    const handleSave = async () => {
        try {
            await onSave({ zoomAccountId, zoomClientId, zoomClientSecret });
            // Maybe show a success indicator? Hook or toast might handle it.
        } catch (e) {
            // Error already logged by hook
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-2">
                <label className="text-sm font-medium">Zoom Account ID</label>
                <input
                    type="text"
                    value={zoomAccountId}
                    onChange={(e) => setZoomAccountId(e.target.value)}
                    placeholder="Account ID..."
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                />
            </div>
            <div className="grid gap-2">
                <label className="text-sm font-medium">Client ID</label>
                <input
                    type="text"
                    value={zoomClientId}
                    onChange={(e) => setZoomClientId(e.target.value)}
                    placeholder="Client ID..."
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                />
            </div>
            <div className="grid gap-2">
                <label className="text-sm font-medium">Client Secret</label>
                <div className="relative">
                    <input
                        type={showSecret ? 'text' : 'password'}
                        value={zoomClientSecret}
                        onChange={(e) => setZoomClientSecret(e.target.value)}
                        placeholder="Client Secret..."
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Use Server-to-Server OAuth app credentials from Zoom App Marketplace.
                </p>
            </div>

            <div className="flex justify-end pt-2">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Zoom Settings'}
                </button>
            </div>
        </div>
    );
}
