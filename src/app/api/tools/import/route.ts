import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeUrl, extractDedupeKey } from "@/lib/url-utils";
import { fetchMetadata } from "@/lib/metadata";
import { inferCategories } from "@/lib/categorize";
import { generateSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

function checkPassword(request: Request): boolean {
    const pw = request.headers.get("x-admin-password");
    return pw === process.env.ADMIN_PASSWORD;
}

/**
 * POST /api/tools/import — bulk import tools by URLs.
 * Body: { urls: string[] }
 */
export async function POST(request: Request) {
    if (!checkPassword(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { urls } = await request.json();
        if (!Array.isArray(urls) || urls.length === 0) {
            return NextResponse.json({ error: "urls array is required" }, { status: 400 });
        }

        // Cap at 100 URLs per import
        const batch = urls.slice(0, 100);

        let added = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const rawUrl of batch) {
            if (!rawUrl || typeof rawUrl !== "string") {
                skipped++;
                continue;
            }

            try {
                const normalized = normalizeUrl(rawUrl.trim());
                const { domain, pathKey } = extractDedupeKey(normalized);

                // Dedupe check
                const existing = await prisma.tool.findUnique({
                    where: { domain_pathKey: { domain, pathKey } },
                });
                if (existing) {
                    skipped++;
                    continue;
                }

                // Fetch metadata
                const meta = await fetchMetadata(normalized);
                const categories = inferCategories(meta.title, meta.description, domain);

                // Generate slug
                let slug = generateSlug(meta.title);
                if (!slug) slug = generateSlug(domain);
                const slugExists = await prisma.tool.findUnique({ where: { slug } });
                if (slugExists) {
                    slug = `${slug}-${Date.now().toString(36)}`;
                }

                await prisma.tool.create({
                    data: {
                        name: meta.title,
                        slug,
                        url: normalized,
                        canonicalUrl: meta.canonicalUrl,
                        domain,
                        pathKey,
                        description: meta.description,
                        imageUrl: meta.imageUrl,
                        faviconUrl: meta.faviconUrl,
                        categories,
                        status: "reviewed",
                        source: "import",
                    },
                });

                added++;
            } catch (err) {
                errors.push(`${rawUrl}: ${err instanceof Error ? err.message : "unknown error"}`);
            }
        }

        return NextResponse.json({ added, skipped, errors, total: batch.length });
    } catch (error) {
        console.error("Import error:", error);
        return NextResponse.json({ error: "Import failed" }, { status: 500 });
    }
}
