import { useState, useEffect } from 'react';
import { Bot, Loader2, MessageSquare } from 'lucide-react';
import { ClientExpansion, ClientExpansionContext } from '@/lib/expansions/client/types';
import { toast } from 'sonner';

const SmartReplyComponent = ({ context }: { context: ClientExpansionContext }) => {
    const [replies, setReplies] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    const fetchReplies = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/expansions/core-smart-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailContent: context.emailContent
                })
            });
            const result = await res.json();
            if (!result.success) throw new Error(result.message);

            if (Array.isArray(result.data)) {
                setReplies(result.data);
            }
            setHasFetched(true);
        } catch (e) {
            console.error(e);
            toast.error('Failed to get suggestions');
        } finally {
            setIsLoading(false);
        }
    };

    if (!hasFetched && !isLoading) {
        // Button to trigger
        return (
            <button
                onClick={fetchReplies}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-purple-100 hover:text-purple-600 h-8 w-8 ml-1"
                title="Smart Reply"
            >
                <Bot className="h-4 w-4" />
            </button>
        );
    }

    // Once fetched (or loading), show results? 
    // Wait, the mountPoint 'EMAIL_TOOLBAR' is small.
    // Maybe we need TWO components? One for button, one for results?
    // Or we render a Popover?
    // Let's use a simple approach: Button in toolbar triggers a "toast" or just opens the compose with options?
    // The previous implementation showed chips in the body.
    // Let's change the MOUNT POINT to 'EMAIL_FOOTER' for the chips.
    // But the user clicked the button.

    // Better idea: SmartReply has TWO mount points? Or just one component that portals?
    // Let's stick to the prompt: "Button + Chips display".
    // If mounted in FOOTER, it can just show chips.
    // If mounted in TOOLBAR, it triggers?

    // SIMPLIFICATION: Let's mount SmartReply in 'EMAIL_FOOTER' (below body) and have it have a "Generate Suggestions" button if empty?
    return null; // Implemented below separately for clarity in registry
};


const SmartReplyFooterComponent = ({ context }: { context: ClientExpansionContext }) => {
    const [replies, setReplies] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    const fetchReplies = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/expansions/core-smart-reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailContent: context.emailContent
                })
            });
            const result = await res.json();
            if (!result.success) throw new Error(result.message);

            if (Array.isArray(result.data)) {
                setReplies(result.data);
            }
            setHasFetched(true);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReply = (reply: string) => {
        // Open compose with reply
        // We need a way to open compose. Context should provide it? 
        // Or dispatch a custom event?
        // 'useCompose' hook is internal.
        // Let's assume context has 'onReply' handler.
        if (context.onReply) {
            context.onReply(reply);
        }
    };

    useEffect(() => {
        if (hasFetched && replies.length > 0 && context.onUpdateSuggestions) {
            context.onUpdateSuggestions(replies);
        }
    }, [hasFetched, replies, context]);

    return (
        <div className="mt-4">
            {!hasFetched ? (
                <button
                    onClick={fetchReplies}
                    disabled={isLoading}
                    className="flex items-center gap-2 text-sm text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-md transition-colors"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                    Generate Smart Replies
                </button>
            ) : null /* Host MailView renders the chips */}
        </div>
    );
}

export const SmartReplyClientExpansion: ClientExpansion = {
    id: 'core-smart-reply',
    mounts: [{
        point: 'EMAIL_FOOTER',
        Component: SmartReplyFooterComponent
    }]
};
