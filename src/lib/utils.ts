import slugify from "slugify";

/**
 * Generates a URL-safe slug from a name.
 */
export function generateSlug(name: string): string {
    return slugify(name, { lower: true, strict: true, trim: true });
}

/**
 * Crypto-focused categories for tools.
 */
export const CATEGORIES = [
    "Exchanges",
    "Wallets",
    "DeFi",
    "NFT",
    "Trading",
    "Analytics",
    "AI",
    "Developer Tools",
    "DAOs",
    "Bridges",
    "Layer 2",
    "Staking",
    "Lending",
    "Derivatives",
    "Launchpads",
    "Gaming",
    "Metaverse",
    "Infrastructure",
    "Security",
    "Portfolio",
    "News",
    "Other",
] as const;
