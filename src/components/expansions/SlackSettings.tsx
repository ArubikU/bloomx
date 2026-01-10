'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Info } from 'lucide-react';

interface SlackSettingsProps {
    settings: {
        slackToken?: string;
    };
    onSave: (settings: any) => Promise<void>;
    saving?: boolean;
}

export function SlackSettings({ settings, onSave, saving }: SlackSettingsProps) {
    const [slackToken, setSlackToken] = useState(settings?.slackToken || '');
    const [showKey, setShowKey] = useState(false);

    const handleSave = async () => {
        await onSave({ slackToken });
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-2">
                <label className="text-sm font-medium">Slack Bot User OAuth Token</label>
                <div className="relative">
                    <input
                        type={showKey ? 'text' : 'password'}
                        value={slackToken}
                        onChange={(e) => setSlackToken(e.target.value)}
                        placeholder="xoxb-..."
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Slack Settings'}
                </button>
            </div>
        </div>
    );
}
