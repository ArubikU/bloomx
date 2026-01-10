import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const labels = await prisma.label.findMany({
        where: { userId: user.id },
        orderBy: { name: 'asc' }
    });

    return NextResponse.json(labels);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { name, color, aliasSuffix, filterRegex } = body;

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const label = await prisma.label.create({
            data: {
                name,
                color: color || '#6366f1',
                aliasSuffix,
                filterRegex,
                userId: user.id
            }
        });

        return NextResponse.json(label);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create label' }, { status: 500 });
    }
}
