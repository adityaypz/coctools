/**
 * Keyword-based category inference for crypto/web3 tools.
 */

const CATEGORY_KEYWORDS: Record<string, string[]> = {
    Exchanges: ["exchange", "binance", "coinbase", "kraken", "uniswap", "pancakeswap", "dydx", "bybit", "okx", "kucoin", "gate.io", "bitfinex", "gemini", "trade", "swap", "dex"],
    Wallets: ["wallet", "metamask", "phantom", "ledger", "trezor", "trust wallet", "rainbow", "argent", "coinbase wallet", "exodus", "safe", "gnosis"],
    DeFi: ["defi", "aave", "compound", "curve", "maker", "lido", "yearn", "convex", "balancer", "liquidity", "yield", "lending", "borrow"],
    NFT: ["nft", "opensea", "blur", "magic eden", "rarible", "foundation", "superrare", "zora", "manifold", "nifty", "collectible", "marketplace"],
    Trading: ["trading", "tradingview", "coinglass", "chart", "technical analysis", "futures", "perpetual", "leverage", "margin"],
    Analytics: ["analytics", "dune", "nansen", "defillama", "glassnode", "chainalysis", "etherscan", "bscscan", "polygonscan", "explorer", "data", "metrics", "dashboard"],
    "Developer Tools": ["developer", "hardhat", "foundry", "truffle", "remix", "alchemy", "infura", "quicknode", "the graph", "chainlink", "api", "rpc", "node", "sdk", "web3.js", "ethers.js", "viem"],
    DAOs: ["dao", "snapshot", "aragon", "colony", "tally", "boardroom", "governance", "voting", "proposal"],
    Bridges: ["bridge", "hop", "across", "stargate", "synapse", "multichain", "wormhole", "layerzero", "cross-chain"],
    "Layer 2": ["layer 2", "l2", "arbitrum", "optimism", "polygon", "zksync", "starknet", "scroll", "base", "linea", "rollup", "scaling"],
    Staking: ["staking", "stake", "validator", "lido", "rocket pool", "frax", "rewards", "steth"],
    Lending: ["lending", "borrow", "aave", "compound", "maker", "liquity", "euler", "radiant", "loan", "collateral"],
    Derivatives: ["derivatives", "perpetual", "futures", "options", "gmx", "gains", "kwenta", "lyra", "ribbon", "dopex"],
    Launchpads: ["launchpad", "ido", "ico", "token sale", "presale", "dao maker", "polkastarter", "seedify"],
    Gaming: ["gaming", "game", "play to earn", "p2e", "axie", "immutable", "gala", "sandbox", "decentraland", "nft game"],
    Metaverse: ["metaverse", "virtual", "decentraland", "sandbox", "otherside", "spatial", "vr", "virtual world"],
    Infrastructure: ["infrastructure", "node", "rpc", "indexer", "oracle", "chainlink", "api3", "pyth", "band protocol", "cloud"],
    Security: ["security", "audit", "certik", "peckshield", "slowmist", "immunefi", "bug bounty", "multisig", "safe", "fireblocks"],
    Portfolio: ["portfolio", "tracker", "zapper", "zerion", "debank", "rotki", "cointracker", "koinly", "tax"],
    News: ["news", "media", "blog", "cointelegraph", "coindesk", "decrypt", "the block", "defiant", "bankless"],
};

/**
 * Infer categories from title, description, and domain.
 * Returns an array of matched category names. Defaults to ["Other"].
 */
export function inferCategories(
    title: string,
    description: string | null,
    domain: string
): string[] {
    const text = [title, description || "", domain].join(" ").toLowerCase();

    const matched: string[] = [];
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const kw of keywords) {
            if (text.includes(kw)) {
                matched.push(category);
                break;
            }
        }
    }

    // Cap at 3 categories
    if (matched.length > 3) {
        return matched.slice(0, 3);
    }
    return matched.length > 0 ? matched : ["Other"];
}
