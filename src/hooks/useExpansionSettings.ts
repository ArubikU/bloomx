import { useState, useCallback, useEffect, useRef } from 'react';
import { useCache } from '@/contexts/CacheContext';

export function useExpansionSettings(expansionId: string) {
    const { getData, setData } = useCache();
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Key for storing the FULL settings object in cache to count avoid DB hits
    // We namespace it to avoid collision with other keys
    const CACHE_KEY_ALL = 'system:expansion-settings-full';

    const loadedRef = useRef(false);

    const loadSettings = useCallback(async (force = false) => {
        if (!force && (loading && loadedRef.current)) return;
        setLoading(true);
        try {
            // 1. Try Cache First (Full Object)
            let fullSettings = await getData<any>(CACHE_KEY_ALL);

            // 2. If missing, fetch from API (DB)
            if (!fullSettings || force) {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const json = await res.json();
                    fullSettings = json.expansionSettings || {};
                    // Update Cache
                    await setData(CACHE_KEY_ALL, fullSettings);
                }
            }

            // 3. Extract specific settings
            if (fullSettings) {
                setSettings(fullSettings[expansionId] || {});
            }
            loadedRef.current = true;
        } catch (e) {
            console.error("Failed to load expansion settings", e);
        } finally {
            setLoading(false);
        }
    }, [expansionId, getData, setData]);

    useEffect(() => {
        if (!loadedRef.current) {
            loadSettings();
        }
    }, [loadSettings]);

    const saveSettings = useCallback(async (newSettings: any) => {
        try {
            setSaving(true);
            // 1. Get current Full Settings (Cache or API)
            let fullSettings = await getData<any>(CACHE_KEY_ALL) || {};

            // If we suspect cache is stale, we might want to fetch fresh API first?
            if (Object.keys(fullSettings).length === 0) {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const json = await res.json();
                    fullSettings = json.expansionSettings || {};
                }
            }

            // 2. Merge
            const updatedFull = {
                ...fullSettings,
                [expansionId]: newSettings
            };

            // 3. Update Cache Immediate (Optimistic)
            await setData(CACHE_KEY_ALL, updatedFull);
            setSettings(newSettings);

            // 4. Persist to DB
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expansionSettings: updatedFull })
            });

        } catch (e) {
            console.error("Failed to save settings", e);
            throw e;
        } finally {
            setSaving(false);
        }
    }, [expansionId, getData, setData]);

    return {
        settings,
        saveSettings,
        loading,
        saving,
        refresh: loadSettings
    };
}
