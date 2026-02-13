"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Submission {
    id: string;
    projectName: string;
    projectUrl: string;
    description: string;
    proofLinks: string[];
    submittedBy: string | null;
    telegramUsername: string | null;
    status: string;
    createdAt: string;
    reviewedAt: string | null;
    reviewNotes: string | null;
}

export default function SubmissionsPage() {
    const [password, setPassword] = useState("");
    const [authenticated, setAuthenticated] = useState(false);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [statusFilter, setStatusFilter] = useState("pending");

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/airdrops/submit?status=${statusFilter}`, {
                headers: { "x-admin-password": password },
            });
            if (!res.ok) throw new Error("Unauthorized");
            const data = await res.json();
            setSubmissions(data.submissions || []);
        } catch {
            setError("Failed to fetch submissions");
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            const res = await fetch("/api/airdrops/submit?status=pending", {
                headers: { "x-admin-password": password },
            });
            if (!res.ok) throw new Error("Invalid password");
            setAuthenticated(true);
            fetchSubmissions();
        } catch {
            setError("Invalid password");
        }
    };

    useEffect(() => {
        if (authenticated) fetchSubmissions();
    }, [statusFilter, authenticated]);

    const handleReview = async (submissionId: string, action: "approve" | "reject" | "reopen", notes?: string, endDate?: string) => {
        try {
            const res = await fetch(`/api/airdrops/submit/${submissionId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-password": password,
                },
                body: JSON.stringify({ action, notes, endDate }),
            });
            if (!res.ok) throw new Error("Review failed");
            const data = await res.json();
            if (action === "approve" && data.toolId) {
                setSuccess(`✅ Submission approved! Tool created/updated. View on /airdrops`);
            } else {
                setSuccess(`Submission ${action}d successfully`);
            }
            fetchSubmissions();
        } catch {
            setError(`Failed to ${action} submission`);
        }
    };

    const handleDelete = async (submissionId: string) => {
        if (!confirm("Are you sure you want to delete this submission?")) return;
        try {
            const res = await fetch(`/api/airdrops/submit/${submissionId}`, {
                method: "DELETE",
                headers: { "x-admin-password": password },
            });
            if (!res.ok) throw new Error("Delete failed");
            setSuccess("Submission deleted successfully");
            fetchSubmissions();
        } catch {
            setError("Failed to delete submission");
        }
    };

    if (!authenticated) {
        return (
            <div className="mx-auto max-w-md space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
                    <p className="text-gray-400">Review community airdrop submissions</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="rounded-xl border border-white/10 bg-gray-900/60 p-6">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Admin password"
                            className="w-full rounded-lg border border-white/10 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                        />
                    </div>
                    {error && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full rounded-xl bg-violet-500 px-6 py-3 font-semibold text-white hover:bg-violet-400 transition-colors"
                    >
                        Login
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Airdrop Submissions</h1>
                    <p className="text-sm text-gray-400">{submissions.length} submissions</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/admin"
                        className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        ← Back to Admin
                    </Link>
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
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}
            {success && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-300">
                    {success}
                </div>
            )}

            {/* Status Filter */}
            <div className="flex gap-2">
                {["pending", "approved", "rejected", "all"].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${statusFilter === status
                            ? "bg-violet-500 text-white"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {/* Submissions List */}
            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : submissions.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-gray-900/60 p-12 text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Submissions</h3>
                    <p className="text-gray-400">No {statusFilter !== "all" ? statusFilter : ""} submissions found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {submissions.map((submission) => (
                        <div
                            key={submission.id}
                            className="rounded-xl border border-white/10 bg-gray-900/60 p-5 space-y-4"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white">{submission.projectName}</h3>
                                    <a
                                        href={submission.projectUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-violet-400 hover:text-violet-300"
                                    >
                                        {submission.projectUrl}
                                    </a>
                                </div>
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-bold ${submission.status === "approved"
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : submission.status === "rejected"
                                            ? "bg-red-500/20 text-red-400"
                                            : "bg-yellow-500/20 text-yellow-400"
                                        }`}
                                >
                                    {submission.status}
                                </span>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-gray-300 leading-relaxed">{submission.description}</p>

                            {/* Proof Links */}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-400 mb-2">Proof Links:</h4>
                                <div className="space-y-1">
                                    {submission.proofLinks.map((link, i) => (
                                        <a
                                            key={i}
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block text-xs text-blue-400 hover:text-blue-300 truncate"
                                        >
                                            {link}
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Submitted: {new Date(submission.createdAt).toLocaleDateString()}</span>
                                {submission.submittedBy && <span>By: {submission.submittedBy}</span>}
                                {submission.telegramUsername && (
                                    <a
                                        href={`https://t.me/${submission.telegramUsername.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-full bg-blue-500/10 px-2.5 py-1 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium"
                                    >
                                        📱 {submission.telegramUsername}
                                    </a>
                                )}
                            </div>

                            {/* Actions */}
                            {submission.status === "pending" && (
                                <div className="flex gap-2 pt-2 border-t border-white/10">
                                    <button
                                        onClick={() => {
                                            const endDate = prompt("Airdrop end date (optional, YYYY-MM-DD):");
                                            handleReview(submission.id, "approve", undefined, endDate || undefined);
                                        }}
                                        className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-400 transition-colors"
                                    >
                                        ✓ Approve
                                    </button>
                                    <button
                                        onClick={() => {
                                            const notes = prompt("Rejection reason (optional):");
                                            handleReview(submission.id, "reject", notes || undefined);
                                        }}
                                        className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-400 transition-colors"
                                    >
                                        ✗ Reject
                                    </button>
                                </div>
                            )}

                            {/* Actions for approved/rejected */}
                            {submission.status !== "pending" && (
                                <div className="flex gap-2 pt-2 border-t border-white/10">
                                    <button
                                        onClick={() => handleReview(submission.id, "reopen")}
                                        className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-400 transition-colors"
                                    >
                                        🔄 Re-open
                                    </button>
                                    <button
                                        onClick={() => handleDelete(submission.id)}
                                        className="flex-1 rounded-lg bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-400 transition-colors"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            )}

                            {/* Review Notes */}
                            {submission.reviewNotes && (
                                <div className="rounded-lg bg-white/5 p-3">
                                    <h4 className="text-xs font-semibold text-gray-400 mb-1">Review Notes:</h4>
                                    <p className="text-sm text-gray-300">{submission.reviewNotes}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
