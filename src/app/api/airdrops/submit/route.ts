import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { sendSubmissionConfirmation } from "@/lib/email";

export const dynamic = "force-dynamic";

const SubmissionSchema = z.object({
    projectName: z.string().min(1).max(200),
    projectUrl: z.string().url(),
    description: z.string().min(20).max(2000),
    proofLinks: z.array(z.string().url()).min(1).max(5),
    submittedBy: z.string().email().optional().or(z.literal("")),
    telegramUsername: z.string().regex(/^@?[a-zA-Z0-9_]{5,32}$/).optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate input
        const validationResult = SubmissionSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Invalid input", details: validationResult.error.issues },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Check for duplicate submissions (same URL)
        const existing = await prisma.airdropSubmission.findFirst({
            where: {
                projectUrl: data.projectUrl,
                status: { in: ["pending", "approved"] },
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: "This airdrop has already been submitted" },
                { status: 409 }
            );
        }

        // Create submission
        const submission = await prisma.airdropSubmission.create({
            data: {
                projectName: data.projectName,
                projectUrl: data.projectUrl,
                description: data.description,
                proofLinks: data.proofLinks,
                submittedBy: data.submittedBy || null,
                telegramUsername: data.telegramUsername ?
                    (data.telegramUsername.startsWith('@') ? data.telegramUsername : '@' + data.telegramUsername)
                    : null,
                status: "pending",
            },
        });

        // Send confirmation email (non-blocking)
        if (submission.submittedBy) {
            sendSubmissionConfirmation(submission.submittedBy, submission).catch(err =>
                console.error("Email send failed:", err)
            );
        }

        return NextResponse.json({
            success: true,
            message: "Thank you! Your submission has been received and will be reviewed soon.",
            submissionId: submission.id,
        });
    } catch (error) {
        console.error("Airdrop submission error:", error);
        return NextResponse.json(
            { error: "Failed to submit airdrop", details: String(error) },
            { status: 500 }
        );
    }
}

// Get all submissions (admin only)
export async function GET(req: NextRequest) {
    try {
        // Check admin password
        const adminPassword = req.headers.get("x-admin-password");
        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || "pending";

        const submissions = await prisma.airdropSubmission.findMany({
            where: status !== "all" ? { status } : undefined,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ submissions });
    } catch (error) {
        console.error("Error fetching submissions:", error);
        return NextResponse.json(
            { error: "Failed to fetch submissions" },
            { status: 500 }
        );
    }
}
