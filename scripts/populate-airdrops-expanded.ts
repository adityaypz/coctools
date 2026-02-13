/**
 * EXPANDED Script to populate airdrop data - includes lesser-known opportunities
 * Run with: npx tsx scripts/populate-airdrops-expanded.ts
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

// EXPANDED: Known active airdrops including lesser-known opportunities
const KNOWN_AIRDROPS: Record<string, { details: string; endDate?: string }> = {
    // Major Layer 2s & Chains
    "scroll.io": {
        details: "Scroll Marks Program: Earn marks by bridging assets, providing liquidity on Scroll DEXs (Ambient, Nuri, SyncSwap), and interacting with dApps. Marks may convert to future SCR token.",
    },
    "linea.build": {
        details: "Linea Voyage: Earn LXP and LXP-L points by bridging to Linea, using DeFi protocols (Velocore, Lynex, Horizon), NFT platforms, and gaming dApps. Points expected to convert to LINEA token.",
    },
    "zksync.io": {
        details: "zkSync Era ecosystem incentives. Bridge assets, trade on DEXs (SyncSwap, Mute, SpaceFi), provide liquidity, use zkSync native dApps. Active users may qualify for additional ZK distributions.",
    },
    "blast.io": {
        details: "Blast Gold & Points: Earn native yield on deposited ETH/USDB (4% ETH, 5% stablecoins) + accumulate Blast Points through DeFi activity. Gold earned via dApp usage converts to airdrop allocation.",
    },
    "base.org": {
        details: "Base Ecosystem Growth: Coinbase's L2 with no official token yet, but ecosystem projects offering points. Use Base mainnet, bridge via official bridge, interact with BaseSwap, Aerodrome, Seamless Protocol.",
    },
    "starknet.io": {
        details: "StarkNet DeFi Spring: Ongoing incentives for using StarkNet DeFi (Ekubo, Nostra, zkLend, mySwap). STRK token already distributed but more ecosystem rewards expected.",
    },
    "monad.xyz": {
        details: "Monad Testnet: High-performance EVM L1 with anticipated mainnet Q2 2024. Active testnet participants, developers, and community members expected to receive token allocation.",
    },
    "berachain.com": {
        details: "Berachain Proof of Liquidity Testnet: Provide liquidity on BEX, lend on Bend, use Berps. BGT token distribution expected for active testnet users. Mainnet launch anticipated 2024.",
    },
    "taiko.xyz": {
        details: "Taiko Based Rollup: Ethereum-equivalent ZK-Rollup. Bridge to Taiko, use native dApps, provide liquidity. Early users and testnet participants may qualify for TAIKO token distribution.",
    },
    "manta.network": {
        details: "Manta Pacific L2: Modular L2 with native yield. New Paradigm program offers points for bridging, staking, and DeFi activity. Points convert to ecosystem rewards.",
    },

    // DeFi Protocols - Major
    "eigenlayer.xyz": {
        details: "EigenLayer Restaking: Deposit LSTs (stETH, rETH, cbETH) to earn restaking rewards + EIGEN points. Multiple seasons active. Liquid restaking via Renzo, Puffer, Kelp also eligible.",
    },
    "symbiotic.fi": {
        details: "Symbiotic Restaking: Alternative to EigenLayer. Stake wstETH, rETH, mETH to earn Symbiotic points. Partnerships with Lido, Mellow Finance. Token distribution expected Q2 2024.",
    },
    "pendle.finance": {
        details: "Pendle Yield Trading: Trade and provide liquidity for yield tokens (PT/YT). Earn PENDLE rewards + partner protocol airdrops (Ethena, Renzo, Puffer). vePENDLE holders get boosted rewards.",
    },
    "aave.com": {
        details: "Aave V3 Incentives: Borrow GHO stablecoin at discounted rates with stkAAVE. Participate in Aave governance, earn safety module rewards. Multichain deployment (Ethereum, Polygon, Arbitrum, Optimism).",
    },
    "lido.fi": {
        details: "Lido Liquid Staking: Stake ETH for stETH (or wstETH) and maintain liquidity. Use stETH across DeFi for additional yield. Participate in Lido DAO governance with LDO tokens.",
    },
    "ethena.fi": {
        details: "Ethena Sats Campaign Season 2: Stake USDe or sUSDe to earn Sats points. Provide liquidity on Curve, Pendle. Early participants get multipliers. Sats convert to ENA token allocations.",
    },
    "hyperliquid.xyz": {
        details: "HyperLiquid Points: Trade perpetuals on HyperLiquid DEX to earn points based on volume, fees paid, and activity. Points convert to HYPE token. No KYC, fully on-chain orderbook.",
    },
    "dydx.exchange": {
        details: "dYdX V4 Trading Rewards: Earn DYDX tokens through trading volume on the decentralized perpetuals exchange. Stake DYDX for governance and fee discounts. Fully decentralized on Cosmos.",
    },
    "gmx.io": {
        details: "GMX V2 Rewards: Stake GMX or provide GLP/GM liquidity to earn protocol fees (ETH/AVAX), esGMX vesting rewards, and multiplier points. Available on Arbitrum and Avalanche.",
    },
    "uniswap.org": {
        details: "Uniswap V3/V4 Liquidity Mining: Provide concentrated liquidity on Uniswap to earn trading fees. Participate in UNI governance. V4 hooks enable custom incentive programs.",
    },
    "curve.fi": {
        details: "Curve Gauge Voting: Lock CRV for veCRV to earn boosted yields (up to 2.5x) on Curve pools, governance voting power, and protocol fee share. Vote for gauge weights to direct CRV emissions.",
    },
    "jupiter.ag": {
        details: "Jupiter JUP Staking: Stake JUP tokens to participate in governance and earn from upcoming JUP reward seasons. Active traders on Jupiter aggregator may qualify for future distributions.",
    },

    // DeFi - Lesser Known but Active
    "renzo.protocol": {
        details: "Renzo ezPoints: Liquid restaking on EigenLayer. Deposit ETH/LSTs for ezETH and earn ezPoints. Use ezETH in DeFi (Pendle, Curve, Balancer) for additional yields. REZ token distribution completed, more seasons expected.",
    },
    "puffer.fi": {
        details: "Puffer Finance Points: Native liquid restaking. Stake ETH for pufETH and earn Puffer Points + EigenLayer points. Lower entry barrier (1 ETH) for solo staking. Token launch expected Q2 2024.",
    },
    "kelpdao.xyz": {
        details: "Kelp DAO Miles: Liquid restaking with rsETH. Earn Kelp Miles + EigenLayer points. Integrated with DeFi protocols for additional yield opportunities. KELP token distribution expected.",
    },
    "etherfi.com": {
        details: "Ether.fi Loyalty Points: Stake ETH for eETH (liquid restaking). Earn Loyalty Points + EigenLayer points. Participate in ether.fi DAO. ETHFI token already distributed, more seasons active.",
    },
    "morpho.org": {
        details: "Morpho Optimizers: Improved lending rates on Aave/Compound through peer-to-peer matching. Use Morpho Blue for permissionless lending markets. Early users may qualify for MORPHO token distribution.",
    },
    "gearbox.fi": {
        details: "Gearbox Leverage Farming: Get up to 10x leverage for DeFi farming on Curve, Uniswap, Balancer. Earn GEAR tokens through liquidity provision and usage. Participate in Gearbox DAO governance.",
    },
    "radiant.capital": {
        details: "Radiant Capital Omnichain Lending: Cross-chain money market on Arbitrum, BSC, Ethereum. Earn RDNT rewards for lending/borrowing. Lock RDNT for boosted APY and governance rights.",
    },
    "maverick.protocol": {
        details: "Maverick AMM: Directional liquidity provision with automated position management. Earn MAV tokens through liquidity mining. Active on Ethereum, zkSync Era, Base.",
    },
    "ambient.finance": {
        details: "Ambient Finance: Next-gen DEX with concentrated liquidity. Provide liquidity on Scroll, Blast to earn trading fees + potential token rewards. Efficient capital deployment.",
    },

    // NFT & Gaming
    "opensea.io": {
        details: "OpenSea Loyalty Rewards: Active traders and creators may qualify for future OpenSea token or incentive programs. Use OpenSea Pro for advanced trading features.",
    },
    "blur.io": {
        details: "Blur Season 3 Active: List NFTs with competitive pricing, place bids on collections, lend with Blend protocol. Earn BLUR tokens across multiple seasons. Blast integration for additional rewards.",
    },
    "magiceden.io": {
        details: "Magic Eden Multi-Chain: Leading NFT marketplace on Solana, Bitcoin, Polygon, Ethereum. Active users may qualify for future ME token distribution. Diamond rewards program active.",
    },
    "parallel.life": {
        details: "Parallel TCG: Sci-fi trading card game with play-to-earn mechanics. Earn PRIME tokens through gameplay, staking cards, and participating in tournaments. Active esports scene.",
    },
    "treasure.lol": {
        details: "Treasure DAO: Gaming ecosystem on Arbitrum. Play games (Bridgeworld, The Beacon, Realm), stake MAGIC tokens, provide liquidity. Earn rewards across interconnected gaming metaverse.",
    },

    // Infrastructure & Data
    "chainlink.com": {
        details: "Chainlink Staking v0.2: Stake LINK in community pool (up to 45M LINK cap) to earn staking rewards (4-7% APY) and support oracle network security. Participate in Chainlink BUILD program.",
    },
    "thegraph.com": {
        details: "The Graph Indexing: Delegate GRT to indexers to earn ~10% APY, or curate subgraphs for curation rewards. Essential infrastructure for Web3 data querying.",
    },
    "celestia.org": {
        details: "Celestia Modular DA: Stake TIA tokens (~15% APY) to secure the first modular data availability layer. Ecosystem projects may snapshot TIA holders for airdrops.",
    },
    "pyth.network": {
        details: "Pyth Network: Oracle network for high-fidelity price feeds. PYTH token staking active. Publishers and data consumers may qualify for additional rewards. Integrated across 40+ chains.",
    },
    "api3.org": {
        details: "API3 First-Party Oracles: Stake API3 tokens in DAO pool to earn staking rewards and participate in governance. First-party oracles eliminate third-party risk.",
    },

    // Emerging & Testnet Opportunities
    "fuel.network": {
        details: "Fuel Modular Execution Layer: Fastest modular execution layer. Active testnet with points program. Build or use dApps on Fuel testnet to earn points for future FUEL token distribution.",
    },
    "aztec.network": {
        details: "Aztec Privacy L2: Programmable privacy on Ethereum. Testnet active with developer grants. Early builders and testnet users expected to receive token allocation.",
    },
    "eclipse.xyz": {
        details: "Eclipse SVM L2: Solana Virtual Machine on Ethereum. Testnet active. Bridge assets, use dApps, provide liquidity. Early users may qualify for ECLIPSE token.",
    },
    "movement.xyz": {
        details: "Movement Labs: Move-based L2 on Ethereum. Testnet incentives for developers and users. Build with Move language or interact with testnet dApps for potential rewards.",
    },
    "initia.xyz": {
        details: "Initia Omnitia: Interwoven rollups architecture. Testnet active with missions program. Complete tasks, build apps, provide feedback to earn points for INIT token distribution.",
    },
};

async function main() {
    console.log("🚀 Populating EXPANDED airdrop data...\n");

    const tools = await prisma.tool.findMany({
        select: { id: true, name: true, domain: true, hasAirdrop: true, status: true },
    });

    console.log(`📦 Found ${tools.length} tools in database\n`);

    let updated = 0;
    let alreadySet = 0;

    for (const tool of tools) {
        const domain = tool.domain.replace("www.", "");
        const airdropInfo = KNOWN_AIRDROPS[domain];

        if (airdropInfo) {
            if (tool.hasAirdrop) {
                // Update existing airdrop with potentially new details
                await prisma.tool.update({
                    where: { id: tool.id },
                    data: {
                        airdropDetails: airdropInfo.details,
                        airdropLastCheck: new Date(),
                    },
                });
                console.log(`🔄 ${tool.name} → updated details`);
                alreadySet++;
            } else {
                // Set new airdrop
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

                if (tool.status === "draft") {
                    await prisma.tool.update({
                        where: { id: tool.id },
                        data: { status: "reviewed" },
                    });
                }

                console.log(`✅ ${tool.name} → NEW airdrop set!`);
                updated++;
            }
        }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ ${updated} NEW airdrops added`);
    console.log(`🔄 ${alreadySet} existing airdrops updated`);
    console.log(`📊 ${updated + alreadySet} total active airdrops`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    await prisma.$disconnect();
}

main().catch(console.error);
