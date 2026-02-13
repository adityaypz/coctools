import { NextRequest, NextResponse } from "next/server";
import { runAirdropScraper } from "@/lib/airdrop-scraper";

/**
 * Admin API endpoint to manually trigger airdrop scraper
 * POST /api/admin/scrape-airdrops
 */

function checkPassword(request: NextRequest): boolean {
    const password = request.headers.get("x-admin-password");
    return password === process.env.ADMIN_PASSWORD;
}

export async function POST(request: NextRequest) {
    // Check admin authentication
    if (!checkPassword(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        console.log("🚀 Starting manual airdrop scraper...");
        const stats = await runAirdropScraper();

        return NextResponse.json({
            success: true,
            stats: {
                timestamp: stats.timestamp,
                duration: `${(stats.duration / 1000).toFixed(1)}s`,
                scraped: stats.scraped,
                matched: stats.matched,
                updated: stats.updated,
                skipped: stats.skipped,
                errors: stats.errors,
            },
        });
    } catch (error) {
        console.error("Scraper error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
