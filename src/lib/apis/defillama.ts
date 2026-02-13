/**
 * DefiLlama API Client
 * Free API for fetching DeFi protocol data including airdrops and points programs
 * No API key required!
 */

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

export interface AirdropInfo {
    projectName: string;
    description: string;
    url: string;
    defillamaSlug: string;
    confidence: number;
    source: string;
}

const DEFILLAMA_BASE_URL = "https://api.llama.fi";

/**
 * Fetch all DeFi protocols from DefiLlama
 */
export async function fetchDefiLlamaProtocols(): Promise<DefiLlamaProtocol[]> {
    try {
        const response = await fetch(`${DEFILLAMA_BASE_URL}/protocols`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; CryptoToolsDirectory/1.0)",
            },
        });

        if (!response.ok) {
            throw new Error(`DefiLlama API error: ${response.status}`);
        }

        const protocols: DefiLlamaProtocol[] = await response.json();
        return protocols;
    } catch (error) {
        console.error("Error fetching DefiLlama protocols:", error);
        throw error;
    }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace("www.", "");
    } catch {
        return "";
    }
}

/**
 * Check if a protocol likely has an airdrop/points program
 * Based on keywords in description, category, and recent activity
 */
function hasLikelyAirdrop(protocol: DefiLlamaProtocol): boolean {
    const airdropKeywords = [
        "airdrop",
        "points",
        "rewards",
        "incentive",
        "testnet",
        "early user",
        "loyalty program",
        "token launch",
        "governance token",
        "upcoming token",
    ];

    const description = (protocol.description || "").toLowerCase();
    const category = (protocol.category || "").toLowerCase();

    // Check for airdrop keywords
    const hasKeyword = airdropKeywords.some(
        (keyword) => description.includes(keyword) || category.includes(keyword)
    );

    // Check if it's a newer protocol (listed in last 2 years)
    const twoYearsAgo = Date.now() / 1000 - 2 * 365 * 24 * 60 * 60;
    const isRecent = protocol.listedAt > twoYearsAgo;

    // Check if it has significant TVL but no token yet (potential airdrop)
    const hasNoToken = !protocol.gecko_id && !protocol.cmcId;
    const hasSignificantTvl = protocol.tvl > 1000000; // $1M+

    return hasKeyword || (isRecent && hasNoToken && hasSignificantTvl);
}

/**
 * Convert DefiLlama protocol to airdrop info
 */
export function protocolToAirdropInfo(protocol: DefiLlamaProtocol): AirdropInfo | null {
    if (!hasLikelyAirdrop(protocol)) {
        return null;
    }

    // Calculate confidence based on signals
    let confidence = 0.5; // Base confidence

    const description = (protocol.description || "").toLowerCase();

    if (description.includes("airdrop") || description.includes("points")) {
        confidence = 0.9;
    } else if (description.includes("rewards") || description.includes("incentive")) {
        confidence = 0.8;
    } else if (description.includes("testnet") || description.includes("early user")) {
        confidence = 0.75;
    }

    // Boost confidence for protocols with high TVL
    if (protocol.tvl > 100000000) { // $100M+
        confidence = Math.min(confidence + 0.1, 1.0);
    }

    return {
        projectName: protocol.name,
        description: protocol.description || `${protocol.name} is a ${protocol.category} protocol on ${protocol.chains.join(", ")}.`,
        url: protocol.url,
        defillamaSlug: protocol.slug,
        confidence,
        source: "defillama",
    };
}

/**
 * Match DefiLlama protocol to existing tool by domain
 */
export function matchProtocolToTool(
    protocol: DefiLlamaProtocol,
    tools: Array<{ id: string; name: string; domain: string }>
): { toolId: string; toolName: string } | null {
    const protocolDomain = extractDomain(protocol.url);

    if (!protocolDomain) {
        return null;
    }

    // Try exact domain match
    const exactMatch = tools.find((tool) => tool.domain === protocolDomain);
    if (exactMatch) {
        return { toolId: exactMatch.id, toolName: exactMatch.name };
    }

    // Try fuzzy name match
    const normalizedProtocolName = protocol.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const fuzzyMatch = tools.find((tool) => {
        const normalizedToolName = tool.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        return normalizedToolName === normalizedProtocolName;
    });

    if (fuzzyMatch) {
        return { toolId: fuzzyMatch.id, toolName: fuzzyMatch.name };
    }

    return null;
}

/**
 * Sync airdrops from DefiLlama to database
 */
export async function syncDefiLlamaAirdrops(
    existingTools: Array<{ id: string; name: string; domain: string; airdropConfidence: number | null }>
): Promise<{
    matched: number;
    updated: number;
    skipped: number;
    errors: string[];
}> {
    const stats = {
        matched: 0,
        updated: 0,
        skipped: 0,
        errors: [] as string[],
    };

    try {
        const protocols = await fetchDefiLlamaProtocols();

        for (const protocol of protocols) {
            try {
                const airdropInfo = protocolToAirdropInfo(protocol);

                if (!airdropInfo) {
                    continue; // No likely airdrop
                }

                const match = matchProtocolToTool(protocol, existingTools);

                if (!match) {
                    stats.skipped++;
                    continue; // No matching tool found
                }

                stats.matched++;

                // Only update if DefiLlama confidence is higher or no existing airdrop
                const existingTool = existingTools.find((t) => t.id === match.toolId);
                const existingConfidence = existingTool?.airdropConfidence || 0;

                if (airdropInfo.confidence > existingConfidence) {
                    stats.updated++;
                    // Update will be done by the caller using this info
                }
            } catch (error) {
                stats.errors.push(`Error processing ${protocol.name}: ${error}`);
            }
        }
    } catch (error) {
        stats.errors.push(`Error fetching protocols: ${error}`);
    }

    return stats;
}
