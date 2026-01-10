'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Info } from 'lucide-react';

interface TrelloSettingsProps {
    settings: {
        trelloKey?: string;
        trelloToken?: string;
    };
    onSave: (settings: any) => Promise<void>;
    saving?: boolean;
}

export function TrelloSettings({ settings, onSave, saving }: TrelloSettingsProps) {
    const [trelloKey, setTrelloKey] = useState(settings?.trelloKey || '');
    const [trelloToken, setTrelloToken] = useState(settings?.trelloToken || '');
    const [showToken, setShowToken] = useState(false);

    const handleSave = async () => {
        await onSave({ trelloKey, trelloToken });
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-2">
                <label className="text-sm font-medium">Trello API Key</label>
                <input
                    type="text"
                    value={trelloKey}
                    onChange={(e) => setTrelloKey(e.target.value)}
                    placeholder="Key..."
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                />
            </div>
            <div className="grid gap-2">
                <label className="text-sm font-medium">Trello Token</label>
                <div className="relative">
                    <input
                        type={showToken ? 'text' : 'password'}
                        value={trelloToken}
                        onChange={(e) => setTrelloToken(e.target.value)}
                        placeholder="Token..."
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
                    {saving ? 'Saving...' : 'Save Trello Settings'}
                </button>
            </div>
        </div>
    );
}
