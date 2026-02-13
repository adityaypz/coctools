"use client";

import { useState } from "react";
import ToolCard from "@/components/ToolCard";
import Link from "next/link";

interface Tool {
    id: string;
    name: string;
    description: string;
    domain: string;
    url: string;
    imageUrl: string | null;
    faviconUrl: string | null;
    categories: string[];
    status: string;
    popularity: number;
    clicks: number;
    hasAirdrop: boolean;
    airdropDetails: string | null;
    airdropSource: string | null;
    airdropConfidence: number | null;
    airdropEndDate: string | null;
    airdropLastCheck: string | null;
    slug: string;
}

interface AirdropsPageClientProps {
    tools: Tool[];
}

export default function AirdropsPageClient({ tools }: AirdropsPageClientProps) {
    const [hoveredTool, setHoveredTool] = useState<string | null>(null);

    // Categorize airdrops by type
    const categories = {
        "Layer 2 & Chains": tools.filter(t =>
            t.categories.some(c => c.toLowerCase().includes("layer 2") || c.toLowerCase().includes("blockchain"))
        ),
        "DeFi Protocols": tools.filter(t =>
            t.categories.some(c => c.toLowerCase().includes("defi") || c.toLowerCase().includes("dex") || c.toLowerCase().includes("lending"))
        ),
        "NFT & Gaming": tools.filter(t =>
            t.categories.some(c => c.toLowerCase().includes("nft") || c.toLowerCase().includes("gaming"))
        ),
        "Infrastructure": tools.filter(t =>
            t.categories.some(c => c.toLowerCase().includes("infrastructure") || c.toLowerCase().includes("oracle") || c.toLowerCase().includes("data"))
        ),
        "Other Opportunities": tools.filter(t =>
            !t.categories.some(c =>
                c.toLowerCase().includes("layer 2") ||
                c.toLowerCase().includes("blockchain") ||
                c.toLowerCase().includes("defi") ||
                c.toLowerCase().includes("dex") ||
                c.toLowerCase().includes("lending") ||
                c.toLowerCase().includes("nft") ||
                c.toLowerCase().includes("gaming") ||
                c.toLowerCase().includes("infrastructure") ||
                c.toLowerCase().includes("oracle") ||
                c.toLowerCase().includes("data")
            )
        ),
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <section className="space-y-4 text-center">
                <div className="inline-block rounded-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-4 py-1.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg animate-pulse">
                    🎁 {tools.length} Active Opportunities
                </div>
                <h1 className="text-4xl font-bold text-white sm:text-5xl">
                    Crypto{" "}
                    <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
                        Airdrops & Incentives
                    </span>
                </h1>
                <p className="mx-auto max-w-2xl text-gray-400 leading-relaxed">
                    Discover active airdrop campaigns, points programs, and incentive opportunities.
                    <br />
                    <span className="text-sm text-emerald-400 font-medium">Including lesser-known opportunities not tracked by major sites!</span>
                </p>
            </section>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-gray-900/60 p-4 text-center backdrop-blur-sm">
                    <div className="text-3xl font-bold text-emerald-400">{tools.length}</div>
                    <div className="text-sm text-gray-500">Total Active</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-gray-900/60 p-4 text-center backdrop-blur-sm">
                    <div className="text-3xl font-bold text-blue-400">{categories["Layer 2 & Chains"].length}</div>
                    <div className="text-sm text-gray-500">L2 & Chains</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-gray-900/60 p-4 text-center backdrop-blur-sm">
                    <div className="text-3xl font-bold text-violet-400">{categories["DeFi Protocols"].length}</div>
                    <div className="text-sm text-gray-500">DeFi</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-gray-900/60 p-4 text-center backdrop-blur-sm">
                    <div className="text-3xl font-bold text-pink-400">{categories["NFT & Gaming"].length + categories["Infrastructure"].length}</div>
                    <div className="text-sm text-gray-500">NFT + Infra</div>
                </div>
            </div>

            {/* Important Notice */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">⚠️</span>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-amber-300 mb-1">Important Disclaimer</h3>
                        <p className="text-sm text-amber-200/80 leading-relaxed">
                            Always DYOR before participating. Verify official sources and be cautious of scams.
                            This directory does not guarantee rewards. <strong>Hover over cards for details.</strong>
                        </p>
                    </div>
                </div>
            </div>

            {/* Airdrops Grid */}
            {tools.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-12 text-center">
                    <div className="text-6xl mb-4">🎁</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Active Airdrops Yet</h3>
                    <p className="text-gray-400 mb-6">
                        Check back soon! We're constantly updating this page with new opportunities.
                    </p>
                    <Link
                        href="/"
                        className="inline-block rounded-xl bg-violet-500 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-400 transition-colors"
                    >
                        Browse All Tools
                    </Link>
                </div>
            ) : (
                <div className="space-y-10">
                    {/* Categorized Airdrops */}
                    {Object.entries(categories).map(([category, categoryTools]) => {
                        if (categoryTools.length === 0) return null;

                        return (
                            <div key={category} className="space-y-5">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold text-white">{category}</h2>
                                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-400">
                                        {categoryTools.length}
                                    </span>
                                </div>

                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {categoryTools.map((tool) => (
                                        <div
                                            key={tool.id}
                                            className="relative"
                                            onMouseEnter={() => setHoveredTool(tool.id)}
                                            onMouseLeave={() => setHoveredTool(null)}
                                        >
                                            {/* Tool Card */}
                                            <div className="relative transition-transform hover:scale-[1.02]">
                                                <ToolCard {...tool} />
                                            </div>

                                            {/* Popup Bubble on Hover */}
                                            {tool.airdropDetails && hoveredTool === tool.id && (
                                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-[calc(100%+2rem)] max-w-md z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
                                                        {/* Arrow */}
                                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-gray-900 to-gray-800 border-r border-b border-emerald-500/40 rotate-45"></div>

                                                        {/* Badges */}
                                                        <div className="flex items-center gap-2 flex-wrap mb-3">
                                                            {tool.airdropConfidence && (
                                                                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tool.airdropConfidence >= 0.9
                                                                    ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                                                                    : tool.airdropConfidence >= 0.7
                                                                        ? "bg-yellow-500/30 text-yellow-300 border border-yellow-500/50"
                                                                        : "bg-gray-500/30 text-gray-300 border border-gray-500/50"
                                                                    }`}>
                                                                    {tool.airdropConfidence >= 0.9 ? "✓ Verified" :
                                                                        tool.airdropConfidence >= 0.7 ? "⚡ High Confidence" :
                                                                            "⚠️ Medium"}
                                                                </span>
                                                            )}
                                                            {tool.airdropSource && (
                                                                <span className="rounded-full bg-blue-500/30 border border-blue-500/50 px-2.5 py-1 text-xs font-bold text-blue-300">
                                                                    {tool.airdropSource === "curated" ? "📝 Curated" :
                                                                        tool.airdropSource === "coinmarketcap" ? "📰 CMC" :
                                                                            tool.airdropSource}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Details */}
                                                        <div className="space-y-3">
                                                            <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wide">
                                                                <span className="text-base">💎</span>
                                                                <span>Opportunity Details</span>
                                                            </div>
                                                            <p className="text-sm text-gray-200 leading-relaxed">{tool.airdropDetails}</p>

                                                            {(tool.airdropEndDate || tool.airdropLastCheck) && (
                                                                <div className="pt-3 border-t border-gray-700/50 space-y-1">
                                                                    {tool.airdropEndDate && (
                                                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                                            <span>⏰</span>
                                                                            <span>Ends: {new Date(tool.airdropEndDate).toLocaleDateString()}</span>
                                                                        </div>
                                                                    )}
                                                                    {tool.airdropLastCheck && (
                                                                        <div className="text-xs text-gray-500">
                                                                            Updated: {new Date(tool.airdropLastCheck).toLocaleDateString()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Hover Hint */}
                                            {tool.airdropDetails && (
                                                <div className={`mt-2 text-center transition-opacity ${hoveredTool === tool.id ? 'opacity-0' : 'opacity-60'}`}>
                                                    <span className="text-xs text-emerald-400">💡 Hover for details</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* CTA */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-900/20 to-emerald-900/20 p-8 text-center backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white mb-2">Know of an Active Airdrop?</h3>
                <p className="text-gray-400 mb-4 leading-relaxed">
                    Help the community by suggesting new opportunities!
                    <br />
                    <span className="text-sm text-emerald-400">We especially value lesser-known but legitimate programs.</span>
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                    <Link
                        href="/"
                        className="inline-block rounded-xl bg-violet-500 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-400 transition-all hover:scale-105"
                    >
                        Browse All Tools
                    </Link>
                    <Link
                        href="/submit-airdrop"
                        className="inline-block rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all hover:scale-105"
                    >
                        📝 Submit Airdrop
                    </Link>
                </div>
            </div>
        </div>
    );
}
