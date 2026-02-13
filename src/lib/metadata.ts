/**
 * Server-side metadata fetcher — extracts og:title, description, image, favicon
 * from any URL using fetch + cheerio.
 */
import * as cheerio from "cheerio";
import { extractDomain } from "./url-utils";

export interface SiteMetadata {
    title: string;
    description: string | null;
    imageUrl: string | null;
    faviconUrl: string | null;
    canonicalUrl: string | null;
}

const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Fetch and parse metadata from a URL.
 * On failure, returns a fallback with name = domain.
 */
export async function fetchMetadata(url: string): Promise<SiteMetadata> {
    const domain = extractDomain(url);

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);

        const res = await fetch(url, {
            headers: {
                "User-Agent": USER_AGENT,
                Accept: "text/html,application/xhtml+xml",
            },
            signal: controller.signal,
            redirect: "follow",
        });

        clearTimeout(timeout);

        if (!res.ok) {
            return fallback(domain);
        }

        const html = await res.text();
        const $ = cheerio.load(html);

        // Title: og:title → twitter:title → <title>
        const title =
            getMeta($, "og:title") ||
            getMeta($, "twitter:title") ||
            $("title").first().text().trim() ||
            domain;

        // Description: og:description → meta[name=description]
        const description =
            getMeta($, "og:description") ||
            $('meta[name="description"]').attr("content")?.trim() ||
            null;

        // Image: og:image → twitter:image
        let imageUrl =
            getMeta($, "og:image") ||
            getMeta($, "twitter:image") ||
            null;
        if (imageUrl) imageUrl = resolveUrl(imageUrl, url);

        // Favicon: link[rel*=icon] → /favicon.ico fallback
        let faviconUrl = getFavicon($);
        if (faviconUrl) {
            faviconUrl = resolveUrl(faviconUrl, url);
        } else {
            faviconUrl = `https://${domain}/favicon.ico`;
        }

        // Canonical URL
        const canonicalUrl =
            $('link[rel="canonical"]').attr("href")?.trim() || null;

        return { title, description, imageUrl, faviconUrl, canonicalUrl };
    } catch {
        return fallback(domain);
    }
}

function fallback(domain: string): SiteMetadata {
    return {
        title: domain,
        description: null,
        imageUrl: null,
        faviconUrl: `https://${domain}/favicon.ico`,
        canonicalUrl: null,
    };
}

function getMeta($: cheerio.CheerioAPI, property: string): string | null {
    const content =
        $(`meta[property="${property}"]`).attr("content") ||
        $(`meta[name="${property}"]`).attr("content");
    return content?.trim() || null;
}

function getFavicon($: cheerio.CheerioAPI): string | null {
    // Try various icon link types
    const selectors = [
        'link[rel="icon"]',
        'link[rel="shortcut icon"]',
        'link[rel="apple-touch-icon"]',
    ];
    for (const sel of selectors) {
        const href = $(sel).attr("href")?.trim();
        if (href) return href;
    }
    return null;
}

function resolveUrl(relative: string, base: string): string {
    if (relative.startsWith("http://") || relative.startsWith("https://")) {
        return relative;
    }
    if (relative.startsWith("//")) {
        return `https:${relative}`;
    }
    try {
        return new URL(relative, base).toString();
    } catch {
        return relative;
    }
}
