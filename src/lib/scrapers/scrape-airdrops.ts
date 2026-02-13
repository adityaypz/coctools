import prisma from "../prisma";
import { CoinMarketCapScraper } from "./scrapers/coinmarketcap";
import { matchProject } from "./utils/fuzzy-match";
import { Logger } from "./utils/logger";
import { AirdropData } from "./utils/validator";

/**
 * Main Airdrop Scraper Orchestrator
 * Coordinates scraping from multiple sources and updates database
 */

export interface ScraperStats {
    timestamp: Date;
    duration: number;
    scraped: number;
    matched: number;
    updated: number;
    skipped: number;
    errors: string[];
}

export async function runAirdropScraper(): Promise<ScraperStats> {
    const startTime = Date.now();
    const logger = new Logger();
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
        logger.info("🚀 Starting airdrop scraper...");

        // Fetch all tools from database
        logger.info("📦 Fetching tools from database...");
        const tools = await prisma.tool.findMany({
            where: {
                status: { in: ["reviewed", "featured"] },
            },
            select: {
                id: true,
                name: true,
                domain: true,
                hasAirdrop: true,
            },
        });
        logger.success(`Found ${tools.length} tools in database`);

        // Scrape from CoinMarketCap
        const cmcScraper = new CoinMarketCapScraper(logger);
        const airdrops = await cmcScraper.scrape();
        stats.scraped = airdrops.length;

        if (airdrops.length === 0) {
            logger.warn("No airdrops found from any source");
            stats.duration = Date.now() - startTime;
            return stats;
        }

        // Match airdrops to tools and update database
        logger.info(`🔍 Matching ${airdrops.length} airdrops to tools...`);

        for (const airdrop of airdrops) {
            try {
                const match = matchProject(airdrop.projectName, tools);

                if (!match) {
                    logger.warn(`No match found for: ${airdrop.projectName}`);
                    stats.skipped++;
                    continue;
                }

                if (match.confidence < 0.8) {
                    logger.warn(
                        `Low confidence match (${(match.confidence * 100).toFixed(0)}%) for ${airdrop.projectName} → ${match.toolName}`
                    );
                    stats.skipped++;
                    continue;
                }

                stats.matched++;

                // Check if already has airdrop
                const tool = tools.find(t => t.id === match.toolId);
                if (tool?.hasAirdrop) {
                    logger.info(`${match.toolName} already has airdrop, skipping`);
                    stats.skipped++;
                    continue;
                }

                // Update tool with airdrop info
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

                logger.success(
                    `✅ Updated ${match.toolName} (${(match.confidence * 100).toFixed(0)}% confidence)`
                );
                stats.updated++;
            } catch (error) {
                const errorMsg = `Error processing ${airdrop.projectName}: ${error}`;
                logger.error(errorMsg);
                stats.errors.push(errorMsg);
            }
        }

        stats.duration = Date.now() - startTime;

        // Log summary
        logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        logger.success(`✅ Scraper completed in ${(stats.duration / 1000).toFixed(1)}s`);
        logger.info(`📊 Scraped: ${stats.scraped}`);
        logger.info(`🎯 Matched: ${stats.matched}`);
        logger.info(`💾 Updated: ${stats.updated}`);
        logger.info(`⏭️  Skipped: ${stats.skipped}`);
        logger.info(`❌ Errors: ${stats.errors.length}`);
        logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        return stats;
    } catch (error) {
        logger.error(`Fatal error: ${error}`);
        stats.errors.push(`Fatal error: ${error}`);
        stats.duration = Date.now() - startTime;
        return stats;
    }
}

// Allow running from command line
if (require.main === module) {
    runAirdropScraper()
        .then(stats => {
            console.log("\n📊 Final Stats:", JSON.stringify(stats, null, 2));
            process.exit(stats.errors.length > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error("Fatal error:", error);
            process.exit(1);
        });
}
