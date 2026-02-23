import { Metadata } from "next";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ToolDetailClient from "./client";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const tool = await prisma.tool.findUnique({
        where: { slug },
        select: { name: true, description: true, domain: true, categories: true },
    });

    if (!tool) return { title: "Tool Not Found" };

    const title = `${tool.name} — Crypto Tools Directory`;
    const description = tool.description || `${tool.name} (${tool.domain}) — Discover this tool on Crypto Tools Directory.`;

    return {
        title,
        description,
        keywords: [...tool.categories, tool.name, tool.domain, "crypto", "web3"],
        openGraph: {
            title,
            description,
            type: "website",
        },
        twitter: {
            card: "summary",
            title,
            description,
        },
    };
}

export default async function ToolDetailPage({ params }: Props) {
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
        notFound();
    }

    // Fetch related tools
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
            faviconUrl: true,
            categories: true,
            status: true,
            hasAirdrop: true,
            airdropDetails: true,
        },
    });

    return (
        <ToolDetailClient
            tool={{
                ...tool,
                createdAt: tool.createdAt.toISOString(),
                airdropEndDate: tool.airdropEndDate?.toISOString() ?? null,
            }}
            related={related.map((r) => ({
                ...r,
                imageUrl: null,
                popularity: 0,
                clicks: 0,
                createdAt: "",
            }))}
        />
    );
}
