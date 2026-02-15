
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.bloomx.arubik.dev';

        // Forward request to Backend
        const res = await fetch(`${backendUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        // Debug: Check what backend returned
        const responseText = await res.text();
        console.log("[ADMIN_LOGIN_PROXY] Backend Status:", res.status);
        console.log("[ADMIN_LOGIN_PROXY] Backend Response:", responseText.slice(0, 200)); // Log first 200 chars

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error("[ADMIN_LOGIN_PROXY] Failed to parse backend JSON:", e);
            return NextResponse.json({ error: "Backend returned invalid JSON", details: responseText.slice(0, 100) }, { status: 502 });
        }

        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        // Extract Set-Cookie header from backend response
        const setCookieHeader = res.headers.get('set-cookie');

        // Create response and forward the cookie
        const response = NextResponse.json(data);

        if (setCookieHeader) {
            // We need to pass this cookie to the client.
            // Since we are on the same domain (conceptually, via proxy), we can just set it.
            // However, verify if 'secure' flag needs stripping for localhost 
            // (Backend handles this ideally, but let's just forward the header value)
            response.headers.set('Set-Cookie', setCookieHeader);
        }

        return response;

    } catch (error) {
        console.error("[ADMIN_LOGIN_PROXY]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
