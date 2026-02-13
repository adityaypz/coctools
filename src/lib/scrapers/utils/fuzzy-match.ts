import * as fuzz from "fuzzball";

/**
 * Fuzzy matching utility for matching airdrop project names to tools
 */

export interface MatchResult {
    toolId: string;
    toolName: string;
    confidence: number;
    matchType: "exact_domain" | "fuzzy_name" | "alias";
}

/**
 * Manual domain mappings for common edge cases
 */
const DOMAIN_ALIASES: Record<string, string[]> = {
    "uniswap.org": ["uniswap", "uni"],
    "aave.com": ["aave"],
    "curve.fi": ["curve", "curve finance"],
    "lido.fi": ["lido"],
    "blast.io": ["blast"],
    "scroll.io": ["scroll"],
    "zksync.io": ["zksync", "zk sync"],
    "starknet.io": ["starknet", "stark"],
    "arbitrum.io": ["arbitrum"],
    "optimism.io": ["optimism", "op"],
    "base.org": ["base"],
    "linea.build": ["linea"],
};

/**
 * Normalize project name for matching
 */
function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .trim();
}

/**
 * Match airdrop project to tools in database
 */
export function matchProject(
    airdropName: string,
    tools: Array<{ id: string; name: string; domain: string }>
): MatchResult | null {
    const normalizedAirdrop = normalizeName(airdropName);

    // Strategy 1: Exact domain match
    for (const tool of tools) {
        const domain = tool.domain.replace("www.", "");
        if (normalizedAirdrop.includes(domain.split(".")[0])) {
            return {
                toolId: tool.id,
                toolName: tool.name,
                confidence: 1.0,
                matchType: "exact_domain",
            };
        }

        // Check aliases
        const aliases = DOMAIN_ALIASES[domain] || [];
        for (const alias of aliases) {
            if (normalizedAirdrop.includes(alias)) {
                return {
                    toolId: tool.id,
                    toolName: tool.name,
                    confidence: 0.95,
                    matchType: "alias",
                };
            }
        }
    }

    // Strategy 2: Fuzzy name matching
    const similarities = tools.map(tool => ({
        tool,
        score: fuzz.ratio(normalizedAirdrop, normalizeName(tool.name)) / 100,
    }));

    // Sort by score descending
    similarities.sort((a, b) => b.score - a.score);
    const best = similarities[0];

    // Only return if confidence > 80%
    if (best && best.score > 0.8) {
        return {
            toolId: best.tool.id,
            toolName: best.tool.name,
            confidence: best.score,
            matchType: "fuzzy_name",
        };
    }

    // No confident match found
    return null;
}

/**
 * Add manual domain alias
 */
export function addDomainAlias(domain: string, aliases: string[]) {
    DOMAIN_ALIASES[domain] = [...(DOMAIN_ALIASES[domain] || []), ...aliases];
}
