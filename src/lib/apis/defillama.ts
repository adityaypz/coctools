/**
 * DefiLlama API Client — Enhanced Airdrop Detection
 * Uses protocols, fundraising rounds, and yield pools to detect airdrops
 * No API key required!
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface DefiLlamaProtocol {
    id: string;
    name: string;
    address: string | null;
    symbol: string;
    url: string;
    description: string;
    chain: string;
    logo: string | null;
    audits: string;
    audit_note: string | null;
    gecko_id: string | null;
    cmcId: string | null;
    category: string;
    chains: string[];
    module: string;
    twitter: string | null;
    forkedFrom: string[];
    oracles: string[];
    listedAt: number;
    slug: string;
    tvl: number;
    chainTvls: Record<string, number>;
    change_1h: number | null;
    change_1d: number | null;
    change_7d: number | null;
    fdv: number | null;
    mcap: number | null;
}

export interface RaiseData {
    date: number; // Unix timestamp
    name: string;
    round: string; // "Seed", "Series A", etc.
    amount: number; // USD amount raised
    chains: string[];
    sector: string;
    category: string;
    source: string;
    leadInvestors: string[];
    otherInvestors: string[];
    valuation: number | null;
    depiledId?: string; // DefiLlama protocol id
}

export interface YieldPool {
    chain: string;
    project: string; // DefiLlama project slug
    symbol: string;
    tvlUsd: number;
    apyBase: number | null;
    apyReward: number | null;
    apy: number;
    rewardTokens: string[] | null;
    pool: string;
    stablecoin: boolean;
    exposure: string;
    poolMeta: string | null;
}

export interface AirdropInfo {
    projectName: string;
    description: string;
    url: string;
    defillamaSlug: string;
    confidence: number;
    source: string;
    signals: string[]; // What triggered the detection
}

// ─── Constants ───────────────────────────────────────────────────────

const DEFILLAMA_BASE_URL = "https://api.llama.fi";
const YIELDS_BASE_URL = "https://yields.llama.fi";

/** Keywords in protocol description that signal a likely airdrop */
const AIRDROP_KEYWORDS = [
    "airdrop", "points", "rewards", "incentive", "testnet",
    "early user", "loyalty program", "token launch", "governance token",
    "upcoming token", "farming", "season", "quest", "campaign",
    "boost", "xp", "gems", "loyalty", "earn points", "reward program",
    "point system", "staking rewards", "early adopter", "genesis",
    "fair launch", "community distribution", "token generation",
];

/** Protocol categories historically associated with airdrops */
const HIGH_AIRDROP_CATEGORIES = [
    "Dexes", "Lending", "Bridge", "Liquid Staking", "CDP",
    "Yield", "Derivatives", "Yield Aggregator", "Cross Chain",
    "Restaking", "Options", "Leveraged Farming", "RWA",
    "Liquid Restaking", "Perpetuals",
];

/** Categories that should NEVER be flagged as airdrops */
const EXCLUDED_CATEGORIES = [
    "CEX", "Centralized Exchange", "Exchange",
];

/**
 * Protocols that already completed their airdrop — should not be detected.
 * Use normalized name (lowercase, alphanumeric only).
 */
const COMPLETED_AIRDROPS = new Set([
    "zksync", "zksyncerafinance", "zksyncera",
    "arbitrum", "arbitrumone",
    "optimism",
    "starknet",
    "blur",
    "aptos",
    "sui",
    "celestia",
    "jito",
    "jupiter",
    "wormhole",
    "pyth", "pythnetwork",
    "dymension",
    "zetachain",
    "altlayer",
    "manta", "mantanetwork",
    "sei", "seinetwork",
    "saga",
    "ethena", "ethenalabs",
    "ondo", "ondofinance",
    "bonk",
    "tensor",
    "kamino", "kaminofinance",
    "parcl",
    "drift", "driftprotocol",
    "notcoin",
    "hamster", "hamsterkombat",
    "dogs",
    "catizen",
    "scroll",
    "blast",
    "layerzero",
    "eigenlayer",
    "uniswap",
    "1inch", "1inchnetwork",
    "dydx",
    "ens",
    "looksrare",
    "x2y2",
    "hop", "hopprotocol",
    "across", "acrossprotocol",
    "connext",
    "safe", "safeglobal",
    "cow", "cowswap", "cowprotocol",
    "paraswap",
    "ribbon", "ribbonfinance",
    "gearbox",
    "shardeum",
]);

// ─── API Fetchers ────────────────────────────────────────────────────

const FETCH_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; CryptoToolsDirectory/1.0)",
};

export async function fetchDefiLlamaProtocols(): Promise<DefiLlamaProtocol[]> {
    try {
        const response = await fetch(`${DEFILLAMA_BASE_URL}/protocols`, {
            headers: FETCH_HEADERS,
        });
        if (!response.ok) throw new Error(`DefiLlama API error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching DefiLlama protocols:", error);
        throw error;
    }
}

export async function fetchRaises(): Promise<RaiseData[]> {
    try {
        const response = await fetch(`${DEFILLAMA_BASE_URL}/raises`, {
            headers: FETCH_HEADERS,
        });
        if (!response.ok) throw new Error(`DefiLlama raises API error: ${response.status}`);
        const data = await response.json();
        // API returns { raises: [...] }
        return data.raises || data || [];
    } catch (error) {
        console.error("Error fetching DefiLlama raises:", error);
        return []; // Non-fatal: continue without raises data
    }
}

export async function fetchYieldPools(): Promise<YieldPool[]> {
    try {
        const response = await fetch(`${YIELDS_BASE_URL}/pools`, {
            headers: FETCH_HEADERS,
        });
        if (!response.ok) throw new Error(`DefiLlama yields API error: ${response.status}`);
        const data = await response.json();
        return data.data || data || [];
    } catch (error) {
        console.error("Error fetching DefiLlama yield pools:", error);
        return []; // Non-fatal
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function extractDomain(url: string): string {
    try {
        return new URL(url).hostname.replace("www.", "");
    } catch {
        return "";
    }
}

/** Build a lookup: protocol slug → total raised amount */
function buildRaiseLookup(raises: RaiseData[]): Map<string, { totalRaised: number; lastRound: string; valuation: number | null }> {
    const lookup = new Map<string, { totalRaised: number; lastRound: string; valuation: number | null }>();

    for (const raise of raises) {
        const key = raise.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const existing = lookup.get(key);
        if (existing) {
            existing.totalRaised += raise.amount || 0;
            existing.lastRound = raise.round;
            if (raise.valuation) existing.valuation = raise.valuation;
        } else {
            lookup.set(key, {
                totalRaised: raise.amount || 0,
                lastRound: raise.round,
                valuation: raise.valuation,
            });
        }
    }

    return lookup;
}

/** Build a lookup: project slug → pool count & total TVL */
function buildYieldLookup(pools: YieldPool[]): Map<string, { poolCount: number; totalTvl: number; hasRewardTokens: boolean }> {
    const lookup = new Map<string, { poolCount: number; totalTvl: number; hasRewardTokens: boolean }>();

    for (const pool of pools) {
        const key = pool.project;
        const existing = lookup.get(key);
        const hasRewards = !!(pool.rewardTokens && pool.rewardTokens.length > 0);

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

// ─── Enhanced Airdrop Detection ──────────────────────────────────────

/**
 * Multi-signal airdrop detection for a protocol.
 * Returns confidence score and detected signals.
 */
export function detectAirdropSignals(
    protocol: DefiLlamaProtocol,
    raiseLookup: Map<string, { totalRaised: number; lastRound: string; valuation: number | null }>,
    yieldLookup: Map<string, { poolCount: number; totalTvl: number; hasRewardTokens: boolean }>,
): { confidence: number; signals: string[] } | null {
    const signals: string[] = [];
    let confidence = 0;

    const description = (protocol.description || "").toLowerCase();
    const category = (protocol.category || "").toLowerCase();
    const hasNoToken = !protocol.gecko_id && !protocol.cmcId;
    const twoYearsAgo = Date.now() / 1000 - 2 * 365 * 24 * 60 * 60;
    const isRecent = protocol.listedAt > twoYearsAgo;
    const nameKey = protocol.name.toLowerCase().replace(/[^a-z0-9]/g, "");

    // ── FILTER: Skip excluded categories (exchanges, CEX, wallets) ──
    if (EXCLUDED_CATEGORIES.some(exc => exc.toLowerCase() === category)) {
        return null;
    }

    // ── FILTER: Skip completed airdrops ──
    if (COMPLETED_AIRDROPS.has(nameKey) || COMPLETED_AIRDROPS.has(protocol.slug)) {
        return null;
    }

    // ── FILTER: Protocol already has a token — very strict ──
    // If gecko_id or cmcId exists, the token is live. Only detect if
    // description explicitly mentions a NEW airdrop/season/campaign.
    if (!hasNoToken) {
        const hasActiveKeyword = ["season 2", "season 3", "s2", "s3", "new airdrop", "upcoming airdrop", "points campaign"].some(
            kw => description.includes(kw)
        );
        if (!hasActiveKeyword) {
            return null; // Already has token, no active campaign mentioned
        }
        // Has token but active campaign → lower base confidence
        confidence += 0.3;
        signals.push("Active campaign (has token)");
    }

    // ── Signal 1: Keyword in description ──
    const matchedKeywords = AIRDROP_KEYWORDS.filter(kw =>
        description.includes(kw) || category.includes(kw)
    );
    if (matchedKeywords.length > 0) {
        const kwBoost = Math.min(matchedKeywords.length * 0.15, 0.5);
        confidence += 0.4 + kwBoost;
        signals.push(`Keywords: ${matchedKeywords.slice(0, 3).join(", ")}`);
    }

    // ── Signal 2: Has fundraising but no token ──
    const raiseInfo = raiseLookup.get(nameKey);
    if (raiseInfo && hasNoToken) {
        if (raiseInfo.totalRaised >= 10_000_000) {
            confidence += 0.5;
            signals.push(`Raised $${(raiseInfo.totalRaised / 1e6).toFixed(0)}M, no token`);
        } else if (raiseInfo.totalRaised >= 1_000_000) {
            confidence += 0.35;
            signals.push(`Raised $${(raiseInfo.totalRaised / 1e6).toFixed(1)}M, no token`);
        } else if (raiseInfo.totalRaised > 0) {
            confidence += 0.2;
            signals.push(`Raised funding, no token`);
        }
    } else if (raiseInfo && !hasNoToken) {
        // Has token already — might still have a secondary airdrop/season
        if (matchedKeywords.length > 0) {
            confidence += 0.1;
            signals.push("Has token + airdrop keywords (possible S2)");
        }
    }

    // ── Signal 3: Yield pools with rewards but no token ──
    const yieldInfo = yieldLookup.get(protocol.slug);
    if (yieldInfo && hasNoToken && yieldInfo.hasRewardTokens) {
        confidence += 0.3;
        signals.push(`${yieldInfo.poolCount} yield pools with rewards, no token`);
    } else if (yieldInfo && hasNoToken && yieldInfo.totalTvl > 1_000_000) {
        confidence += 0.15;
        signals.push(`$${(yieldInfo.totalTvl / 1e6).toFixed(0)}M TVL in yield pools, no token`);
    }

    // ── Signal 4: High-airdrop category + no token ──
    const isHighCategory = HIGH_AIRDROP_CATEGORIES.some(
        c => c.toLowerCase() === category
    );
    if (isHighCategory && hasNoToken) {
        confidence += 0.15;
        signals.push(`Category: ${protocol.category}`);
    }

    // ── Signal 5: Recent, significant TVL, no token ──
    if (isRecent && hasNoToken && protocol.tvl > 100_000) {
        confidence += 0.2;
        signals.push(`Recent protocol, $${(protocol.tvl / 1e6).toFixed(1)}M TVL, no token`);
    } else if (hasNoToken && protocol.tvl > 10_000_000) {
        // Older but still no token with big TVL
        confidence += 0.25;
        signals.push(`$${(protocol.tvl / 1e6).toFixed(0)}M TVL, no token`);
    }

    // ── Signal 6: Very high TVL boost ──
    if (protocol.tvl > 100_000_000) {
        confidence += 0.1;
        signals.push(`TVL > $100M`);
    }

    // Only return if we have at least one signal and minimum confidence
    if (signals.length === 0 || confidence < 0.3) {
        return null;
    }

    return {
        confidence: Math.min(confidence, 1.0),
        signals,
    };
}

/**
 * Convert protocol + detection result into airdrop info
 */
export function protocolToAirdropInfo(
    protocol: DefiLlamaProtocol,
    raiseLookup?: Map<string, { totalRaised: number; lastRound: string; valuation: number | null }>,
    yieldLookup?: Map<string, { poolCount: number; totalTvl: number; hasRewardTokens: boolean }>,
): AirdropInfo | null {
    const detection = detectAirdropSignals(
        protocol,
        raiseLookup || new Map(),
        yieldLookup || new Map(),
    );

    if (!detection) return null;

    return {
        projectName: protocol.name,
        description: protocol.description || `${protocol.name} is a ${protocol.category} protocol on ${protocol.chains.join(", ")}.`,
        url: protocol.url,
        defillamaSlug: protocol.slug,
        confidence: detection.confidence,
        source: "defillama",
        signals: detection.signals,
    };
}

// ─── Tool Matching ───────────────────────────────────────────────────

export function matchProtocolToTool(
    protocol: DefiLlamaProtocol,
    tools: Array<{ id: string; name: string; domain: string }>,
): { toolId: string; toolName: string } | null {
    const protocolDomain = extractDomain(protocol.url);

    if (!protocolDomain) return null;

    // Exact domain match
    const exactMatch = tools.find(tool => tool.domain === protocolDomain);
    if (exactMatch) {
        return { toolId: exactMatch.id, toolName: exactMatch.name };
    }

    // Subdomain match (e.g., app.uniswap.org matches uniswap.org)
    const subdomainMatch = tools.find(tool => {
        return protocolDomain.endsWith(`.${tool.domain}`) || tool.domain.endsWith(`.${protocolDomain}`);
    });
    if (subdomainMatch) {
        return { toolId: subdomainMatch.id, toolName: subdomainMatch.name };
    }

    // Domain base match (e.g., "aave" from "aave.com")
    const protocolDomainBase = protocolDomain.split(".")[0];
    const domainBaseMatch = tools.find(tool => {
        const toolDomainBase = tool.domain.split(".")[0];
        return toolDomainBase === protocolDomainBase;
    });
    if (domainBaseMatch) {
        return { toolId: domainBaseMatch.id, toolName: domainBaseMatch.name };
    }

    // Fuzzy name match
    const normalizedProtocolName = protocol.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const fuzzyMatch = tools.find(tool => {
        const normalizedToolName = tool.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        return normalizedToolName === normalizedProtocolName;
    });

    if (fuzzyMatch) {
        return { toolId: fuzzyMatch.id, toolName: fuzzyMatch.name };
    }

    // Partial name inclusion (longer name contains shorter)
    const partialMatch = tools.find(tool => {
        const normalizedToolName = tool.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (normalizedToolName.length < 3 || normalizedProtocolName.length < 3) return false;
        return normalizedToolName.includes(normalizedProtocolName) ||
            normalizedProtocolName.includes(normalizedToolName);
    });

    if (partialMatch) {
        return { toolId: partialMatch.id, toolName: partialMatch.name };
    }

    return null;
}

// ─── Main Enhanced Sync ──────────────────────────────────────────────

export async function syncEnhancedAirdrops(
    existingTools: Array<{ id: string; name: string; domain: string; airdropConfidence: number | null; hasAirdrop: boolean }>,
): Promise<{
    fetched: number;
    raisesLoaded: number;
    poolsLoaded: number;
    detected: number;
    matched: number;
    updated: number;
    skipped: number;
    errors: string[];
    topDetections: Array<{ name: string; confidence: number; signals: string[]; matched: boolean }>;
}> {
    const stats = {
        fetched: 0,
        raisesLoaded: 0,
        poolsLoaded: 0,
        detected: 0,
        matched: 0,
        updated: 0,
        skipped: 0,
        errors: [] as string[],
        topDetections: [] as Array<{ name: string; confidence: number; signals: string[]; matched: boolean }>,
    };

    try {
        // Fetch all data sources in parallel
        console.log("📡 Fetching DefiLlama data (protocols + raises + yields)...");
        const [protocols, raises, pools] = await Promise.all([
            fetchDefiLlamaProtocols(),
            fetchRaises(),
            fetchYieldPools(),
        ]);

        stats.fetched = protocols.length;
        stats.raisesLoaded = raises.length;
        stats.poolsLoaded = pools.length;

        console.log(`📊 Loaded: ${protocols.length} protocols, ${raises.length} raises, ${pools.length} pools`);

        // Build lookups
        const raiseLookup = buildRaiseLookup(raises);
        const yieldLookup = buildYieldLookup(pools);

        console.log(`🔍 Raise lookup: ${raiseLookup.size} projects, Yield lookup: ${yieldLookup.size} projects`);

        // Process each protocol
        for (const protocol of protocols) {
            try {
                const airdropInfo = protocolToAirdropInfo(protocol, raiseLookup, yieldLookup);

                if (!airdropInfo) continue;

                stats.detected++;

                const match = matchProtocolToTool(protocol, existingTools);

                // Track all detections for stats (top 30)
                if (stats.topDetections.length < 30) {
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

                // Only update if confidence is higher than existing
                const existingTool = existingTools.find(t => t.id === match.toolId);
                const existingConfidence = existingTool?.airdropConfidence || 0;

                if (airdropInfo.confidence > existingConfidence || !existingTool?.hasAirdrop) {
                    stats.updated++;
                    // Return the info — caller will do the DB update
                }
            } catch (error) {
                stats.errors.push(`Error processing ${protocol.name}: ${error}`);
            }
        }

        // Sort top detections by confidence
        stats.topDetections.sort((a, b) => b.confidence - a.confidence);

    } catch (error) {
        stats.errors.push(`Error fetching protocols: ${error}`);
    }

    return stats;
}
