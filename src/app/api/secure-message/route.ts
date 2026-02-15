import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { uploadToStorage, getSignedDownloadUrl } from '@/lib/storage'; // Assuming this exists per services.ts reference
import { encrypt } from '@/lib/encryption';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { content, subject } = body;

        // 1. Generate ID and secure payload
        const id = uuidv4();
        const payload = JSON.stringify({
            subject,
            content,
            sender: user.email,
            createdAt: new Date().toISOString()
        });

        // 2. Encrypt locally before storage (Double encryption, why not?)
        // Actually encryption.ts uses a server key. Storage might be public/private.
        // Let's encrypt it so even if storage is leaked, it's safe without the app key.
        const encryptedPayload = encrypt(payload);

        // 3. Upload
        // We assume 'bloomx-secure' bucket or prefix
        await uploadToStorage(`secure/${id}.msg`, encryptedPayload, 'text/plain');

        // 4. Construct URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bloomx.arubik.dev';
        const viewUrl = `${baseUrl}/secure/${id}`;

        return NextResponse.json({ success: true, viewUrl });

    } catch (e) {
        console.error('Secure Message Error', e);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
