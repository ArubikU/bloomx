import React, { useState, useEffect } from 'react';
import { ClientExpansionContext } from '@/lib/expansions/client/types';
import { Calendar, Loader2, Plus, X, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useExpansionUI } from '@/contexts/ExpansionUIContext';
import { format } from 'date-fns';

const CalendarCreateModal = ({ context, onClose }: { context: ClientExpansionContext, onClose: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('New Meeting');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [time, setTime] = useState('10:00');
    const [location, setLocation] = useState('');

    const createICS = () => {
        const start = date.replace(/-/g, '') + 'T' + time.replace(/:/g, '') + '00';
        const endNum = parseInt(time.replace(/:/g, '')) + 100;
        const endStr = endNum.toString().padStart(4, '0');
        const end = date.replace(/-/g, '') + 'T' + endStr + '00';

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Bloomx//Bloomx Calendar//EN',
            'BEGIN:VEVENT',
            `UID:${Date.now()}@bloomx.app`,
            `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
            `DTSTART:${start}`,
            `DTEND:${end}`,
            `SUMMARY:${title}`,
            `LOCATION:${location || ''}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        return new File([blob], 'invite.ics', { type: 'text/calendar' });
    }

    const handleCreate = async () => {
        setLoading(true);
        try {
            const eventHtml = `
                <span contenteditable="false" style="color: #0f172a; display: inline-flex; align-items: center; gap: 4px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 2px 6px; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.4; vertical-align: middle; margin: 2px 4px 2px 0; white-space: nowrap;">
                    <span style="font-size: 14px; line-height: 1;">📅</span>
                    <span style="font-weight: 500;">${title}</span>
                    <span style="color: #64748b; font-size: 12px;">(${format(new Date(date), 'MMM do')} @ ${time})</span>
                </span>&nbsp;
            `;

            if (context.execute) {
                context.execute();
            }

            context.onInsertBody?.(eventHtml);

            if (context.uploadAttachment) {
                const file = createICS();
                const attachment = await context.uploadAttachment(file);
                if (attachment) {
                    toast.success('Event inserted with attachment');
                }
            } else {
                toast.success('Event inserted');
            }

            if (!context.execute) {
                onClose();
            }
        } catch (e) {
            toast.error('Error creating event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 flex items-center justify-between bg-muted/20">
                <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    Insert Event
                </h3>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="p-6 space-y-4">
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Event Title</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="flex h-10 w-full rounded-md border px-3 py-2 text-sm bg-background"
                        autoFocus
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="flex h-10 w-full rounded-md border px-3 py-2 text-sm bg-background"
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Time</label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="flex h-10 w-full rounded-md border px-3 py-2 text-sm bg-background"
                        />
                    </div>
                </div>
                <div className="grid gap-2">
                    <label className="text-sm font-medium">Location</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="flex h-10 w-full rounded-md border pl-9 px-3 py-2 text-sm bg-background"
                            placeholder="Add location..."
                        />
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 bg-muted/20 flex justify-end gap-2">
                <button onClick={handleCreate} disabled={loading} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md disabled:opacity-50 flex items-center gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Insert
                </button>
            </div>
        </div>
    );
};

const CalendarInline = ({ context, onClose, args }: { context: ClientExpansionContext, onClose?: () => void, args?: string }) => {
    const [title, setTitle] = useState(args || 'Meeting');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('14:00');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (args) setTitle(args);
    }, [args]);

    const handleInsert = async () => {
        setLoading(true);
        try {
            const eventHtml = `
                <span contenteditable="false" style="color: #0f172a; display: inline-flex; align-items: center; gap: 4px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; padding: 2px 6px; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.4; vertical-align: middle; margin: 2px 4px 2px 0; white-space: nowrap;">
                    <span style="font-size: 14px; line-height: 1;">📅</span>
                    <span style="font-weight: 500;">${title}</span>
                    <span style="color: #64748b; font-size: 12px;">(${date} @ ${time})</span>
                </span>&nbsp;
            `;

            if (context.execute) {
                context.execute();
            }

            context.onInsertBody?.(eventHtml);

            if (context.uploadAttachment) {
                const start = date.replace(/-/g, '') + 'T' + time.replace(/:/g, '') + '00';
                const endNum = parseInt(time.replace(/:/g, '')) + 100;
                const endStr = endNum.toString().padStart(4, '0');
                const end = date.replace(/-/g, '') + 'T' + endStr + '00';
                const ics = [
                    'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
                    `UID:${Date.now()}@bloomx.app`, `SUMMARY:${title}`,
                    `DTSTART:${start}`, `DTEND:${end}`,
                    'END:VEVENT', 'END:VCALENDAR'
                ].join('\r\n');

                const file = new File([new Blob([ics])], 'invite.ics', { type: 'text/calendar' });
                await context.uploadAttachment(file);
                toast.success('Inserted with attachment');
            } else {
                toast.success('Inserted');
            }

            if (!context.execute) { // This condition was previously `if (context.execute)` and was moved. The original `else` branch is now the primary path if `context.execute` is not present.
                onClose?.();
            }
        } catch (e) {
            toast.error('Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-3 bg-gray-50 flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <input
                    className="flex-1 text-sm bg-white border rounded px-2 py-1 focus:ring-1 focus:ring-purple-400"
                    placeholder="Event Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
                    autoFocus
                />
            </div>
            <div className="flex items-center gap-2">
                <input type="date" className="text-xs bg-white border rounded px-2 py-1 flex-1" value={date} onChange={(e) => setDate(e.target.value)} />
                <input type="time" className="w-20 text-xs bg-white border rounded px-2 py-1" value={time} onChange={(e) => setTime(e.target.value)} />
                <button onClick={handleInsert} disabled={loading} className="bg-purple-600 text-white text-xs font-medium px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50">
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
                </button>
            </div>
        </div>
    );
}

export const CalendarClientExpansion = ({ context }: { context: ClientExpansionContext }) => {
    const { openModal, closeModal } = useExpansionUI();
    return (
        <button
            onClick={() => openModal(<CalendarCreateModal context={context} onClose={closeModal} />)}
            className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            title="Insert Event"
        >
            <Calendar className="h-4 w-4" />
        </button>
    );
};

export const CalendarClientExpansionDefinition = {
    id: 'core-calendar',
    mounts: [
        {
            point: 'COMPOSER_TOOLBAR',
            Component: CalendarClientExpansion,
            title: 'Insert Event',
            icon: Calendar
        },
        {
            point: 'SLASH_COMMAND',
            Component: CalendarInline,
            slashCommand: {
                key: 'calendar',
                description: 'Insert Calendar Event',
                arguments: 'Event Title'
            }
        },
        {
            point: 'SLASH_COMMAND',
            Component: CalendarInline,
            slashCommand: {
                key: 'cal',
                description: 'Insert Calendar Event',
                arguments: 'Event Title'
            }
        }
    ]
};
