"use client";

import { useState } from "react";

export default function NewsletterSignup() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");

        try {
            const res = await fetch("/api/newsletter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to subscribe");
            }

            setStatus("success");
            setMessage(data.message);
            setEmail("");
        } catch (err) {
            setStatus("error");
            setMessage(err instanceof Error ? err.message : "Something went wrong");
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <h3 className="text-sm font-semibold text-white mb-2 text-center">
                Stay Updated
            </h3>
            <p className="text-xs text-gray-500 mb-3 text-center">
                Get notified about new tools and airdrops
            </p>

            {status === "success" ? (
                <p className="text-center text-sm text-emerald-400">{message}</p>
            ) : (
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="flex-1 rounded-xl border border-white/10 bg-gray-800/60 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white hover:from-violet-400 hover:to-fuchsia-400 transition-all disabled:opacity-50"
                    >
                        {status === "loading" ? "..." : "Subscribe"}
                    </button>
                </form>
            )}

            {status === "error" && (
                <p className="text-center text-xs text-red-400 mt-2">{message}</p>
            )}
        </div>
    );
}
