'use client';

import { useEffect } from 'react';
import { useCache } from '@/contexts/CacheContext';
import { toast } from 'sonner';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/components/SessionProvider';

export function RealTimeListener() {
    const { status } = useSession();
    const { setData } = useCache();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (status !== 'authenticated' || pathname === '/login') return;

        let eventSource: EventSource | null = null;

        // Small delay to ensure redirect is settled and avoid race on login callback
        const timer = setTimeout(() => {
            eventSource = new EventSource('/api/sse');

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'NEWMESSAGE') {
                        toast.info('New message received!', {
                            action: {
                                label: 'Refresh',
                                onClick: () => window.location.reload()
                            }
                        });
                        router.refresh();
                    }
                } catch (e) {
                    console.error('SSE Parse Error', e);
                }
            };

            eventSource.onerror = (e) => {
                console.error('SSE Error', e);
                eventSource?.close();
            };
        }, 1000);

        return () => {
            clearTimeout(timer);
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [router, status, pathname]);

    return null;
}
