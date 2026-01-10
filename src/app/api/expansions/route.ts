import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ensureCoreExpansions, expansionRegistry } from '@/lib/expansions/server';
import { ExpansionTrigger } from '@/lib/expansions/types';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const trigger = searchParams.get('trigger');
    ensureCoreExpansions();

    let expansions = expansionRegistry.getAll();

    if (trigger) {
        // manually filter by intercepts
        expansions = expansions.filter(e =>
            e.intercepts.some(i => i.trigger === trigger)
        );
    }

    // Return only metadata safe for frontend
    const metadata = expansions.map(e => ({
        id: e.id,
        name: e.name,
        description: e.description,
        icon: e.icon,
        intercepts: e.intercepts.map(i => ({ type: i.type, trigger: i.trigger }))
    }));

    return NextResponse.json(metadata);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const trigger = searchParams.get('trigger');

    if (!trigger) {
        return NextResponse.json({ error: 'Trigger required' }, { status: 400 });
    }

    ensureCoreExpansions();

    // Find expansion that handles this trigger with API type
    const expansions = expansionRegistry.getAll();
    const handler = expansions
        .flatMap(e => e.intercepts)
        .find(i => i.trigger === trigger && i.type === 'API');

    if (!handler) {
        return NextResponse.json({ error: 'Handler not found' }, { status: 404 });
    }

    try {
        const body = await req.json();

        // Context construction with payload
        // Context construction with payload
        const context: any = {
            userId: (session.user as any).id,
            userEmail: session.user.email,
            ...body // Flatten body into context
        };

        // Initialize services
        // Use require to avoid circular dependency issues at top-level if any, though here it's likely fine.
        // Better to import DefaultExpansionServices properly.
        const { DefaultExpansionServices } = require('@/lib/expansions/services');
        const services = new DefaultExpansionServices();

        const result = await handler.execute(context, services);
        return NextResponse.json(result);

    } catch (e: any) {
        return NextResponse.json({ success: false, message: e.message || 'Internal Server Error' }, { status: 500 });
    }
}


