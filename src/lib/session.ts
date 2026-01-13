import { cookies } from "next/headers";
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
}

export async function getSessionCookie() {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
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
