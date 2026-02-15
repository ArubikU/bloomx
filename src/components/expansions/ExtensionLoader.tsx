
import React from 'react';
import { useDomainConfig } from '@/hooks/useDomainConfig';
import { JsonRenderer } from './renderer/JsonRenderer';

interface ExtensionLoaderProps {
    mountPoint: string; // e.g., 'EMAIL_TOOLBAR', 'SETTINGS_TAB'
    context?: any;
    priority?: 'HIGH' | 'LOW' | 'NORMAL';
}

export const ExtensionLoader: React.FC<ExtensionLoaderProps> = ({ mountPoint, context, priority }) => {
    const { extensions, isLoading } = useDomainConfig();

    if (isLoading) return null; // or skeleton

    // Find all mounts matching this point
    const mounts = extensions.flatMap((ext: any) => {
        if (!ext.template || !ext.template.mounts) return [];
        return ext.template.mounts
            .filter((m: any) => m.point === mountPoint)
            .map((m: any) => ({
                ...m,
                extensionId: ext.id,
                overlays: ext.template.overlays // Pass overlays to context
            }));
    });

    // Sort by priority if needed (not implemented deep sort yet)

    return (
        <>
            {mounts.map((mount: any, i: number) => (
                <JsonRenderer
                    key={`${mount.extensionId}-${i}`}
                    component={mount.component}
                    context={{
                        ...context,
                        extensionId: mount.extensionId,
                        overlays: mount.overlays
                    }}
                />
            ))}
        </>
    );
};
