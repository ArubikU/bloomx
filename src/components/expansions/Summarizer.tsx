import { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { ClientExpansion, ClientExpansionContext } from '@/lib/expansions/client/types';

const SummarizerComponent = ({ context }: { context: ClientExpansionContext }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleSummarize = async () => {

        setIsLoading(true);
        try {
            const res = await fetch('/api/expansions/core-summarizer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailContent: context.emailContent
                })
            });
            const result = await res.json();
            if (!result.success) throw new Error(result.message);

            if (context.onUpdateSummary) {
                context.onUpdateSummary(result.data);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to summarize');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={handleSummarize}
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-purple-100 hover:text-purple-600 h-8 w-8 ml-1"
                title="Summarize"
            >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            </button>
        </>
    );
};

export const SummarizerClientExpansion: ClientExpansion = {
    id: 'core-summarizer',
    mounts: [{
        point: 'EMAIL_TOOLBAR',
        Component: SummarizerComponent
    }]
};
