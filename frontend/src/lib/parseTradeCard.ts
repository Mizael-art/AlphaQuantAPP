/**
 * Parses raw OCR text from a Bybit "share result" screenshot (the kind
 * posted to Telegram/WhatsApp showing symbol, direction, leverage, ROI,
 * entry/exit price) into structured trade fields.
 *
 * This is intentionally regex-based rather than AI-based: the Bybit card
 * layout is consistent enough that a handful of patterns reliably extract
 * every field, with zero API cost and no network dependency once the OCR
 * model itself has been downloaded by the browser.
 */
export interface ParsedTradeCard {
  asset: string | null;
  direction: "LONG" | "SHORT" | null;
  leverage: number | null;
  resultPct: number | null;
  entry: number | null;
  exit: number | null;
  /** Which fields we found, for showing the admin what still needs manual entry. */
  confidence: "high" | "partial" | "low";
}

function firstMatch(text: string, re: RegExp): string | null {
  const m = text.match(re);
  return m ? m[1] : null;
}

export function parseTradeCardText(rawText: string): ParsedTradeCard {
  // Normalize: collapse newlines/extra whitespace so multi-line OCR output
  // ("Entry Price\n0.4764") still matches single-line-style patterns.
  const text = rawText.replace(/\s+/g, " ").trim();

  // Symbol: an all-caps ticker immediately followed by USDT/USDC/BUSD (Bybit's
  // near-universal quote assets on these cards), e.g. RUNEUSDT, BTCUSDT.
  const asset = firstMatch(text, /\b([A-Z0-9]{2,15}(?:USDT|USDC|BUSD))\b/);

  // Direction + leverage often sit right next to each other: "Long 15.0X" / "Short 5X".
  const dirLevMatch = text.match(/\b(Long|Short)\s+(\d+(?:\.\d+)?)\s*[xX]\b/);
  const direction = dirLevMatch
    ? (dirLevMatch[1].toUpperCase() as "LONG" | "SHORT")
    : (firstMatch(text, /\b(Long|Short)\b/i)?.toUpperCase() as "LONG" | "SHORT" | null) ?? null;
  const leverage = dirLevMatch ? parseFloat(dirLevMatch[2]) : null;

  // ROI: a signed percentage, usually the largest/only "%" figure on the card.
  const roiRaw = firstMatch(text, /([+\-−]?\s?\d+(?:\.\d+)?)\s*%/);
  const resultPct = roiRaw ? parseFloat(roiRaw.replace("−", "-").replace(/\s/g, "")) : null;

  // Entry / Exit price: label followed by a number (allow a colon, dash, or
  // just whitespace between label and value since OCR spacing is unreliable).
  const entryRaw = firstMatch(text, /Entry\s*Price[:\s]*([\d.,]+)/i);
  const exitRaw = firstMatch(text, /Exit\s*Price[:\s]*([\d.,]+)/i);
  const entry = entryRaw ? parseFloat(entryRaw.replace(/,/g, "")) : null;
  const exit = exitRaw ? parseFloat(exitRaw.replace(/,/g, "")) : null;

  const foundCount = [asset, direction, leverage, resultPct, entry, exit].filter(v => v !== null).length;
  const confidence: ParsedTradeCard["confidence"] = foundCount >= 5 ? "high" : foundCount >= 3 ? "partial" : "low";

  return { asset, direction, leverage, resultPct, entry, exit, confidence };
}
