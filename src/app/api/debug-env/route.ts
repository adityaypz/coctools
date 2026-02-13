import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const adminPassword = process.env.ADMIN_PASSWORD;

    return NextResponse.json({
        hasPassword: !!adminPassword,
        passwordLength: adminPassword?.length || 0,
        // Don't expose actual password, just first/last char for debugging
        firstChar: adminPassword?.[0] || null,
        lastChar: adminPassword?.[adminPassword.length - 1] || null,
    });
}
