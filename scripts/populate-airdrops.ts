/**
 * Script to populate airdrop data for known crypto projects
 * Run with: npx tsx scripts/populate-airdrops.ts
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function getConnectionString(): string {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL not set");

    if (url.startsWith("prisma+postgres://") || url.startsWith("prisma://")) {
        try {
            const apiKey = new URL(url).searchParams.get("api_key");
            if (apiKey) {
                const decoded = JSON.parse(Buffer.from(apiKey, "base64").toString("utf-8"));
                if (decoded.databaseUrl) return decoded.databaseUrl;
            }
        } catch (err) {
            console.error("Failed to decode:", err);
        }
    }
    return url;
}

const adapter = new PrismaPg({ connectionString: getConnectionString() });
const prisma = new PrismaClient({ adapter });

// Known active airdrops/incentive programs in the crypto space (Feb 2026)
const KNOWN_AIRDROPS: Record<string, { details: string; endDate?: string }> = {
    // Layer 2s & Chains
    "scroll.io": {
        details: "Scroll marks program active! Earn marks by bridging assets, providing liquidity on Scroll DEXs, and interacting with dApps on Scroll L2.",
    },
    "linea.build": {
        details: "Linea Voyage: Earn LXP points by bridging to Linea, using DeFi protocols, and participating in ecosystem activities. Points may convert to future token.",
    },
    "zksync.io": {
        details: "zkSync ecosystem incentives active. Use zkSync Era mainnet, bridge assets, trade on DEXs, provide liquidity, and interact with dApps to qualify for potential future rewards.",
    },
    "blast.io": {
        details: "Blast Gold & Points program. Earn yield on deposited ETH/stablecoins and accumulate Blast Points through DeFi activity on the Blast L2 network.",
    },
    "base.org": {
        details: "Base ecosystem growing rapidly. Active users on Base mainnet may qualify for future rewards. Bridge assets and use popular Base dApps.",
    },
    "starknet.io": {
        details: "StarkNet ecosystem incentives. Active users bridging to StarkNet and using DeFi protocols may qualify for STRK token distributions.",
    },
    "monad.xyz": {
        details: "Monad testnet active with anticipated mainnet launch. Early testnet participants and community members may qualify for future token distribution.",
    },
    "berachain.com": {
        details: "Berachain testnet live! Participate in Proof of Liquidity activities on testnet. BGT token distribution expected for active testnet users.",
    },

    // DeFi Protocols
    "eigenlayer.xyz": {
        details: "EigenLayer restaking points program. Deposit LSTs to earn restaking rewards and EIGEN token allocations. Multiple seasons of rewards available.",
    },
    "symbiotic.fi": {
        details: "Symbiotic restaking protocol with active points program. Stake assets to earn Symbiotic points for potential future token distribution.",
    },
    "pendle.finance": {
        details: "Pendle incentive program active. Provide liquidity, trade yield tokens, and earn vePENDLE rewards plus potential bonus airdrops from partner protocols.",
    },
    "aave.com": {
        details: "Aave GHO stablecoin incentives active. Borrow GHO at discounted rates with stkAAVE and earn additional rewards through ecosystem participation.",
    },
    "lido.fi": {
        details: "Lido staking rewards plus DeFi incentives. Stake ETH for stETH and use across DeFi for compounded yield opportunities.",
    },
    "ethena.fi": {
        details: "Ethena Sats Campaign active! Stake USDe or provide liquidity to earn Sats points. Multiple seasons with increasing rewards for early participants.",
    },
    "hyperliquid.xyz": {
        details: "Hyperliquid points program for traders. Trade perpetuals and earn points based on trading volume and activity. Points convert to HYPER tokens.",
    },
    "dydx.exchange": {
        details: "dYdX trading rewards active. Earn DYDX tokens through trading activity on the decentralized perpetuals platform.",
    },
    "gmx.io": {
        details: "GMX fee sharing and esGMX rewards. Stake GMX or GLP to earn protocol fees, esGMX vesting rewards, and multiplier points.",
    },
    "uniswap.org": {
        details: "Uniswap liquidity incentives on multiple chains. Provide liquidity on Uniswap V3/V4 to earn trading fees and potential protocol reward allocations.",
    },
    "curve.fi": {
        details: "Curve gauge voting rewards. Lock CRV for veCRV and earn boosted yields across Curve pools plus governance voting power.",
    },
    "jupiter.ag": {
        details: "Jupiter active user rewards. Trade on Jupiter aggregator and participate in JUP staking for governance and reward distribution seasons.",
    },

    // NFT & Gaming
    "opensea.io": {
        details: "OpenSea loyalty rewards for active traders and creators. Use the marketplace to potentially qualify for future incentive programs.",
    },
    "blur.io": {
        details: "Blur Season rewards active. List NFTs, bid on collections, and lend with Blend to earn BLUR token rewards across multiple seasons.",
    },

    // Infrastructure
    "chainlink.com": {
        details: "Chainlink staking v0.2 active. Stake LINK in community staker pool to earn staking rewards and support network security.",
    },
    "thegraph.com": {
        details: "The Graph indexer and delegator rewards. Delegate GRT to indexers or curate subgraphs to earn protocol rewards.",
    },
    "celestia.org": {
        details: "Celestia modular DA layer. Stake TIA tokens to earn staking rewards and potentially qualify for ecosystem airdrop snapshots.",
    },
};

async function main() {
    console.log("🚀 Populating airdrop data...\n");

    // Get all tools
    const tools = await prisma.tool.findMany({
        select: { id: true, name: true, domain: true, hasAirdrop: true, status: true },
    });

    console.log(`📦 Found ${tools.length} tools in database\n`);

    // Print all tools for debugging
    console.log("📋 All tools:");
    tools.forEach(t => console.log(`  ${t.name} | ${t.domain} | ${t.status}`));
    console.log();

    let updated = 0;

    for (const tool of tools) {
        const domain = tool.domain.replace("www.", "");
        const airdropInfo = KNOWN_AIRDROPS[domain];

        if (airdropInfo) {
            await prisma.tool.update({
                where: { id: tool.id },
                data: {
                    hasAirdrop: true,
                    airdropDetails: airdropInfo.details,
                    airdropSource: "curated",
                    airdropConfidence: 1.0,
                    airdropLastCheck: new Date(),
                    ...(airdropInfo.endDate ? { airdropEndDate: new Date(airdropInfo.endDate) } : {}),
                },
            });

            // Also ensure status is at least "reviewed" so it shows on the page
            if (tool.status === "draft") {
                await prisma.tool.update({
                    where: { id: tool.id },
                    data: { status: "reviewed" },
                });
            }

            console.log(`✅ ${tool.name} (${domain}) → airdrop set!`);
            updated++;
        }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Updated ${updated} tools with airdrop data`);
    console.log(`📊 ${tools.length} total tools in database`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    await prisma.$disconnect();
}

main().catch(console.error);
