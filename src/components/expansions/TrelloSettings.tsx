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

    useEffect(() => {
        // Check for Trello token in hash
        if (typeof window !== 'undefined' && window.location.hash) {
            const hash = window.location.hash.substring(1); // remove #
            const params = new URLSearchParams(hash);
            const token = params.get('token');
            if (token) {
                setTrelloToken(token);
                // Clear the hash cleanly
                window.history.replaceState(null, '', window.location.pathname);
                // Optionally save immediately?
                // onSave({ trelloKey, trelloToken: token }); 
                // But we usually wait for user to click Save or verify Key.
                // Actually the User needs to provide Key too for some usages? 
                // Usually the Token is enough if the App Key is static in backend, 
                // BUT TrelloSettings asks for Key+Token. 
                // If the backend uses ENV Key, maybe we don't need User Key?
                // Standard Trello expansion usually requires Key+Token if it acts "on behalf of user" using a specific Key.
                // If we use Server Key, we might hide the Key input?
                // For now, let's just populate Token.
            }
        }
    }, []);

    const handleConnect = () => {
        window.location.href = '/api/auth/trello';
    };

    const handleSave = async () => {
        await onSave({ trelloKey, trelloToken });
    };

    return (
        <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-medium">Connect Trello</h4>
                    <p className="text-xs text-muted-foreground">Authorize board access</p>
                </div>
                <button
                    onClick={handleConnect}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 transition-colors"
                >
                    Connect
                </button>
            </div>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or configure manually</span>
                </div>
            </div>

            <div className="grid gap-2">
                <label className="text-sm font-medium">Trello API Key</label>
                <div className="text-xs text-muted-foreground mb-1">
                    (Optional if using Connect, but required for custom keys)
                </div>
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
