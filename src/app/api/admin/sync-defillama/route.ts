import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
    fetchDefiLlamaProtocols,
    fetchRaises,
    fetchYieldPools,
    protocolToAirdropInfo,
    matchProtocolToTool,
    COMPLETED_AIRDROPS,
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
            imported: 0,
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

                if (match) {
                    // ── EXISTING TOOL: Update if confidence is higher ──
                    stats.matched++;
                    validatedToolIds.add(match.toolId);

                    const existingTool = tools.find(t => t.id === match.toolId);
                    const existingConfidence = existingTool?.airdropConfidence || 0;

                    if (airdropInfo.confidence >= existingConfidence || !existingTool?.hasAirdrop) {
                        await prisma.tool.update({
                            where: { id: match.toolId },
                            data: {
                                hasAirdrop: true,
                                airdropDetails: `${airdropInfo.description}\n\nSignals: ${airdropInfo.signals.join(" • ")}`,
                                airdropSource: "defillama",
                                airdropConfidence: airdropInfo.confidence,
                                airdropLastCheck: new Date(),
                                defillamaSlug: airdropInfo.defillamaSlug,
                                lastDefillamaSync: new Date(),
                            },
                        });

                        stats.updated++;
                    }
                } else {
                    // ── NO MATCHING TOOL: Auto-create from DefiLlama protocol ──
                    // Only create for high-confidence detections (fundraising-based)
                    if (airdropInfo.confidence >= 0.8 && protocol.url) {
                        try {
                            const protocolUrl = protocol.url.startsWith("http") ? protocol.url : `https://${protocol.url}`;
                            let domain: string;
                            try {
                                domain = new URL(protocolUrl).hostname.replace("www.", "");
                            } catch {
                                stats.skipped++;
                                continue;
                            }

                            // Check if domain already exists
                            const existing = await prisma.tool.findFirst({
                                where: { domain },
                                select: { id: true },
                            });

                            if (existing) {
                                // Tool exists with different name, update it
                                validatedToolIds.add(existing.id);
                                await prisma.tool.update({
                                    where: { id: existing.id },
                                    data: {
                                        hasAirdrop: true,
                                        airdropDetails: `${airdropInfo.description}\n\nSignals: ${airdropInfo.signals.join(" • ")}`,
                                        airdropSource: "defillama",
                                        airdropConfidence: airdropInfo.confidence,
                                        airdropLastCheck: new Date(),
                                        defillamaSlug: protocol.slug,
                                        lastDefillamaSync: new Date(),
                                    },
                                });
                                stats.updated++;
                            } else {
                                // Map DefiLlama category → CocTools categories
                                const catMap: Record<string, string[]> = {
                                    "Dexes": ["DeFi", "Exchanges"],
                                    "Lending": ["DeFi", "Lending"],
                                    "Bridge": ["Bridges"],
                                    "CDP": ["DeFi"],
                                    "Yield": ["DeFi", "Staking"],
                                    "Yield Aggregator": ["DeFi"],
                                    "Derivatives": ["DeFi", "Derivatives"],
                                    "Liquid Staking": ["DeFi", "Staking"],
                                    "Liquid Restaking": ["DeFi", "Staking"],
                                    "Restaking": ["DeFi", "Staking"],
                                    "Cross Chain": ["Bridges"],
                                    "Perpetuals": ["DeFi", "Trading"],
                                    "Options": ["DeFi", "Derivatives"],
                                    "RWA": ["DeFi"],
                                    "Leveraged Farming": ["DeFi"],
                                    "DEX Aggregator": ["DeFi", "Exchanges"],
                                    "NFT Marketplace": ["NFT"],
                                    "NFT Lending": ["NFT", "Lending"],
                                    "Gaming": ["Gaming"],
                                    "Prediction Market": ["DeFi", "Trading"],
                                    "Privacy": ["Infrastructure"],
                                };
                                const categories = catMap[protocol.category] || ["DeFi"];

                                // TVL-based tag
                                const tvlTag = protocol.tvl > 10_000_000 ? "High TVL"
                                    : protocol.tvl > 1_000_000 ? "Medium TVL"
                                        : "Low TVL";

                                const slug = protocol.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

                                await prisma.tool.create({
                                    data: {
                                        name: protocol.name,
                                        slug: `defillama-${slug}`,
                                        url: protocolUrl,
                                        domain,
                                        description: protocol.description || `${protocol.name} - ${protocol.category} protocol`,
                                        imageUrl: protocol.logo || null,
                                        faviconUrl: protocol.logo || null,
                                        categories,
                                        tags: [tvlTag, protocol.category, ...protocol.chains.slice(0, 3)].filter(Boolean),
                                        status: "reviewed",
                                        source: "defillama-auto",
                                        hasAirdrop: true,
                                        airdropDetails: `${airdropInfo.description}\n\nSignals: ${airdropInfo.signals.join(" • ")}`,
                                        airdropSource: "defillama",
                                        airdropConfidence: airdropInfo.confidence,
                                        airdropLastCheck: new Date(),
                                        defillamaSlug: protocol.slug,
                                        lastDefillamaSync: new Date(),
                                    },
                                });
                                stats.imported++;
                                console.log(`📥 Auto-imported: ${protocol.name} (${domain}) [${airdropInfo.signals.join(", ")}]`);
                            }
                        } catch (importError: any) {
                            // Skip duplicate slug errors silently
                            if (!importError.message?.includes("Unique constraint")) {
                                stats.errors.push(`Import error for ${protocol.name}: ${importError}`);
                            }
                        }
                    } else {
                        stats.skipped++;
                    }
                }
            } catch (error) {
                const errorMsg = `Error processing ${protocol.name}: ${error}`;
                stats.errors.push(errorMsg);
                console.error(errorMsg);
            }
        }

        // ── FORCE-CLEAN: Remove completed airdrops by name ──
        // Check ALL airdrop tools against the blacklist, regardless of source
        const forceCleanTools = tools.filter(t => {
            if (!t.hasAirdrop) return false;
            const nameKey = t.name.toLowerCase().replace(/[^a-z0-9]/g, "");
            const domainBase = t.domain.split(".")[0].toLowerCase();
            return COMPLETED_AIRDROPS.has(nameKey) ||
                COMPLETED_AIRDROPS.has(domainBase) ||
                // Also check if name contains a blacklisted term
                [...COMPLETED_AIRDROPS].some(bl => bl.length >= 4 && nameKey.includes(bl));
        });

        for (const tool of forceCleanTools) {
            try {
                await prisma.tool.update({
                    where: { id: tool.id },
                    data: {
                        hasAirdrop: false,
                        airdropDetails: null,
                        airdropSource: null,
                        airdropConfidence: null,
                        airdropLastCheck: new Date(),
                    },
                });
                validatedToolIds.delete(tool.id); // Don't re-validate
                stats.cleaned++;
                console.log(`🚫 Force-cleaned completed airdrop: ${tool.name}`);
            } catch (error) {
                stats.errors.push(`Force-clean error for ${tool.name}: ${error}`);
            }
        }

        // ── CLEANUP: Remove stale airdrops ──
        // Tools that have hasAirdrop=true from auto sources but NOT re-validated
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
            message: `Sync: ${stats.detected} detected, ${stats.matched} matched, ${stats.updated} updated, ${stats.imported} imported, ${stats.cleaned} cleaned`,
        });
    } catch (error) {
        console.error("DefiLlama sync error:", error);
        return NextResponse.json(
            { error: "Failed to sync DefiLlama data", details: String(error) },
            { status: 500 },
        );
    }
}
