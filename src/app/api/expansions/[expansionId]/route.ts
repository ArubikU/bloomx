import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ensureCoreExpansions, expansionRegistry } from '@/lib/expansions/server';
import { prisma } from '@/lib/prisma'; // Optional if needed for context fetching

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ expansionId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { expansionId } = await params;

    // Ensure registry is populated
    ensureCoreExpansions();

    const expansion = expansionRegistry.get(expansionId);
    if (!expansion) {
        return NextResponse.json({ error: 'Expansion not found' }, { status: 404 });
    }

    try {
        const body = await req.json();
        // Construct Context
        // The UI should send necessary context (like emailId, content)
        // But for security, we might want to fetch sensitive data on backend if only ID is passed?
        // For now, trust the body context but validate ownership if IDs are used.

        const context = {
            ...body,
            userEmail: session.user.email
        };

        // Execute
        const { DefaultExpansionServices } = await import('@/lib/expansions/services');
        const services = new DefaultExpansionServices();
        // Dispatch Logic
        const action = req.nextUrl.searchParams.get('action');

        // Filter for API intercepts
        const apiIntercepts = expansion.intercepts.filter(i => i.type === 'API');

        let targetIntercept = null;
        if (action) {
            targetIntercept = apiIntercepts.find(i => i.trigger === action);
        } else {
            // Default to first API intercept if available
            targetIntercept = apiIntercepts[0];
        }

        if (!targetIntercept) {
            return NextResponse.json({ error: 'No matching API action found' }, { status: 404 });
        }

        const result = await targetIntercept.execute(context, services);

        if (!result.success) {
            return NextResponse.json({ success: false, message: result.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (error: any) {
        console.error('Expansion Error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Expansion execution failed' }, { status: 500 });
    }
}
