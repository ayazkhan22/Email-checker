import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Pooled URL for runtime (Supabase port 6543)
    url: env("DATABASE_URL"),
    // Direct URL for migrations (Supabase port 5432) — set in Vercel when running db:migrate
    ...(process.env.DIRECT_URL ? { directUrl: process.env.DIRECT_URL } : {}),
  },
});
