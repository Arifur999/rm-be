import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { env } from "../../config/env.js";

// A small pool: on Vercel every function instance opens its own, and Neon's
// pooler does the real pooling. The local `prisma dev` database only takes a
// single connection, so .env sets DB_POOL_MAX=1 there.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL, max: env.DB_POOL_MAX });

export const prisma = new PrismaClient({ adapter });
