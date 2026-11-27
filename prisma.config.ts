import "dotenv/config";
import { defineConfig } from "prisma/config";

// Migrations use the direct (non-pooled) Neon URL; the app itself uses the
// pooled DATABASE_URL through the pg adapter in src/app/lib/prisma.ts.
export default defineConfig({
  schema: "prisma/schema",
  datasource: {
    url: (process.env.DIRECT_URL || process.env.DATABASE_URL) as string,
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx src/app/utils/seed.ts",
  },
});
