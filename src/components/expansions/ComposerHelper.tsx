import { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { ClientExpansion, ClientExpansionContext } from '@/lib/expansions/client/types';

interface ComposerHelperProps {
    context: ClientExpansionContext;
}

const ComposerHelperComponent = ({ context }: ComposerHelperProps) => {
    const [prompt, setPrompt] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        try {
            // Call the Server Expansion
            const res = await fetch('/api/expansions/core-composer-helper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    subject: context.subject,
                    to: context.to?.join(', ')
                })
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
            setGeneratedContent(json.data);
        } catch (e) {
            console.error(e);
            alert('Generation Failed');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleInsert = () => {
        if (!generatedContent) return;
        if (context.onInsertBody) {
            context.onInsertBody(generatedContent);
        } else if (context.onUpdateBody) {
            context.onUpdateBody(generatedContent);
        } else if (context.onUpdateContent) {
            context.onUpdateContent(generatedContent);
        }
        context.onClose?.();
    };

    return (
        <div className="bg-background/95 backdrop-blur-md p-4 z-30 animate-in slide-in-from-bottom-10 fade-in mx-3 rounded-xl ring-1 ring-black/5 mb-3">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Help me write
                </h4>
                <button onClick={() => context.onClose?.()} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                </button>
            </div>

            {generatedContent ? (
                <div className="flex flex-col gap-2">
                    <textarea
                        className="w-full text-sm border-gray-200 rounded-md p-3 focus:ring-2 focus:ring-purple-200 outline-none resize-none bg-purple-50/50 shadow-inner"
                        rows={4}
                        value={generatedContent}
                        onChange={(e) => setGeneratedContent(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setGeneratedContent('')}
                            className="text-gray-500 hover:text-gray-700 px-3 py-1.5 text-xs font-medium"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-1.5 rounded-md text-xs font-medium border border-purple-200 transition-colors"
                        >
                            {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Retry'}
                        </button>
                        <button
                            onClick={handleInsert}
                            className="bg-purple-600 text-white rounded-md px-4 py-1.5 font-medium text-xs hover:bg-purple-700 shadow-sm flex items-center gap-1"
                        >
                            Insert
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-2">
                    <textarea
                        className="flex-1 text-sm border-gray-200 rounded-md p-3 focus:ring-2 focus:ring-purple-200 outline-none resize-none bg-white shadow-sm"
                        rows={2}
                        placeholder="Describe what you want to say..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleGenerate();
                            }
                        }}
                        autoFocus
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className="bg-purple-600 text-white rounded-md px-4 py-2 font-medium text-sm hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate'}
                    </button>
                </div>
            )}
        </div>
    );
};

export const ComposerHelperClientExpansion: ClientExpansion = {
    id: 'core-composer-helper', // Matches server ID
    mounts: [{
        point: 'COMPOSER_OVERLAY',
        Component: ComposerHelperComponent
    }]
};
