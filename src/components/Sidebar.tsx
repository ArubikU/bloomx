'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { brand } from '@/lib/brand';
import { useSearchParams } from 'next/navigation';
import { Inbox, File, Send, ArchiveX, Trash2, Archive, Plus, Tag, Check, X, Clock, Sparkles } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useExpansions } from '@/hooks/useExpansions';
import { cn } from '@/lib/utils';
import { ClientExpansions } from '@/lib/expansions/client/renderer';
import { ensureClientExpansions } from '@/lib/expansions/client/core-expansions';
import { CronTrigger } from '@/components/CronTrigger';
import { useCompose } from '@/contexts/ComposeContext';
import { useCache } from '@/contexts/CacheContext';
import { useSession } from '@/components/SessionProvider';
import { toast } from 'sonner';
import { SettingsModal } from './SettingsModal';
// Init
ensureClientExpansions();

interface SidebarProps {
    onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
    const { status } = useSession();
    const searchParams = useSearchParams();
    const currentFolder = searchParams.get('folder') || 'inbox';
    const { openCompose } = useCompose();
    const { getData, setData, subscribe } = useCache();
    const [counts, setCounts] = useState({
        inbox: 0,
        drafts: 0,
        sent: 0,
        spam: 0,
        trash: 0,
        archive: 0,
        scheduled: 0
    });
    const [labels, setLabels] = useState<any[]>([]);

    const activeLabels = searchParams.get('label')?.split(',') || [];

    const getLabelUrl = (labelName: string) => {
        const name = labelName.toLowerCase();
        let newLabels = [...activeLabels];
        if (newLabels.includes(name)) {
            newLabels = newLabels.filter(l => l !== name);
        } else {
            newLabels.push(name);
        }

        const params = new URLSearchParams(searchParams.toString());
        if (newLabels.length > 0) {
            params.set('label', newLabels.join(','));
            params.set('folder', currentFolder); // Ensure folder stays current
        } else {
            params.delete('label');
        }
        if (params.has('id')) params.delete('id'); // Deselect email on nav

        return `/?${params.toString()}`;
    };

    // Label creation state
    const [isCreatingLabel, setIsCreatingLabel] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [isSubmittingLabel, setIsSubmittingLabel] = useState(false);

    const [showSettings, setShowSettings] = useState(false);



    useEffect(() => {
        async function loadData() {
            // Load Counts
            const countsKey = 'stats-counts';
            const cachedCounts = await getData<typeof counts>(countsKey);

            if (cachedCounts) {
                setCounts(cachedCounts);
            }

            // Load Labels
            const labelsKey = 'labels-all';
            const cachedLabels = await getData<any[]>(labelsKey);

            if (cachedLabels) {
                setLabels(cachedLabels);
            }

            // Background Refresh
            try {
                const res = await fetch('/api/counts');
                const data = await res.json();

                if (data.counts) {
                    setCounts(data.counts);
                    setData(countsKey, data.counts, { silent: true });
                }
                if (data.labels) {
                    setLabels(data.labels);
                    setData(labelsKey, data.labels, { silent: true });
                }
            } catch (error) {
                console.error('Failed to refresh counts:', error);
            }
        }

        if (status === 'authenticated') {
            loadData();
        }

        // Subscription for immediate updates
        const unsubscribe = subscribe(() => {
            if (status === 'authenticated') loadData();
        });

        // Poll every 30s
        const interval = setInterval(() => {
            if (status === 'authenticated') loadData();
        }, 30000);
        return () => {
            clearInterval(interval);
            unsubscribe();
        };
    }, [getData, setData, subscribe, status]);

    const handleCreateLabel = async () => {
        if (!newLabelName.trim()) return;
        setIsSubmittingLabel(true);
        try {
            const res = await fetch('/api/labels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newLabelName.trim() })
            });

            if (res.ok) {
                const label = await res.json();
                setLabels(prev => [...prev, { ...label, count: 0 }]); // Optimistic add

                // Update global cache for MailView
                const cachedLabels = await getData<any[]>('labels-all') || [];
                // Check if already exists to be safe
                if (!cachedLabels.some((l: any) => l.id === label.id)) {
                    await setData('labels-all', [...cachedLabels, label], { silent: true });
                }

                setNewLabelName('');
                setIsCreatingLabel(false);
                toast.success('Label created successfully');
            } else {
                toast.error('Failed to create label');
            }
        } catch (error) {
            console.error(error);
            toast.error('Something went wrong');
        } finally {
            setIsSubmittingLabel(false);
        }
    };

    const mainNav = [
        { name: 'Inbox', icon: Inbox, id: 'inbox', count: counts.inbox },
        { name: 'Drafts', icon: File, id: 'drafts', count: counts.drafts },
        { name: 'Sent', icon: Send, id: 'sent', count: counts.sent },
        { name: 'Scheduled', icon: Clock, id: 'scheduled', count: counts.scheduled || 0 }, // Added Scheduled
        { name: 'Junk', icon: ArchiveX, id: 'spam', count: counts.spam },
        { name: 'Trash', icon: Trash2, id: 'trash', count: counts.trash },
        { name: 'Archive', icon: Archive, id: 'archive', count: counts.archive },
    ];

    return (
        <div className="flex h-full flex-col bg-muted/10 group h-full">
            {/* Account / Compose */}
            <div className="flex px-4 py-4 items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-bold text-lg tracking-tight">
                    {brand.logo ? (
                        <img src={brand.logo} alt={brand.name} className="h-7 w-7 rounded-lg object-contain" />
                    ) : (
                        <div
                            className="h-7 w-7 text-primary-foreground rounded-lg flex items-center justify-center transition-colors"
                            style={{ backgroundColor: brand.color }}
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                    <span>{brand.name}</span>
                </div>
                {/* Mobile Close Button */}
                {onClose && (
                    <button onClick={onClose} className="md:hidden p-2 text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            <div className="px-3 mb-4">
                <button
                    onClick={() => {
                        openCompose();
                        onClose?.();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-all shadow-sm active:scale-[0.98]"
                >
                    <Plus className="h-4 w-4" />
                    <span>New Message</span>
                </button>
            </div>

            {/* Main Navigation */}
            <div className="flex flex-col gap-1 px-2">
                {mainNav.map((item) => {
                    const isActive = currentFolder === item.id;
                    return (
                        <Link
                            key={item.id}
                            href={`/?folder=${item.id}`}
                            onClick={() => onClose?.()}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group/item",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover/item:text-foreground")} />
                            {item.name}
                            {item.count > 0 && (
                                <span className={cn(
                                    "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full",
                                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}>
                                    {item.count}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Labels Section */}
            <div className="mt-8 px-4 flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Labels</span>

                    {/* Dynamic Header Actions */}
                    <ClientExpansions mountPoint="SIDEBAR_HEADER" context={{}} />
                </div>
                <button
                    onClick={() => setIsCreatingLabel(!isCreatingLabel)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-sm hover:bg-muted"
                    title="Create Label"
                >
                    <Plus className="h-3 w-3" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4">
                {isCreatingLabel && (
                    <div className="mb-2 px-2 pb-2 animate-in fade-in slide-in-from-top-1 duration-200 bg-muted/30 rounded-lg p-2 border border-border/50">
                        <div className="flex items-center gap-1">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Label name..."
                                value={newLabelName}
                                onChange={(e) => setNewLabelName(e.target.value)}
                                className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateLabel();
                                    if (e.key === 'Escape') setIsCreatingLabel(false);
                                }}
                            />
                            <button onClick={handleCreateLabel} disabled={isSubmittingLabel} className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
                                <Check className="h-3 w-3" />
                            </button>
                            <button onClick={() => setIsCreatingLabel(false)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                )}

                <nav className="grid gap-0.5">
                    {labels.length === 0 && !isCreatingLabel && (
                        <div className="px-4 py-4 text-xs text-muted-foreground/60 text-center border mr-2 ml-2 rounded border-dashed">No labels</div>
                    )}
                    {labels.map((label: any) => {
                        const isActive = activeLabels.includes(label.name.toLowerCase());
                        return (
                            <Link
                                key={label.name}
                                href={getLabelUrl(label.name)}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center justify-center w-4 relative">
                                    <span
                                        className="h-2.5 w-2.5 rounded-full ring-2 ring-transparent group-hover:ring-border transition-all"
                                        style={{ backgroundColor: label.color }}
                                    />
                                    {isActive && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="h-4 w-4 bg-primary/20 rounded-full animate-pulse" />
                                        </div>
                                    )}
                                </div>
                                <span className={cn("flex-1", isActive && "font-bold")}>{label.name}</span>
                                {label.count > 0 && (
                                    <span className="ml-auto text-xs text-muted-foreground">{label.count}</span>
                                )}
                                {isActive && <Check className="h-3 w-3 text-primary ml-1" />}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Client Expansions: Sidebar Footer */}
            <ClientExpansions
                mountPoint="SIDEBAR_FOOTER"
                context={{}}
            />

            {/* User Profile / Settings stub - Hidden on Mobile */}
            <div className="p-4 border-t mt-auto hidden md:block">
                <button
                    onClick={() => setShowSettings(true)}
                    className="flex w-full items-center gap-3 hover:bg-muted/50 p-2 rounded-lg transition-colors -mx-2 text-left"
                >
                    <UserProfileAvatar />
                    <UserProfileDisplay />
                </button>
            </div>

            <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
            <CronTrigger />
        </div>
    );
}

function UserProfileAvatar() {
    const { data: session } = useSession();
    if (session?.user?.avatar) {
        return <img src={session.user.avatar} alt="Avatar" className="h-9 w-9 rounded-full object-cover border border-border" />;
    }
    return (
        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-pink-500 to-violet-500 flex items-center justify-center text-white font-medium text-xs">
            {(session?.user?.name?.[0] || session?.user?.email?.[0] || '?').toUpperCase()}
        </div>
    );
}

function UserProfileDisplay() {
    const { data: session } = useSession();
    if (!session?.user) return null;
    return (<div className="flex flex-col overflow-hidden">
        <span className="text-sm font-medium truncate">{session.user.name || 'User'}</span>
        <span className="text-xs text-muted-foreground truncate max-w-[140px]">{session.user.email}</span>
    </div>
    );
}
