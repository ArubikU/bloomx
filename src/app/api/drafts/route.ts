import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// Get all drafts
// Get all drafts for the authenticated user
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const drafts = await prisma.draft.findMany({
            where: { from: user.email },
            orderBy: { updatedAt: 'desc' },
            take: 50,
            include: { attachments: true }
        });
        return NextResponse.json({ drafts });
    } catch (error) {
        console.error('Failed to fetch drafts:', error);
        return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
    }
}

// Create or update draft
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, to, cc, bcc, subject, body: draftBody, attachments } = body;

        let draft;
        if (id) {
            // Update existing draft
            // If attachments provided, we might need to sync them.
            // Simplified: Delete old non-linked ones? Or just add new ones?
            // Usually drafts replace content.
            // For now, let's just create new attachments if passed, but checking duplicates is complex without IDs.
            // Let's assume frontend sends full list of uploaded file metadata.

            // First, update basic fields
            try {
                draft = await prisma.draft.update({
                    where: {
                        id,
                        from: user.email // Ensure ownership
                    },
                    data: {
                        to: to || null,
                        cc: cc || null,
                        bcc: bcc || null,
                        subject: subject || null,
                        body: draftBody || null,
                    },
                });

                // Handle attachments...
                if (attachments && Array.isArray(attachments)) {
                    await prisma.attachment.deleteMany({ where: { draftId: id } });

                    if (attachments.length > 0) {
                        await prisma.attachment.createMany({
                            data: attachments.map((att: any) => ({
                                draftId: id,
                                filename: att.filename,
                                mimeType: att.mimeType || 'application/octet-stream',
                                size: att.size || 0,
                                key: att.key
                            }))
                        });
                    }
                }
            } catch (error: any) {
                if (error?.code === 'P2025') {
                    // Record not found, perhaps deleted. We can't update it.
                    // Return 404 or just succeed nicely to stop client errors?
                    // Returning 404 allows client to know it's gone.
                    return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
                }
                throw error; // Re-throw other errors
            }
        } else {
            // Create new draft
            draft = await prisma.draft.create({
                data: {
                    from: user.email,
                    to: to || null,
                    cc: cc || null,
                    bcc: bcc || null,
                    subject: subject || null,
                    body: draftBody || null,
                    attachments: attachments ? {
                        create: attachments.map((att: any) => ({
                            filename: att.filename,
                            mimeType: att.mimeType || 'application/octet-stream',
                            size: att.size || 0,
                            key: att.key
                        }))
                    } : undefined
                },
            });
        }

        return NextResponse.json({ draft });
    } catch (error) {
        console.error('Failed to save draft:', error);
        return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
    }
}
