import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "@prisma/adapter-pg"],
  turbopack: {
    root: process.cwd(),
    resolveAlias: {
      "@generated/prisma": path.resolve("./prisma/generated/prisma"),
    },
  },
};

export default nextConfig;
