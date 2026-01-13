import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
    const user = await getCurrentUser();
    if (!user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = user.email;

    try {
        const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true }
        });
        if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const [inboxCount, draftsCount, sentCount, trashCount, junkCount, archiveCount] = await Promise.all([
            // Inbox: To me, not deleted, not archived, not junk
            prisma.email.count({
                where: {
                    userId: dbUser.id,
                    folder: 'inbox',
                }
            }),
            // Drafts
            prisma.draft.count({
                where: { from: email } // Drafts seem to rely on 'from' in schema? Let's check schema. 
                // Draft schema doesn't have userId yet?
                // Wait, I didn't update Draft schema.
                // Re-checking Drafts... Drafts usually are personal.
                // Assuming 'from' matches user email is okay for now if Draft doesn't have userId?
                // But strictly speaking better to add userId to Draft too?
                // User requirement was Email and Label explicitly.
                // I will stick to existing logic for Drafts unless I see an issue, 
                // but Drafts schema uses `from`.
                // Actually `Draft` model was shown in schema dump...
                // ...
                // model Draft { ... from String ... no userId ... }
                // So I will leave Drafts as is (based on email) OR add userId to Draft too?
                // Prudent to maintain same pattern. But 'from' is unique enough given correct auth?
                // Let's stick to email for Drafts to minimize scope creep unless broken.
            }),
            // Sent
            prisma.email.count({
                where: { userId: user.id, folder: 'sent' }
            }),
            // Trash
            prisma.email.count({
                where: {
                    userId: user.id,
                    folder: 'trash'
                }
            }),
            // Junk
            prisma.email.count({
                where: { userId: user.id, folder: 'spam' }
            }),
            // Archive
            prisma.email.count({
                where: { userId: user.id, folder: 'archive' }
            })
        ]);

        // Labels with counts
        const labels = await prisma.label.findMany({
            where: { userId: user.id },
            include: {
                _count: {
                    select: { emails: true }
                }
            }
        });

        const labelCounts: Record<string, number> = {};
        labels.forEach(l => {
            labelCounts[l.name.toLowerCase()] = l._count.emails;
        });

        return NextResponse.json({
            counts: {
                inbox: inboxCount,
                drafts: draftsCount,
                sent: sentCount,
                trash: trashCount,
                spam: junkCount,
                archive: archiveCount
            },
            labels: labels.map(l => ({
                name: l.name,
                color: l.color,
                count: l._count.emails
            }))
        });

    } catch (error) {
        console.error('Failed to fetch counts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
