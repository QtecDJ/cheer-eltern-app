import { PrismaClient } from "@prisma/client";
// import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Prisma 6 benötigt keinen Adapter
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Adapter wird nur für Prisma 7 benötigt

// Prisma Client für Next.js - verhindert zu viele Verbindungen im Dev-Modus
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
