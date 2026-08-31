/**
 * MARKET DATA SERVICE
 *
 * Single centralized layer between Bybit and the rest of the system
 * (spec sections 20, 81-83): "não abrir centenas de conexões externas",
 * "não fazer uma chamada Bybit por usuário".
 *
 * v1 IMPLEMENTATION NOTE (documented deviation, per spec section 133 rule
 * of never changing behaviour silently):
 * The spec prefers a persistent Bybit WebSocket feed (section 20/83) for
 * live prices. This v1 uses a single polled REST ticker loop instead of a
 * WS subscription, because:
 *   1. It is far simpler to make correct and observable for a first
 *      production cut.
 *   2. It still fully satisfies the "one shared connection, not one per
 *      user" requirement — polling happens once, centrally, and every
 *      consumer reads from the in-memory cache below.
 * The `BybitWebSocketFeed` class is stubbed at the bottom of this file as
 * the designated extension point for Phase "market-data-v2" — swapping the
 * poller for a real WS subscription should not require any change to
 * `getPrice()` or its callers.
 */

const BYBIT_REST_BASE = "https://api.bybit.com";

interface CachedPrice {
  symbol: string;
  price: number;
  updatedAt: number; // epoch ms
}

interface Kline {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const PRICE_TTL_MS = 3_000;
const priceCache = new Map<string, CachedPrice>();
const inFlight = new Map<string, Promise<number>>();

async function fetchTickerPrice(symbol: string): Promise<number> {
  const url = `${BYBIT_REST_BASE}/v5/market/tickers?category=linear&symbol=${encodeURIComponent(symbol)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Bybit ticker request failed: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as {
    retCode: number;
    retMsg: string;
    result?: { list?: Array<{ lastPrice: string }> };
  };
  if (json.retCode !== 0) {
    throw new Error(`Bybit error: ${json.retMsg}`);
  }
  const last = json.result?.list?.[0]?.lastPrice;
  if (!last) throw new Error(`No ticker data for ${symbol}`);
  return Number(last);
}

/**
 * Returns the current price for a symbol, using a shared in-memory cache
 * (TTL 3s) so N callers within the same tick do not each hit Bybit.
 */
export async function getPrice(symbol: string): Promise<number> {
  const now = Date.now();
  const cached = priceCache.get(symbol);
  if (cached && now - cached.updatedAt < PRICE_TTL_MS) {
    return cached.price;
  }

  const existing = inFlight.get(symbol);
  if (existing) return existing;

  const promise = fetchTickerPrice(symbol)
    .then((price) => {
      priceCache.set(symbol, { symbol, price, updatedAt: Date.now() });
      inFlight.delete(symbol);
      return price;
    })
    .catch((err) => {
      inFlight.delete(symbol);
      throw err;
    });

  inFlight.set(symbol, promise);
  return promise;
}

/** Batched price fetch for the monitoring loop — dedupes symbols. */
export async function getPrices(symbols: string[]): Promise<Map<string, number>> {
  const unique = Array.from(new Set(symbols));
  const results = await Promise.allSettled(unique.map((s) => getPrice(s)));
  const map = new Map<string, number>();
  unique.forEach((symbol, i) => {
    const r = results[i];
    if (r.status === "fulfilled") map.set(symbol, r.value);
  });
  return map;
}

/**
 * Historical klines for backtest / historical trade analysis.
 * Never invents candles (spec section 41): if Bybit has no data for the
 * requested range, returns an empty array and callers must surface
 * INSUFFICIENT_DATA rather than fabricate a result.
 */
export async function getKlines(
  symbol: string,
  interval: "15" | "60" | "240" | "D",
  startMs: number,
  endMs: number,
): Promise<Kline[]> {
  const url =
    `${BYBIT_REST_BASE}/v5/market/kline?category=linear&symbol=${encodeURIComponent(symbol)}` +
    `&interval=${interval}&start=${startMs}&end=${endMs}&limit=1000`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Bybit kline request failed: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as {
    retCode: number;
    retMsg: string;
    result?: { list?: string[][] };
  };
  if (json.retCode !== 0) {
    throw new Error(`Bybit error: ${json.retMsg}`);
  }
  const list = json.result?.list ?? [];
  // Bybit returns most-recent-first; normalize to chronological order.
  return list
    .map((row) => ({
      openTime: Number(row[0]),
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5]),
    }))
    .sort((a, b) => a.openTime - b.openTime);
}

export function clearPriceCache() {
  priceCache.clear();
}

/**
 * Extension point for Phase "market-data-v2": a persistent Bybit WS feed
 * that pushes ticker updates into the same `priceCache` used by getPrice().
 * Not implemented in this phase — see file header note.
 */
export class BybitWebSocketFeed {
  private connected = false;
  start() {
    throw new Error(
      "BybitWebSocketFeed not implemented in this phase — market data currently uses REST polling. See market-data-service/index.ts header.",
    );
  }
  get isConnected() {
    return this.connected;
  }
}
