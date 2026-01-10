import React, { useState, useEffect } from 'react';
import { ClientExpansionContext } from '@/lib/expansions/client/types';
import { KanbanSquare, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useExpansionUI } from '@/contexts/ExpansionUIContext';
import { TrelloSettings } from './TrelloSettings';
import { useExpansionSettings } from '@/hooks/useExpansionSettings';

const TrelloCreateCardModal = ({ context, onClose }: { context: ClientExpansionContext, onClose: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [stage, setStage] = useState<'boards' | 'lists' | 'details'>('boards');

    const [boards, setBoards] = useState<any[]>([]);
    const [lists, setLists] = useState<any[]>([]);

    const [selectedBoard, setSelectedBoard] = useState('');
    const [selectedList, setSelectedList] = useState('');

    const [cardTitle, setCardTitle] = useState('');
    const [cardDesc, setCardDesc] = useState('');
    const [error, setError] = useState<string | null>(null);

    const { settings, loading: settingsLoading } = useExpansionSettings('core-trello');

    useEffect(() => {
        setCardTitle(typeof context.subject === 'string' ? context.subject : `Email from ${context.from || 'Unknown'}`);
        setCardDesc(`From: ${context.from}\nLink: ${window.location.href}\n\n${context.emailContent?.substring(0, 500)}...`);
        if (!settingsLoading) {
            fetchBoards();
        }
    }, [settingsLoading]);

    const fetchBoards = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/expansions?trigger=get_trello_boards`);
            const json = await res.json();
            if (json.success) {
                setBoards(json.data);
                if (json.data.length > 0) setSelectedBoard(json.data[0].id);
            } else {
                setError(json.message || 'Trello not configured.');
            }
        } catch (e) {
            setError('Failed to fetch boards.');
        } finally {
            setLoading(false);
        }
    };

    const fetchLists = async (boardId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/expansions?trigger=get_trello_lists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ boardId })
            });
            const json = await res.json();
            if (json.success) {
                setLists(json.data);
                if (json.data.length > 0) setSelectedList(json.data[0].id);
                setStage('lists');
            } else {
                toast.error('Failed to load lists');
            }
        } catch (e) {
            toast.error('Error loading lists');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (stage === 'boards') {
            fetchLists(selectedBoard);
        } else if (stage === 'lists') {
            setStage('details');
        }
    };

    const createCard = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/expansions?trigger=create_trello_card`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    listId: selectedList,
                    name: cardTitle,
                    desc: cardDesc
                })
            });
            const json = await res.json();
            if (json.success) {
                toast.success('Card created in Trello');
                onClose();
            } else {
                toast.error(json.message || 'Failed to create card');
            }
        } catch (e) {
            toast.error('Error creating card');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/20">
                <h3 className="font-semibold flex items-center gap-2">
                    <KanbanSquare className="h-4 w-4 text-blue-600" />
                    Create Trello Card
                </h3>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="p-6 space-y-4">
                {error ? (
                    <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                        {error}. Configure in Settings.
                    </div>
                ) : (
                    <>
                        {stage === 'boards' && (
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Select Board</label>
                                    <select
                                        value={selectedBoard}
                                        onChange={(e) => setSelectedBoard(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        disabled={loading}
                                    >
                                        {boards.map(b => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {stage === 'lists' && (
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Select List</label>
                                    <select
                                        value={selectedList}
                                        onChange={(e) => setSelectedList(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        disabled={loading}
                                    >
                                        {lists.map(l => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {stage === 'details' && (
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Card Title</label>
                                    <input
                                        value={cardTitle}
                                        onChange={(e) => setCardTitle(e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <textarea
                                        value={cardDesc}
                                        onChange={(e) => setCardDesc(e.target.value)}
                                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="px-6 py-4 bg-muted/20 flex justify-end gap-2 border-t">
                {stage !== 'boards' && !error && (
                    <button
                        onClick={() => setStage(stage === 'details' ? 'lists' : 'boards')}
                        className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors mr-auto"
                        disabled={loading}
                    >
                        Back
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                >
                    Cancel
                </button>
                {!error && (
                    <button
                        onClick={stage === 'details' ? createCard : handleNext}
                        disabled={loading || (stage === 'boards' && boards.length === 0)}
                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (stage === 'details' ? <Plus className="h-4 w-4" /> : 'Next')}
                        {stage === 'details' && 'Create Card'}
                    </button>
                )}
            </div>
        </div>
    );
};

export const TrelloClientExpansion = ({ context }: { context: ClientExpansionContext }) => {
    const { openModal, closeModal } = useExpansionUI();

    if (!context.emailContent) return null;

    return (
        <button
            onClick={() => openModal(<TrelloCreateCardModal context={context} onClose={closeModal} />)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 text-muted-foreground"
            title="Create Trello Card"
        >
            <KanbanSquare className="h-4 w-4" />
        </button>
    );
};

export const TrelloClientExpansionDefinition = {
    id: 'core-trello',
    mounts: [
        {
            point: 'EMAIL_TOOLBAR',
            Component: TrelloClientExpansion,
            title: 'Create Trello Card',
            icon: KanbanSquare
        },
        {
            point: 'CUSTOM_SETTINGS_TAB',
            Component: TrelloSettings,
            title: 'Trello',
            icon: KanbanSquare
        }
    ]
};
