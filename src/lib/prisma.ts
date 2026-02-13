import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getConnectionString(): string {
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    // For prisma+postgres:// URLs (Prisma Postgres / Accelerate),
    // decode the api_key to extract the direct TCP connection string.
    if (url.startsWith("prisma+postgres://") || url.startsWith("prisma://")) {
        try {
            const apiKey = new URL(url).searchParams.get("api_key");
            if (apiKey) {
                const decoded = JSON.parse(
                    Buffer.from(apiKey, "base64").toString("utf-8")
                );
                if (decoded.databaseUrl) {
                    return decoded.databaseUrl;
                }
            }
        } catch (err) {
            console.error("Failed to decode prisma+postgres URL:", err);
        }
    }

    // For regular postgres:// URLs, use them directly
    return url;
}

function createPrismaClient() {
    const connectionString = getConnectionString();
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
