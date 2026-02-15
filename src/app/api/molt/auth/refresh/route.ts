import { NextRequest, NextResponse } from 'next/server';
import { refreshMoltToken } from '@/lib/molt-auth';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { refreshToken } = body;

        if (!refreshToken) {
            return NextResponse.json({ error: 'Missing refresh token' }, { status: 400 });
        }

        const tokens = await refreshMoltToken(refreshToken);

        return NextResponse.json({ success: true, ...tokens });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Invalid refresh token' }, { status: 401 });
    }
}
