import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const tool = await prisma.tool.findUnique({
            where: { slug },
            select: {
                id: true,
                name: true,
                slug: true,
                url: true,
                domain: true,
                description: true,
                imageUrl: true,
                faviconUrl: true,
                categories: true,
                tags: true,
                status: true,
                popularity: true,
                clicks: true,
                hasAirdrop: true,
                airdropDetails: true,
                airdropEndDate: true,
                createdAt: true,
            },
        });

        if (!tool || !["reviewed", "featured"].includes(tool.status)) {
            return NextResponse.json(
                { error: "Tool not found" },
                { status: 404 }
            );
        }

        // Fetch related tools (same categories, exclude current)
        const related = await prisma.tool.findMany({
            where: {
                status: { in: ["reviewed", "featured"] },
                id: { not: tool.id },
                categories: { hasSome: tool.categories },
            },
            orderBy: { popularity: "desc" },
            take: 4,
            select: {
                id: true,
                name: true,
                slug: true,
                url: true,
                domain: true,
                description: true,
                imageUrl: true,
                faviconUrl: true,
                categories: true,
                status: true,
                popularity: true,
                clicks: true,
                hasAirdrop: true,
                airdropDetails: true,
            },
        });

        return NextResponse.json({ tool, related });
    } catch (error) {
        console.error("Error fetching tool:", error);
        return NextResponse.json(
            { error: "Failed to fetch tool" },
            { status: 500 }
        );
    }
}
