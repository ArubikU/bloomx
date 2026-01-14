import { ClientExpansion, ClientExpansionMountPoint, ExpansionPriority } from './types';

class ClientExpansionRegistry {
    private expansions: Map<string, ClientExpansion> = new Map();

    register(expansion: ClientExpansion) {
        console.log(`[Registry] Registering expansion: ${expansion.id}`);
        this.expansions.set(expansion.id, expansion);
    }

    getByMountPoint(mountPoint: ClientExpansionMountPoint): Array<{ id: string, Component?: React.ComponentType<any>, execute?: any, title?: string, icon?: any, slashCommand?: { key: string, description: string }, routePath?: string, handler?: any, priority?: ExpansionPriority }> {
        const results: Array<{ id: string, Component?: React.ComponentType<any>, execute?: any, title?: string, icon?: any, slashCommand?: { key: string, description: string }, routePath?: string, handler?: any, priority?: ExpansionPriority }> = [];

        const allExpansions = Array.from(this.expansions.values());
        for (let i = 0; i < allExpansions.length; i++) {
            const exp = allExpansions[i];
            const mounts = exp.mounts.filter((m: any) => m.point === mountPoint);

            for (const mount of mounts) {
                results.push({
                    id: exp.id,
                    Component: mount.Component,
                    execute: mount.execute,
                    title: mount.title,
                    icon: mount.icon,
                    slashCommand: mount.slashCommand,
                    routePath: mount.routePath,
                    handler: mount.handler,
                    priority: mount.priority
                });
            }
        }
        return results;
    }

    getAll() {
        return Array.from(this.expansions.values());
    }
}

export const clientExpansionRegistry = new ClientExpansionRegistry();
