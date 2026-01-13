import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: NextRequest) {
    const user = await getCurrentUser();

    if (!user) {
        return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
}
