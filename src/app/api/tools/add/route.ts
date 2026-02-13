import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeUrl, extractDedupeKey, extractDomain } from "@/lib/url-utils";
import { fetchMetadata } from "@/lib/metadata";
import { inferCategories } from "@/lib/categorize";
import { generateSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

function checkPassword(request: Request): boolean {
    const pw = request.headers.get("x-admin-password");
    return pw === process.env.ADMIN_PASSWORD;
}

/**
 * POST /api/tools/add — add a single tool by URL.
 * Body: { url: string }
 */
export async function POST(request: Request) {
    if (!checkPassword(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { url } = await request.json();
        if (!url || typeof url !== "string") {
            return NextResponse.json({ error: "url is required" }, { status: 400 });
        }

        const normalized = normalizeUrl(url);
        const { domain, pathKey } = extractDedupeKey(normalized);

        // Check for existing
        const existing = await prisma.tool.findUnique({
            where: { domain_pathKey: { domain, pathKey } },
        });
        if (existing) {
            return NextResponse.json(
                { error: `Tool already exists: ${existing.name}`, tool: existing },
                { status: 409 }
            );
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

        const tool = await prisma.tool.create({
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
                source: "manual",
            },
        });

        return NextResponse.json(tool, { status: 201 });
    } catch (error) {
        console.error("Add tool error:", error);
        return NextResponse.json({ error: "Failed to add tool" }, { status: 500 });
    }
}
