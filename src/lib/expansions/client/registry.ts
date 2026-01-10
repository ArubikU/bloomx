import { ClientExpansion, ClientExpansionMountPoint } from './types';

class ClientExpansionRegistry {
    private expansions: Map<string, ClientExpansion> = new Map();

    register(expansion: ClientExpansion) {
        this.expansions.set(expansion.id, expansion);
    }

    getByMountPoint(mountPoint: ClientExpansionMountPoint): Array<{ id: string, Component?: React.ComponentType<any>, execute?: any, title?: string, icon?: any, slashCommand?: { key: string, description: string } }> {
        const results: Array<{ id: string, Component?: React.ComponentType<any>, execute?: any, title?: string, icon?: any, slashCommand?: { key: string, description: string } }> = [];

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
                    slashCommand: mount.slashCommand
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
