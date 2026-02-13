import * as cheerio from "cheerio";
import { RateLimiter, getRandomUserAgent } from "../utils/rate-limiter";
import { AirdropData, validateAirdrop } from "../utils/validator";
import { Logger } from "../utils/logger";

/**
 * CoinMarketCap Airdrop Scraper
 * Scrapes active airdrops from CoinMarketCap
 */

export class CoinMarketCapScraper {
    private rateLimiter: RateLimiter;
    private logger: Logger;
    private baseUrl = "https://coinmarketcap.com";

    constructor(logger: Logger) {
        this.rateLimiter = new RateLimiter(3000); // 3 second delay
        this.logger = logger;
    }

    /**
     * Scrape airdrops from CoinMarketCap
     */
    async scrape(): Promise<AirdropData[]> {
        this.logger.info("Starting CoinMarketCap scraper...");
        const airdrops: AirdropData[] = [];

        try {
            const html = await this.rateLimiter.withRetry(async () => {
                this.logger.info("Fetching CoinMarketCap airdrop page...");
                const response = await fetch(`${this.baseUrl}/airdrop/`, {
                    headers: {
                        "User-Agent": getRandomUserAgent(),
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                        "Accept-Language": "en-US,en;q=0.5",
                        "Accept-Encoding": "gzip, deflate, br",
                        "Connection": "keep-alive",
                        "Upgrade-Insecure-Requests": "1",
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return await response.text();
            });

            const $ = cheerio.load(html);

            // Try multiple selectors (resilient parsing)
            const selectors = [
                ".airdrop-card",
                "[data-role='airdrop-item']",
                ".sc-aef7b723-0", // CMC uses dynamic class names
                "article",
            ];

            let elements: cheerio.Cheerio<any> | null = null;
            for (const selector of selectors) {
                const found = $(selector);
                if (found.length > 0) {
                    elements = found;
                    this.logger.info(`Found ${found.length} elements with selector: ${selector}`);
                    break;
                }
            }

            if (!elements || elements.length === 0) {
                this.logger.warn("No airdrop elements found with any selector");
                return airdrops;
            }

            // Parse each airdrop
            elements.each((i, el) => {
                try {
                    const $el = $(el);

                    // Try multiple ways to extract project name
                    const projectName =
                        $el.find("h3").first().text().trim() ||
                        $el.find("[data-role='title']").text().trim() ||
                        $el.find("a").first().text().trim() ||
                        "";

                    // Try multiple ways to extract description
                    const description =
                        $el.find("p").first().text().trim() ||
                        $el.find("[data-role='description']").text().trim() ||
                        $el.find(".description").text().trim() ||
                        "";

                    // Extract URL
                    const url = $el.find("a").first().attr("href") || "";

                    // Extract status (active/upcoming)
                    const statusText = $el.text().toLowerCase();
                    const status = statusText.includes("upcoming") ? "upcoming" : "active";

                    if (!projectName || !description) {
                        this.logger.warn(`Skipping airdrop ${i}: missing name or description`);
                        return;
                    }

                    const airdropData = {
                        projectName,
                        description: description.substring(0, 500), // Limit length
                        status,
                        url: url.startsWith("http") ? url : `${this.baseUrl}${url}`,
                        source: "coinmarketcap",
                    };

                    const validated = validateAirdrop(airdropData);
                    if (validated) {
                        airdrops.push(validated);
                        this.logger.success(`Scraped: ${projectName}`);
                    }
                } catch (error) {
                    this.logger.error(`Error parsing airdrop ${i}: ${error}`);
                }
            });

            this.logger.success(`CoinMarketCap scraper completed: ${airdrops.length} airdrops found`);
        } catch (error) {
            this.logger.error(`CoinMarketCap scraper failed: ${error}`);
        }

        return airdrops;
    }
}
