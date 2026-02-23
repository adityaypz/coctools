import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { generateSlug } from "@/lib/utils";
import { extractDomain, extractDedupeKey, normalizeUrl } from "@/lib/url-utils";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ToolSubmissionSchema = z.object({
    name: z.string().min(1, "Tool name is required").max(200),
    url: z.string().url("Please enter a valid URL"),
    description: z.string().min(20, "Description must be at least 20 characters").max(500),
    category: z.string().min(1, "Please select a category"),
    submittedBy: z.string().email().optional().or(z.literal("")),
    telegramUsername: z
        .string()
        .regex(/^@?[a-zA-Z0-9_]{5,32}$/)
        .optional()
        .or(z.literal("")),
});

export async function POST(req: NextRequest) {
    // Rate limit: 5 submissions per 15 minutes per IP
    const { limited, resetIn } = rateLimit(req);
    if (limited) {
        return NextResponse.json(
            { error: `Too many submissions. Please try again in ${Math.ceil(resetIn / 60000)} minutes.` },
            { status: 429 }
        );
    }

    try {
        const body = await req.json();

        // Validate input
        const validationResult = ToolSubmissionSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Invalid input", details: validationResult.error.issues },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Normalize URL and extract domain/dedup key
        const canonicalUrl = normalizeUrl(data.url);
        const domain = extractDomain(data.url);
        const { pathKey } = extractDedupeKey(data.url);
        const slug = generateSlug(data.name);

        // Check for duplicate (same domain + pathKey)
        const existing = await prisma.tool.findFirst({
            where: { domain, pathKey },
        });

        if (existing) {
            return NextResponse.json(
                { error: "This tool has already been submitted" },
                { status: 409 }
            );
        }

        // Create tool as draft (needs admin review)
        const tool = await prisma.tool.create({
            data: {
                name: data.name,
                slug,
                url: data.url,
                canonicalUrl,
                domain,
                pathKey,
                description: data.description,
                categories: [data.category],
                status: "draft",
                source: "user-submission",
                submittedByTelegram: data.telegramUsername
                    ? (data.telegramUsername.startsWith('@') ? data.telegramUsername : '@' + data.telegramUsername)
                    : null,
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Thank you! Your tool has been submitted for review.",
                toolId: tool.id,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Tool submission error:", error);
        return NextResponse.json(
            { error: "Failed to submit tool", details: String(error) },
            { status: 500 }
        );
    }
}
