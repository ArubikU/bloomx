import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { verifyJWT, COOKIE_NAME } from "@/lib/jwt";

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 1. Define public paths (login, register, api auth routes, static files)
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/api/auth') || // Allow all auth routes
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static')
    ) {
        return NextResponse.next();
    }

    try {
        // 2. Manual Token Verification
        const token = req.cookies.get(COOKIE_NAME)?.value;

        if (!token) {
            throw new Error("No token found");
        }

        const payload = await verifyJWT(token);

        if (!payload) {
            throw new Error("Invalid token");
        }

        // 3. Authorized
        return NextResponse.next();

    } catch (error) {
        // console.error(`[MIDDLEWARE-ERROR] Token Verification Failed:`, error);
        // On error, also redirect to login
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("callbackUrl", req.url);
        return NextResponse.redirect(url);
    }
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
