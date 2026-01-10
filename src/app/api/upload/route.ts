import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToStorage, getSignedDownloadUrl } from '@/lib/storage';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 200MB limit
        if (file.size > 200 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size exceeds 200MB limit' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const timestamp = Date.now();
        // Sanitize filename
        const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `attachments/${session.user.email}/${timestamp}-${safeFilename}`;

        await uploadToStorage(key, buffer, file.type);

        // Generate Proxy URL for the Private Bucket
        let protocol = 'https';
        //curent url
        let host = req.url.split('/api')[0].split('://')[1];


        // If localhost, force http might be needed if SSL not set up locally, but typically Next.js handles relative URLs fine on frontend.
        // However, Editor needs a full URL often, or at least absolute path.
        // Also, for EMAILS sent to others, we MUST use the absolute public URL (ulima.dev).

        if (host.includes('localhost')) protocol = 'http';

        const url = `${protocol}://${host}/api/assets/${key}`;

        if (!url) {
            return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
        }

        return NextResponse.json({
            url,
            key,
            filename: file.name,
            size: file.size,
            mimeType: file.type
        });

    } catch (error) {
        console.error('Upload failed:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
