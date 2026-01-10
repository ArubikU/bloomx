'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { Loader2, CheckCircle2, AlertCircle, LogOut, LogIn, RefreshCcw } from 'lucide-react';

export function GoogleAuthSettings({ settings, onSave }: { settings: any, onSave: (s: any) => void }) {
    const [status, setStatus] = useState<'loading' | 'linked' | 'unlinked'>('loading');
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const checkStatus = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            setStatus(data.isGoogleLinked ? 'linked' : 'unlinked');
        } catch (e) {
            console.error(e);
            setStatus('unlinked');
        }
    };

    useEffect(() => {
        checkStatus();
    }, []);

    const handleConnect = () => {
        signIn('google', { callbackUrl: window.location.href });
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect your Google account from this expansion? You will need to sign in again to access Drive files.')) return;

        setActionLoading(true);
        setMessage(null);
        try {
            const res = await fetch('/api/auth/unlink/google', { method: 'DELETE' });
            if (res.ok) {
                setStatus('unlinked');
                setMessage({ type: 'success', text: 'Disconnected successfully' });
            } else {
                throw new Error('Failed to disconnect');
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Failed to disconnect account' });
        } finally {
            setActionLoading(false);
        }
    };

    if (status === 'loading') {
        return <div className="p-4 flex justify-center"><Loader2 className="animate-spin h-5 w-5 text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${status === 'linked' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {status === 'linked' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    </div>
                    <div>
                        <h4 className="font-medium text-sm">Google Account</h4>
                        <p className="text-xs text-muted-foreground">
                            {status === 'linked' ? 'Connected and ready to use.' : 'Not connected.'}
                        </p>
                    </div>
                </div>

                {status === 'linked' ? (
                    <div className="flex gap-2">
                        <button
                            onClick={handleConnect}
                            disabled={actionLoading}
                            className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md transition-colors font-medium"
                            title="Refresh connection tokens"
                        >
                            <RefreshCcw className="h-3.5 w-3.5" />
                            Refresh
                        </button>
                        <button
                            onClick={handleDisconnect}
                            disabled={actionLoading}
                            className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md transition-colors font-medium"
                        >
                            {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleConnect}
                        className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors font-medium"
                    >
                        <LogIn className="h-3.5 w-3.5" />
                        Connect
                    </button>
                )}
            </div>

            {message && (
                <div className={`text-xs p-2 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {message.text}
                </div>
            )}
        </div>
    );
}
