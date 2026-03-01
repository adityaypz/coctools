import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
    fetchDefiLlamaProtocols,
    fetchRaises,
    fetchYieldPools,
    protocolToAirdropInfo,
    matchProtocolToTool,
} from "@/lib/apis/defillama";

export const dynamic = "force-dynamic";

// Build raise + yield lookups
function buildRaiseLookup(raises: any[]) {
    const lookup = new Map<string, { totalRaised: number; lastRound: string; valuation: number | null }>();
    for (const raise of raises) {
        const key = (raise.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!key) continue;
        const existing = lookup.get(key);
        if (existing) {
            existing.totalRaised += raise.amount || 0;
            existing.lastRound = raise.round;
            if (raise.valuation) existing.valuation = raise.valuation;
        } else {
            lookup.set(key, {
                totalRaised: raise.amount || 0,
                lastRound: raise.round || "Unknown",
                valuation: raise.valuation || null,
            });
        }
    }
    return lookup;
}

function buildYieldLookup(pools: any[]) {
    const lookup = new Map<string, { poolCount: number; totalTvl: number; hasRewardTokens: boolean }>();
    for (const pool of pools) {
        const key = pool.project;
        if (!key) continue;
        const hasRewards = !!(pool.rewardTokens && pool.rewardTokens.length > 0);
        const existing = lookup.get(key);
        if (existing) {
            existing.poolCount++;
            existing.totalTvl += pool.tvlUsd || 0;
            if (hasRewards) existing.hasRewardTokens = true;
        } else {
            lookup.set(key, {
                poolCount: 1,
                totalTvl: pool.tvlUsd || 0,
                hasRewardTokens: hasRewards,
            });
        }
    }
    return lookup;
}

export async function POST(req: NextRequest) {
    try {
        // Check admin password
        const adminPassword = req.headers.get("x-admin-password");
        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const stats = {
            protocolsFetched: 0,
            raisesLoaded: 0,
            poolsLoaded: 0,
            detected: 0,
            matched: 0,
            updated: 0,
            cleaned: 0,
            skipped: 0,
            errors: [] as string[],
            topDetections: [] as Array<{ name: string; confidence: number; signals: string[]; matched: boolean }>,
        };

        // Fetch all existing tools
        const tools = await prisma.tool.findMany({
            select: {
                id: true,
                name: true,
                domain: true,
                airdropConfidence: true,
                hasAirdrop: true,
                airdropSource: true,
            },
        });

        // Fetch all DefiLlama data in parallel
        console.log("📡 Fetching DefiLlama data (protocols + raises + yields)...");
        const [protocols, raises, pools] = await Promise.all([
            fetchDefiLlamaProtocols(),
            fetchRaises(),
            fetchYieldPools(),
        ]);

        stats.protocolsFetched = protocols.length;
        stats.raisesLoaded = raises.length;
        stats.poolsLoaded = pools.length;

        console.log(`📊 ${protocols.length} protocols, ${raises.length} raises, ${pools.length} pools`);

        // Build lookups
        const raiseLookup = buildRaiseLookup(raises);
        const yieldLookup = buildYieldLookup(pools);

        // Track which tool IDs are validated by this sync
        const validatedToolIds = new Set<string>();

        // Process each protocol with enhanced multi-signal detection
        for (const protocol of protocols) {
            try {
                const airdropInfo = protocolToAirdropInfo(protocol, raiseLookup, yieldLookup);

                if (!airdropInfo) continue;

                stats.detected++;

                const match = matchProtocolToTool(protocol, tools);

                // Track top detections (first 50)
                if (stats.topDetections.length < 50) {
                    stats.topDetections.push({
                        name: protocol.name,
                        confidence: airdropInfo.confidence,
                        signals: airdropInfo.signals,
                        matched: !!match,
                    });
                }

                if (!match) {
                    stats.skipped++;
                    continue;
                }

                stats.matched++;
                validatedToolIds.add(match.toolId);

                // Get existing tool data
                const existingTool = tools.find(t => t.id === match.toolId);
                const existingConfidence = existingTool?.airdropConfidence || 0;

                // Only update if confidence is higher or no existing airdrop
                if (airdropInfo.confidence > existingConfidence || !existingTool?.hasAirdrop) {
                    await prisma.tool.update({
                        where: { id: match.toolId },
                        data: {
                            hasAirdrop: true,
                            airdropDetails: `${airdropInfo.description}\n\nSignals: ${airdropInfo.signals.join(" • ")}`,
                            airdropSource: airdropInfo.source,
                            airdropConfidence: airdropInfo.confidence,
                            airdropLastCheck: new Date(),
                            defillamaSlug: airdropInfo.defillamaSlug,
                            lastDefillamaSync: new Date(),
                        },
                    });

                    stats.updated++;
                    console.log(`✅ ${match.toolName} (${(airdropInfo.confidence * 100).toFixed(0)}%) [${airdropInfo.signals.join(", ")}]`);
                }
            } catch (error) {
                const errorMsg = `Error processing ${protocol.name}: ${error}`;
                stats.errors.push(errorMsg);
                console.error(errorMsg);
            }
        }

        // ── CLEANUP: Remove stale airdrops ──
        // Tools that have hasAirdrop=true from auto sources (defillama, coinmarketcap, etc.)
        // but were NOT re-validated in this sync → they no longer pass filters.
        // Only manually curated airdrops (source='curated' or 'manual') are preserved.
        const PROTECTED_SOURCES = ["curated", "manual", "user-submission"];
        const staleTools = tools.filter(t =>
            t.hasAirdrop &&
            !PROTECTED_SOURCES.includes(t.airdropSource || "") &&
            !validatedToolIds.has(t.id)
        );

        for (const staleTool of staleTools) {
            try {
                await prisma.tool.update({
                    where: { id: staleTool.id },
                    data: {
                        hasAirdrop: false,
                        airdropDetails: null,
                        airdropSource: null,
                        airdropConfidence: null,
                        airdropLastCheck: new Date(),
                    },
                });
                stats.cleaned++;
                console.log(`🧹 Cleaned stale airdrop: ${staleTool.name}`);
            } catch (error) {
                stats.errors.push(`Cleanup error for ${staleTool.name}: ${error}`);
            }
        }

        // Sort top detections by confidence
        stats.topDetections.sort((a, b) => b.confidence - a.confidence);

        return NextResponse.json({
            success: true,
            stats,
            message: `Enhanced sync: ${stats.detected} detected, ${stats.matched} matched, ${stats.updated} updated, ${stats.cleaned} cleaned from ${stats.protocolsFetched} protocols + ${stats.raisesLoaded} raises + ${stats.poolsLoaded} yield pools`,
        });
    } catch (error) {
        console.error("DefiLlama sync error:", error);
        return NextResponse.json(
            { error: "Failed to sync DefiLlama data", details: String(error) },
            { status: 500 },
        );
    }
}
