/**
 * Rate Limiter Utility
 * Prevents overwhelming target servers with requests
 */

export class RateLimiter {
    private lastRequest = 0;
    private minDelay: number;

    constructor(minDelayMs = 2000) {
        this.minDelay = minDelayMs;
    }

    async throttle(): Promise<void> {
        const now = Date.now();
        const elapsed = now - this.lastRequest;

        if (elapsed < this.minDelay) {
            const waitTime = this.minDelay - elapsed;
            await this.sleep(waitTime);
        }

        this.lastRequest = Date.now();
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Execute function with exponential backoff on failure
     */
    async withRetry<T>(
        fn: () => Promise<T>,
        maxRetries = 3
    ): Promise<T> {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                await this.throttle();
                return await fn();
            } catch (error) {
                if (attempt === maxRetries - 1) {
                    throw error;
                }
                // Exponential backoff: 2s, 4s, 8s
                const backoffDelay = Math.pow(2, attempt + 1) * 1000;
                console.log(`Retry attempt ${attempt + 1} after ${backoffDelay}ms`);
                await this.sleep(backoffDelay);
            }
        }
        throw new Error("Max retries exceeded");
    }
}

/**
 * Get random user agent to avoid detection
 */
export function getRandomUserAgent(): string {
    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15"
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}
