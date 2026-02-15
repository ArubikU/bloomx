
import { NextResponse } from "next/server";
import { verifyManagerSession } from "@/lib/manager-auth";

export async function GET(req: Request) {
    const manager = await verifyManagerSession(req as any);
    if (!manager) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.bloomx.arubik.dev';
        const cookieStore = req.headers.get("cookie") || "";

        const res = await fetch(`${backendUrl}/api/admin/domain`, {
            headers: { 'Cookie': cookieStore }
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const manager = await verifyManagerSession(req as any); // Type cast if needed

    if (!manager) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.bloomx.arubik.dev';

        // We need to forward the auth cookie manually since we are proxying
        const cookieStore = req.headers.get("cookie") || "";

        const res = await fetch(`${backendUrl}/api/admin/domain`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookieStore // Forward auth_session
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error("[ADMIN_DOMAIN_PROXY]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
