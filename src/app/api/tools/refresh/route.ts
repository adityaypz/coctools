import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { fetchMetadata } from "@/lib/metadata";
import { inferCategories } from "@/lib/categorize";

export const dynamic = "force-dynamic";

function checkPassword(request: Request): boolean {
    const pw = request.headers.get("x-admin-password");
    return pw === process.env.ADMIN_PASSWORD;
}

/**
 * POST /api/tools/refresh — re-fetch metadata for an existing tool.
 * Body: { id: string }
 */
export async function POST(request: Request) {
    if (!checkPassword(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await request.json();
        if (!id || typeof id !== "string") {
            return NextResponse.json({ error: "id is required" }, { status: 400 });
        }

        const tool = await prisma.tool.findUnique({ where: { id } });
        if (!tool) {
            return NextResponse.json({ error: "Tool not found" }, { status: 404 });
        }

        // Re-fetch metadata
        const meta = await fetchMetadata(tool.url);
        const categories = inferCategories(meta.title, meta.description, tool.domain);

        const updated = await prisma.tool.update({
            where: { id },
            data: {
                name: meta.title,
                description: meta.description,
                imageUrl: meta.imageUrl,
                faviconUrl: meta.faviconUrl,
                canonicalUrl: meta.canonicalUrl,
                categories: tool.categories.length > 0 && tool.categories[0] !== "Other"
                    ? tool.categories // keep manually set categories
                    : categories,    // only overwrite if was auto-inferred "Other"
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Refresh error:", error);
        return NextResponse.json({ error: "Failed to refresh" }, { status: 500 });
    }
}
