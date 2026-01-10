import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// PostgreSQL Pool für Prisma Adapter
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Prisma Adapter erstellen
const adapter = new PrismaPg(pool);

// Prisma Client für Next.js - verhindert zu viele Verbindungen im Dev-Modus
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
