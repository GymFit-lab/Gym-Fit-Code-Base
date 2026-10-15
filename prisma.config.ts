import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js reads .env.local; the Prisma CLI doesn't, so load it here (falling back to .env).
config({ path: [".env.local", ".env"] });

const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // `prisma generate` doesn't need a connection, so only require the URL when it's set
  // (migrate / db push will still error clearly if it's missing).
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
});
