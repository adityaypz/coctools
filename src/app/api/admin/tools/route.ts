import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function checkPassword(request: Request): boolean {
    const pw = request.headers.get("x-admin-password");
    return pw === process.env.ADMIN_PASSWORD;
}

export const dynamic = "force-dynamic";

// GET — list all tools (all statuses) for admin
export async function GET(request: Request) {
    if (!checkPassword(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const tools = await prisma.tool.findMany({
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
                tags: true,
                status: true,
                source: true,
                popularity: true,
                clicks: true,
                hasAirdrop: true,
                airdropDetails: true,
                airdropEndDate: true,
                submittedByTelegram: true,
                createdAt: true,
            },
        });

        return NextResponse.json(tools);
    } catch (error) {
        console.error("Database error in GET /api/admin/tools:", error);
        return NextResponse.json(
            { error: "Database error", details: String(error) },
            { status: 500 }
        );
    }
}

// PATCH — update tool status, categories, tags, popularity
export async function PATCH(request: Request) {
    if (!checkPassword(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { toolId, status, categories, tags, popularity, hasAirdrop, airdropDetails } = body;

        if (!toolId) {
            return NextResponse.json({ error: "toolId is required" }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {};
        if (status) updateData.status = status;
        if (categories) updateData.categories = categories;
        if (tags) updateData.tags = tags;
        if (typeof popularity === "number") updateData.popularity = popularity;
        if (typeof hasAirdrop === "boolean") updateData.hasAirdrop = hasAirdrop;
        if (airdropDetails !== undefined) updateData.airdropDetails = airdropDetails;

        const tool = await prisma.tool.update({
            where: { id: toolId },
            data: updateData,
        });

        return NextResponse.json(tool);
    } catch (error) {
        console.error("Admin update error:", error);
        return NextResponse.json({ error: "Failed to update tool" }, { status: 500 });
    }
}

// DELETE — remove a tool
export async function DELETE(request: Request) {
    if (!checkPassword(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { toolId } = body;

        if (!toolId) {
            return NextResponse.json({ error: "toolId is required" }, { status: 400 });
        }

        await prisma.tool.delete({ where: { id: toolId } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin delete error:", error);
        return NextResponse.json({ error: "Failed to delete tool" }, { status: 500 });
    }
}
