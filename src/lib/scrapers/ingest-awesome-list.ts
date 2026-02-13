/**
 * Ingest tools from awesome-list markdown files.
 * Usage: npx tsx scripts/ingest-awesome-list.ts
 *
 * Fetches markdown from configured URLs, parses tool entries,
 * and upserts them as draft tools into the database.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Configure these URLs ──────────────────────────────────────────
const AWESOME_LIST_URLS: string[] = [
    // Add awesome-list raw markdown URLs here, e.g.:
    // "https://raw.githubusercontent.com/some/awesome-list/main/README.md",
];

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
}

function normalizeDomain(url: string): string {
    try {
        const u = new URL(url.startsWith("http") ? url : `https://${url}`);
        return u.hostname.replace(/^www\./, "").toLowerCase();
    } catch {
        return url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].toLowerCase();
    }
}

interface ParsedEntry {
    name: string;
    url: string;
    description: string | null;
}

function parseAwesomeList(markdown: string): ParsedEntry[] {
    const entries: ParsedEntry[] = [];
    const linkRegex = /[-*]\s+\[([^\]]+)\]\(([^)]+)\)\s*[-–—:]?\s*(.*)/g;
    let match;
    while ((match = linkRegex.exec(markdown)) !== null) {
        const name = match[1].trim();
        const url = match[2].trim();
        const description = match[3]?.trim() || null;
        if (url.startsWith("http")) {
            entries.push({ name, url, description });
        }
    }
    return entries;
}

async function main() {
    if (AWESOME_LIST_URLS.length === 0) {
        console.log("No awesome-list URLs configured. Add URLs to AWESOME_LIST_URLS array.");
        return;
    }

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const listUrl of AWESOME_LIST_URLS) {
        console.log(`\n📥 Fetching: ${listUrl}`);

        const res = await fetch(listUrl);
        if (!res.ok) {
            console.log(`   ✗ Failed to fetch (${res.status})`);
            continue;
        }

        const markdown = await res.text();
        const parsed = parseAwesomeList(markdown);
        console.log(`   Found ${parsed.length} links`);

        for (const item of parsed) {
            const domain = normalizeDomain(item.url);

            // Check for duplicate by domain
            const existing = await prisma.tool.findFirst({ where: { domain } });
            if (existing) {
                totalSkipped++;
                continue;
            }

            // Generate unique slug
            let slug = slugify(item.name);
            const slugExists = await prisma.tool.findUnique({ where: { slug } });
            if (slugExists) {
                slug = `${slug}-${Date.now().toString(36)}`;
            }

            await prisma.tool.create({
                data: {
                    name: item.name,
                    slug,
                    url: item.url,
                    domain,
                    pathKey: "",
                    description: item.description || null,
                    categories: [],
                    tags: [],
                    status: "draft",
                    source: "awesome-list",
                },
            });

            totalCreated++;
            process.stdout.write(`   ✓ ${item.name}\n`);
        }
    }

    console.log(`\n✅ Done! Created: ${totalCreated}, Skipped (dupes): ${totalSkipped}`);
    await prisma.$disconnect();
}

main().catch(console.error);
