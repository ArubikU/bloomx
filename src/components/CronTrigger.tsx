'use client';

import { useEffect } from 'react';

export function CronTrigger() {
    useEffect(() => {
        // Function to Ping Cron
        const runCron = async () => {
            // Use navigator.sendBeacon or simple fetch
            // sendBeacon is better for background but we want simple fetch here
            try {
                await fetch('/api/cron/run', { method: 'POST' });
            } catch (e) {
                // Silent fail
            }
        };

        // Run immediately on load
        runCron();

        // Run every 5 minutes
        const interval = setInterval(runCron, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    return null; // Invisible
}
