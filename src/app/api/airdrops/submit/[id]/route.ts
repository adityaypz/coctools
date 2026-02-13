import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendApprovalNotification, sendRejectionNotification } from "@/lib/email";

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

        // Send email notifications (non-blocking)
        if (updatedSubmission.submittedBy) {
            if (action === "approve") {
                sendApprovalNotification(updatedSubmission.submittedBy, updatedSubmission, toolId).catch(err =>
                    console.error("Approval email failed:", err)
                );
            } else if (action === "reject") {
                sendRejectionNotification(updatedSubmission.submittedBy, updatedSubmission, notes).catch(err =>
                    console.error("Rejection email failed:", err)
                );
            }
        }

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

        // Get submission to find associated tool
        const submission = await prisma.airdropSubmission.findUnique({
            where: { id: submissionId },
        });

        if (!submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        // Find and update the associated Tool to remove airdrop
        try {
            const domain = new URL(submission.projectUrl).hostname.replace(/^www\./, "");

            // Find tool by domain
            const tool = await prisma.tool.findFirst({
                where: { domain },
            });

            // If tool exists and has airdrop, remove it
            if (tool && tool.hasAirdrop) {
                await prisma.tool.update({
                    where: { id: tool.id },
                    data: {
                        hasAirdrop: false,
                        airdropDetails: null,
                        airdropSource: null,
                        airdropConfidence: null,
                        airdropEndDate: null,
                    },
                });
            }
        } catch (err) {
            console.error("Error updating tool:", err);
            // Continue with deletion even if tool update fails
        }

        // Delete the submission
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
