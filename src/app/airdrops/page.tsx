import prisma from "@/lib/prisma";
import AirdropsPageClient from "./client";

export const dynamic = "force-dynamic";

export default async function AirdropsPage() {
    // Fetch all tools with active airdrops
    const airdropTools = await prisma.tool.findMany({
        where: {
            hasAirdrop: true,
            status: { in: ["reviewed", "featured"] },
        },
        orderBy: [
            { status: "asc" }, // featured first
            { airdropConfidence: "desc" }, // highest confidence first
            { popularity: "desc" },
            { clicks: "desc" },
        ],
    });

    // Serialize dates for client component
    const serializedTools = airdropTools.map(tool => ({
        ...tool,
        airdropEndDate: tool.airdropEndDate ? tool.airdropEndDate.toISOString() : null,
        airdropLastCheck: tool.airdropLastCheck ? tool.airdropLastCheck.toISOString() : null,
    }));

    return <AirdropsPageClient tools={serializedTools as any} />;
}
