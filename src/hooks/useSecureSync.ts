import { useState, useEffect, useCallback } from 'react';
import { secureRead, secureWrite } from '@/lib/expansions/client/secure-storage';

export function useSecureSync<T>(key: string, initialValue: T, userId: string = 'default-user'): [T, (value: T) => void] {
    const [state, setState] = useState<T>(initialValue);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from storage on mount
    useEffect(() => {
        let mounted = true;
        secureRead(key, userId).then((val) => {
            if (mounted && val !== null) {
                setState(val);
            }
            if (mounted) setIsLoaded(true);
        });
        return () => { mounted = false; };
    }, [key, userId]);

    // Sync to storage on change
    // We wrap secureWrite to avoid race conditions with initial load?
    // Actually, only write if loaded or if user explicitly sets it.

    const setSecureState = useCallback((newValue: T) => {
        setState(newValue);
        // Fire and forget write
        secureWrite(key, newValue, userId).catch(console.error);
    }, [key, userId]);

    return [state, setSecureState];
}
