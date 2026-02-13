import { z } from "zod";

/**
 * Airdrop data schema for validation
 */
export const AirdropSchema = z.object({
    projectName: z.string().min(1),
    description: z.string().min(10),
    status: z.enum(["active", "upcoming", "ended"]).default("active"),
    endDate: z.string().optional(),
    url: z.string().url().optional(),
    source: z.string(),
});

export type AirdropData = z.infer<typeof AirdropSchema>;

/**
 * Validate scraped airdrop data
 */
export function validateAirdrop(data: unknown): AirdropData | null {
    try {
        return AirdropSchema.parse(data);
    } catch (error) {
        console.error("Validation failed:", error);
        return null;
    }
}

/**
 * Scraper result schema
 */
export const ScraperResultSchema = z.object({
    source: z.string(),
    timestamp: z.date(),
    airdrops: z.array(AirdropSchema),
    errors: z.array(z.string()),
    duration: z.number(),
});

export type ScraperResult = z.infer<typeof ScraperResultSchema>;
