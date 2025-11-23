import { SMA, RollingBetaEW, EMA } from "@junduck/trading-core";
import type { BarWith } from "../types/BarData.js";
import type { PeriodWith } from "../types/PeriodOptions.js";

export function bodyLength(bar: BarWith<"open" | "close">): number {
  return Math.abs(bar.close - bar.open);
}

export function upperShadow(bar: BarWith<"open" | "close" | "high">): number {
  const bodyTop = Math.max(bar.open, bar.close);
  return bar.high - bodyTop;
}

export function lowerShadow(bar: BarWith<"open" | "close" | "low">): number {
  const bodyBottom = Math.min(bar.open, bar.close);
  return bodyBottom - bar.low;
}

export function range(bar: BarWith<"high" | "low">): number {
  return bar.high - bar.low;
}

export function isBullish(bar: BarWith<"open" | "close">): boolean {
  return bar.close > bar.open;
}

export function isBearish(bar: BarWith<"open" | "close">): boolean {
  return bar.close < bar.open;
}

/**
 * Average body length calculator for pattern recognition
 */
export class AverageBodyLength {
  private sma: SMA;

  constructor(opts: PeriodWith<"period">) {
    this.sma = new SMA(opts);
  }

  update(open: number, close: number): number {
    const body = bodyLength({ open, close });
    const avg = this.sma.update(body);
    return avg;
  }

  onData(bar: BarWith<"open" | "close">) {
    return this.update(bar.open, bar.close);
  }
}

/**
 * Creates AverageBodyLength closure for functional usage.
 */
export function useAverageBodyLength(
  opts: PeriodWith<"period">
): (bar: BarWith<"open" | "close">) => number {
  const instance = new AverageBodyLength(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Trend of smoothed close price
 */
export class SmoothedTrend {
  private ema: EMA;
  private beta: RollingBetaEW;
  private n: number = 0;

  constructor(opts: PeriodWith<"period">) {
    this.ema = new EMA(opts);
    this.beta = new RollingBetaEW(opts);
  }

  update(close: number): { ema: number; beta: number } {
    this.n++;
    const m = this.ema.update(close);
    const { beta } = this.beta.update(this.n, m);
    return { ema: m, beta };
  }

  onData(bar: BarWith<"close">) {
    return this.update(bar.close);
  }
}

export function useSmoothedTrend(
  opts: PeriodWith<"period">
): (bar: BarWith<"close">) => { ema: number; beta: number } {
  const instance = new SmoothedTrend(opts);
  return (bar) => instance.onData(bar);
}
