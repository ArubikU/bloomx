import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // @ts-ignore
        await prisma.account.deleteMany({
            where: {
                userId: user.id,
                provider: 'google'
            }
        });

        return NextResponse.json({ success: true, message: 'Google account unlinked' });
    } catch (error) {
        console.error('Unlink Error:', error);
        return NextResponse.json({ error: 'Failed to unlink account' }, { status: 500 });
    }
}
