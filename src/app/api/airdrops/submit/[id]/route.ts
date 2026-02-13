import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check admin password
        const adminPassword = req.headers.get("x-admin-password");
        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { action, notes } = await req.json();
        const { id: submissionId } = await params;

        if (!["approve", "reject"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const submission = await prisma.airdropSubmission.update({
            where: { id: submissionId },
            data: {
                status: action === "approve" ? "approved" : "rejected",
                reviewedAt: new Date(),
                reviewNotes: notes || null,
            },
        });

        return NextResponse.json({ success: true, submission });
    } catch (error) {
        console.error("Error reviewing submission:", error);
        return NextResponse.json(
            { error: "Failed to review submission" },
            { status: 500 }
        );
    }
}
