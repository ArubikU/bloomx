'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Info } from 'lucide-react';

interface NotionSettingsProps {
    settings: {
        notionKey?: string;
        databaseId?: string;
    };
    onSave: (settings: any) => Promise<void>;
    saving?: boolean;
}

export function NotionSettings({ settings, onSave, saving }: NotionSettingsProps) {
    const [notionKey, setNotionKey] = useState(settings?.notionKey || '');
    const [databaseId, setDatabaseId] = useState(settings?.databaseId || '');
    const [showKey, setShowKey] = useState(false);

    const handleConnect = () => {
        window.location.href = '/api/auth/notion';
    };

    const handleSave = async () => {
        await onSave({ notionKey, databaseId });
    };

    return (
        <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-medium">Connect Notion Workspace</h4>
                    <p className="text-xs text-muted-foreground">Authorize access to pages</p>
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
                <label className="text-sm font-medium">Notion API Key</label>
                <div className="relative">
                    <input
                        type={showKey ? 'text' : 'password'}
                        value={notionKey}
                        onChange={(e) => setNotionKey(e.target.value)}
                        placeholder="secret_..."
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

            <div className="grid gap-2">
                <label className="text-sm font-medium">Database ID</label>
                <input
                    type="text"
                    value={databaseId}
                    onChange={(e) => setDatabaseId(e.target.value)}
                    placeholder="32 chars hex string from URL"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>

            <div className="flex justify-end pt-2 border-t">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Notion Settings'}
                </button>
            </div>
        </div>
    );
}
