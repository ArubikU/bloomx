import { cookies, headers } from "next/headers";
import { signJWT, verifyJWT, COOKIE_NAME } from "./jwt";
import { prisma } from "./prisma";

export async function setSessionCookie(payload: any) {
    const token = await signJWT(payload);
    (await cookies()).set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    });
    return token; // Return token for client-side storage
}

export async function getSessionCookie() {
    const cookieStore = await cookies();
    let token = cookieStore.get(COOKIE_NAME)?.value;

    // Check Authorization Header if Cookie is missing or as override
    if (!token) {
        const headersList = await headers();
        const authHeader = headersList.get("authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }
    }

    if (!token) return null;
    return await verifyJWT(token);
}

export async function clearSessionCookie() {
    (await cookies()).delete(COOKIE_NAME);
}

export async function getCurrentUser() {
    const session = await getSessionCookie();
    if (!session || !session.sub) return null;

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.sub as string },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
            }
        });
        return user;
    } catch (error) {
        return null;
    }
}
