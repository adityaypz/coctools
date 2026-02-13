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

        const { action, notes, endDate } = await req.json();
        const { id: submissionId } = await params;

        if (!["approve", "reject", "reopen"].includes(action)) {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        // Get submission details
        const submission = await prisma.airdropSubmission.findUnique({
            where: { id: submissionId },
        });

        if (!submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        // If approving, create or update Tool record
        let toolId: string | null = null;
        if (action === "approve") {
            try {
                // Extract domain from projectUrl
                const url = new URL(submission.projectUrl);
                const domain = url.hostname.replace(/^www\./, "");

                // Generate slug from project name
                const baseSlug = submission.projectName
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");

                // Check if tool already exists by domain
                let tool = await prisma.tool.findFirst({
                    where: { domain },
                });

                if (tool) {
                    // Update existing tool with airdrop data
                    tool = await prisma.tool.update({
                        where: { id: tool.id },
                        data: {
                            hasAirdrop: true,
                            airdropDetails: submission.description,
                            airdropSource: "community",
                            airdropConfidence: 0.7,
                            airdropEndDate: endDate ? new Date(endDate) : null,
                            airdropLastCheck: new Date(),
                            status: tool.status === "draft" ? "reviewed" : tool.status,
                        },
                    });
                } else {
                    // Create new tool
                    let slug = baseSlug;
                    const existing = await prisma.tool.findUnique({ where: { slug } });
                    if (existing) {
                        slug = `${baseSlug}-${Date.now().toString(36)}`;
                    }

                    tool = await prisma.tool.create({
                        data: {
                            name: submission.projectName,
                            slug,
                            url: submission.projectUrl,
                            canonicalUrl: submission.projectUrl,
                            domain,
                            pathKey: url.pathname || "/",
                            description: submission.description,
                            hasAirdrop: true,
                            airdropDetails: submission.description,
                            airdropSource: "community",
                            airdropConfidence: 0.7,
                            airdropEndDate: endDate ? new Date(endDate) : null,
                            airdropLastCheck: new Date(),
                            status: "reviewed",
                            source: "community",
                            popularity: 50,
                        },
                    });
                }

                toolId = tool.id;
            } catch (toolError) {
                console.error("Error creating/updating tool:", toolError);
                // Continue with submission update even if tool creation fails
            }
        }

        // Update submission status
        const updatedSubmission = await prisma.airdropSubmission.update({
            where: { id: submissionId },
            data: {
                status: action === "reopen" ? "pending" : action === "approve" ? "approved" : "rejected",
                reviewedAt: action === "reopen" ? null : new Date(),
                reviewNotes: notes || null,
            },
        });

        return NextResponse.json({
            success: true,
            submission: updatedSubmission,
            toolId,
        });
    } catch (error) {
        console.error("Error reviewing submission:", error);
        return NextResponse.json(
            { error: "Failed to review submission" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check admin password
        const adminPassword = req.headers.get("x-admin-password");
        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: submissionId } = await params;

        await prisma.airdropSubmission.delete({
            where: { id: submissionId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting submission:", error);
        return NextResponse.json(
            { error: "Failed to delete submission" },
            { status: 500 }
        );
    }
}
