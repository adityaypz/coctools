"use client";

import Link from "next/link";

interface Tool {
    id: string;
    name: string;
    slug: string;
    url: string;
    domain: string;
    description: string | null;
    imageUrl: string | null;
    faviconUrl: string | null;
    categories: string[];
    tags: string[];
    status: string;
    popularity: number;
    clicks: number;
    hasAirdrop: boolean;
    airdropDetails: string | null;
    airdropEndDate: string | null;
    createdAt: string;
}

interface RelatedTool {
    id: string;
    name: string;
    slug: string;
    url: string;
    domain: string;
    description: string | null;
    faviconUrl: string | null;
    categories: string[];
    status: string;
    hasAirdrop: boolean;
    airdropDetails: string | null;
}

export default function ToolDetailClient({
    tool,
    related,
}: {
    tool: Tool;
    related: RelatedTool[];
}) {
    const handleVisit = () => {
        try {
            fetch("/api/tools/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ toolId: tool.id }),
            }).catch(() => { });
        } catch { }
    };

    return (
        <div className="mx-auto max-w-4xl space-y-10 py-4">
            {/* Back link */}
            <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
                ← Back to all tools
            </Link>

            {/* Main card */}
            <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-6 sm:p-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                            {tool.faviconUrl ? (
                                <img
                                    src={tool.faviconUrl}
                                    alt=""
                                    className="h-8 w-8 object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = "none";
                                        target.parentElement!.innerHTML = `<span class="text-xl font-bold text-violet-300">${tool.name.charAt(0).toUpperCase()}</span>`;
                                    }}
                                />
                            ) : (
                                <span className="text-xl font-bold text-violet-300">
                                    {tool.name.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white sm:text-3xl">
                                {tool.name}
                            </h1>
                            <p className="text-sm text-gray-500">{tool.domain}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {tool.hasAirdrop && (
                            <span className="rounded-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-500/30">
                                🎁 Airdrop
                            </span>
                        )}
                        {tool.status === "featured" && (
                            <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                                ⭐ Featured
                            </span>
                        )}
                    </div>
                </div>

                {/* Description */}
                <p className="text-base leading-relaxed text-gray-300">
                    {tool.description || `Visit ${tool.domain} to learn more about this tool.`}
                </p>

                {/* Airdrop details */}
                {tool.hasAirdrop && tool.airdropDetails && (
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                        <p className="text-sm font-medium text-emerald-300">🎁 Airdrop Info</p>
                        <p className="text-sm text-emerald-200/80 mt-1">{tool.airdropDetails}</p>
                        {tool.airdropEndDate && (
                            <p className="text-xs text-emerald-400/60 mt-2">
                                Ends: {new Date(tool.airdropEndDate).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                )}

                {/* Categories & Tags */}
                <div className="flex flex-wrap gap-2">
                    {tool.categories.map((cat) => (
                        <span
                            key={cat}
                            className="rounded-full bg-violet-500/20 px-3 py-1 text-xs font-medium text-violet-300"
                        >
                            {cat}
                        </span>
                    ))}
                    {tool.tags.map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-400"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>

                {/* Stats */}
                <div className="flex gap-6 text-sm text-gray-500">
                    <span>★ {tool.popularity} popularity</span>
                    <span>👆 {tool.clicks} clicks</span>
                    <span>Added {new Date(tool.createdAt).toLocaleDateString()}</span>
                </div>

                {/* CTA */}
                <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleVisit}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    Visit {tool.domain} →
                </a>
            </div>

            {/* Related Tools */}
            {related.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-white">Related Tools</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {related.map((r) => (
                            <Link
                                key={r.id}
                                href={`/tools/${r.slug}`}
                                className="group flex items-center gap-3 rounded-xl border border-white/10 bg-gray-900/60 p-4 transition-all hover:border-violet-500/40 hover:bg-gray-900/80"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                                    {r.faviconUrl ? (
                                        <img
                                            src={r.faviconUrl}
                                            alt=""
                                            className="h-6 w-6 object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = "none";
                                            }}
                                        />
                                    ) : (
                                        <span className="text-sm font-bold text-violet-300">
                                            {r.name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">
                                        {r.name}
                                    </h3>
                                    <p className="truncate text-xs text-gray-500">{r.domain}</p>
                                </div>
                                {r.hasAirdrop && (
                                    <span className="shrink-0 text-xs">🎁</span>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
