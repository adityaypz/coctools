/**
 * URL normalization and deduplication utilities.
 */

/** Parameters to strip from URLs for normalization. */
const STRIP_PARAMS = [
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "ref", "fbclid", "gclid", "mc_cid", "mc_eid",
];

/**
 * Normalize a URL: ensure https, strip tracking params, fragments, trailing slash.
 */
export function normalizeUrl(raw: string): string {
    let url = raw.trim();
    if (!url) return url;

    // Ensure protocol
    if (!/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
    }

    try {
        const u = new URL(url);
        u.protocol = "https:";
        u.hash = "";

        // Strip tracking params
        for (const p of STRIP_PARAMS) {
            u.searchParams.delete(p);
        }

        // Remove trailing slash from pathname (keep "/" as-is)
        if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
            u.pathname = u.pathname.slice(0, -1);
        }

        // Remove www
        u.hostname = u.hostname.replace(/^www\./, "");

        return u.toString();
    } catch {
        return url;
    }
}

/**
 * Extract domain (without www.) from a URL string.
 */
export function extractDomain(url: string): string {
    try {
        const u = new URL(url.startsWith("http") ? url : `https://${url}`);
        return u.hostname.replace(/^www\./, "").toLowerCase();
    } catch {
        return url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].toLowerCase();
    }
}

/**
 * Extract dedup key from a URL: { domain, pathKey }.
 * If pathname is "/" or empty → pathKey = "" (root of domain = same tool).
 * Otherwise pathKey = cleaned pathname.
 */
export function extractDedupeKey(url: string): { domain: string; pathKey: string } {
    const domain = extractDomain(url);

    try {
        const u = new URL(url.startsWith("http") ? url : `https://${url}`);
        let pathname = u.pathname.replace(/\/+$/, "").toLowerCase();
        if (pathname === "" || pathname === "/") {
            pathname = "";
        }
        return { domain, pathKey: pathname };
    } catch {
        return { domain, pathKey: "" };
    }
}
