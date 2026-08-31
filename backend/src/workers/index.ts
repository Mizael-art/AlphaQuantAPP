/**
 * WORKER PROCESS
 *
 * Runs the monitoring engine and periodic performance aggregation.
 * Deployed as a separate long-running process (spec section 21:
 * "Não depender do frontend" — monitoring must run server-side,
 * independent of any browser tab being open).
 */

import { runMonitoringTick } from "../engines/monitoring-engine/index.js";
import { computeAndPersistSnapshot } from "../engines/performance-engine/index.js";
import { prisma } from "../db/client.js";

const MONITORING_INTERVAL_MS = Number(process.env.MONITORING_INTERVAL_MS ?? 15_000);
const PERFORMANCE_INTERVAL_MS = Number(process.env.PERFORMANCE_INTERVAL_MS ?? 5 * 60_000);

async function monitoringLoop() {
  try {
    const result = await runMonitoringTick();
    if (result.errors.length > 0) {
      console.error(`[monitoring] ${result.errors.length} error(s) this tick`, result.errors);
      await prisma.systemHealth.upsert({
        where: { service: "monitoring" },
        create: { service: "monitoring", status: "DEGRADED", lastError: JSON.stringify(result.errors[0]) },
        update: { status: "DEGRADED", lastError: JSON.stringify(result.errors[0]), lastErrorAt: new Date() },
      });
    } else {
      console.log(`[monitoring] checked=${result.checked} updated=${result.updated}`);
    }
  } catch (err) {
    console.error("[monitoring] tick failed entirely", err);
    await prisma.systemHealth.upsert({
      where: { service: "monitoring" },
      create: { service: "monitoring", status: "OFFLINE", lastError: (err as Error).message },
      update: { status: "OFFLINE", lastError: (err as Error).message, lastErrorAt: new Date() },
    });
  } finally {
    setTimeout(monitoringLoop, MONITORING_INTERVAL_MS);
  }
}

async function performanceLoop() {
  try {
    await Promise.all([
      computeAndPersistSnapshot("DAILY"),
      computeAndPersistSnapshot("WEEKLY"),
      computeAndPersistSnapshot("MONTHLY"),
      computeAndPersistSnapshot("ALL_TIME"),
    ]);
    console.log("[performance] snapshots recomputed");
  } catch (err) {
    console.error("[performance] snapshot computation failed", err);
  } finally {
    setTimeout(performanceLoop, PERFORMANCE_INTERVAL_MS);
  }
}

console.log(
  `[worker] starting — monitoring every ${MONITORING_INTERVAL_MS}ms, performance snapshots every ${PERFORMANCE_INTERVAL_MS}ms`,
);
monitoringLoop();
performanceLoop();
