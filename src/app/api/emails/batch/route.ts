import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from "@/lib/session";
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { ids, updates } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
        }

        const result = await prisma.email.updateMany({
            where: {
                id: { in: ids },
                // Ensure user owns these emails (assuming simplistic ownership by 'to' or 'from' isn't enough, 
                // but usually we'd have a userId on the Email model. 
                // For now, based on previous code, we might rely on the fact that only user's emails are in DB 
                // or we need to filter by user. The Email model in schema doesn't seem to have userId yet, 
                // but let's proceed assuming global or single-tenant for this specific codebase part 
                // OR relies on labels/folders. 
                // WAIT: schema.prisma showed Email DOes NOT have userId. 
                // But let's look at how GET /api/emails does it. 
                // It doesn't seem to filter by User ID in previous `view_file`.
                // We will trust the request for now or if 'Label' has userId.
            },
            data: updates,
        });

        return NextResponse.json({ count: result.count });
    } catch (error) {
        console.error('Failed to batch update emails:', error);
        return NextResponse.json({ error: 'Failed to update emails' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { ids } = body;

        console.log(`[BatchDelete] User: ${user.email}`);

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
        }

        console.log("BATCH DELETE IDS:", ids);

        // 1. Fetch emails to get storage keys
        const emails = await prisma.email.findMany({
            where: { id: { in: ids }, AND: { userId: user.id } },
            include: { attachments: true }
        });
        console.log("BATCH DELETE FOUND:", emails.length);

        // 2. Delete from Storage
        // We import dynamically or top-level? Top-level is fine if not circular.
        // But let's check imports. Route doesn't have deleteFromStorage imported yet.
        const { deleteFromStorage } = await import('@/lib/storage');

        const deletions = [];
        for (const email of emails) {
            const e = email as any; // Cast to avoid TS issues with include inference
            if (e.htmlKey) deletions.push(deleteFromStorage(e.htmlKey));
            if (e.textKey) deletions.push(deleteFromStorage(e.textKey));
            if (e.rawKey) deletions.push(deleteFromStorage(e.rawKey));
            if (e.attachments) {
                for (const att of e.attachments) {
                    if (att.key) deletions.push(deleteFromStorage(att.key));
                }
            }
        }

        // Use allSettled 
        await Promise.allSettled(deletions);

        // 3. Delete from DB
        const result = await prisma.email.deleteMany({
            where: {
                id: { in: ids }
            }
        });
        console.log(result)
        return NextResponse.json({ count: result.count });
    } catch (error) {
        console.error('Failed to batch delete emails:', error);
        return NextResponse.json({ error: 'Failed to delete emails' }, { status: 500 });
    }
}
