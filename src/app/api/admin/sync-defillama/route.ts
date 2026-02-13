import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
    fetchDefiLlamaProtocols,
    protocolToAirdropInfo,
    matchProtocolToTool,
} from "@/lib/apis/defillama";

export async function POST(req: NextRequest) {
    try {
        // Check admin password
        const adminPassword = req.headers.get("x-admin-password");
        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const stats = {
            fetched: 0,
            matched: 0,
            updated: 0,
            skipped: 0,
            errors: [] as string[],
        };

        // Fetch all existing tools
        const tools = await prisma.tool.findMany({
            select: {
                id: true,
                name: true,
                domain: true,
                airdropConfidence: true,
                hasAirdrop: true,
            },
        });

        // Fetch protocols from DefiLlama
        console.log("Fetching protocols from DefiLlama...");
        const protocols = await fetchDefiLlamaProtocols();
        stats.fetched = protocols.length;

        console.log(`Fetched ${protocols.length} protocols`);

        // Process each protocol
        for (const protocol of protocols) {
            try {
                const airdropInfo = protocolToAirdropInfo(protocol);

                if (!airdropInfo) {
                    continue; // No likely airdrop
                }

                const match = matchProtocolToTool(protocol, tools);

                if (!match) {
                    stats.skipped++;
                    continue; // No matching tool found
                }

                stats.matched++;

                // Get existing tool data
                const existingTool = tools.find((t) => t.id === match.toolId);
                const existingConfidence = existingTool?.airdropConfidence || 0;

                // Only update if DefiLlama confidence is higher or no existing airdrop
                if (airdropInfo.confidence > existingConfidence || !existingTool?.hasAirdrop) {
                    await prisma.tool.update({
                        where: { id: match.toolId },
                        data: {
                            hasAirdrop: true,
                            airdropDetails: airdropInfo.description,
                            airdropSource: airdropInfo.source,
                            airdropConfidence: airdropInfo.confidence,
                            airdropLastCheck: new Date(),
                            defillamaSlug: airdropInfo.defillamaSlug,
                            lastDefillamaSync: new Date(),
                        },
                    });

                    stats.updated++;
                    console.log(`Updated ${match.toolName} with DefiLlama data`);
                }
            } catch (error) {
                const errorMsg = `Error processing ${protocol.name}: ${error}`;
                stats.errors.push(errorMsg);
                console.error(errorMsg);
            }
        }

        return NextResponse.json({
            success: true,
            stats,
            message: `Synced ${stats.updated} airdrops from ${stats.fetched} protocols`,
        });
    } catch (error) {
        console.error("DefiLlama sync error:", error);
        return NextResponse.json(
            { error: "Failed to sync DefiLlama data", details: String(error) },
            { status: 500 }
        );
    }
}
