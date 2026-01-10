import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resend } from '@/lib/resend';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToStorage } from '@/lib/storage';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get('folder') || 'inbox';
    const q = searchParams.get('q'); // Search query
    const label = searchParams.get('label');
    const page = parseInt(searchParams.get('page') || '1');
    const since = searchParams.get('since'); // Date string ISO
    const limit = 20;
    const skip = (page - 1) * limit;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Ensure core expansions are registered
    // We cannot import directly at top level if registry uses 'require'? 
    // registry.ts uses standard import/export.
    // server.ts uses imports.
    const { ensureCoreExpansions, expansionRegistry } = await import('@/lib/expansions/server');
    ensureCoreExpansions();


    // Fetch User ID
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Lazy Unsnooze: Check for snoozed emails that need to wake up
    // We do this before fetching to ensure data is consistent
    try {
        await prisma.email.updateMany({
            where: {
                userId: user.id,
                folder: 'snoozed',
                scheduledAt: { lte: new Date() }
            },
            data: {
                folder: 'inbox',
                scheduledAt: null
            }
        });
    } catch (e) {
        console.error("Failed to unsnooze", e);
    }

    try {
        const whereObj: any = {
            AND: [
                { userId: user.id } // Force User Isolation
            ]
        };

        if (since) {
            whereObj.AND.push({
                createdAt: { gt: new Date(since) }
            });
        }

        const until = searchParams.get('until');
        if (until) {
            whereObj.AND.push({
                createdAt: { lt: new Date(until) }
            });
        }

        if (q) {
            whereObj.AND.push({
                OR: [
                    { subject: { contains: q, mode: 'insensitive' } },
                    { from: { contains: q, mode: 'insensitive' } },
                    { snippet: { contains: q, mode: 'insensitive' } },
                    { to: { contains: q, mode: 'insensitive' } },
                    { cleanTo: { contains: q, mode: 'insensitive' } }
                ]
            });
        }

        // Advanced Filters
        const fromParam = searchParams.get('from');
        if (fromParam) {
            whereObj.AND.push({ from: { contains: fromParam, mode: 'insensitive' } });
        }

        const hasAttachment = searchParams.get('hasAttachment') === 'true';
        if (hasAttachment) {
            whereObj.AND.push({ attachments: { some: {} } });
        }

        if (label) {
            const labelsList = label.split(',');
            whereObj.AND.push({
                labels: {
                    some: {
                        name: {
                            in: labelsList,
                            mode: 'insensitive'
                        }
                    }
                },
                folder: { notIn: ['trash', 'spam'] } // Explicitly exclude trash/spam from label views
            });
        } else if (!q) {
            // Only filter by folder if no label is selected and not searching globally
            // (or maybe search should be within folder? Usually Gmail global search ignores folder unless specified)
            // Let's make search global (ignore folder) if q is present, unless we want "in:sent" etc support later.
            // For now: Global search if q present.
            if (folder) {
                whereObj.AND.push({ folder });
            }
        } else {
            // If searching (q exists), we generally want to search ALL folders, 
            // but usually except Trash/Spam unless specified.
            // For simplicity, let's search everything for now, or exclude trash/spam.
            whereObj.AND.push({
                folder: { notIn: ['trash', 'spam'] }
            });
        }

        const emails = await prisma.email.findMany({
            where: whereObj,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                attachments: true,
                labels: true // Include labels in response
            }
        });

        console.log(`[GET /api/emails] Folder: ${folder}, Q: ${q}, Found: ${emails.length}`);
        if (folder === 'trash') {
            console.log(`[GET /api/emails] Trash IDs:`, emails.map(e => e.id));
        }

        const count = await prisma.email.count({ where: whereObj });

        return NextResponse.json({ emails, total: count, page, pages: Math.ceil(count / limit) });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
    }
}
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { to, subject, html, text, from, cc, bcc, attachments, scheduledAt } = body;

        // Use authenticated user's credentials
        let senderName = session.user.name || 'User';
        let senderEmail = session.user.email;

        const user = await prisma.user.findUnique({
            where: { email: senderEmail },
            select: { id: true }
        });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Allow overriding ONLY if the domain matches (for aliasing)
        // or just strictly enforce the user's email for now to prevent spoofing
        if (from) {
            // ... existing checks ...
            const fromEmail = from.split('@')[0];
            const sessionEmail = session.user.email.split('@')[0];
            //check the domain is the same
            if (from.split('@')[1] !== session.user.email.split('@')[1]) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            if (fromEmail !== sessionEmail) {
                let cleanedFromEmail = fromEmail.replace(/\./g, '').replace(/\+/g, '');
                let cleanedSessionEmail = sessionEmail.replace(/\./g, '').replace(/\+/g, '');
                if (cleanedFromEmail !== cleanedSessionEmail) {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
            }
        }

        const formattedFrom = `${senderName} <${senderEmail}>`;

        // ----------------------------------------------------
        // MIDDLEWARE: Pre-Send Hooks
        // ----------------------------------------------------
        const { ensureCoreExpansions, expansionRegistry } = await import('@/lib/expansions/server');
        ensureCoreExpansions();

        const preSendHooks = expansionRegistry.getAll()
            .flatMap(e => e.intercepts)
            .filter(i => i.trigger === 'EMAIL_PRE_SEND');

        if (preSendHooks.length > 0) {
            // Lazy load services
            const { DefaultExpansionServices } = await import('@/lib/expansions/services');
            const services = new DefaultExpansionServices();

            const context = {
                userId: user.id,
                userEmail: session.user.email,
                emailContent: html || text || '',
                subject: subject,
                to: to
            };

            for (const hook of preSendHooks) {
                try {
                    const result = await hook.execute(context, services as any);
                    if (result.stop) {
                        return NextResponse.json({
                            error: result.message || 'Blocked by expansion policy',
                            blocked: true
                        }, { status: 400 });
                    }
                } catch (e) {
                    console.error('Expansion Pre-Send Error', e);
                    // Do we block on error? Let's say yes for safety in "DLP" context.
                    return NextResponse.json({ error: 'Security Check Failed' }, { status: 500 });
                }
            }
        }
        // ----------------------------------------------------

        // Prepare attachments for Resend
        const resendAttachments = attachments?.map((att: any) => ({
            filename: att.filename,
            path: att.url,
        }));

        // Wrapper for Resend payload
        // Resend requires at least 'html' or 'text' to be present.
        let finalHtml = html;
        let finalText = text;

        if ((!finalHtml && !finalText) && (attachments && attachments.length > 0)) {
            finalText = '';
        }

        const payload: any = {
            from: formattedFrom,
            to: to.split(','),
            cc: cc ? cc.split(',') : undefined,
            bcc: bcc ? bcc.split(',') : undefined,
            subject: subject,
            html: finalHtml,
            text: finalText,
            attachments: resendAttachments
        };

        if (scheduledAt) {
            payload.scheduledAt = scheduledAt;
        }

        // Send via Resend
        const { data, error } = await resend.emails.send(payload);

        if (error) {
            console.error(error, to);
            return NextResponse.json({ error }, { status: 400 });
        }

        // Upload HTML/Text to Storage for persistence
        // We use the same storage as inbound emails
        const timestamp = Date.now();
        const safeSubject = (subject || 'no-subject').replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);

        let htmlKey = null;
        let textKey = null;

        if (finalHtml) {
            htmlKey = `sent/${session.user.email}/${timestamp}-${safeSubject}.html`;
            await uploadToStorage(htmlKey, Buffer.from(finalHtml), 'text/html');
        }

        if (finalText) {
            textKey = `sent/${session.user.email}/${timestamp}-${safeSubject}.txt`;
            await uploadToStorage(textKey, Buffer.from(finalText), 'text/plain');
        }

        // Save to Sent/Scheduled folder
        const email = await prisma.email.create({
            data: {
                userId: user.id, // Link to User
                from: formattedFrom, // Store in "Name <email>" format
                to: to,
                cleanTo: to.split(',').map((email: string) => { // Use same logic as before or extract helper
                    const [local, domain] = email.trim().toLowerCase().split('@');
                    if (!domain) return email.trim();
                    let cleanLocal = local.replace(/\./g, '');
                    const plusIndex = cleanLocal.indexOf('+');
                    if (plusIndex !== -1) cleanLocal = cleanLocal.substring(0, plusIndex);
                    return `${cleanLocal}@${domain}`;
                }).join(', '),
                subject: subject,
                messageId: data?.id || crypto.randomUUID(),
                snippet: finalText ? finalText.substring(0, 200) : '',
                htmlKey: htmlKey,
                textKey: textKey,
                // Determine folder and status
                folder: scheduledAt ? 'scheduled' : 'sent',
                status: scheduledAt ? 'scheduled' : 'sent',
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                read: true,
                attachments: {
                    create: attachments?.map((att: any) => ({
                        filename: att.filename,
                        mimeType: att.mimeType || 'application/octet-stream',
                        size: att.size || 0,
                        key: att.key
                    }))
                }
            }
        });

        // ----------------------------------------------------
        // MIDDLEWARE: Post-Send Hooks (Background)
        // ----------------------------------------------------
        const postSendHooks = expansionRegistry.getAll()
            .flatMap(e => e.intercepts)
            .filter(i => i.trigger === 'EMAIL_POST_SEND');

        if (postSendHooks.length > 0) {
            // Lazy load services (reuse if possible, but new instance is fine)
            const { DefaultExpansionServices } = await import('@/lib/expansions/services');
            const services = new DefaultExpansionServices();

            const context = {
                userId: user.id,
                userEmail: session.user.email,
                emailId: email.id,
                sentEmail: email
            };

            // Fire and forget (don't await loop to return response faster)
            Promise.all(postSendHooks.map(hook =>
                hook.execute(context, services as any).catch(e => console.error('Post-Send Hook Error', e))
            ));
        }
        // ----------------------------------------------------

        return NextResponse.json({ success: true, id: data?.id });

    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
}
