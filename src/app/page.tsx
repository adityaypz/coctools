"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import ToolCard from "@/components/ToolCard";

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
  status: string;
  popularity: number;
  clicks: number;
  createdAt: string;
}

const SORT_OPTIONS = [
  { value: "popular", label: "🔥 Popular" },
  { value: "newest", label: "🆕 Newest" },
  { value: "a-z", label: "🔤 A–Z" },
  { value: "clicks", label: "👆 Most Clicked" },
] as const;

/* ── Animated counter hook ── */
function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const startTime = performance.now();
    function step(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    }
    requestAnimationFrame(step);
  }, [target, duration]);
  return count;
}

/* ── Skeleton Card ── */
function SkeletonCard() {
  return (
    <div className="flex h-[280px] flex-col rounded-2xl border border-white/10 bg-gray-900/60 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-white/10" />
          <div className="h-3 w-1/2 rounded bg-white/5" />
        </div>
      </div>
      <div className="flex-1 space-y-2">
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-3 w-5/6 rounded bg-white/5" />
        <div className="h-3 w-2/3 rounded bg-white/5" />
      </div>
      <div className="flex gap-2 mt-4">
        <div className="h-6 w-16 rounded-full bg-white/5" />
        <div className="h-6 w-20 rounded-full bg-white/5" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("popular");
  const [loading, setLoading] = useState(true);
  const recentlyAddedRef = useRef<HTMLDivElement>(null);

  const animatedCount = useAnimatedCounter(loading ? 0 : tools.length);

  useEffect(() => {
    async function fetchTools() {
      try {
        const res = await fetch("/api/tools");
        const data = await res.json();
        setTools(data);
      } catch (err) {
        console.error("Failed to fetch tools:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTools();
  }, []);

  const filtered = useMemo(() => {
    const result = tools.filter((tool) => {
      const matchesSearch =
        !search ||
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.domain.toLowerCase().includes(search.toLowerCase()) ||
        tool.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        !category || tool.categories.includes(category);
      return matchesSearch && matchesCategory;
    });

    // Sort
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "a-z":
          return a.name.localeCompare(b.name);
        case "clicks":
          return (b.clicks ?? 0) - (a.clicks ?? 0);
        default: // popular
          return (b.popularity ?? 0) - (a.popularity ?? 0);
      }
    });
  }, [tools, search, category, sortBy]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="text-center space-y-4 py-6 sm:py-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
          <span className="hero-gradient-text">
            Discover Crypto Tools
          </span>
        </h1>
        <p className="mx-auto max-w-xl text-gray-400">
          A curated directory of the best tools for crypto, DeFi, and Web3.
          Search by name or filter by category.
        </p>
        {/* Animated stats */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white tabular-nums">
              {animatedCount}+
            </span>
            <span className="text-xs text-gray-500">Tools Listed</span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">22+</span>
            <span className="text-xs text-gray-500">Categories</span>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">100%</span>
            <span className="text-xs text-gray-500">Free</span>
          </div>
        </div>
      </section>

      {/* Search & Filter */}
      <div className="flex flex-col items-center gap-6">
        <SearchBar value={search} onChange={setSearch} />
        <CategoryFilter selected={category} onChange={setCategory} />
      </div>

      {/* Sort */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-gray-500">Sort by:</span>
        <div className="flex gap-1.5">
          {SORT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSortBy(value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${sortBy === value
                ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Recently Added */}
      {!loading && !search && !category && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            🆕 Recently Added
          </h2>
          <div className="relative group/scroll">
            {/* Left Arrow */}
            <button
              onClick={() => recentlyAddedRef.current?.scrollBy({ left: -300, behavior: "smooth" })}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-800/90 border border-white/10 text-white shadow-lg opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-violet-500 cursor-pointer"
            >
              ‹
            </button>
            {/* Right Arrow */}
            <button
              onClick={() => recentlyAddedRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-800/90 border border-white/10 text-white shadow-lg opacity-0 group-hover/scroll:opacity-100 transition-opacity hover:bg-violet-500 cursor-pointer"
            >
              ›
            </button>
            <div ref={recentlyAddedRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-2">
              {[...tools]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 8)
                .map((tool) => (
                  <a
                    key={tool.id}
                    href={`/tools/${tool.slug}`}
                    className="group flex min-w-[260px] max-w-[300px] items-center gap-3 rounded-xl border border-white/10 bg-gray-900/60 p-3 transition-all hover:border-violet-500/40 hover:bg-gray-900/80 shrink-0"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                      {tool.faviconUrl ? (
                        <img
                          src={tool.faviconUrl}
                          alt=""
                          className="h-5 w-5 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="text-xs font-bold text-violet-300">
                          {tool.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white group-hover:text-violet-300 transition-colors">
                        {tool.name}
                      </p>
                      <p className="truncate text-xs text-gray-500">{tool.domain}</p>
                    </div>
                  </a>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-500">
          <p className="text-lg">No tools found.</p>
          <p className="text-sm mt-1">Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tool, i) => (
            <div key={tool.id} className="animate-fade-in-up" style={{ "--i": i } as React.CSSProperties}>
              <ToolCard {...tool} />
            </div>
          ))}
        </div>
      )}

      {/* Count */}
      {!loading && (
        <p className="text-center text-sm text-gray-500">
          Showing {filtered.length} of {tools.length} tools
        </p>
      )}
    </div>
  );
}
