
'use client';

import { useEffect } from 'react';
import { useDomainConfig } from '@/hooks/useDomainConfig';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { config } = useDomainConfig();

    useEffect(() => {
        if (!config?.theme) return;

        const root = document.documentElement;
        const theme = config.theme;

        // Core Colors
        root.style.setProperty('--color-primary', theme.primaryColor || '#000000');
        root.style.setProperty('--color-primary-foreground', theme.primaryForeground || '#ffffff');

        root.style.setProperty('--color-secondary', theme.secondaryColor || '#ffffff');
        root.style.setProperty('--color-secondary-foreground', theme.secondaryForeground || '#000000');

        root.style.setProperty('--color-accent', theme.accentColor || '#4f46e5');
        root.style.setProperty('--color-accent-foreground', theme.accentForeground || '#ffffff');

        root.style.setProperty('--color-background', theme.backgroundColor || '#f9fafb');
        root.style.setProperty('--color-foreground', theme.textColor || '#111827');

        // Extended Colors (with defaults if not provided)
        root.style.setProperty('--color-muted', theme.mutedColor || '#f3f4f6'); // gray-100
        root.style.setProperty('--color-muted-foreground', theme.mutedForeground || '#6b7280'); // gray-500

        root.style.setProperty('--color-card', theme.cardColor || '#ffffff');
        root.style.setProperty('--color-card-foreground', theme.cardForeground || '#111827');

        root.style.setProperty('--color-popover', theme.popoverColor || '#ffffff');
        root.style.setProperty('--color-popover-foreground', theme.popoverForeground || '#111827');

        root.style.setProperty('--color-border', theme.borderColor || '#e5e7eb'); // gray-200
        root.style.setProperty('--color-input', theme.inputColor || '#e5e7eb');
        root.style.setProperty('--color-ring', theme.ringColor || theme.primaryColor || '#000000');

        // Radius
        if (theme.radius) {
            root.style.setProperty('--radius', `${theme.radius}rem`);
        }

        // Typography
        const titleFont = theme.titleFont || 'Inter';
        const bodyFont = theme.bodyFont || 'Inter';

        root.style.setProperty('--font-title', titleFont);
        root.style.setProperty('--font-body', bodyFont);

        // Inject global font override
        root.style.setProperty('font-family', bodyFont); // fallback for root


    }, [config]);

    return <>{children}</>;
}
