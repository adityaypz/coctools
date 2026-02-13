import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Decode direct URL from prisma+postgres:// connection
function getConnectionString(): string {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL not set");
    if (url.startsWith("prisma+postgres://") || url.startsWith("prisma://")) {
        const apiKey = new URL(url).searchParams.get("api_key");
        if (apiKey) {
            try {
                const decoded = JSON.parse(Buffer.from(apiKey, "base64").toString("utf-8"));
                if (decoded.databaseUrl) return decoded.databaseUrl;
            } catch { }
        }
    }
    return url;
}

const adapter = new PrismaPg({ connectionString: getConnectionString() });
const prisma = new PrismaClient({ adapter });

// 100+ crypto/web3 tool URLs with popularity scores (100 = most popular)
const CRYPTO_TOOLS: Array<{ url: string; popularity: number }> = [
    // ── Exchanges (Popularity: 90-100) ────────────────
    { url: "https://www.binance.com", popularity: 100 },
    { url: "https://www.coinbase.com", popularity: 98 },
    { url: "https://www.kraken.com", popularity: 95 },
    { url: "https://uniswap.org", popularity: 97 },
    { url: "https://pancakeswap.finance", popularity: 92 },
    { url: "https://dydx.exchange", popularity: 90 },
    { url: "https://www.bybit.com", popularity: 93 },
    { url: "https://www.okx.com", popularity: 91 },
    { url: "https://www.kucoin.com", popularity: 89 },
    { url: "https://www.gate.io", popularity: 85 },
    { url: "https://curve.fi", popularity: 94 },
    { url: "https://balancer.fi", popularity: 82 },
    { url: "https://sushi.com", popularity: 88 },
    { url: "https://www.gemini.com", popularity: 87 },

    // ── Wallets (Popularity: 85-98) ───────────────────
    { url: "https://metamask.io", popularity: 98 },
    { url: "https://phantom.app", popularity: 95 },
    { url: "https://www.ledger.com", popularity: 94 },
    { url: "https://trezor.io", popularity: 92 },
    { url: "https://trustwallet.com", popularity: 91 },
    { url: "https://rainbow.me", popularity: 88 },
    { url: "https://www.argent.xyz", popularity: 85 },
    { url: "https://www.exodus.com", popularity: 86 },
    { url: "https://safe.global", popularity: 90 },
    { url: "https://www.coinbase.com/wallet", popularity: 89 },
    { url: "https://rabby.io", popularity: 83 },

    // ── DeFi (Popularity: 80-96) ──────────────────────
    { url: "https://aave.com", popularity: 96 },
    { url: "https://compound.finance", popularity: 94 },
    { url: "https://makerdao.com", popularity: 93 },
    { url: "https://lido.fi", popularity: 95 },
    { url: "https://yearn.finance", popularity: 88 },
    { url: "https://convexfinance.com", popularity: 82 },
    { url: "https://www.rocketpool.net", popularity: 87 },
    { url: "https://frax.finance", popularity: 84 },
    { url: "https://liquity.org", popularity: 81 },
    { url: "https://euler.finance", popularity: 78 },
    { url: "https://radiant.capital", popularity: 76 },

    // ── NFT (Popularity: 75-95) ───────────────────────
    { url: "https://opensea.io", popularity: 95 },
    { url: "https://blur.io", popularity: 92 },
    { url: "https://magiceden.io", popularity: 90 },
    { url: "https://rarible.com", popularity: 85 },
    { url: "https://foundation.app", popularity: 82 },
    { url: "https://superrare.com", popularity: 80 },
    { url: "https://zora.co", popularity: 83 },
    { url: "https://manifold.xyz", popularity: 78 },
    { url: "https://niftygateway.com", popularity: 77 },
    { url: "https://looksrare.org", popularity: 75 },

    // ── Trading & Analytics (Popularity: 70-94) ───────
    { url: "https://www.tradingview.com", popularity: 94 },
    { url: "https://www.coingecko.com", popularity: 93 },
    { url: "https://coinmarketcap.com", popularity: 92 },
    { url: "https://dune.com", popularity: 91 },
    { url: "https://www.nansen.ai", popularity: 89 },
    { url: "https://defillama.com", popularity: 90 },
    { url: "https://www.glassnode.com", popularity: 86 },
    { url: "https://etherscan.io", popularity: 95 },
    { url: "https://bscscan.com", popularity: 88 },
    { url: "https://polygonscan.com", popularity: 87 },
    { url: "https://arbiscan.io", popularity: 84 },
    { url: "https://optimistic.etherscan.io", popularity: 82 },
    { url: "https://www.coinglass.com", popularity: 80 },
    { url: "https://coincodex.com", popularity: 72 },
    { url: "https://messari.io", popularity: 79 },

    // ── Developer Tools (Popularity: 75-92) ───────────
    { url: "https://hardhat.org", popularity: 92 },
    { url: "https://getfoundry.sh", popularity: 90 },
    { url: "https://www.alchemy.com", popularity: 91 },
    { url: "https://www.infura.io", popularity: 89 },
    { url: "https://thegraph.com", popularity: 88 },
    { url: "https://chain.link", popularity: 93 },
    { url: "https://www.quicknode.com", popularity: 85 },
    { url: "https://remix.ethereum.org", popularity: 87 },
    { url: "https://trufflesuite.com", popularity: 82 },
    { url: "https://tenderly.co", popularity: 81 },
    { url: "https://moralis.io", popularity: 80 },
    { url: "https://www.ankr.com", popularity: 78 },
    { url: "https://viem.sh", popularity: 83 },
    { url: "https://wagmi.sh", popularity: 84 },

    // ── DAOs & Governance (Popularity: 70-88) ─────────
    { url: "https://snapshot.org", popularity: 88 },
    { url: "https://www.tally.xyz", popularity: 85 },
    { url: "https://aragon.org", popularity: 82 },
    { url: "https://boardroom.io", popularity: 78 },
    { url: "https://colony.io", popularity: 72 },
    { url: "https://www.withtally.com", popularity: 76 },

    // ── Bridges (Popularity: 70-86) ───────────────────
    { url: "https://hop.exchange", popularity: 86 },
    { url: "https://across.to", popularity: 83 },
    { url: "https://stargate.finance", popularity: 84 },
    { url: "https://synapseprotocol.com", popularity: 80 },
    { url: "https://wormhole.com", popularity: 82 },
    { url: "https://layerzero.network", popularity: 85 },
    { url: "https://cbridge.celer.network", popularity: 76 },
    { url: "https://connext.network", popularity: 74 },

    // ── Layer 2 (Popularity: 75-92) ───────────────────
    { url: "https://arbitrum.io", popularity: 92 },
    { url: "https://www.optimism.io", popularity: 90 },
    { url: "https://polygon.technology", popularity: 91 },
    { url: "https://zksync.io", popularity: 88 },
    { url: "https://starknet.io", popularity: 85 },
    { url: "https://scroll.io", popularity: 82 },
    { url: "https://base.org", popularity: 89 },
    { url: "https://linea.build", popularity: 81 },
    { url: "https://www.mantle.xyz", popularity: 78 },

    // ── Derivatives & Perps (Popularity: 70-88) ───────
    { url: "https://gmx.io", popularity: 88 },
    { url: "https://gains.trade", popularity: 82 },
    { url: "https://kwenta.io", popularity: 80 },
    { url: "https://www.lyra.finance", popularity: 76 },
    { url: "https://www.ribbon.finance", popularity: 77 },
    { url: "https://www.dopex.io", popularity: 73 },
    { url: "https://www.dydx.exchange", popularity: 86 },

    // ── Launchpads (Popularity: 65-80) ────────────────
    { url: "https://daomaker.com", popularity: 80 },
    { url: "https://polkastarter.com", popularity: 78 },
    { url: "https://seedify.fund", popularity: 75 },
    { url: "https://www.trustswap.com", popularity: 68 },
    { url: "https://www.gamefi.org", popularity: 70 },

    // ── Gaming & Metaverse (Popularity: 65-85) ────────
    { url: "https://axieinfinity.com", popularity: 85 },
    { url: "https://www.immutable.com", popularity: 83 },
    { url: "https://gala.com", popularity: 78 },
    { url: "https://www.sandbox.game", popularity: 82 },
    { url: "https://decentraland.org", popularity: 80 },
    { url: "https://otherside.xyz", popularity: 76 },
    { url: "https://www.stepn.com", popularity: 72 },
    { url: "https://illuvium.io", popularity: 74 },

    // ── Security & Audits (Popularity: 70-88) ─────────
    { url: "https://www.certik.com", popularity: 88 },
    { url: "https://immunefi.com", popularity: 84 },
    { url: "https://www.peckshield.com", popularity: 80 },
    { url: "https://www.slowmist.com", popularity: 78 },
    { url: "https://www.fireblocks.com", popularity: 82 },
    { url: "https://www.halborn.com", popularity: 75 },

    // ── Portfolio & Tax (Popularity: 70-86) ───────────
    { url: "https://zapper.xyz", popularity: 86 },
    { url: "https://zerion.io", popularity: 84 },
    { url: "https://debank.com", popularity: 85 },
    { url: "https://rotki.com", popularity: 76 },
    { url: "https://cointracker.io", popularity: 80 },
    { url: "https://koinly.io", popularity: 79 },
    { url: "https://www.accointing.com", popularity: 72 },

    // ── News & Media (Popularity: 70-88) ──────────────
    { url: "https://cointelegraph.com", popularity: 88 },
    { url: "https://www.coindesk.com", popularity: 87 },
    { url: "https://decrypt.co", popularity: 82 },
    { url: "https://www.theblock.co", popularity: 84 },
    { url: "https://thedefiant.io", popularity: 78 },
    { url: "https://www.bankless.com", popularity: 80 },
    { url: "https://cryptoslate.com", popularity: 75 },
];

// Collections with tool assignments
const COLLECTIONS = [
    {
        name: "DeFi Essentials",
        slug: "defi-essentials",
        description: "Core DeFi protocols for lending, borrowing, and yield farming",
        tools: ["aave.com", "compound.finance", "curve.fi", "lido.fi", "uniswap.org", "makerdao.com"],
    },
    {
        name: "NFT Marketplaces",
        slug: "nft-marketplaces",
        description: "Top platforms for buying, selling, and trading NFTs",
        tools: ["opensea.io", "blur.io", "magiceden.io", "rarible.com", "foundation.app", "zora.co"],
    },
    {
        name: "Trading Platforms",
        slug: "trading-platforms",
        description: "Centralized and decentralized exchanges for crypto trading",
        tools: ["www.binance.com", "www.coinbase.com", "uniswap.org", "dydx.exchange", "www.kraken.com", "pancakeswap.finance"],
    },
    {
        name: "Crypto Wallets",
        slug: "crypto-wallets",
        description: "Secure wallets for storing and managing your crypto assets",
        tools: ["metamask.io", "phantom.app", "www.ledger.com", "trezor.io", "trustwallet.com", "rainbow.me"],
    },
    {
        name: "Analytics & Data",
        slug: "analytics-data",
        description: "On-chain analytics, market data, and blockchain explorers",
        tools: ["dune.com", "www.nansen.ai", "defillama.com", "etherscan.io", "www.coingecko.com", "coinmarketcap.com"],
    },
    {
        name: "Developer Tools",
        slug: "developer-tools",
        description: "Essential tools for building Web3 applications",
        tools: ["hardhat.org", "getfoundry.sh", "www.alchemy.com", "www.infura.io", "thegraph.com", "chain.link"],
    },
    {
        name: "Layer 2 Solutions",
        slug: "layer-2-solutions",
        description: "Ethereum scaling solutions for faster and cheaper transactions",
        tools: ["arbitrum.io", "www.optimism.io", "polygon.technology", "zksync.io", "base.org", "starknet.io"],
    },
    {
        name: "Cross-Chain Bridges",
        slug: "cross-chain-bridges",
        description: "Bridge assets between different blockchain networks",
        tools: ["hop.exchange", "across.to", "stargate.finance", "wormhole.com", "layerzero.network"],
    },
];

// Simple metadata fetcher
async function fetchMeta(url: string) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8_000);
        const res = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0" },
            signal: controller.signal,
            redirect: "follow",
        });
        clearTimeout(timeout);
        if (!res.ok) return null;
        const html = await res.text();

        const getMetaContent = (html: string, prop: string) => {
            const re = new RegExp(`<meta[^>]*(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, "i");
            const re2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`, "i");
            return re.exec(html)?.[1] || re2.exec(html)?.[1] || null;
        };

        const title = getMetaContent(html, "og:title")
            || html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim()
            || null;

        const description = getMetaContent(html, "og:description")
            || getMetaContent(html, "description")
            || null;

        let imageUrl = getMetaContent(html, "og:image") || null;
        if (imageUrl && !imageUrl.startsWith("http")) {
            imageUrl = new URL(imageUrl, url).toString();
        }

        let faviconUrl: string | null = null;
        const iconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i)
            || html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
        if (iconMatch) {
            faviconUrl = iconMatch[1].startsWith("http") ? iconMatch[1] : new URL(iconMatch[1], url).toString();
        }

        return { title, description, imageUrl, faviconUrl };
    } catch {
        return null;
    }
}

// Category inference (same as categorize.ts)
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

function inferCategories(title: string, description: string | null, domain: string): string[] {
    const text = [title, description || "", domain].join(" ").toLowerCase();
    const matched: string[] = [];
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        for (const kw of keywords) {
            if (text.includes(kw)) { matched.push(category); break; }
        }
    }
    return matched.length > 0 ? matched.slice(0, 3) : ["Other"];
}

function slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

async function main() {
    console.log(`🌱 Seeding database with ${CRYPTO_TOOLS.length} crypto tools...\n`);

    // Clean existing
    await prisma.collectionTool.deleteMany();
    await prisma.collection.deleteMany();
    await prisma.tool.deleteMany();
    console.log("  Cleaned existing data.\n");

    let added = 0;
    let failed = 0;
    const toolsByDomain = new Map<string, string>(); // domain -> toolId

    for (const { url, popularity } of CRYPTO_TOOLS) {
        const domain = new URL(url).hostname.replace(/^www\./, "").toLowerCase();

        try {
            const meta = await fetchMeta(url);
            const title = meta?.title || domain;
            const description = meta?.description || null;
            const imageUrl = meta?.imageUrl || null;
            const faviconUrl = meta?.faviconUrl || `https://${domain}/favicon.ico`;
            const categories = inferCategories(title, description, domain);

            let slug = slugify(title);
            if (!slug) slug = slugify(domain);

            const existing = await prisma.tool.findUnique({ where: { slug } });
            if (existing) slug = `${slug}-${Date.now().toString(36)}`;

            const tool = await prisma.tool.create({
                data: {
                    name: title,
                    slug,
                    url,
                    domain,
                    pathKey: "",
                    description,
                    imageUrl,
                    faviconUrl,
                    categories,
                    popularity,
                    status: popularity >= 90 ? "featured" : "reviewed",
                    source: "seed",
                },
            });

            toolsByDomain.set(domain, tool.id);
            console.log(`  ✓ ${title} (${domain}) [${popularity}] → [${categories.join(", ")}]`);
            added++;
        } catch (err) {
            console.log(`  ✗ ${domain}: ${err instanceof Error ? err.message : "error"}`);
            failed++;
        }
    }

    // Create collections
    console.log(`\n📚 Creating ${COLLECTIONS.length} collections...\n`);
    for (const col of COLLECTIONS) {
        const collection = await prisma.collection.create({
            data: {
                name: col.name,
                slug: col.slug,
                description: col.description,
            },
        });

        for (const domain of col.tools) {
            const toolId = toolsByDomain.get(domain);
            if (toolId) {
                await prisma.collectionTool.create({
                    data: {
                        collectionId: collection.id,
                        toolId,
                    },
                });
            }
        }

        console.log(`  ✓ ${col.name} (${col.tools.length} tools)`);
    }

    console.log(`\n✅ Done! Added: ${added} tools, ${COLLECTIONS.length} collections, Failed: ${failed}`);
    await prisma.$disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
