import { useState, useEffect } from 'react';
import { ExpansionTrigger } from '@/lib/expansions/types';

export interface ExpansionMeta {
    id: string;
    name: string;
    description: string;
    icon?: string;
    type: string;
    ui?: Array<{
        label: string;
        icon: string;
        location: string;
        variant?: string;
    }>;
}

export function useExpansions(trigger: ExpansionTrigger) {
    const [expansions, setExpansions] = useState<ExpansionMeta[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchExpansions() {
            try {
                const res = await fetch(`/api/expansions?trigger=${trigger}`);
                if (res.ok) {
                    const data = await res.json();
                    setExpansions(data);
                }
            } catch (error) {
                console.error('Failed to fetch expansions', error);
            } finally {
                setLoading(false);
            }
        }
        fetchExpansions();
    }, [trigger]);

    return { expansions, loading };
}
