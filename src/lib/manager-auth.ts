
import { NextRequest } from "next/server";

export async function verifyManagerSession(req: NextRequest) {
    const sessionCookie = req.cookies.get("auth_session");

    if (!sessionCookie?.value) {
        console.log("[MANAGER_AUTH] No session cookie found");
        return null;
    }

    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://backend.bloomx.arubik.dev' || "http://localhost:3001";
        const res = await fetch(`${backendUrl}/api/auth/me`, {
            headers: {
                Cookie: `auth_session=${sessionCookie.value}`
            }
        });

        if (!res.ok) {
            console.error(`[MANAGER_AUTH] Failed to verify session. Status: ${res.status}`);
            const text = await res.text();
            console.error(`[MANAGER_AUTH] Response: ${text.slice(0, 200)}`);
            return null;
        }

        const data = await res.json();
        return data.user; // Returns manager user object or null
    } catch (error) {
        console.error("[MANAGER_AUTH] Verification failed:", error);
        return null;
    }
}
