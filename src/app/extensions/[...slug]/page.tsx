'use client';

import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { clientExpansionRegistry } from '@/lib/expansions/client/registry';
import { Loader2 } from 'lucide-react';
import { ensureClientExpansions } from '@/lib/expansions/client/core-expansions';

// Ensure expansions are registered
ensureClientExpansions();

interface ExtensionPageProps {
    params: Promise<{ slug: string[] }>;
}

function ExtensionContent({ slug }: { slug: string[] }) {
    // 1. Reconstruct route path (e.g., ["decrypt"] -> "decrypt")
    const routePath = slug.join('/');

    // 2. Find matching extension
    const extensions = clientExpansionRegistry.getByMountPoint('EXTENSION_PAGE');
    const match = extensions.find(ext => ext.routePath === routePath);

    if (!match || !match.Component) {
        return notFound();
    }

    const Component = match.Component;

    // 3. Render
    return <Component context={{}} />;
}

export default async function ExtensionPage({ params }: ExtensionPageProps) {
    const { slug } = await params;

    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>}>
            <ExtensionContent slug={slug} />
        </Suspense>
    );
}
