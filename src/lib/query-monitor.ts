/**
 * Query Performance Monitor für Neon Postgres
 * 
 * Überwacht Prisma Queries und loggt Performance-Metriken
 * Hilft bei der Identifizierung von langsamen oder ineffizienten Queries
 */

import { PrismaClient } from "@prisma/client";

// Query-Statistiken
interface QueryStats {
  model: string;
  action: string;
  count: number;
  totalDuration: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  lastExecuted: Date;
}

const queryStats = new Map<string, QueryStats>();

/**
 * Erweitert Prisma Client mit Logging und Monitoring
 */
/**
 * @deprecated Candidate for removal/relocation. Kept for compatibility.
 */
// `createMonitoredPrismaClient`, `resetQueryStats` and `exportQueryStats`
// moved to `src/deprecated/lib/query-monitor.deprecated.ts` to remove
// unused exports and keep a backup.
export function createMonitoredPrismaClient() {
  const prisma = new PrismaClient({
    log: [
      {
        emit: "event",
        level: "query",
      },
    ],
  });

  // Query Event Listener
  prisma.$on("query" as never, (e: { query?: string; params?: string; duration?: number | string; target?: string; action?: string }) => {
    const key = `${e.target ?? 'unknown'}.${e.action ?? 'unknown'}`;
    const duration = typeof e.duration === 'number' ? e.duration : parseFloat(String(e.duration || '0')) || 0;

    const existing = queryStats.get(key);
    if (existing) {
      existing.count++;
      existing.totalDuration += duration;
      existing.avgDuration = existing.totalDuration / existing.count;
      existing.maxDuration = Math.max(existing.maxDuration, duration);
      existing.minDuration = Math.min(existing.minDuration, duration);
      existing.lastExecuted = new Date();
    } else {
      queryStats.set(key, {
        model: e.target ?? 'unknown',
        action: e.action ?? 'unknown',
        count: 1,
        totalDuration: duration,
        avgDuration: duration,
        maxDuration: duration,
        minDuration: duration,
        lastExecuted: new Date(),
      });
    }

    // Warne bei langsamen Queries
    if (duration > 1000) {
      console.warn(`🐌 Slow query detected: ${key} took ${duration}ms`);
      console.warn(`Query: ${e.query}`);
    }

    // Warne bei N+1 Patterns
    if (existing && existing.count > 10 && existing.avgDuration < 50) {
      console.warn(`⚠️  Potential N+1 query pattern: ${key} called ${existing.count} times`);
    }
  });

  return prisma;
}

/**
 * Gibt Query-Statistiken aus
 */
export function printQueryStats() {
  console.log("\n📊 Query Performance Statistics:\n");
  
  const sorted = Array.from(queryStats.values()).sort(
    (a, b) => b.totalDuration - a.totalDuration
  );

  console.table(
    sorted.map((stat) => ({
      Query: `${stat.model}.${stat.action}`,
      Count: stat.count,
      "Avg (ms)": stat.avgDuration.toFixed(2),
      "Max (ms)": stat.maxDuration.toFixed(2),
      "Total (ms)": stat.totalDuration.toFixed(2),
    }))
  );

  // Warnungen
  const slowQueries = sorted.filter((s) => s.avgDuration > 500);
  if (slowQueries.length > 0) {
    console.warn("\n🐌 Slow Queries (avg > 500ms):");
    slowQueries.forEach((q) => {
      console.warn(`  - ${q.model}.${q.action}: ${q.avgDuration.toFixed(2)}ms avg`);
    });
  }

  const frequentQueries = sorted.filter((s) => s.count > 50);
  if (frequentQueries.length > 0) {
    console.warn("\n⚠️  Frequent Queries (> 50 calls):");
    frequentQueries.forEach((q) => {
      console.warn(`  - ${q.model}.${q.action}: ${q.count} calls`);
    });
  }
}

/**
 * Reset Statistics
 */
/**
 * @deprecated Candidate for removal/relocation. Kept for compatibility.
 */
// resetQueryStats moved to deprecated archive
export function resetQueryStats() {
  // noop - archived
}

/**
 * Export Statistics für externe Analyse
 */
// exportQueryStats moved to deprecated archive
export function exportQueryStats() {
  return [];
}

/**
 * Neon-spezifische Metriken
 */
export interface NeonMetrics {
  totalQueries: number;
  totalDuration: number;
  estimatedDataTransfer: number; // in KB
  estimatedCost: number; // in USD
}

/**
 * Schätze Neon Kosten basierend auf Query-Aktivität
 */
export function estimateNeonCost(): NeonMetrics {
  const stats = Array.from(queryStats.values());
  
  const totalQueries = stats.reduce((sum, s) => sum + s.count, 0);
  const totalDuration = stats.reduce((sum, s) => sum + s.totalDuration, 0);
  
  // Grobe Schätzung: 1 Query = ~5KB Daten-Transfer (vor Optimierung)
  // Nach Optimierung: ~1.5KB pro Query
  const avgTransferPerQuery = 1.5; // KB
  const estimatedDataTransfer = totalQueries * avgTransferPerQuery;
  
  // Neon Free Tier: 5 GB/Monat gratis
  // Danach: $0.16 per GB
  const freeGBLimit = 5 * 1024 * 1024; // 5 GB in KB
  const costPerKB = 0.16 / (1024 * 1024); // $0.16 per GB
  
  const billableKB = Math.max(0, estimatedDataTransfer - freeGBLimit);
  const estimatedCost = billableKB * costPerKB;
  
  return {
    totalQueries,
    totalDuration,
    estimatedDataTransfer,
    estimatedCost,
  };
}

/**
 * Ausgabe Neon-Metriken
 */
export function printNeonMetrics() {
  const metrics = estimateNeonCost();
  
  console.log("\n💰 Neon Database Metrics:\n");
  console.log(`  Total Queries: ${metrics.totalQueries.toLocaleString()}`);
  console.log(`  Total Duration: ${(metrics.totalDuration / 1000).toFixed(2)}s`);
  console.log(`  Est. Data Transfer: ${(metrics.estimatedDataTransfer / 1024).toFixed(2)} MB`);
  console.log(`  Est. Monthly Cost: $${metrics.estimatedCost.toFixed(4)}`);
  
  if (metrics.estimatedDataTransfer > 5 * 1024 * 1024) {
    console.warn(`\n⚠️  Warning: Exceeding free tier limit!`);
  } else {
    const remaining = (5 * 1024 * 1024 - metrics.estimatedDataTransfer) / (1024 * 1024);
    console.log(`\n✅ Within free tier. ${remaining.toFixed(2)} GB remaining.`);
  }
}

/**
 * Setup automatic monitoring in development
 */
if (process.env.NODE_ENV === "development") {
  // Print stats every 5 minutes
  setInterval(() => {
    printQueryStats();
    printNeonMetrics();
  }, 5 * 60 * 1000);
  
  // Print on process exit
  process.on("beforeExit", () => {
    console.log("\n📊 Final Query Statistics:");
    printQueryStats();
    printNeonMetrics();
  });
}
