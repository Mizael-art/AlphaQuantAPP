import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { verifyPassword, requireAdmin } from "../../auth/index.js";
import { publishCall, applyAdminEdit, closeTrade, cancelTrade, recordEvent } from "../../engines/trade-engine/index.js";
import { runBacktest } from "../../engines/backtest-engine/index.js";
import { getKlines } from "../../engines/market-data-service/index.js";
import { calcPnl } from "../../engines/pnl-engine/index.js";

const createCallSchema = z.object({
  asset: z.string(),
  symbol: z.string(),
  direction: z.enum(["LONG", "SHORT"]),
  entryPrice: z.number(),
  stopPrice: z.number(),
  tp1: z.number(),
  tp2: z.number().optional(),
  tp3: z.number().optional(),
  tp4: z.number().optional(),
  margin: z.number(),
  leverage: z.number(),
  riskPct: z.number().optional(),
  timeframe: z.string(),
  strategyName: z.string(),
  playbook: z.string().optional(),
  score: z.number().optional(),
  reason: z.string().optional(),
  invalidation: z.string().optional(),
  notes: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export async function registerAdminRoutes(app: FastifyInstance) {
  // -- Auth ------------------------------------------------------------
  app.post<{ Body: { email: string; password: string } }>("/api/admin/login", async (req, reply) => {
    const { email, password } = req.body;
    const user = await prisma.adminUser.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(user.passwordHash, password))) {
      return reply.code(401).send({ error: "INVALID_CREDENTIALS" });
    }
    const token = app.jwt.sign({ sub: user.id, email: user.email, role: user.role }, { expiresIn: "12h" });
    await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    reply.setCookie("aq_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 12 * 3600,
    });
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  });

  app.post("/api/admin/logout", async (_req, reply) => {
    reply.clearCookie("aq_session", { path: "/" });
    return { ok: true };
  });

  // All routes below require a valid admin JWT (spec section 79: backend enforces, not frontend)
  app.addHook("preHandler", async (req, reply) => {
    if (req.routeOptions.url?.startsWith("/api/admin/login")) return;
    await requireAdmin(req, reply);
  });

  // -- Calls -------------------------------------------------------------
  app.post<{ Body: z.infer<typeof createCallSchema> & { publish?: boolean } }>(
    "/api/admin/calls",
    async (req, reply) => {
      const parsed = createCallSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: "INVALID_BODY", details: parsed.error.flatten() });
      const data = parsed.data;
      const notional = data.margin * data.leverage;

      const trade = await prisma.trade.create({
        data: {
          asset: data.asset,
          symbol: data.symbol,
          direction: data.direction,
          status: req.body.publish ? "PUBLISHED" : "DRAFT",
          entryPrice: data.entryPrice,
          stopPrice: data.stopPrice,
          tp1: data.tp1,
          tp2: data.tp2,
          tp3: data.tp3,
          tp4: data.tp4,
          margin: data.margin,
          leverage: data.leverage,
          notional,
          riskPct: data.riskPct,
          timeframe: data.timeframe,
          strategyName: data.strategyName,
          playbook: data.playbook,
          score: data.score,
          reason: data.reason,
          invalidation: data.invalidation,
          notes: data.notes,
          isPublic: data.isPublic ?? true,
          publishedAt: req.body.publish ? new Date() : null,
          equityBefore: (await prisma.equityPoint.findFirst({ orderBy: { timestamp: "desc" } }))?.equity ?? 10000,
        },
      });

      const actorId = (req.user as any).sub;
      await recordEvent({ tradeId: trade.id, eventType: "TRADE_CREATED", actor: actorId, source: "admin" });
      if (req.body.publish) await publishCall(trade.id, actorId);

      return trade;
    },
  );

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>("/api/admin/calls/:id", async (req) => {
    const actorId = (req.user as any).sub;
    return applyAdminEdit({ tradeId: req.params.id, actorId, changes: req.body });
  });

  app.post<{ Params: { id: string } }>("/api/admin/calls/:id/close", async (req) => {
    const trade = await prisma.trade.findUniqueOrThrow({ where: { id: req.params.id } });
    const pnl = calcPnl({
      direction: trade.direction,
      entryPrice: trade.entryPrice,
      exitPrice: trade.currentPrice ?? trade.entryPrice,
      margin: trade.margin,
      leverage: trade.leverage,
      accountEquityBefore: trade.equityBefore ?? 10000,
      stopPrice: trade.stopPrice,
    });
    return closeTrade({
      tradeId: trade.id,
      exitPrice: trade.currentPrice ?? trade.entryPrice,
      exitReason: "MANUAL_CLOSE",
      realizedPnlUsd: pnl.pnlUsdNet,
      actorId: (req.user as any).sub,
    });
  });

  app.post<{ Params: { id: string } }>("/api/admin/calls/:id/cancel", async (req) => {
    return cancelTrade(req.params.id, (req.user as any).sub);
  });

  // -- Historical trades (spec sections 39-42) ---------------------------
  // Manual historical trade entry (spec: admin enters the result directly for
  // trades that already happened — no Bybit lookup needed). Modeled as % of
  // account/bankroll, not a fixed dollar margin, since every viewer trades
  // with a different account size: the admin can type `resultPct` directly
  // (e.g. 20 for "we made 20%"), or supply entry+exit and let the frontend
  // derive the % from the price move. Either way, tradeRoiPct and
  // accountImpactPct are set to the SAME number — this is a 100%-of-bankroll
  // model, so "the trade returned 20%" IS "the account grew 20%" from this
  // trade's perspective. A nominal $1000 reference is still stored in
  // pnlUsd/margin purely so the existing $-based UI components keep working;
  // it is not meant to be read as a real dollar amount.
  app.post<{ Body: any }>("/api/admin/historical-trades", async (req) => {
    const actorId = (req.user as any).sub;
    const b = req.body as any;
    const hasResultPct = b.resultPct !== undefined && b.resultPct !== null && b.resultPct !== "";
    const hasPrices = b.entry !== undefined && b.exit !== undefined && b.entry !== "" && b.exit !== "";

    if (!hasResultPct && !hasPrices) {
      return await (async () => {
        const err: any = new Error("Provide resultPct directly, or both entry and exit prices.");
        err.statusCode = 400;
        throw err;
      })();
    }

    const resultPct = hasResultPct
      ? Number(b.resultPct)
      : (() => {
          const entry = Number(b.entry);
          const exit = Number(b.exit);
          const ret = b.direction === "LONG" ? (exit - entry) / entry : (entry - exit) / entry;
          return ret * 100;
        })();

    const NOMINAL_REFERENCE_USD = 1000; // only for legacy $-based UI fields — see comment above
    const pnlUsd = (resultPct / 100) * NOMINAL_REFERENCE_USD;
    const closedAt = b.date ? new Date(`${b.date}T${b.time ?? "00:00:00"}Z`) : new Date();

    const entryPrice = b.entry ? Number(b.entry) : 1; // placeholder when only % was typed; not used for display math
    const exitPrice = b.exit ? Number(b.exit) : entryPrice * (1 + (b.direction === "SHORT" ? -1 : 1) * (resultPct / 100));

    const trade = await prisma.trade.create({
      data: {
        asset: b.asset,
        symbol: b.symbol ?? b.asset,
        direction: b.direction,
        status: "CLOSED",
        source: "HISTORICAL",
        isPublic: b.isPublic ?? true,
        entryPrice,
        exitPrice,
        stopPrice: b.stop ? Number(b.stop) : entryPrice,
        tp1: b.tp1 ? Number(b.tp1) : entryPrice,
        margin: NOMINAL_REFERENCE_USD,
        leverage: 1,
        notional: NOMINAL_REFERENCE_USD,
        timeframe: b.timeframe ?? "N/A",
        strategyName: b.strategy ?? "UNKNOWN",
        notes: b.notes,
        createdAt: closedAt,
        closedAt,
        priceChangePct: resultPct,
        tradeRoiPct: resultPct,
        accountImpactPct: resultPct,
        pnlUsd,
        realizedPnlUsd: pnlUsd,
        exitReason: b.exitReason ?? "MANUAL",
      },
    });
    await recordEvent({
      tradeId: trade.id,
      eventType: "TRADE_CREATED",
      actor: actorId,
      source: "admin",
      metadata: { manualClose: true, resultPct },
    });
    return trade;
  });

  app.post<{ Params: { id: string } }>("/api/admin/historical-trades/:id/analyze", async (req, reply) => {
    const trade = await prisma.trade.findUniqueOrThrow({ where: { id: req.params.id } });
    const start = trade.createdAt.getTime();
    const end = start + 30 * 24 * 3600 * 1000; // 30-day analysis window

    let klines;
    try {
      klines = await getKlines(trade.symbol, "60", start, end);
    } catch (err) {
      return reply.code(502).send({ error: "MARKET_DATA_UNAVAILABLE", message: (err as Error).message });
    }

    if (klines.length === 0) {
      await prisma.trade.update({
        where: { id: trade.id },
        data: { verificationStatus: "INSUFFICIENT_DATA" },
      });
      await recordEvent({ tradeId: trade.id, eventType: "HISTORICAL_AMBIGUOUS", metadata: { reason: "no candles" } });
      return { verification: "INSUFFICIENT_DATA" };
    }

    // Walk candles in order, no lookahead (section 100/101)
    let entryReached = false;
    let entryAt: number | null = null;
    let tp1Hit = false,
      tp2Hit = false,
      tp3Hit = false,
      stopHit = false,
      ambiguous = false;
    let exitPrice: number | null = null;

    for (const k of klines) {
      if (!entryReached) {
        const reached = trade.direction === "LONG" ? k.low <= trade.entryPrice : k.high >= trade.entryPrice;
        if (reached) {
          entryReached = true;
          entryAt = k.openTime;
        }
        continue;
      }
      const sHit = trade.direction === "LONG" ? k.low <= trade.stopPrice : k.high >= trade.stopPrice;
      const t1Hit = trade.direction === "LONG" ? k.high >= trade.tp1 : k.low <= trade.tp1;
      if (sHit && t1Hit) {
        ambiguous = true;
        break;
      }
      if (sHit) {
        stopHit = true;
        exitPrice = trade.stopPrice;
        break;
      }
      if (t1Hit) {
        tp1Hit = true;
        if (trade.tp2) {
          const t2 = trade.direction === "LONG" ? k.high >= trade.tp2 : k.low <= trade.tp2;
          if (t2) tp2Hit = true;
        }
        if (trade.tp3) {
          const t3 = trade.direction === "LONG" ? k.high >= trade.tp3 : k.low <= trade.tp3;
          if (t3) tp3Hit = true;
        }
        exitPrice = trade.tp1;
      }
    }

    const verification = ambiguous
      ? "AMBIGUOUS"
      : !entryReached
        ? "INSUFFICIENT_DATA"
        : tp1Hit || stopHit
          ? "VERIFIED"
          : "PARTIALLY_VERIFIED";

    let pnlResult = null;
    if (exitPrice && entryReached) {
      pnlResult = calcPnl({
        direction: trade.direction,
        entryPrice: trade.entryPrice,
        exitPrice,
        margin: trade.margin,
        leverage: trade.leverage,
        accountEquityBefore: 10000,
        stopPrice: trade.stopPrice,
      });
    }

    await prisma.trade.update({
      where: { id: trade.id },
      data: {
        status: ambiguous ? "AMBIGUOUS" : stopHit ? "STOP_HIT" : tp1Hit ? "TP1_HIT" : "INSUFFICIENT_DATA",
        entryAt: entryAt ? new Date(entryAt) : null,
        tp1Hit,
        tp2Hit,
        tp3Hit,
        exitPrice: exitPrice ?? undefined,
        pnlUsd: pnlResult?.pnlUsdNet,
        tradeRoiPct: pnlResult?.tradeRoiPct,
        rMultiple: pnlResult?.rMultiple,
        verificationStatus: verification,
      },
    });

    await recordEvent({
      tradeId: trade.id,
      eventType: ambiguous ? "HISTORICAL_AMBIGUOUS" : "HISTORICAL_VALIDATED",
      metadata: { entryReached, tp1Hit, tp2Hit, tp3Hit, stopHit, verification },
    });

    return { verification, entryReached, tp1Hit, tp2Hit, tp3Hit, stopHit, pnl: pnlResult };
  });

  // -- Performance / analytics --------------------------------------------
  app.get("/api/admin/performance", async () => {
    return prisma.performanceSnapshot.findMany({ orderBy: { periodStart: "desc" }, take: 90 });
  });

  app.get("/api/admin/analytics", async () => {
    const [openTrades, closedTrades, health, auditLogs] = await Promise.all([
      prisma.trade.count({ where: { status: { in: ["OPEN", "WAITING_ENTRY", "TP1_HIT", "TP2_HIT", "TP3_HIT"] } } }),
      prisma.trade.count({ where: { status: "CLOSED" } }),
      prisma.systemHealth.findMany(),
      prisma.auditLog.findMany({ orderBy: { timestamp: "desc" }, take: 50 }),
    ]);
    return { openTrades, closedTrades, health, recentAuditLogs: auditLogs };
  });

  // -- Backtest (spec sections 71-73) --------------------------------------
  app.post<{ Body: any }>("/api/admin/backtest", async (req) => {
    const b = req.body as any;
    const backtestRow = await prisma.backtest.create({
      data: {
        asset: b.symbol,
        timeframe: b.timeframe,
        periodStart: new Date(b.startMs),
        periodEnd: new Date(b.endMs),
        startingCapital: b.startingCapital,
        riskPct: b.riskPct,
        leverage: b.leverage,
        feesPct: b.feesPct ?? 0,
        slippagePct: b.slippagePct ?? 0,
        status: "RUNNING",
      },
    });

    const result = await runBacktest(b);

    await prisma.backtest.update({
      where: { id: backtestRow.id },
      data: {
        status: result.status,
        error: result.error,
        finalCapital: result.finalCapital,
        totalPnlUsd: result.totalPnlUsd,
        totalReturnPct: result.totalReturnPct,
        totalTrades: result.totalTrades,
        winRatePct: result.winRatePct,
        profitFactor: result.profitFactor,
        expectancy: result.expectancy,
        avgR: result.avgR,
        maxDrawdownPct: result.maxDrawdownPct,
        completedAt: new Date(),
      },
    });

    if (result.trades.length > 0) {
      await prisma.backtestTrade.createMany({
        data: result.trades.map((t) => ({
          backtestId: backtestRow.id,
          direction: t.direction,
          entryPrice: t.entryPrice,
          exitPrice: t.exitPrice,
          stopPrice: t.stopPrice,
          tp1: t.tp1,
          entryTime: new Date(t.entryTime),
          exitTime: new Date(t.exitTime),
          pnlUsd: t.pnlUsd,
          roiPct: t.roiPct,
          rMultiple: t.rMultiple,
          exitReason: t.exitReason,
        })),
      });
    }

    return { id: backtestRow.id, ...result };
  });
}
