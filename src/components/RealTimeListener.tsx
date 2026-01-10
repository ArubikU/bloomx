'use client';

import { useEffect } from 'react';
import { useCache } from '@/contexts/CacheContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function RealTimeListener() {
    const { setData } = useCache();
    const router = useRouter();

    useEffect(() => {
        const eventSource = new EventSource('/api/sse');

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'NEWMESSAGE') {
                    // 1. Notify User
                    toast.info('New message received!', {
                        action: {
                            label: 'Refresh',
                            onClick: () => window.location.reload()
                        }
                    });

                    // 2. Invalidate/Refresh Logic
                    // We can't easily force fetching from here without context exposure, 
                    // BUT we can update cache to trigger reactivity if we knew the new data.
                    // Since we don't, we just trigger a router refresh or invalidate

                    // Simple: Play notification sound? (optional)

                    // Trigger global refresh via Router
                    router.refresh();

                    // Trigger Sidebar refresh?
                    // Sidebar polls, but we can maybe nudge it if we had a global signal.
                    // For now, Router Refresh + Toast is good.
                }
            } catch (e) {
                console.error('SSE Parse Error', e);
            }
        };

        eventSource.onerror = (e) => {
            console.error('SSE Error', e);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [router]);

    return null;
}
