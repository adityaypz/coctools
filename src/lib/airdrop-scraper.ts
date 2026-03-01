/**
 * Enhanced Airdrop Scraper
 * Uses DefiLlama (protocols + raises + yields) as primary source,
 * with CoinMarketCap as a supplementary source.
 */

import * as cheerio from "cheerio";
import prisma from "@/lib/prisma";
import {
    fetchDefiLlamaProtocols,
    fetchRaises,
    fetchYieldPools,
    protocolToAirdropInfo,
    matchProtocolToTool,
} from "@/lib/apis/defillama";

export interface ScraperStats {
    timestamp: Date;
    duration: number;
    // DefiLlama stats
    protocolsFetched: number;
    raisesLoaded: number;
    poolsLoaded: number;
    defillamaDetected: number;
    // CMC stats
    cmcScraped: number;
    // Combined stats
    matched: number;
    updated: number;
    skipped: number;
    errors: string[];
    topDetections: Array<{ name: string; confidence: number; signals: string[]; matched: boolean }>;
}

interface AirdropData {
    projectName: string;
    description: string;
    source: string;
    confidence?: number;
    signals?: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

function similarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;
    const editDistance = levenshtein(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

function levenshtein(s1: string, s2: string): number {
    const costs: number[] = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) {
                costs[j] = j;
            } else if (j > 0) {
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                }
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

function matchProject(
    airdropName: string,
    tools: Array<{ id: string; name: string; domain: string }>,
): { toolId: string; toolName: string; confidence: number } | null {
    const normalizedAirdrop = normalizeName(airdropName);

    // Exact domain-base match
    for (const tool of tools) {
        const domain = tool.domain.replace("www.", "");
        const domainBase = domain.split(".")[0];

        if (normalizedAirdrop.includes(domainBase) && domainBase.length >= 3) {
            return { toolId: tool.id, toolName: tool.name, confidence: 1.0 };
        }
    }

    // Fuzzy name matching
    const similarities = tools.map(tool => ({
        tool,
        score: similarity(normalizedAirdrop, normalizeName(tool.name)),
    }));

    similarities.sort((a, b) => b.score - a.score);
    const best = similarities[0];

    if (best && best.score > 0.7) {
        return { toolId: best.tool.id, toolName: best.tool.name, confidence: best.score };
    }

    return null;
}

// ─── CoinMarketCap Scraper (supplementary) ───────────────────────────

async function scrapeCoinMarketCap(): Promise<AirdropData[]> {
    const airdrops: AirdropData[] = [];

    try {
        console.log("🔍 Fetching CoinMarketCap...");
        await sleep(2000);

        const response = await fetch("https://coinmarketcap.com/airdrop/", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "text/html",
            },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const html = await response.text();
        const $ = cheerio.load(html);

        const selectors = [".airdrop-card", "[data-role='airdrop-item']", "article"];

        let elements: cheerio.Cheerio<any> | null = null;
        for (const selector of selectors) {
            const found = $(selector);
            if (found.length > 0) {
                elements = found;
                console.log(`✅ CMC: Found ${found.length} airdrops`);
                break;
            }
        }

        if (!elements || elements.length === 0) {
            console.log("⚠️ CMC: No airdrops found (selectors may be outdated)");
            return airdrops;
        }

        elements.each((i, el) => {
            try {
                const $el = $(el);
                const projectName = $el.find("h3").first().text().trim() || $el.find("a").first().text().trim();
                const description = $el.find("p").first().text().trim() || $el.find(".description").text().trim();

                if (projectName && description && description.length >= 10) {
                    airdrops.push({
                        projectName,
                        description: description.substring(0, 500),
                        source: "coinmarketcap",
                    });
                }
            } catch {
                // Skip individual parsing errors
            }
        });

        console.log(`✅ CMC: Scraped ${airdrops.length} airdrops`);
    } catch (error) {
        console.error("⚠️ CMC scraper failed (non-fatal):", error);
    }

    return airdrops;
}

// ─── Build raise + yield lookups (duplicated helper for standalone use) ──

function buildRaiseLookup(raises: any[]): Map<string, { totalRaised: number; lastRound: string; valuation: number | null }> {
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

function buildYieldLookup(pools: any[]): Map<string, { poolCount: number; totalTvl: number; hasRewardTokens: boolean }> {
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

// ─── Main Enhanced Scraper ───────────────────────────────────────────

export async function runAirdropScraper(): Promise<ScraperStats> {
    const startTime = Date.now();
    const stats: ScraperStats = {
        timestamp: new Date(),
        duration: 0,
        protocolsFetched: 0,
        raisesLoaded: 0,
        poolsLoaded: 0,
        defillamaDetected: 0,
        cmcScraped: 0,
        matched: 0,
        updated: 0,
        skipped: 0,
        errors: [],
        topDetections: [],
    };

    try {
        console.log("🚀 Starting enhanced airdrop scraper...");

        // 1. Fetch all tools
        const tools = await prisma.tool.findMany({
            where: { status: { in: ["reviewed", "featured"] } },
            select: { id: true, name: true, domain: true, hasAirdrop: true, airdropConfidence: true },
        });
        console.log(`📦 ${tools.length} tools in database`);

        // Track which tools have been updated (to avoid duplicates)
        const updatedToolIds = new Set<string>();

        // ── 2. DefiLlama Enhanced Detection (Primary Source) ──
        console.log("\n━━━ DefiLlama Enhanced Detection ━━━");

        try {
            const [protocols, raises, pools] = await Promise.all([
                fetchDefiLlamaProtocols(),
                fetchRaises(),
                fetchYieldPools(),
            ]);

            stats.protocolsFetched = protocols.length;
            stats.raisesLoaded = raises.length;
            stats.poolsLoaded = pools.length;

            console.log(`📊 ${protocols.length} protocols, ${raises.length} raises, ${pools.length} pools`);

            const raiseLookup = buildRaiseLookup(raises);
            const yieldLookup = buildYieldLookup(pools);

            for (const protocol of protocols) {
                try {
                    const airdropInfo = protocolToAirdropInfo(protocol, raiseLookup, yieldLookup);
                    if (!airdropInfo) continue;

                    stats.defillamaDetected++;

                    const match = matchProtocolToTool(protocol, tools);

                    // Track top detections for debug
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

                    const existingTool = tools.find(t => t.id === match.toolId);
                    const existingConfidence = existingTool?.airdropConfidence || 0;

                    if (airdropInfo.confidence > existingConfidence || !existingTool?.hasAirdrop) {
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

                        updatedToolIds.add(match.toolId);
                        stats.updated++;
                        console.log(`  ✅ ${match.toolName} (${(airdropInfo.confidence * 100).toFixed(0)}%) [${airdropInfo.signals.join(", ")}]`);
                    }
                } catch (error) {
                    stats.errors.push(`DeFiLlama ${protocol.name}: ${error}`);
                }
            }

            console.log(`📈 DefiLlama: ${stats.defillamaDetected} detected, ${stats.matched} matched, ${stats.updated} updated`);
        } catch (error) {
            console.error("⚠️ DefiLlama detection failed:", error);
            stats.errors.push(`DefiLlama: ${error}`);
        }

        // ── 3. CoinMarketCap Detection (Supplementary) ──
        console.log("\n━━━ CoinMarketCap (Supplementary) ━━━");

        try {
            const cmcAirdrops = await scrapeCoinMarketCap();
            stats.cmcScraped = cmcAirdrops.length;

            for (const airdrop of cmcAirdrops) {
                try {
                    const match = matchProject(airdrop.projectName, tools);

                    if (!match || match.confidence < 0.7) {
                        continue;
                    }

                    // Skip if already updated by DefiLlama with higher confidence
                    if (updatedToolIds.has(match.toolId)) {
                        continue;
                    }

                    const tool = tools.find(t => t.id === match.toolId);
                    if (tool?.hasAirdrop && (tool.airdropConfidence || 0) >= match.confidence) {
                        continue;
                    }

                    await prisma.tool.update({
                        where: { id: match.toolId },
                        data: {
                            hasAirdrop: true,
                            airdropDetails: airdrop.description,
                            airdropSource: "coinmarketcap",
                            airdropConfidence: match.confidence,
                            airdropLastCheck: new Date(),
                        },
                    });

                    updatedToolIds.add(match.toolId);
                    stats.updated++;
                    console.log(`  ✅ CMC: ${match.toolName}`);
                } catch (error) {
                    stats.errors.push(`CMC ${airdrop.projectName}: ${error}`);
                }
            }
        } catch (error) {
            console.error("⚠️ CMC detection failed:", error);
            stats.errors.push(`CMC: ${error}`);
        }

        // ── Summary ──
        stats.duration = Date.now() - startTime;
        stats.topDetections.sort((a, b) => b.confidence - a.confidence);

        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`✅ Scraper completed in ${(stats.duration / 1000).toFixed(1)}s`);
        console.log(`📊 Protocols: ${stats.protocolsFetched} | Raises: ${stats.raisesLoaded} | Pools: ${stats.poolsLoaded}`);
        console.log(`🎯 Detected: ${stats.defillamaDetected} | Matched: ${stats.matched} | Updated: ${stats.updated}`);
        console.log(`📰 CMC: ${stats.cmcScraped} scraped`);
        console.log(`❌ Errors: ${stats.errors.length}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        return stats;
    } catch (error) {
        stats.errors.push(`Fatal: ${error}`);
        stats.duration = Date.now() - startTime;
        return stats;
    }
}
