import prisma from "@/lib/prisma";
import AirdropsPageClient from "./client";

export const dynamic = "force-dynamic";

// Domains that should NEVER show as airdrops (display-level safety net)
const EXCLUDED_AIRDROP_DOMAINS = new Set([
    // Exchanges
    "coinbase.com", "binance.com", "kraken.com", "okx.com", "bybit.com",
    "bitget.com", "kucoin.com", "gate.io", "htx.com", "mexc.com",
    "bitfinex.com", "gemini.com", "crypto.com", "upbit.com", "bithumb.com",
    // Wallets
    "phantom.app", "metamask.io", "trustwallet.com", "rabby.io", "rainbow.me",
    "zerion.io", "zapper.xyz", "exodus.com", "ledger.com",
    // Completed airdrops / established chains with tokens
    "uniswap.org", "optimism.io", "arbitrum.io", "zksync.io", "starknet.io",
    "scroll.io", "blast.io", "blur.io", "dydx.exchange", "hop.exchange",
    "across.to", "connext.network", "safe.global", "cow.fi", "paraswap.io",
    "1inch.io", "looksrare.org", "x2y2.io",
    "polygon.technology", "avalanche.com", "solana.com", "near.org",
    // Infrastructure with tokens
    "chainlink.com", "thegraph.com", "filecoin.io", "arweave.org",
    // Already distributed
    "celestia.org", "jito.network", "jupiter.ag", "wormhole.com",
    "pyth.network", "zetachain.com", "altlayer.io", "manta.network",
    "sei.io", "ethena.fi", "ondo.finance", "eigenlayer.xyz",
    "layerzero.foundation", "aptos.dev", "sui.io",
]);

export default async function AirdropsPage() {
    // Fetch all tools with active airdrops
    const airdropTools = await prisma.tool.findMany({
        where: {
            hasAirdrop: true,
            status: { in: ["reviewed", "featured"] },
        },
        orderBy: [
            { status: "asc" }, // featured first
            { airdropConfidence: "desc" }, // highest confidence first
            { popularity: "desc" },
            { clicks: "desc" },
        ],
    });

    // Filter out known false positives at display level
    const filteredTools = airdropTools.filter(tool => {
        const domain = tool.domain.replace("www.", "");
        return !EXCLUDED_AIRDROP_DOMAINS.has(domain);
    });

    // Serialize dates for client component
    const serializedTools = filteredTools.map(tool => ({
        ...tool,
        createdAt: tool.createdAt.toISOString(),
        airdropEndDate: tool.airdropEndDate ? tool.airdropEndDate.toISOString() : null,
        airdropLastCheck: tool.airdropLastCheck ? tool.airdropLastCheck.toISOString() : null,
    }));

    return <AirdropsPageClient tools={serializedTools as any} />;
}
