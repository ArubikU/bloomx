import React, { useState, useEffect, useRef } from 'react';
import { ClientExpansionContext } from '@/lib/expansions/client/types';
import { Search, Loader2, X, Image } from 'lucide-react';
import { toast } from 'sonner';
import { useExpansionSettings } from '@/hooks/useExpansionSettings';
import { Popover } from '../ui/Popover';

const DEMO_KEY = 'Cp5f2X2k7y2s5L21';

const GiphySelector = ({ context, args }: { context: ClientExpansionContext, args?: string }) => {
    const { settings } = useExpansionSettings('core-giphy');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState(args || '');
    const [debouncedQuery, setDebouncedQuery] = useState(args || '');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const gridRef = useRef<HTMLDivElement>(null);

    const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY || settings?.apiKey || DEMO_KEY;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
            setResults([]);
            setOffset(0);
            setHasMore(true);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        if (!apiKey) return;
        setLoading(true);

        const limit = 12;
        const endpoint = debouncedQuery
            ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(debouncedQuery)}&limit=${limit}&offset=${offset}&rating=g`
            : `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=${limit}&offset=${offset}&rating=g`;

        fetch(endpoint)
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    setResults(prev => offset === 0 ? data.data : [...prev, ...data.data]);
                    if (data.data.length < limit) setHasMore(false);
                }
            })
            .catch(() => toast.error('Failed to load GIFs'))
            .finally(() => setLoading(false));
    }, [debouncedQuery, apiKey, offset]);

    const handleSelect = (gif: any) => {
        const src = gif.images.fixed_height.url;

        if (context.execute) {
            context.execute();
        }

        if (context.insertBody) {
            context.insertBody(
                `<div contenteditable="false" style="margin: 12px 0;"><img src="${src}" alt="${gif.title}" style="max-width:100%;border-radius:8px;box-shadow: 0 1px 3px rgba(0,0,0,0.1);" /></div><br/>`
            );
        } else if (context.appendBody) {
            context.appendBody(
                `<div contenteditable="false" style="margin: 12px 0;"><img src="${src}" alt="${gif.title}" style="max-width:100%;border-radius:8px;box-shadow: 0 1px 3px rgba(0,0,0,0.1);" /></div><br/>`
            );
        }

        if (!context.execute) {
            context.onClose?.();
        }
    };

    return (
        <div className="w-full bg-white flex flex-col h-[400px]">
            {/* Search + Close inline */}
            <div className="flex items-center gap-1 px-3 py-2 border-b">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search Giphy..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                />
                <button
                    onClick={() => context.onClose?.()}
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                >
                    <X className="h-4 w-4 text-gray-400" />
                </button>
            </div>

            {/* Grid */}
            <div
                ref={gridRef}
                className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200"
            >
                {results.length === 0 && loading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                    </div>
                ) : results.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-xs text-gray-400">
                        No results for "{debouncedQuery}"
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-3 gap-2">
                            {results.map(gif => (
                                <button
                                    key={gif.id}
                                    onClick={() => handleSelect(gif)}
                                    className="aspect-square overflow-hidden rounded-md bg-gray-50 border border-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all group relative"
                                >
                                    <img
                                        src={gif.images.preview_gif.url}
                                        alt={gif.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>

                        {hasMore && (
                            <div className="mt-4 flex justify-center pb-2">
                                <button
                                    onClick={() => setOffset(prev => prev + 12)}
                                    disabled={loading}
                                    className="text-xs font-semibold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-full transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Loading...' : 'Load more GIFs'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="px-3 py-1.5 border-t bg-gray-50/50 flex justify-between items-center text-[10px] text-gray-400">
                <span className="truncate pr-4">{debouncedQuery ? `Results for "${debouncedQuery}"` : 'Trending'}</span>
                <span className="font-black tracking-tighter text-gray-300 select-none">GIPHY</span>
            </div>
        </div>
    );
};


export const GiphyToolbarButton = ({ context }: { context: ClientExpansionContext }) => {
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleOpen = () => {
        if (!context.openPopover && !context.openOverlay) return;

        // Mobile check
        const isMobile = window.innerWidth < 640;

        if (isMobile && context.openOverlay) {
            context.openOverlay(<GiphySelector context={context} />);
        } else if (buttonRef.current && context.openPopover) {
            const rect = buttonRef.current.getBoundingClientRect();
            context.openPopover(rect, (
                <GiphySelector context={context} />
            ), { width: 320, header: false });
        }
    };

    return (
        <button
            ref={buttonRef}
            onClick={handleOpen}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            title="Insert GIF"
        >
            <span className="font-bold text-xs uppercase">Gif</span>
        </button>
    );
};

export const GiphyClientExpansionDefinition = {
    id: 'core-giphy',
    mounts: [
        {
            point: 'COMPOSER_TOOLBAR',
            Component: GiphyToolbarButton,
            title: 'Giphy',
            icon: Image
        },
        {
            point: 'SLASH_COMMAND',
            Component: GiphySelector,
            slashCommand: {
                key: 'giphy',
                description: 'Search Giphy',
                arguments: 'search query',
                header: false
            }
        }
    ]
};
