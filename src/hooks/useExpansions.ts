import { useState, useEffect } from 'react';
import { fetchExpansions } from '@/lib/expansions/api';

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

export function useExpansions(trigger: string) {
    const [expansions, setExpansions] = useState<ExpansionMeta[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadExpansions() {
            try {
                const data = await fetchExpansions(trigger);
                setExpansions(data);
            } catch (error) {
                console.error('Failed to load expansions', error);
            } finally {
                setLoading(false);
            }
        }
        loadExpansions();
    }, [trigger]);

    return { expansions, loading };
}
