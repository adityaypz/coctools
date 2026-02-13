import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const dbUrl = process.env.DATABASE_URL;

        // Check if DATABASE_URL exists
        if (!dbUrl) {
            return NextResponse.json({
                error: "DATABASE_URL not set",
                hasUrl: false,
            });
        }

        // Try to import Prisma
        let prismaImportError = null;
        try {
            const { PrismaClient } = await import("@prisma/client");
            const prisma = new PrismaClient();

            // Try a simple query
            try {
                await prisma.$connect();
                const count = await prisma.tool.count();
                await prisma.$disconnect();

                return NextResponse.json({
                    success: true,
                    hasUrl: true,
                    urlPrefix: dbUrl.substring(0, 20) + "...",
                    prismaImported: true,
                    connected: true,
                    toolCount: count,
                });
            } catch (queryError) {
                await prisma.$disconnect();
                return NextResponse.json({
                    error: "Database query failed",
                    hasUrl: true,
                    urlPrefix: dbUrl.substring(0, 20) + "...",
                    prismaImported: true,
                    connected: false,
                    queryError: String(queryError),
                });
            }
        } catch (importError) {
            prismaImportError = String(importError);
            return NextResponse.json({
                error: "Prisma import failed",
                hasUrl: true,
                urlPrefix: dbUrl.substring(0, 20) + "...",
                prismaImported: false,
                importError: prismaImportError,
            });
        }
    } catch (error) {
        return NextResponse.json({
            error: "Unexpected error",
            details: String(error),
        });
    }
}
