"use client";

import { useState } from "react";
import Link from "next/link";

export default function SubmitAirdropPage() {
    const [formData, setFormData] = useState({
        projectName: "",
        projectUrl: "",
        description: "",
        proofLinks: [""],
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
            // Filter out empty proof links
            const proofLinks = formData.proofLinks.filter((link) => link.trim() !== "");

            if (proofLinks.length === 0) {
                setError("Please provide at least one proof link");
                setLoading(false);
                return;
            }

            const response = await fetch("/api/airdrops/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    proofLinks,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit");
            }

            setSuccess(true);
            setFormData({
                projectName: "",
                projectUrl: "",
                description: "",
                proofLinks: [""],
                submittedBy: "",
                telegramUsername: "",
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit");
        } finally {
            setLoading(false);
        }
    };

    const addProofLink = () => {
        if (formData.proofLinks.length < 5) {
            setFormData({
                ...formData,
                proofLinks: [...formData.proofLinks, ""],
            });
        }
    };

    const removeProofLink = (index: number) => {
        setFormData({
            ...formData,
            proofLinks: formData.proofLinks.filter((_, i) => i !== index),
        });
    };

    const updateProofLink = (index: number, value: string) => {
        const newProofLinks = [...formData.proofLinks];
        newProofLinks[index] = value;
        setFormData({ ...formData, proofLinks: newProofLinks });
    };

    if (success) {
        return (
            <div className="mx-auto max-w-2xl space-y-6">
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-2xl font-bold text-emerald-300 mb-2">
                        Submission Received!
                    </h2>
                    <p className="text-gray-300 mb-6">
                        Thank you for contributing to the community! Your airdrop submission will be
                        reviewed by our team and added to the directory if approved.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => setSuccess(false)}
                            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors"
                        >
                            Submit Another
                        </button>
                        <Link
                            href="/airdrops"
                            className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                            View Airdrops
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
                    Submit an{" "}
                    <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                        Airdrop
                    </span>
                </h1>
                <p className="text-gray-400">
                    Know of an active airdrop or incentive program? Share it with the community!
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-6 space-y-5">
                    {/* Project Name */}
                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                            Project Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.projectName}
                            onChange={(e) =>
                                setFormData({ ...formData, projectName: e.target.value })
                            }
                            className="w-full rounded-xl border border-white/10 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="e.g., Uniswap, zkSync, Scroll"
                        />
                    </div>

                    {/* Project URL */}
                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                            Project Website *
                        </label>
                        <input
                            type="url"
                            required
                            value={formData.projectUrl}
                            onChange={(e) =>
                                setFormData({ ...formData, projectUrl: e.target.value })
                            }
                            className="w-full rounded-xl border border-white/10 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="https://example.com"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                            Airdrop Details *
                        </label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            rows={4}
                            className="w-full rounded-xl border border-white/10 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="Describe the airdrop opportunity, how to participate, and any requirements..."
                            minLength={20}
                            maxLength={2000}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {formData.description.length}/2000 characters (minimum 20)
                        </p>
                    </div>

                    {/* Proof Links */}
                    <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                            Proof Links * (Twitter, Docs, Blog Posts)
                        </label>
                        {formData.proofLinks.map((link, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="url"
                                    value={link}
                                    onChange={(e) => updateProofLink(index, e.target.value)}
                                    className="flex-1 rounded-xl border border-white/10 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    placeholder="https://twitter.com/project/status/..."
                                />
                                {formData.proofLinks.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeProofLink(index)}
                                        className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 text-red-400 hover:bg-red-500/20 transition-colors"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                        {formData.proofLinks.length < 5 && (
                            <button
                                type="button"
                                onClick={addProofLink}
                                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                                + Add another proof link
                            </button>
                        )}
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
                            className="w-full rounded-xl border border-white/10 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
                                // Auto-add @ if user forgets
                                if (value && !value.startsWith('@')) {
                                    value = '@' + value;
                                }
                                setFormData({ ...formData, telegramUsername: value });
                            }}
                            className="w-full rounded-xl border border-white/10 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            placeholder="@username (to verify real contributors)"
                            maxLength={33}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            💡 Enter your Telegram username (e.g., @vncturn)
                        </p>
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
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-lg font-semibold text-white hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Submitting..." : "Submit Airdrop"}
                </button>
            </form>

            {/* Info Box */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">ℹ️</span>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-blue-300 mb-1">Submission Guidelines</h3>
                        <ul className="text-sm text-blue-200/80 space-y-1 list-disc list-inside">
                            <li>Only submit legitimate airdrops with verifiable proof</li>
                            <li>Provide official links (Twitter, docs, blog posts)</li>
                            <li>Be specific about participation requirements</li>
                            <li>Submissions are reviewed before being published</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
