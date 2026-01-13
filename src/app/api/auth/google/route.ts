import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/callback/google`;

    if (!GOOGLE_CLIENT_ID) {
        return NextResponse.json({ error: "Google Client ID not configured" }, { status: 500 });
    }

    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: "openid email profile https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/calendar.events",
        access_type: "offline",
        prompt: "consent",
    });

    return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
