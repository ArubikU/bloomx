
'use client';

import { useEffect } from 'react';
import { useDomainConfig } from '@/hooks/useDomainConfig';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { config } = useDomainConfig();

    useEffect(() => {
        if (!config?.theme) return;

        const root = document.documentElement;

        // Helper to convert hex to rgb (optional, for potential tailwind opacity support later)
        // For now sticking to direct hex values in variables

        root.style.setProperty('--primary-color', config.theme.primaryColor || '#000000');
        root.style.setProperty('--secondary-color', config.theme.secondaryColor || '#ffffff');
        root.style.setProperty('--background-color', config.theme.backgroundColor || '#f9fafb');
        root.style.setProperty('--text-color', config.theme.textColor || '#111827');
        root.style.setProperty('--accent-color', config.theme.accentColor || '#4f46e5');

    }, [config]);

    return <>{children}</>;
}
