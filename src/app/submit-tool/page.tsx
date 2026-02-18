"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/utils";

export default function SubmitToolPage() {
    const [formData, setFormData] = useState({
        name: "",
        url: "",
        description: "",
        category: "",
        submittedBy: "",
        telegramUsername: "",
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/tools/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit");
            }

            setSuccess(true);
            setFormData({
                name: "",
                url: "",
                description: "",
                category: "",
                submittedBy: "",
                telegramUsername: "",
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-8 text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-2xl font-bold text-violet-300 mb-2">
                        Tool Submitted!
                    </h2>
                    <p className="text-gray-300 mb-6">
                        Thank you for your submission! Your tool will be reviewed by our team
                        and added to the directory if approved.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => setSuccess(false)}
                            className="rounded-xl bg-violet-500 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-400 transition-colors"
                        >
                            Submit Another
                        </button>
                        <Link
                            href="/"
                            className="rounded-xl border border-violet-500/50 bg-violet-500/10 px-6 py-3 text-sm font-semibold text-violet-400 hover:bg-violet-500/20 transition-colors"
                        >
                            Browse Tools
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                    Submit a{" "}
                    <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                        Tool
                    </span>
                </h1>
                <p className="text-gray-400">
                    Know a great crypto or Web3 tool? Help us grow the directory!
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-6 space-y-5">
                    {/* Tool Name */}
                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                            Tool Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            className="w-full rounded-xl border border-white/10 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                            placeholder="e.g., Uniswap, Aave, MetaMask"
                        />
                    </div>

                    {/* Tool URL */}
                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                            Tool Website *
                        </label>
                        <input
                            type="url"
                            required
                            value={formData.url}
                            onChange={(e) =>
                                setFormData({ ...formData, url: e.target.value })
                            }
                            className="w-full rounded-xl border border-white/10 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                            placeholder="https://example.com"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                            Description *
                        </label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            rows={3}
                            className="w-full rounded-xl border border-white/10 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                            placeholder="What does this tool do? Why is it useful?"
                            minLength={20}
                            maxLength={500}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {formData.description.length}/500 characters (minimum 20)
                        </p>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                            Category *
                        </label>
                        <select
                            required
                            value={formData.category}
                            onChange={(e) =>
                                setFormData({ ...formData, category: e.target.value })
                            }
                            className="w-full rounded-xl border border-white/10 bg-gray-800 px-4 py-3 text-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                        >
                            <option value="" disabled>
                                Select a category
                            </option>
                            {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Optional Email */}
                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                            Your Email (Optional)
                        </label>
                        <input
                            type="email"
                            value={formData.submittedBy}
                            onChange={(e) =>
                                setFormData({ ...formData, submittedBy: e.target.value })
                            }
                            className="w-full rounded-xl border border-white/10 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                            placeholder="your@email.com (for updates on your submission)"
                        />
                    </div>

                    {/* Optional Telegram Username */}
                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                            Your Telegram Username (Optional)
                        </label>
                        <input
                            type="text"
                            value={formData.telegramUsername}
                            onChange={(e) => {
                                let value = e.target.value.trim();
                                if (value && !value.startsWith("@")) {
                                    value = "@" + value;
                                }
                                setFormData({ ...formData, telegramUsername: value });
                            }}
                            className="w-full rounded-xl border border-white/10 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                            placeholder="@username"
                            maxLength={33}
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                        {error}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-4 text-lg font-semibold text-white hover:from-violet-400 hover:to-fuchsia-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Submitting..." : "Submit Tool"}
                </button>
            </form>

            {/* Info Box */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">ℹ️</span>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-blue-300 mb-1">Submission Guidelines</h3>
                        <ul className="text-sm text-blue-200/80 space-y-1 list-disc list-inside">
                            <li>Only submit legitimate crypto/Web3 tools</li>
                            <li>Provide a working URL to the tool&apos;s website</li>
                            <li>Write a clear, helpful description</li>
                            <li>Submissions are reviewed before being published</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
