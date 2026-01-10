'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Info } from 'lucide-react';

interface HubSpotSettingsProps {
    settings: {
        hubspotAccessToken?: string;
    };
    onSave: (settings: any) => Promise<void>;
    saving?: boolean;
}

export function HubSpotSettings({ settings, onSave, saving }: HubSpotSettingsProps) {
    const [hubspotAccessToken, setHubspotAccessToken] = useState(settings?.hubspotAccessToken || '');
    const [showToken, setShowToken] = useState(false);

    const handleSave = async () => {
        await onSave({ hubspotAccessToken });
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-2">
                <label className="text-sm font-medium">HubSpot Access Token</label>
                <div className="relative">
                    <input
                        type={showToken ? 'text' : 'password'}
                        value={hubspotAccessToken}
                        onChange={(e) => setHubspotAccessToken(e.target.value)}
                        placeholder="pat-na1-..."
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save HubSpot Settings'}
                </button>
            </div>
        </div>
    );
}
