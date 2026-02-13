"use client";

import { CATEGORIES } from "@/lib/utils";

interface CategoryFilterProps {
    selected: string | null;
    onChange: (category: string | null) => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
    return (
        <div className="flex flex-wrap gap-2">
            <button
                onClick={() => onChange(null)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${selected === null
                        ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                        : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    }`}
            >
                All
            </button>
            {CATEGORIES.map((cat) => (
                <button
                    key={cat}
                    onClick={() => onChange(selected === cat ? null : cat)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${selected === cat
                            ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        }`}
                >
                    {cat}
                </button>
            ))}
        </div>
    );
}
