import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { ids, action } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
        }

        if (action === 'delete') {
            const result = await prisma.draft.deleteMany({
                where: {
                    id: { in: ids },
                    from: session.user.email // Security: Ensure ownership
                }
            });
            return NextResponse.json({ count: result.count });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Failed to batch update drafts:', error);
        return NextResponse.json({ error: 'Failed to update drafts' }, { status: 500 });
    }
}
