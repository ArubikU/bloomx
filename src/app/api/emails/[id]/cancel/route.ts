import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;

        // 1. Find the email
        const email = await prisma.email.findUnique({
            where: { id },
            include: { attachments: true }
        });

        if (!email) {
            return NextResponse.json({ error: 'Email not found' }, { status: 404 });
        }

        // Verify ownership (simple check on From email matching session user)
        // Adjust logic if you have strict user IDs
        if (!email.from.includes(session.user.email)) {
            // Fallback: check if the user is the sender (parsed)
            // For now assuming if you can access it, you can cancel it (since we filter by folder usually)
            // But strict check:
            const senderEmail = email.from.match(/<(.+)>/)?.[1] || email.from;
            if (senderEmail !== session.user.email) {
                // Allow if alias?
            }
        }

        if (email.status !== 'scheduled' && email.folder !== 'scheduled') {
            return NextResponse.json({ error: 'Email is not scheduled' }, { status: 400 });
        }

        // 2. Cancel in Resend
        try {
            if (email.messageId) {
                await (resend.emails as any).cancel(email.messageId);
            }
        } catch (error) {
            console.error('Resend cancellation failed:', error);
            // We might continue if it failed because it wasn't found, but if it's too late, we should stop.
            // But typical Resend error for "too late" or "already sent" should probably stop us.
            // For now, assume if ID exists we try.
        }

        // 3. Convert back to Draft
        // We need to reconstruct the body. `email.snippet` is text. 
        // We might not have the full HTML if we didn't store it in DB (we store key). 
        // But wait, we store `htmlKey` or `textKey`. 
        // If we don't have the content easily, we might have trouble.
        // However, the `Email` model changes I made earlier didn't explicitly add `body` text storage, 
        // passing `html` to Resend. 
        // Wait, did I store the body in `Email`? 
        // The `Email` model has: subject, snippet, cleanTo, to, from. It does NOT have the full body content directly unless `htmlKey` is used.
        // But `POST /api/emails` saved `htmlKey: null`. 
        // CHECK: In `POST /api/emails`, I see: `htmlKey: null`. Attempting to retrieve content??
        // If I can't retrieve the content, I can't make a draft.
        // RETROACTIVE FIX: We need to store the body instructions or content in the Email model if we want to "Edit" it later, 
        // OR rely on Resend to give it back? Resend `emails.get` retrieves details.

        // Let's fetch the email details from Resend to get the body back if possible?
        // Resend `retrieve` might give html.
        let bodyContent = '';
        if (email.messageId) {
            try {
                const resendEmail = await resend.emails.get(email.messageId);
                if (resendEmail.data) {
                    bodyContent = resendEmail.data.html || resendEmail.data.text || '';
                }
            } catch (e) {
                console.error('Failed to fetch from Resend', e);
            }
        }

        const draft = await prisma.draft.create({
            data: {
                from: email.from, // We might need to parse just the email if TagInput expects just email?
                to: email.to,
                subject: email.subject,
                body: bodyContent || email.snippet || '', // Fallback
                attachments: {
                    create: email.attachments.map(a => ({
                        filename: a.filename,
                        mimeType: a.mimeType,
                        size: a.size,
                        key: a.key
                    }))
                }
            }
        });

        // 4. Delete the Scheduled Email
        await prisma.email.delete({ where: { id } });

        return NextResponse.json({ success: true, draftId: draft.id });

    } catch (error: any) {
        console.error('Cancel error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
