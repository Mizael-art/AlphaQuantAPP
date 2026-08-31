import type { FastifyInstance } from "fastify";
import { prisma } from "../../db/client.js";
import {
  computeMetrics,
  getRealizedVsUnrealized,
  getPerformanceByGroup,
  PROJECT_START_CAPITAL,
} from "../../engines/performance-engine/index.js";
import { getPrice } from "../../engines/market-data-service/index.js";
import { calcPnl } from "../../engines/pnl-engine/index.js";

/**
 * Lightweight, display-only price refresh for open trades.
 *
 * This is intentionally NOT the full monitoring engine: it does not detect
 * stop/TP hits or transition status (that requires the persistent worker,
 * which processes every trade continuously and handles ambiguity/ordering
 * correctly). This helper only updates currentPrice + the live unrealized
 * P&L figures shown in the UI, so numbers aren't stale between worker runs
 * or when the worker isn't deployed at all. One failing symbol never blocks
 * the others or the response.
 */
async function refreshOpenTradePrices(trades: any[]): Promise<void> {
  const refreshable = trades.filter((t) => t.status === "OPEN" || (t.status as string).endsWith("_HIT"));
  if (refreshable.length === 0) return;

  await Promise.all(
    refreshable.map(async (t) => {
      try {
        const price = await getPrice(t.symbol);
        const pnl = calcPnl({
          direction: t.direction,
          entryPrice: t.entryPrice,
          exitPrice: price,
          margin: t.margin,
          leverage: t.leverage,
          accountEquityBefore: t.equityBefore ?? 10000,
          stopPrice: t.stopPrice,
        });
        await prisma.trade.update({
          where: { id: t.id },
          data: {
            currentPrice: price,
            unrealizedPnlUsd: pnl.pnlUsdNet,
            priceChangePct: pnl.priceReturnPct * 100,
            tradeRoiPct: pnl.tradeRoiPct,
            pnlUsd: pnl.pnlUsdNet,
            accountImpactPct: pnl.accountImpactPct,
            rMultiple: pnl.rMultiple,
          },
        });
        // keep the in-memory objects fresh too, so this same request's response reflects the update
        t.currentPrice = price;
        t.unrealizedPnlUsd = pnl.pnlUsdNet;
        t.priceChangePct = pnl.priceReturnPct * 100;
        t.tradeRoiPct = pnl.tradeRoiPct;
        t.pnlUsd = pnl.pnlUsdNet;
        t.accountImpactPct = pnl.accountImpactPct;
        t.rMultiple = pnl.rMultiple;
      } catch {
        // Bybit unreachable or unknown symbol — leave the trade's last known price as-is.
      }
    }),
  );
}

/**
 * PUBLIC API — spec section 77.
 * No login required. All read-only. Never hides losses/cancelled/ambiguous
 * trades (spec section 93) — every endpoint here queries by isPublic only,
 * not by result.
 */
export async function registerPublicRoutes(app: FastifyInstance) {
  app.get("/api/public/overview", async () => {
    const [openTrades, recentCalls, health, { realizedPnlUsd, unrealizedPnlUsd, totalPnlUsd }] =
      await Promise.all([
        prisma.trade.findMany({
          where: { isPublic: true, status: { in: ["PUBLISHED", "WAITING_ENTRY", "OPEN", "TP1_HIT", "TP2_HIT", "TP3_HIT"] } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.trade.findMany({ where: { isPublic: true }, orderBy: { createdAt: "desc" }, take: 10 }),
        prisma.systemHealth.findMany(),
        getRealizedVsUnrealized(),
      ]);

    await refreshOpenTradePrices(openTrades);

    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const weekStart = new Date(todayStart.getTime() - ((todayStart.getUTCDay() + 6) % 7) * 86400000);
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const [todayTrades, weekTrades, monthTrades, allTrades] = await Promise.all([
      prisma.trade.findMany({ where: { status: "CLOSED", closedAt: { gte: todayStart } } }),
      prisma.trade.findMany({ where: { status: "CLOSED", closedAt: { gte: weekStart } } }),
      prisma.trade.findMany({ where: { status: "CLOSED", closedAt: { gte: monthStart } } }),
      prisma.trade.findMany({ where: { status: "CLOSED" } }),
    ]);

    const toStats = (trades: typeof allTrades) => {
      const m = computeMetrics(trades, PROJECT_START_CAPITAL);
      return {
        pnlUsd: m.totalPnlUsd,
        roiPct: m.totalReturnPct,
        trades: m.totalTrades,
        wins: m.winningTrades,
        losses: m.losingTrades,
        winRatePct: m.winRatePct,
        realizedPnlUsd: m.totalPnlUsd,
        unrealizedPnlUsd: 0,
      };
    };

    const equityPoints = await prisma.equityPoint.findMany({ orderBy: { timestamp: "asc" }, take: 500 });

    const degraded = health.some((h: { status: string }) => h.status !== "ONLINE");

    return {
      systemStatus: degraded ? "DEGRADED" : "ONLINE",
      lastUpdate: new Date().toISOString(),
      activeCalls: openTrades.length,
      today: toStats(todayTrades),
      week: toStats(weekTrades),
      month: toStats(monthTrades),
      allTime: toStats(allTrades),
      realizedPnlUsd,
      unrealizedPnlUsd,
      totalPnlUsd,
      openTrades,
      equityCurve: equityPoints.map((p: { timestamp: Date; equity: number }) => ({
        date: p.timestamp.toISOString(),
        equity: p.equity,
      })),
      recentCalls,
    };
  });

  app.get("/api/public/open-trades", async () => {
    const trades = await prisma.trade.findMany({
      where: { isPublic: true, status: { in: ["PUBLISHED", "WAITING_ENTRY", "OPEN", "TP1_HIT", "TP2_HIT", "TP3_HIT"] } },
      orderBy: { createdAt: "desc" },
    });
    await refreshOpenTradePrices(trades);
    return trades;
  });

  app.get("/api/public/calls", async () => {
    return prisma.trade.findMany({
      where: { isPublic: true, status: { not: "DRAFT" } },
      orderBy: { publishedAt: "desc" },
      take: 100,
    });
  });

  app.get<{ Querystring: { page?: string; pageSize?: string; asset?: string; status?: string; strategy?: string } }>(
    "/api/public/trades",
    async (req) => {
      const page = Math.max(1, Number(req.query.page ?? 1));
      const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 25)));
      const where: any = { isPublic: true };
      if (req.query.asset) where.asset = req.query.asset;
      if (req.query.status) where.status = req.query.status;
      if (req.query.strategy) where.strategyName = req.query.strategy;

      const [items, total] = await Promise.all([
        prisma.trade.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.trade.count({ where }),
      ]);
      return { items, total, page, pageSize };
    },
  );

  app.get<{ Params: { id: string } }>("/api/public/trades/:id", async (req, reply) => {
    const trade = await prisma.trade.findUnique({
      where: { id: req.params.id },
      include: { events: { orderBy: { timestamp: "asc" } } },
    });
    if (!trade || !trade.isPublic) {
      return reply.code(404).send({ error: "NOT_FOUND" });
    }
    return trade;
  });

  app.get("/api/public/performance", async () => {
    const [byAsset, byStrategy, byTimeframe, byDirection, snapshots] = await Promise.all([
      getPerformanceByGroup("asset"),
      getPerformanceByGroup("strategyName"),
      getPerformanceByGroup("timeframe"),
      getPerformanceByGroup("direction"),
      prisma.performanceSnapshot.findMany({ orderBy: { periodStart: "desc" }, take: 60 }),
    ]);
    return { byAsset, byStrategy, byTimeframe, byDirection, snapshots };
  });

  app.get<{ Querystring: { period?: "daily" | "weekly" | "monthly" | "all-time" } }>(
    "/api/public/reports",
    async (req) => {
      const periodMap = { daily: "DAILY", weekly: "WEEKLY", monthly: "MONTHLY", "all-time": "ALL_TIME" } as const;
      const period = periodMap[req.query.period ?? "daily"];
      return prisma.performanceSnapshot.findMany({ where: { period }, orderBy: { periodStart: "desc" }, take: 90 });
    },
  );
}
