import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
    const collections = await prisma.collection.findMany({
        include: {
            tools: {
                include: { tool: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-8">
            <div className="space-y-3">
                <h1 className="text-4xl font-bold text-white">Collections</h1>
                <p className="text-gray-400 max-w-2xl">
                    Curated lists of crypto tools grouped by theme or use-case.
                    Browse collections like "DeFi Essentials", "NFT Marketplaces", or "Trading Platforms"
                    to discover the best tools for your needs.
                </p>
            </div>

            {collections.length === 0 ? (
                <div className="py-20 text-center text-gray-500">
                    <p>No collections yet.</p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {collections.map((collection) => (
                        <Link
                            key={collection.id}
                            href={`/collections/${collection.slug}`}
                            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-950/80 p-6 backdrop-blur-sm transition-all hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10"
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <h3 className="text-lg font-semibold text-white group-hover:text-violet-400 transition-colors">
                                        {collection.name}
                                    </h3>
                                    <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-medium text-violet-400">
                                        {collection.tools.length} tools
                                    </span>
                                </div>
                                {collection.description && (
                                    <p className="text-sm text-gray-400 line-clamp-2">
                                        {collection.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-violet-400 font-medium">
                                    View collection →
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
