import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const { snoozeUntil } = body;

        if (!snoozeUntil) {
            return NextResponse.json({ error: 'snoozeUntil is required' }, { status: 400 });
        }

        // Verify ownership and exists
        const email = await prisma.email.findUnique({
            where: { id },
            select: { userId: true }
        });

        if (!email) {
            return NextResponse.json({ error: 'Email not found' }, { status: 404 });
        }

        // Check ownership? existing code implies userId handling is messy but let's assume we can query by ID
        // Ideally we check User ID match.
        const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
        if (!user || user.id !== email.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const updated = await prisma.email.update({
            where: { id },
            data: {
                folder: 'snoozed',
                scheduledAt: new Date(snoozeUntil)
            }
        });

        return NextResponse.json(updated);

    } catch (error) {
        console.error('Snooze Error', error);
        return NextResponse.json({ error: 'Failed to snooze email' }, { status: 500 });
    }
}
