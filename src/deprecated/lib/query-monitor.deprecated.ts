import { PrismaClient } from "@prisma/client";

export function createMonitoredPrismaClient() {
  // archived implementation
  return new PrismaClient();
}

export function resetQueryStats() {
  // archived
}

export function exportQueryStats() {
  return [];
}
