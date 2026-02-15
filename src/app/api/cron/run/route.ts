import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
// import { ensureCoreExpansions, expansionRegistry } from '@/lib/expansions/server';
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

    // 2. Execute Crons
    // Local expansions removed.
    console.log(`[Cron] Local expansions removed. Updates via backend.`);

    // Placeholder results
    // const results = [];

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

    return NextResponse.json({ success: true, results: [] });
}
