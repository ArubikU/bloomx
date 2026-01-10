import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ClientExpansion, ClientExpansionContext } from '@/lib/expansions/client/types';

const OrganizerComponent = ({ context }: { context: ClientExpansionContext }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleOrganize = async () => {
        const toastId = toast.loading('Organizing inbox...');
        setIsLoading(true);
        try {
            const res = await fetch('/api/expansions/core-organizer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const result = await res.json();
            if (!result.success) throw new Error(result.message || 'Error');

            if (result.data?.count !== undefined) {
                toast.success(`Organized ${result.data.count} emails`, { id: toastId });
                // Reload or refresh context if possible
                window.location.reload();
            } else {
                toast.success('Completed', { id: toastId });
            }
        } catch (e: any) {
            toast.error(e.message || 'Failed', { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleOrganize}
            disabled={isLoading}
            className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 p-0.5 rounded transition-colors"
            title="Auto Organize"
        >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
        </button>
    );
};

export const OrganizerClientExpansion: ClientExpansion = {
    id: 'core-organizer',
    mounts: [{
        point: 'SIDEBAR_HEADER',
        Component: OrganizerComponent
    }],
    label: 'Auto Organizer'
};
