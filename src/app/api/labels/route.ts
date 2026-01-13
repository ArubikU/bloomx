
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from "@/lib/session";

export async function GET() {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const labels = await prisma.label.findMany({
        where: { userId: user.id },
        orderBy: { name: 'asc' }
    });

    return NextResponse.json(labels);
}

export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { name, color, aliasSuffix, filterRegex } = body;

        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const label = await prisma.label.create({
            data: {
                name,
                color: color || '#6366f1',
                aliasSuffix,
                filterRegex,
                userId: user.id,
            }
        });

        return NextResponse.json(label);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create label' }, { status: 500 });
    }
}
