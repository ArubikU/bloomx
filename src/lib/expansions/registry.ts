import { Expansion, ExpansionTrigger } from './types';

class ExpansionRegistry {
    private expansions: Map<string, Expansion> = new Map();

    register(expansion: Expansion) {
        // Silent overwrite or skip? 
        // For development HMR, overwrite is good. For Prod, silent is fine.
        // The user complained about spam.
        // Let's just set it.
        this.expansions.set(expansion.id, expansion);
    }

    get(id: string): Expansion | undefined {
        return this.expansions.get(id);
    }

    getAll(): Expansion[] {
        return Array.from(this.expansions.values());
    }

}

// Singleton global instance
export const expansionRegistry = new ExpansionRegistry();
