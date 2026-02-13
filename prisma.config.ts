import "dotenv/config";

export default {
  schema: "./prisma/schema.prisma",
  migrations: "./prisma/migrations",
  datasourceUrl: process.env.DATABASE_URL,
};
