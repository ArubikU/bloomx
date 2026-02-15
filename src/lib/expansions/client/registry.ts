
// This file is required by tsconfig to be present as a module?
// Or maybe it was deleted but tsconfig still thinks it's there?
// Let's create it as a placeholder or real registry if needed.
// Based on file structure, this might be where we register default extensions.

import { ClientExpansion } from "./types";

const registry: Map<string, ClientExpansion> = new Map();


export const clientExpansionRegistry = {
    register: (expansion: ClientExpansion) => {
        registry.set(expansion.id, expansion);
    },
    get: (id: string) => registry.get(id),
    getAll: () => Array.from(registry.values()),
    getByMountPoint: (point: string) => {
        const expansions = Array.from(registry.values());
        const mounts: any[] = [];
        for (const exp of expansions) {
            if (exp.mounts) {
                for (const mount of exp.mounts) {
                    if (mount.point === point) {
                        mounts.push({ ...mount, expansionId: exp.id });
                    }
                }
            }
        }
        return mounts;
    }
};

export function registerClientExpansion(expansion: ClientExpansion) {
    registry.set(expansion.id, expansion);
}

export function getClientExpansion(id: string): ClientExpansion | undefined {
    return registry.get(id);
}

export function getAllClientExpansions(): ClientExpansion[] {
    return Array.from(registry.values());
}
