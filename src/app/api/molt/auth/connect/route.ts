import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createMoltToken } from '@/lib/molt-auth';
import { compare } from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, secret } = body;

        // 1. Validate Secret (Optional extra layer)
        if (process.env.MOLT_CONNECT_SECRET && secret !== process.env.MOLT_CONNECT_SECRET) {
            return NextResponse.json({ error: 'Invalid connect secret' }, { status: 403 });
        }

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
        }

        // 2. Validate User
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.password) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isValid = await compare(password, user.password);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // 3. Generate Tokens
        const tokens = await createMoltToken(user.id);

        return NextResponse.json({
            success: true,
            user: { id: user.id, email: user.email, name: user.name },
            ...tokens
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
