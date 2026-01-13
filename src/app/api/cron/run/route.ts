import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { ensureCoreExpansions, expansionRegistry } from '@/lib/expansions/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Check Rate Limiting / Debounce via User Settings
    const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, expansionSettings: true }
    });

    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const settings: any = dbUser.expansionSettings || {};
    const lastRun = settings.lastCronRun ? new Date(settings.lastCronRun) : new Date(0);
    const now = new Date();

    // Default Interval: 1 Hour (3600000 ms)
    // We can make this configurable per user later
    const INTERVAL = 60 * 60 * 1000;

    if (now.getTime() - lastRun.getTime() < INTERVAL) {
        return NextResponse.json({ skipped: true, reason: 'Too soon' });
    }

    // 2. Execute Crons
    ensureCoreExpansions();

    // Lazy load services
    const { DefaultExpansionServices } = await import('@/lib/expansions/services');
    const services = new DefaultExpansionServices();

    const context = {
        userId: dbUser.id,
        userEmail: user.email
    };

    const cronHooks = expansionRegistry.getAll()
        .flatMap(e => e.intercepts)
        .filter(i => i.trigger === 'ORGANIZATION_CRON');

    if (cronHooks.length === 0) {
        return NextResponse.json({ skipped: true, reason: 'No cron handlers' });
    }

    // Log the run
    console.log(`[Cron] Executing ${cronHooks.length} hooks for user ${user.id}`);

    const results = await Promise.all(cronHooks.map(async (hook) => {
        try {
            return await hook.execute(context, services as any);
        } catch (e: any) {
            console.error('[Cron] Error', e);
            return { success: false, message: e.message };
        }
    }));

    // 3. Update Last Run
    await prisma.user.update({
        where: { id: user.id },
        data: {
            expansionSettings: {
                ...settings,
                lastCronRun: now.toISOString()
            }
        }
    });

    return NextResponse.json({ success: true, results });
}
