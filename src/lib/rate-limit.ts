import { NextRequest } from "next/server";

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (now > entry.resetTime) store.delete(key);
    }
}, 5 * 60 * 1000);

/**
 * In-memory rate limiter.
 * @param req     — incoming request (IP extracted automatically)
 * @param limit   — max requests allowed in the window (default 5)
 * @param windowMs — window duration in ms (default 15 min)
 * @returns { limited, remaining, resetIn } — limited=true means 429
 */
export function rateLimit(
    req: NextRequest,
    limit = 5,
    windowMs = 15 * 60 * 1000
) {
    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown";

    const key = `${ip}:${req.nextUrl.pathname}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetTime) {
        store.set(key, { count: 1, resetTime: now + windowMs });
        return { limited: false, remaining: limit - 1, resetIn: windowMs };
    }

    entry.count += 1;

    if (entry.count > limit) {
        return {
            limited: true,
            remaining: 0,
            resetIn: entry.resetTime - now,
        };
    }

    return {
        limited: false,
        remaining: limit - entry.count,
        resetIn: entry.resetTime - now,
    };
}
