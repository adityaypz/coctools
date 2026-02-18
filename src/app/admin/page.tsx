"use client";

import { useState, useEffect, useCallback } from "react";
import { CATEGORIES } from "@/lib/utils";

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
    source: string;
    popularity: number;
    clicks: number;
    hasAirdrop: boolean;
    airdropDetails: string | null;
    airdropEndDate: string | null;
    submittedByTelegram: string | null;
    createdAt: string;
}

export default function AdminPage() {
    const [password, setPassword] = useState("");
    const [authenticated, setAuthenticated] = useState(false);
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editCategories, setEditCategories] = useState<string[]>([]);
    const [editTags, setEditTags] = useState("");
    const [editPopularity, setEditPopularity] = useState(0);
    const [editHasAirdrop, setEditHasAirdrop] = useState(false);
    const [editAirdropDetails, setEditAirdropDetails] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Add single URL state
    const [addUrl, setAddUrl] = useState("");
    const [addLoading, setAddLoading] = useState(false);

    // Bulk import state
    const [bulkUrls, setBulkUrls] = useState("");
    const [importLoading, setImportLoading] = useState(false);
    const [importResult, setImportResult] = useState<{ added: number; skipped: number; errors: string[] } | null>(null);

    // Airdrop management state
    const [defillamaSyncing, setDefillamaSyncing] = useState(false);
    const [defillamaStats, setDefillamaStats] = useState<any>(null);
    const [pendingCount, setPendingCount] = useState(0);

    // Top contributors state
    const [topContributors, setTopContributors] = useState<{ username: string; count: number }[]>([]);

    // Search, filter, and pagination state
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const TOOLS_PER_PAGE = 10;

    const fetchTools = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/tools", {
                headers: { "x-admin-password": password },
            });
            if (!res.ok) throw new Error("Unauthorized");
            const data = await res.json();
            setTools(data);
        } catch {
            setError("Failed to fetch tools");
        } finally {
            setLoading(false);
        }
    }, [password]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/admin/tools", {
                headers: { "x-admin-password": password },
            });
            if (!res.ok) throw new Error("Invalid password");
            setAuthenticated(true);
            await fetchTools();
        } catch {
            setError("Invalid password");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authenticated) fetchTools();
    }, [authenticated, fetchTools]);

    // Fetch pending submissions count
    useEffect(() => {
        const fetchPending = async () => {
            if (!authenticated) return;
            try {
                const res = await fetch("/api/airdrops/submit", {
                    headers: { "x-admin-password": password },
                });
                const data = await res.json();
                const pending = data.submissions?.filter((s: any) => s.status === "pending").length || 0;
                setPendingCount(pending);
            } catch {
                // Silently fail
            }
        };
        fetchPending();
    }, [authenticated, password]);

    // Fetch top contributors
    useEffect(() => {
        const fetchContributors = async () => {
            if (!authenticated) return;
            try {
                // Count airdrop submissions
                const airdropRes = await fetch("/api/airdrops/submit", {
                    headers: { "x-admin-password": password },
                });
                const airdropData = await airdropRes.json();
                const approvedAirdrops = airdropData.submissions?.filter((s: any) => s.status === "approved" && s.telegramUsername) || [];

                const counts: Record<string, number> = {};
                approvedAirdrops.forEach((s: any) => {
                    const username = s.telegramUsername;
                    counts[username] = (counts[username] || 0) + 1;
                });

                // Count tool submissions (approved = reviewed/featured)
                const approvedTools = tools.filter(t =>
                    t.source === "user-submission" &&
                    ["reviewed", "featured"].includes(t.status) &&
                    t.submittedByTelegram
                );
                approvedTools.forEach((t) => {
                    const username = t.submittedByTelegram!;
                    counts[username] = (counts[username] || 0) + 1;
                });

                // Convert to array and sort
                const sorted = Object.entries(counts)
                    .map(([username, count]) => ({ username, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10); // Top 10

                setTopContributors(sorted);
            } catch {
                // Silently fail
            }
        };
        fetchContributors();
    }, [authenticated, password, tools]);

    // Sync DefiLlama
    const handleDefillamaSync = async () => {
        setDefillamaSyncing(true);
        setError("");
        setSuccess("");
        try {
            const res = await fetch("/api/admin/sync-defillama", {
                method: "POST",
                headers: { "x-admin-password": password },
            });
            const data = await res.json();
            if (data.success) {
                setDefillamaStats(data.stats);
                setSuccess(`✅ DefiLlama sync complete! Updated: ${data.stats.updated}, Matched: ${data.stats.matched}`);
                fetchTools();
            } else {
                setError(`Sync failed: ${data.error}`);
            }
        } catch {
            setError("Failed to sync DefiLlama");
        } finally {
            setDefillamaSyncing(false);
        }
    };

    // ── Add Single URL ──────────────────────────
    const handleAddUrl = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addUrl.trim()) return;
        setAddLoading(true);
        setError("");
        setSuccess("");
        try {
            const res = await fetch("/api/tools/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-password": password,
                },
                body: JSON.stringify({ url: addUrl }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to add tool");
            }
            setSuccess("Tool added successfully!");
            setAddUrl("");
            fetchTools();
        } catch (err: any) {
            setError(err.message || "Failed to add tool");
        } finally {
            setAddLoading(false);
        }
    };

    // ── Bulk Import ─────────────────────────────
    const handleBulkImport = async (e: React.FormEvent) => {
        e.preventDefault();
        const urls = bulkUrls.split("\n").map((u) => u.trim()).filter(Boolean);
        if (urls.length === 0) return;
        setImportLoading(true);
        setError("");
        setImportResult(null);
        try {
            const res = await fetch("/api/tools/import", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-password": password,
                },
                body: JSON.stringify({ urls }),
            });
            if (!res.ok) throw new Error("Import failed");
            const result = await res.json();
            setImportResult(result);
            setBulkUrls("");
            fetchTools();
        } catch {
            setError("Bulk import failed");
        } finally {
            setImportLoading(false);
        }
    };

    // ── Refresh Metadata ────────────────────────
    const handleRefresh = async (toolId: string) => {
        try {
            const res = await fetch("/api/tools/refresh", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-password": password,
                },
                body: JSON.stringify({ toolId }),
            });
            if (!res.ok) throw new Error("Refresh failed");
            setSuccess("Metadata refreshed!");
            fetchTools();
        } catch {
            setError("Failed to refresh metadata");
        }
    };

    // ── Delete Tool ─────────────────────────────
    const handleDelete = async (toolId: string) => {
        if (!confirm("Are you sure you want to delete this tool?")) return;
        try {
            const res = await fetch("/api/admin/tools", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-password": password,
                },
                body: JSON.stringify({ toolId }),
            });
            if (!res.ok) throw new Error("Delete failed");
            setSuccess("Tool deleted!");
            fetchTools();
        } catch {
            setError("Failed to delete tool");
        }
    };

    // ── Delete Airdrop Only ─────────────────────
    const handleDeleteAirdrop = async (toolId: string) => {
        if (!confirm("Remove airdrop from this tool? (Tool will remain)")) return;
        try {
            const res = await fetch("/api/admin/tools", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-password": password,
                },
                body: JSON.stringify({
                    toolId,
                    updates: {
                        hasAirdrop: false,
                        airdropDetails: null,
                        airdropSource: null,
                        airdropConfidence: null,
                        airdropEndDate: null,
                    },
                }),
            });
            if (!res.ok) throw new Error("Failed to remove airdrop");
            setSuccess("Airdrop removed!");
            fetchTools();
        } catch {
            setError("Failed to remove airdrop");
        }
    };

    // ── Change Status ───────────────────────────
    const handleAction = async (toolId: string, action: string) => {
        const statusMap: Record<string, string> = {
            approve: "reviewed",
            feature: "featured",
            draft: "draft",
        };
        try {
            const res = await fetch("/api/admin/tools", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-password": password,
                },
                body: JSON.stringify({ toolId, status: statusMap[action] }),
            });
            if (!res.ok) throw new Error("Action failed");
            fetchTools();
        } catch {
            setError("Action failed");
        }
    };

    // ── Edit Categories/Tags/Popularity ─────────
    const handleSaveEdit = async (toolId: string) => {
        try {
            const res = await fetch("/api/admin/tools", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-password": password,
                },
                body: JSON.stringify({
                    toolId,
                    categories: editCategories,
                    tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
                    popularity: editPopularity,
                    hasAirdrop: editHasAirdrop,
                    airdropDetails: editAirdropDetails || null,
                }),
            });
            if (!res.ok) throw new Error("Save failed");
            setEditingId(null);
            fetchTools();
        } catch {
            setError("Failed to save changes");
        }
    };

    const startEdit = (tool: Tool) => {
        setEditingId(tool.id);
        setEditCategories(tool.categories);
        setEditTags(tool.tags.join(", "));
        setEditPopularity(tool.popularity);
        setEditHasAirdrop(tool.hasAirdrop);
        setEditAirdropDetails(tool.airdropDetails || "");
    };

    // ── Clear messages on timeout ──────────────
    useEffect(() => {
        if (error) {
            const t = setTimeout(() => setError(""), 4000);
            return () => clearTimeout(t);
        }
    }, [error]);

    useEffect(() => {
        if (success) {
            const t = setTimeout(() => setSuccess(""), 4000);
            return () => clearTimeout(t);
        }
    }, [success]);

    // ═══════════════════════════════════════════════
    // LOGIN SCREEN
    // ═══════════════════════════════════════════════
    if (!authenticated) {
        return (
            <div className="mx-auto max-w-sm py-20 space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-white">Admin Access</h1>
                    <p className="text-sm text-gray-400">Enter the admin password to continue.</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full rounded-xl border border-white/10 bg-gray-900/60 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                    />
                    {error && <p className="text-sm text-rose-400">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-400 transition-colors disabled:opacity-50"
                    >
                        {loading ? "Checking..." : "Login"}
                    </button>
                </form>
            </div>
        );
    }

    // Filter, sort, and paginate tools
    const filteredTools = tools.filter((tool) => {
        const matchesSearch = searchQuery === "" ||
            tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.domain.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || tool.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Sort tools
    const sortedTools = [...filteredTools].sort((a, b) => {
        switch (sortBy) {
            case "newest":
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case "oldest":
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case "name":
                return a.name.localeCompare(b.name);
            case "popularity":
                return b.popularity - a.popularity;
            default:
                return 0;
        }
    });

    const totalPages = Math.ceil(sortedTools.length / TOOLS_PER_PAGE);
    const startIndex = (currentPage - 1) * TOOLS_PER_PAGE;
    const paginatedTools = sortedTools.slice(startIndex, startIndex + TOOLS_PER_PAGE);

    // ═══════════════════════════════════════════════
    // ADMIN DASHBOARD
    // ═══════════════════════════════════════════════
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-sm text-gray-400">{tools.length} tools total</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={async () => {
                            setSuccess("");
                            setError("");
                            try {
                                const res = await fetch("/api/admin/scrape-airdrops", {
                                    method: "POST",
                                    headers: { "x-admin-password": password },
                                });
                                const data = await res.json();
                                if (data.success) {
                                    setSuccess(`✅ Scraper completed! Updated: ${data.stats.updated}, Matched: ${data.stats.matched}, Scraped: ${data.stats.scraped}`);
                                    fetchTools(); // Refresh tools list
                                } else {
                                    setError(`Scraper failed: ${data.error}`);
                                }
                            } catch (err) {
                                setError("Failed to run scraper");
                            }
                        }}
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-400 transition-colors"
                    >
                        🔄 Update Airdrops
                    </button>
                    <button
                        onClick={() => { setAuthenticated(false); setPassword(""); }}
                        className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-300">
                    {error}
                </div>
            )}
            {success && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-300">
                    {success}
                </div>
            )}

            {/* Airdrop Management Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
                {/* DefiLlama Sync */}
                <div className="rounded-xl border border-white/10 bg-gray-900/60 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <span>🦙</span>
                            <span>DefiLlama Sync</span>
                        </h2>
                        {defillamaStats && (
                            <span className="text-xs text-gray-500">
                                Last: {defillamaStats.updated} updated
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-400">
                        Automatically fetch airdrop data from DefiLlama (free API, no key needed)
                    </p>
                    <button
                        onClick={handleDefillamaSync}
                        disabled={defillamaSyncing}
                        className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-400 transition-colors disabled:opacity-50"
                    >
                        {defillamaSyncing ? "Syncing..." : "🔄 Sync Now"}
                    </button>
                </div>

                {/* Airdrop Submissions */}
                <div className="rounded-xl border border-white/10 bg-gray-900/60 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <span>📝</span>
                            <span>Airdrop Submissions</span>
                        </h2>
                        {pendingCount > 0 && (
                            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white">
                                {pendingCount}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-400">
                        Review airdrop submissions from the community
                    </p>
                    <a
                        href="/admin/submissions"
                        className="block w-full rounded-lg bg-violet-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-violet-400 transition-colors"
                    >
                        Review Airdrop Submissions
                    </a>
                </div>

                {/* Tool Submissions */}
                <div className="rounded-xl border border-white/10 bg-gray-900/60 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <span>🛠️</span>
                            <span>Tool Submissions</span>
                        </h2>
                        {tools.filter(t => t.status === "draft" && t.source === "user-submission").length > 0 && (
                            <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-bold text-white">
                                {tools.filter(t => t.status === "draft" && t.source === "user-submission").length}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-400">
                        Review tool submissions from users. Click &quot;Draft&quot; filter below to see them.
                    </p>
                    <button
                        onClick={() => { setStatusFilter("draft"); setCurrentPage(1); }}
                        className="block w-full rounded-lg bg-yellow-500 px-4 py-2 text-center text-sm font-medium text-white hover:bg-yellow-400 transition-colors"
                    >
                        Review Tool Submissions
                    </button>
                </div>
            </div>

            {/* Top Contributors Leaderboard */}
            <div className="rounded-xl border border-white/10 bg-gray-900/60 p-5 space-y-3">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span>🏆</span>
                    <span>Top Contributors</span>
                </h2>
                {topContributors.length > 0 ? (
                    <div className="space-y-2">
                        {topContributors.map((contributor, index) => (
                            <div
                                key={contributor.username}
                                className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-gray-400">
                                        #{index + 1}
                                    </span>
                                    <a
                                        href={`https://t.me/${contributor.username.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-full bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-400 hover:bg-blue-500/20 transition-colors"
                                    >
                                        📱 {contributor.username}
                                    </a>
                                </div>
                                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-bold text-emerald-400">
                                    {contributor.count} {contributor.count === 1 ? 'submission' : 'submissions'}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                        No contributors yet. Approve submissions with Telegram usernames to see the leaderboard!
                    </p>
                )}
            </div>

            {/* Add Single URL */}
            <div className="rounded-xl border border-white/10 bg-gray-900/60 p-5 space-y-3">
                <h2 className="text-lg font-semibold text-white">Add Tool by URL</h2>
                <form onSubmit={handleAddUrl} className="flex gap-2">
                    <input
                        type="url"
                        value={addUrl}
                        onChange={(e) => setAddUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 rounded-lg border border-white/10 bg-gray-900/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50"
                    />
                    <button
                        type="submit"
                        disabled={addLoading}
                        className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400 transition-colors disabled:opacity-50"
                    >
                        {addLoading ? "Adding..." : "Add"}
                    </button>
                </form>
            </div>

            {/* Bulk Import */}
            <div className="rounded-xl border border-white/10 bg-gray-900/60 p-5 space-y-3">
                <h2 className="text-lg font-semibold text-white">Bulk Import URLs</h2>
                <form onSubmit={handleBulkImport} className="space-y-3">
                    <textarea
                        value={bulkUrls}
                        onChange={(e) => setBulkUrls(e.target.value)}
                        placeholder="Paste URLs (one per line)"
                        rows={5}
                        className="w-full rounded-lg border border-white/10 bg-gray-900/60 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50"
                    />
                    <button
                        type="submit"
                        disabled={importLoading}
                        className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400 transition-colors disabled:opacity-50"
                    >
                        {importLoading ? "Importing..." : "Import All"}
                    </button>
                </form>
                {importResult && (
                    <div className="text-sm text-gray-400">
                        ✓ Added: {importResult.added}, Skipped: {importResult.skipped}
                        {importResult.errors.length > 0 && (
                            <div className="mt-2 text-rose-400">
                                Errors: {importResult.errors.join(", ")}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Tools List */}
            {tools.length === 0 ? (
                <div className="py-20 text-center text-gray-500">
                    <p className="text-lg">No tools yet. Add one above! 🚀</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Search and Filter Bar */}
                    <div className="space-y-3">
                        {/* Search Input */}
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                placeholder="Search by name or domain..."
                                className="w-full rounded-lg border border-white/10 bg-gray-900/60 px-4 py-2.5 pl-10 text-sm text-white placeholder-gray-500 outline-none focus:border-violet-500/50"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Status Filter Tabs */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                            <div className="flex gap-2 items-center flex-wrap">
                                {["all", "draft", "reviewed", "featured"].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${statusFilter === status
                                            ? "bg-violet-500 text-white"
                                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                                            }`}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {/* Sort Dropdown */}
                            <div className="sm:ml-auto flex items-center gap-2">
                                <span className="text-xs text-gray-500">Sort by:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                                    className="rounded-lg border border-white/10 bg-gray-900/60 px-3 py-1.5 text-xs text-white outline-none focus:border-violet-500/50"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="name">Name (A-Z)</option>
                                    <option value="popularity">Popularity</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tools Count */}
                    <div className="text-sm text-gray-400">
                        Showing {paginatedTools.length} of {filteredTools.length} tools
                        {searchQuery && ` (filtered from ${tools.length} total)`}
                    </div>

                    {/* Tools List */}
                    <div className="space-y-3">
                        {paginatedTools.map((tool) => (
                            <div
                                key={tool.id}
                                className="rounded-xl border border-white/10 bg-gray-900/60 p-5 space-y-3"
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {tool.faviconUrl && (
                                            <img
                                                src={tool.faviconUrl}
                                                alt=""
                                                className="h-6 w-6 rounded object-contain shrink-0"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-white truncate">{tool.name}</h3>
                                            <a
                                                href={tool.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-violet-400 hover:underline"
                                            >
                                                {tool.domain}
                                            </a>
                                            {tool.description && (
                                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{tool.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                        <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-medium text-violet-400">★ {tool.popularity}</span>
                                        <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">👆 {tool.clicks}</span>
                                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-500">{tool.source}</span>
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tool.status === "draft" ? "bg-yellow-500/20 text-yellow-400"
                                            : tool.status === "reviewed" ? "bg-emerald-500/20 text-emerald-400"
                                                : "bg-amber-500/20 text-amber-400"
                                            }`}>
                                            {tool.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Editing section */}
                                {editingId === tool.id ? (
                                    <div className="space-y-3 border-t border-white/5 pt-3">
                                        <div>
                                            <label className="text-xs font-medium text-gray-400">Categories</label>
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {CATEGORIES.map((cat) => (
                                                    <button
                                                        key={cat}
                                                        type="button"
                                                        onClick={() =>
                                                            setEditCategories((prev) =>
                                                                prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                                                            )
                                                        }
                                                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${editCategories.includes(cat)
                                                            ? "bg-violet-500 text-white"
                                                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                                                            }`}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-400">Tags (comma-separated)</label>
                                            <input
                                                type="text"
                                                value={editTags}
                                                onChange={(e) => setEditTags(e.target.value)}
                                                className="w-full mt-1 rounded-lg border border-white/10 bg-gray-900/60 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-400">Popularity (0-100)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={editPopularity}
                                                onChange={(e) => setEditPopularity(parseInt(e.target.value) || 0)}
                                                className="w-full mt-1 rounded-lg border border-white/10 bg-gray-900/60 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-400 flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={editHasAirdrop}
                                                    onChange={(e) => setEditHasAirdrop(e.target.checked)}
                                                    className="rounded border-white/10 bg-gray-900/60 text-emerald-500 focus:ring-emerald-500/50"
                                                />
                                                🎁 Active Airdrop/Incentive
                                            </label>
                                        </div>
                                        {editHasAirdrop && (
                                            <div>
                                                <label className="text-xs font-medium text-gray-400">Airdrop Details</label>
                                                <textarea
                                                    value={editAirdropDetails}
                                                    onChange={(e) => setEditAirdropDetails(e.target.value)}
                                                    placeholder="e.g., Points program for early users, ends March 2026"
                                                    rows={2}
                                                    className="w-full mt-1 rounded-lg border border-white/10 bg-gray-900/60 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
                                                />
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSaveEdit(tool.id)}
                                                className="rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-400"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-400 hover:bg-white/10"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {tool.categories.length > 0 && (
                                            <div className="flex gap-1">
                                                {tool.categories.map((cat) => (
                                                    <span key={cat} className="rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-300">
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                {editingId !== tool.id && (
                                    <div className="flex flex-wrap gap-2 border-t border-white/5 pt-3">
                                        <button
                                            onClick={() => startEdit(tool)}
                                            className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-white/10 transition-colors"
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onClick={() => handleRefresh(tool.id)}
                                            className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-white/10 transition-colors"
                                        >
                                            🔄 Refresh
                                        </button>
                                        {tool.status !== "reviewed" && (
                                            <button
                                                onClick={() => handleAction(tool.id, "approve")}
                                                className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                                            >
                                                ✓ Approve
                                            </button>
                                        )}
                                        {tool.status !== "featured" && (
                                            <button
                                                onClick={() => handleAction(tool.id, "feature")}
                                                className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
                                            >
                                                ⭐ Feature
                                            </button>
                                        )}
                                        {tool.status !== "draft" && (
                                            <button
                                                onClick={() => handleAction(tool.id, "draft")}
                                                className="rounded-lg bg-yellow-500/10 px-3 py-1.5 text-xs font-medium text-yellow-300 hover:bg-yellow-500/20 transition-colors"
                                            >
                                                📝 Draft
                                            </button>
                                        )}
                                        {tool.hasAirdrop && (
                                            <button
                                                onClick={() => handleDeleteAirdrop(tool.id)}
                                                className="rounded-lg bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300 hover:bg-orange-500/20 transition-colors"
                                            >
                                                🎁❌ Remove Airdrop
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(tool.id)}
                                            className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-colors"
                                        >
                                            🗑 Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-white/10 pt-4">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                ← Previous
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">
                                    Page {currentPage} of {totalPages}
                                </span>
                            </div>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
