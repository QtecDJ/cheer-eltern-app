import { PrismaClient } from "@prisma/client";

// Prisma Client für Next.js - verhindert zu viele Verbindungen im Dev-Modus
// Neon Serverless: Connection pooling via Neon Proxy ist bereits aktiviert
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // Neon-optimierte Einstellungen
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
