import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const { toolId } = await request.json();

        if (!toolId) {
            return NextResponse.json({ error: "Tool ID required" }, { status: 400 });
        }

        // Increment click count
        await prisma.tool.update({
            where: { id: toolId },
            data: { clicks: { increment: 1 } },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Click tracking error:", error);
        return NextResponse.json({ error: "Failed to track click" }, { status: 500 });
    }
}
