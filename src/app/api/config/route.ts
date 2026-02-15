
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    // In production, this call would go to the backend service.
    // For now, we mock it or call the backend URL from env.
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.bloomx.arubik.dev';

    // We need to pass the host header to identify the domain.
    // In Dev/Local, we use TOP_DOMAIN from env to simulate the real domain.
    const host = process.env.TOP_DOMAIN || req.headers.get('host');

    try {
        // Send domain as query param to avoid proxy header stripping issues
        const targetUrl = new URL(`${backendUrl}/api/config`);
        if (host) targetUrl.searchParams.set('domain', host.split(':')[0]);

        const res = await fetch(targetUrl.toString(), {
            headers: {
                'x-forwarded-host': host || '',
                'Cache-Control': 'no-cache'
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            console.error("[CONFIG_PROXY] Backend returned error:", res.status);
            return NextResponse.json({ error: "Backend error" }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);

    } catch (e) {
        console.error("[CONFIG_PROXY] Failed to fetch config:", e);
        return NextResponse.json({ error: "Failed to load config" }, { status: 500 });
    }
}
