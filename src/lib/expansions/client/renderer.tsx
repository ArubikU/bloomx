'use client';

import React, { useState, useEffect, useRef } from 'react';
import { clientExpansionRegistry } from './registry';
import { ClientExpansionContext, ClientExpansionMountPoint } from './types';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientExpansionsProps {
    mountPoint: ClientExpansionMountPoint;
    context: ClientExpansionContext;
}

import { Popover } from '@/components/ui/Popover';

export const ClientExpansions = ({ mountPoint, context }: ClientExpansionsProps) => {
    const expansions = clientExpansionRegistry.getByMountPoint(mountPoint);

    // Responsive limit logic
    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);

    const moreButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setMounted(true);
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    if (expansions.length === 0) return null;
    if (!mounted) return null;

    const isToolbar = mountPoint.includes('TOOLBAR');

    if (!isToolbar) {
        return (
            <>
                {expansions.map(exp => {
                    const Component = exp.Component;
                    if (!Component) return null;
                    return <Component key={exp.id} context={context} />;
                })}
            </>
        );
    }

    const limit = isMobile ? 3 : 5;
    const showMore = expansions.length > limit;
    const visibleExpansions = showMore ? expansions.slice(0, limit) : expansions;
    const hiddenExpansions = showMore ? expansions.slice(limit) : [];

    return (
        <div className="flex items-center gap-1">
            <div className="flex items-center gap-1">
                {visibleExpansions.map(exp => {
                    const Component = exp.Component;
                    if (!Component) return null;
                    return <Component key={exp.id} context={context} />;
                })}
            </div>

            {showMore && (
                <>
                    <button
                        ref={moreButtonRef}
                        onClick={() => setOpen(!open)}
                        className={cn(
                            "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-8 w-8",
                            open ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                        title="More Expansions"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </button>

                    <Popover
                        trigger={moreButtonRef}
                        isOpen={open}
                        onClose={() => setOpen(false)}
                        width={200}
                        className="p-1"
                    >
                        <div className="text-[10px] font-bold text-muted-foreground/60 px-2 py-1 uppercase tracking-wider">
                            More Tools
                        </div>
                        <div className="flex flex-col gap-0.5 max-h-[300px] overflow-y-auto">
                            {hiddenExpansions.map(exp => (
                                <div
                                    key={exp.id}
                                    className="flex items-center gap-2 p-1.5 hover:bg-accent rounded-sm transition-colors group cursor-pointer relative"
                                    onClick={() => setOpen(false)}
                                >
                                    <div className="shrink-0">
                                        {/* Render the component itself so its internal button/logic works */}
                                        {(() => {
                                            const Component = exp.Component;
                                            if (!Component) return null;
                                            return <Component context={context} />;
                                        })()}
                                    </div>
                                    <div className="flex-1 min-w-0 pointer-events-none">
                                        <span className="text-xs font-medium truncate block text-foreground">
                                            {exp.title || exp.id}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Popover>
                </>
            )}
        </div>
    );
};
