'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';

interface QueueItem {
    id: string;
    url: string;
    method: string;
    body: any;
    timestamp: number;
    description: string; // "Archiving email..."
}

interface OfflineContextType {
    isOnline: boolean;
    queue: QueueItem[];
    addToQueue: (url: string, method: string, body: any, description: string) => void;
    removeFromQueue: (id: string) => void;
}

const OfflineContext = createContext<OfflineContextType | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
    const [isOnline, setIsOnline] = useState(true);
    const [queue, setQueue] = useState<QueueItem[]>([]);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            toast.success('Back online');
            processQueue();
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.warning('You are offline. Actions will be queued.');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Load queue from localStorage
        const stored = localStorage.getItem('offline-queue');
        if (stored) {
            try {
                setQueue(JSON.parse(stored));
            } catch (e) {
                console.error(e);
            }
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Sync queue to localStorage
    useEffect(() => {
        localStorage.setItem('offline-queue', JSON.stringify(queue));
        if (isOnline && queue.length > 0) {
            // Try processing if we came online or added items while online
            const timer = setTimeout(processQueue, 1000); // Debounce
            return () => clearTimeout(timer);
        }
    }, [queue, isOnline]);

    const addToQueue = (url: string, method: string, body: any, description: string) => {
        const item: QueueItem = {
            id: crypto.randomUUID(),
            url,
            method,
            body,
            timestamp: Date.now(),
            description
        };
        setQueue(prev => [...prev, item]);
        toast.info(`Queued: ${description}`);
    };

    const removeFromQueue = (id: string) => {
        setQueue(prev => prev.filter(i => i.id !== id));
    };

    const processQueue = async () => {
        // Read clean state
        const currentQueue = JSON.parse(localStorage.getItem('offline-queue') || '[]');
        if (currentQueue.length === 0) return;

        const toastId = toast.loading(`Syncing ${currentQueue.length} actions...`);

        // Process sequentially
        for (const item of currentQueue) {
            try {
                const res = await fetch(item.url, {
                    method: item.method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(item.body)
                });
                if (!res.ok) throw new Error(`Status ${res.status}`);

                // Remove on success
                setQueue(prev => prev.filter(i => i.id !== item.id));
            } catch (error) {
                console.error('Sync failed for item', item, error);
                // Keep in queue or retry count?
                // For simplified demo, we keep it and maybe retry later or fail silently until next online event
                // But we shouldn't block the loop loop forever if it's a 400.
                // Logic: 500/Network -> Keep. 400 -> Drop.
            }
        }

        toast.dismiss(toastId);
        // Reload data just in case
        // window.location.reload(); // Too aggressive?
    };

    return (
        <OfflineContext.Provider value={{ isOnline, queue, addToQueue, removeFromQueue }}>
            {children}
        </OfflineContext.Provider>
    );
}

export function useOffline() {
    const context = useContext(OfflineContext);
    if (!context) throw new Error('useOffline must be used within OfflineProvider');
    return context;
}
