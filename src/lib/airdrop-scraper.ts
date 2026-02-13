/**
 * Simplified Airdrop Scraper
 * No external dependencies beyond cheerio
 */

import * as cheerio from "cheerio";
import prisma from "@/lib/prisma";

export interface ScraperStats {
    timestamp: Date;
    duration: number;
    scraped: number;
    matched: number;
    updated: number;
    skipped: number;
    errors: string[];
}

interface AirdropData {
    projectName: string;
    description: string;
    source: string;
}

interface MatchResult {
    toolId: string;
    toolName: string;
    confidence: number;
}

// Domain aliases for matching
const DOMAIN_ALIASES: Record<string, string[]> = {
    "uniswap.org": ["uniswap", "uni"],
    "aave.com": ["aave"],
    "curve.fi": ["curve"],
    "lido.fi": ["lido"],
    "blast.io": ["blast"],
    "scroll.io": ["scroll"],
    "zksync.io": ["zksync", "zk sync"],
    "starknet.io": ["starknet"],
    "arbitrum.io": ["arbitrum"],
    "optimism.io": ["optimism", "op"],
    "base.org": ["base"],
    "linea.build": ["linea"],
};

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

// Simple string similarity (Levenshtein distance approximation)
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
    tools: Array<{ id: string; name: string; domain: string }>
): MatchResult | null {
    const normalizedAirdrop = normalizeName(airdropName);

    // Exact domain match
    for (const tool of tools) {
        const domain = tool.domain.replace("www.", "");
        const domainBase = domain.split(".")[0];

        if (normalizedAirdrop.includes(domainBase)) {
            return { toolId: tool.id, toolName: tool.name, confidence: 1.0 };
        }

        // Check aliases
        const aliases = DOMAIN_ALIASES[domain] || [];
        for (const alias of aliases) {
            if (normalizedAirdrop.includes(alias)) {
                return { toolId: tool.id, toolName: tool.name, confidence: 0.95 };
            }
        }
    }

    // Fuzzy name matching
    const similarities = tools.map(tool => ({
        tool,
        score: similarity(normalizedAirdrop, normalizeName(tool.name)),
    }));

    similarities.sort((a, b) => b.score - a.score);
    const best = similarities[0];

    if (best && best.score > 0.8) {
        return { toolId: best.tool.id, toolName: best.tool.name, confidence: best.score };
    }

    return null;
}

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
                console.log(`✅ Found ${found.length} airdrops`);
                break;
            }
        }

        if (!elements || elements.length === 0) {
            console.log("⚠️ No airdrops found");
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
                    console.log(`  ✓ ${projectName}`);
                }
            } catch (error) {
                console.error(`  ✗ Error ${i}:`, error);
            }
        });

        console.log(`✅ Scraped ${airdrops.length} airdrops`);
    } catch (error) {
        console.error("❌ Scraper failed:", error);
    }

    return airdrops;
}

export async function runAirdropScraper(): Promise<ScraperStats> {
    const startTime = Date.now();
    const stats: ScraperStats = {
        timestamp: new Date(),
        duration: 0,
        scraped: 0,
        matched: 0,
        updated: 0,
        skipped: 0,
        errors: [],
    };

    try {
        console.log("🚀 Starting scraper...");

        const tools = await prisma.tool.findMany({
            where: { status: { in: ["reviewed", "featured"] } },
            select: { id: true, name: true, domain: true, hasAirdrop: true },
        });
        console.log(`✅ ${tools.length} tools`);

        const airdrops = await scrapeCoinMarketCap();
        stats.scraped = airdrops.length;

        if (airdrops.length === 0) {
            stats.duration = Date.now() - startTime;
            return stats;
        }

        console.log(`🔍 Matching...`);

        for (const airdrop of airdrops) {
            try {
                const match = matchProject(airdrop.projectName, tools);

                if (!match || match.confidence < 0.8) {
                    stats.skipped++;
                    continue;
                }

                stats.matched++;

                const tool = tools.find(t => t.id === match.toolId);
                if (tool?.hasAirdrop) {
                    stats.skipped++;
                    continue;
                }

                await prisma.tool.update({
                    where: { id: match.toolId },
                    data: {
                        hasAirdrop: true,
                        airdropDetails: airdrop.description,
                        airdropSource: airdrop.source,
                        airdropConfidence: match.confidence,
                        airdropLastCheck: new Date(),
                    },
                });

                console.log(`  ✅ ${match.toolName}`);
                stats.updated++;
            } catch (error) {
                stats.errors.push(`${airdrop.projectName}: ${error}`);
            }
        }

        stats.duration = Date.now() - startTime;

        console.log(`✅ Done: ${stats.updated} updated, ${stats.matched} matched, ${stats.scraped} scraped`);

        return stats;
    } catch (error) {
        stats.errors.push(`Fatal: ${error}`);
        stats.duration = Date.now() - startTime;
        return stats;
    }
}
