import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const NewsletterSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

export async function POST(req: NextRequest) {
    // Rate limit: 5 signups per 15 minutes per IP
    const { limited, resetIn } = rateLimit(req);
    if (limited) {
        return NextResponse.json(
            { error: `Too many requests. Please try again in ${Math.ceil(resetIn / 60000)} minutes.` },
            { status: 429 }
        );
    }

    try {
        const body = await req.json();

        const validationResult = NewsletterSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Please enter a valid email address" },
                { status: 400 }
            );
        }

        const { email } = validationResult.data;

        // Check if already subscribed
        const existing = await prisma.newsletterSubscriber.findUnique({
            where: { email },
        });

        if (existing) {
            return NextResponse.json({
                success: true,
                message: "You're already subscribed!",
            });
        }

        await prisma.newsletterSubscriber.create({
            data: { email },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Successfully subscribed! 🎉",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Newsletter subscription error:", error);
        return NextResponse.json(
            { error: "Failed to subscribe" },
            { status: 500 }
        );
    }
}
