import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;

    const encoder = new TextEncoder();
    let streamClosed = false;

    const stream = new ReadableStream({
        async start(controller) {

            // Initial Check Timestamp
            let lastCheck = new Date();

            const interval = setInterval(async () => {
                if (streamClosed) {
                    clearInterval(interval);
                    return;
                }

                try {
                    // Check for new emails arrived since lastCheck
                    const newEmails = await prisma.email.count({
                        where: {
                            userId: userId,
                            createdAt: { gt: lastCheck },
                            folder: 'inbox' // only notify for inbox
                        }
                    });

                    if (newEmails > 0) {
                        lastCheck = new Date();
                        const data = JSON.stringify({ type: 'NEWMESSAGE', count: newEmails });
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    }
                } catch (e) {
                    console.error('SSE Error:', e);
                }
            }, 5000); // Check every 5s

            // Keep alive packet every 15s to prevent timeout
            const keepAlive = setInterval(() => {
                if (streamClosed) {
                    clearInterval(keepAlive);
                    return;
                }
                const data = JSON.stringify({ type: 'PING' });
                controller.enqueue(encoder.encode(`: ${data}\n\n`)); // Comment style keep-alive
            }, 15000);

            req.signal.addEventListener('abort', () => {
                streamClosed = true;
                clearInterval(interval);
                clearInterval(keepAlive);
                controller.close();
            });
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}
