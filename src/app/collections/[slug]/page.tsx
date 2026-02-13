import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import ToolCard from "@/components/ToolCard";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function CollectionDetailPage({ params }: PageProps) {
    const { slug } = await params;
    const collection = await prisma.collection.findUnique({
        where: { slug },
        include: {
            tools: {
                include: { tool: true },
            },
        },
    });

    if (!collection) notFound();

    return (
        <div className="space-y-8">
            <Link
                href="/collections"
                className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
            >
                ← Back to collections
            </Link>

            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">{collection.name}</h1>
                {collection.description && (
                    <p className="text-gray-400">{collection.description}</p>
                )}
                <p className="text-sm text-gray-500">{collection.tools.length} tools</p>
            </div>

            {collection.tools.length === 0 ? (
                <div className="py-20 text-center text-gray-500">
                    <p>No tools in this collection yet.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {collection.tools.map(({ tool }) => (
                        <ToolCard
                            key={tool.id}
                            id={tool.id}
                            name={tool.name}
                            url={tool.url}
                            domain={tool.domain}
                            description={tool.description}
                            imageUrl={tool.imageUrl}
                            faviconUrl={tool.faviconUrl}
                            categories={tool.categories}
                            status={tool.status}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
