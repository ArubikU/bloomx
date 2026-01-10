import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFromStorage } from '@/lib/storage';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Treat params as a promise
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params;
        const email = await prisma.email.findUnique({
            where: { id },
            include: {
                labels: true,
                attachments: true
            }
        });

        if (!email) {
            return NextResponse.json({ error: 'Email not found' }, { status: 404 });
        }

        let content = email.snippet || "(No content)";

        // Fetch full content from B2 if available
        if (email.htmlKey) {
            const storedHtml = await getFromStorage(email.htmlKey);
            if (storedHtml) content = storedHtml;
        } else if (email.textKey) {
            const storedText = await getFromStorage(email.textKey);
            if (storedText) content = `<pre>${storedText}</pre>`;
        }

        // Generate signed URLs for attachments
        const attachmentsWithUrls = await Promise.all(email.attachments.map(async (att) => {
            if (att.key) {
                // Determine if we need to sign it or if it's already a public URL (legacy?)
                // Assuming all keys need signing based on storage.ts
                const url = await import('@/lib/storage').then(m => m.getSignedDownloadUrl(att.key));
                return { ...att, url };
            }
            return att;
        }));

        const emailWithSignedAttachments = {
            ...email,
            attachments: attachmentsWithUrls
        };


        return NextResponse.json({
            email: emailWithSignedAttachments,
            content
        });

    } catch (error) {
        console.error('Failed to fetch email:', error);
        return NextResponse.json({ error: 'Failed to fetch email' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Treat params as a promise
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await params; // Await the params
        const body = await req.json();
        const { starred, folder, labelIds, toggleLabelId } = body;

        const updateData: any = {};

        if (typeof starred === 'boolean') {
            updateData.starred = starred;
        }

        if (folder) {
            updateData.folder = folder;
        }

        // Handle full label replacement or toggling single label
        if (labelIds) {
            updateData.labels = {
                set: labelIds.map((lid: string) => ({ id: lid }))
            };
        }

        if (toggleLabelId) {
            // Logic to toggle a specific label would require fetching first, 
            // but Prisma doesn't have a simple "toggle" operator for many-to-many.
            // We'll handle this by fetching the email first.
            const email = await prisma.email.findUnique({
                where: { id },
                include: { labels: true }
            });

            if (email) {
                const hasLabel = email.labels.some(l => l.id === toggleLabelId);
                if (hasLabel) {
                    updateData.labels = {
                        disconnect: { id: toggleLabelId }
                    };
                } else {
                    updateData.labels = {
                        connect: { id: toggleLabelId }
                    };
                }
            }
        }

        const email = await prisma.email.update({
            where: { id },
            data: updateData,
            include: { labels: true }
        });

        return NextResponse.json(email);

    } catch (error) {
        console.error('Failed to update email:', error);
        return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
    }
}
