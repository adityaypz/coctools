import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    const tools = await prisma.tool.findMany({
        where: {
            status: { in: ["reviewed", "featured"] },
            ...(search
                ? {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { description: { contains: search, mode: "insensitive" } },
                        { domain: { contains: search, mode: "insensitive" } },
                    ],
                }
                : {}),
            ...(category ? { categories: { has: category } } : {}),
        },
        orderBy: [
            { popularity: "desc" },
            { status: "asc" },
            { createdAt: "desc" },
        ],
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
            airdropEndDate: true,
        },
    });

    return NextResponse.json(tools);
}
