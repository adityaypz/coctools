"use client";

interface ToolCardProps {
    id: string;
    name: string;
    url: string;
    domain: string;
    description?: string | null;
    imageUrl?: string | null;
    faviconUrl?: string | null;
    categories: string[];
    status: string;
    hasAirdrop?: boolean;
    airdropDetails?: string | null;
}

export default function ToolCard({
    id,
    name,
    url,
    domain,
    description,
    imageUrl,
    faviconUrl,
    categories,
    status,
    hasAirdrop,
    airdropDetails,
}: ToolCardProps) {
    const handleClick = async () => {
        // Track click asynchronously (don't wait for response)
        try {
            fetch("/api/tools/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ toolId: id }),
            }).catch(() => { }); // Silently fail if tracking fails
        } catch { }
    };

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className={`group relative flex h-full min-h-[220px] sm:min-h-[280px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-gray-900/60 p-4 sm:p-5 transition-all duration-300 hover:border-violet-500/40 hover:bg-gray-900/80 hover:shadow-lg hover:shadow-violet-500/10 ${hasAirdrop ? 'pt-10 sm:pt-12' : ''}`}
        >
            {/* Airdrop Badge */}
            {hasAirdrop && (
                <div
                    className="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-500/30 animate-pulse"
                    title={airdropDetails || "Active airdrop or incentive program"}
                >
                    🎁 AIRDROP
                </div>
            )}

            {/* Featured Badge */}
            {status === "featured" && (
                <div className="absolute right-3 top-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Featured
                </div>
            )}

            <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                    {faviconUrl ? (
                        <img
                            src={faviconUrl}
                            alt=""
                            className="h-6 w-6 object-contain"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (imageUrl) {
                                    target.src = imageUrl;
                                    target.className = "h-full w-full object-cover";
                                } else {
                                    target.style.display = "none";
                                    target.parentElement!.innerHTML = `<span class="text-sm font-bold text-violet-300">${name.charAt(0).toUpperCase()}</span>`;
                                }
                            }}
                        />
                    ) : imageUrl ? (
                        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-sm font-bold text-violet-300">
                            {name.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-white group-hover:text-violet-300 transition-colors">
                        {name}
                    </h3>
                    <p className="truncate text-xs text-gray-500">{domain}</p>
                </div>
            </div>

            <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-400">
                {description || `Visit ${domain} to learn more →`}
            </p>

            <div className="mt-auto flex flex-wrap items-center gap-1.5">
                {categories.slice(0, 3).map((cat) => (
                    <span
                        key={cat}
                        className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-gray-300"
                    >
                        {cat}
                    </span>
                ))}
                {categories.length > 3 && (
                    <span className="text-xs text-gray-500">+{categories.length - 3}</span>
                )}
            </div>
        </a>
    );
}
