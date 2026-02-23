"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/utils";

const CATEGORY_EMOJI: Record<string, string> = {
    Exchanges: "🏦",
    Wallets: "👛",
    DeFi: "💰",
    NFT: "🎨",
    Trading: "📈",
    Analytics: "📊",
    AI: "🤖",
    "Developer Tools": "🛠️",
    DAOs: "🏛️",
    Bridges: "🌉",
    "Layer 2": "⚡",
    Staking: "🥩",
    Lending: "🏦",
    Derivatives: "📉",
    Launchpads: "🚀",
    Gaming: "🎮",
    Metaverse: "🌐",
    Infrastructure: "🧱",
    Security: "🔒",
    Portfolio: "💼",
    News: "📰",
    Other: "📦",
};

const VISIBLE_COUNT = 8;

interface CategoryFilterProps {
    selected: string | null;
    onChange: (category: string | null) => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
    // Auto-expand if a hidden category is selected
    const selectedIdx = selected ? CATEGORIES.indexOf(selected as typeof CATEGORIES[number]) : -1;
    const [expanded, setExpanded] = useState(selectedIdx >= VISIBLE_COUNT);

    const visible = CATEGORIES.slice(0, VISIBLE_COUNT);
    const hidden = CATEGORIES.slice(VISIBLE_COUNT);
    const showToggle = hidden.length > 0;

    return (
        <div className="flex flex-col items-center gap-2">
            {/* Main row */}
            <div className="flex flex-wrap gap-2 justify-center">
                <button
                    onClick={() => onChange(null)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${selected === null
                        ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        }`}
                >
                    ✨ All
                </button>
                {visible.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => onChange(selected === cat ? null : cat)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${selected === cat
                            ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        {CATEGORY_EMOJI[cat] || "📦"} {cat}
                    </button>
                ))}
                {showToggle && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="rounded-full px-3.5 py-1.5 text-xs font-medium bg-white/5 text-violet-400 hover:bg-violet-500/10 hover:text-violet-300 transition-all"
                    >
                        {expanded ? "Show Less ▲" : `+${hidden.length} More ▼`}
                    </button>
                )}
            </div>

            {/* Expandable row */}
            <div
                className={`flex flex-wrap gap-2 justify-center overflow-hidden transition-all duration-300 ${expanded ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                {hidden.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => onChange(selected === cat ? null : cat)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${selected === cat
                            ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        {CATEGORY_EMOJI[cat] || "📦"} {cat}
                    </button>
                ))}
            </div>
        </div>
    );
}
