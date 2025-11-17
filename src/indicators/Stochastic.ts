import type { BarWith } from "../types/BarData.js";
import type { PeriodOptions, PeriodWith } from "../types/PeriodOptions.js";
import { CircularBuffer } from "../fn/Containers.js";
import { SMA } from "../fn/Foundation.js";
import { RSI } from "./Momentum.js";

/**
 * Stochastic Oscillator - stateful indicator.
 * Measures price position relative to high-low range over k_period.
 * Returns smoothed %K and %D lines.
 */
export class STOCH {
  private highs: CircularBuffer<number>;
  private lows: CircularBuffer<number>;
  private smaK: SMA;
  private smaD: SMA;

  constructor(
    opts: PeriodOptions & {
      k_period?: number;
      k_slowing?: number;
      d_period?: number;
    }
  ) {
    const kPeriod = opts.k_period ?? opts.period ?? 14;
    const kSlowing = opts.k_slowing ?? 3;
    const dPeriod = opts.d_period ?? 3;

    this.highs = new CircularBuffer(kPeriod);
    this.lows = new CircularBuffer(kPeriod);
    this.smaK = new SMA({ period: kSlowing });
    this.smaD = new SMA({ period: dPeriod });
  }

  /**
   * Process new data point.
   * @param bar Bar with high, low, close prices
   * @returns Object with %K and %D values
   */
  onData(bar: BarWith<"high" | "low" | "close">): {
    k: number;
    d: number;
  } {
    this.highs.push(bar.high);
    this.lows.push(bar.low);

    if (!this.highs.full()) {
      return { k: 0, d: 0 };
    }

    let highest = -Infinity;
    let lowest = Infinity;
    for (const h of this.highs) {
      if (h > highest) highest = h;
    }
    for (const l of this.lows) {
      if (l < lowest) lowest = l;
    }

    const range = highest - lowest;
    const rawK = range !== 0 ? ((bar.close - lowest) / range) * 100 : 50;
    const k = this.smaK.onData(rawK);
    const d = this.smaD.onData(k);
    return { k, d };
  }
}

/**
 * Creates STOCH closure for functional usage.
 * @param opts Period configuration with k_period, k_slowing, d_period
 * @returns Function that processes bar data and returns {k, d}
 */
export function useSTOCH(
  opts: PeriodOptions & {
    k_period?: number;
    k_slowing?: number;
    d_period?: number;
  }
): (bar: BarWith<"high" | "low" | "close">) => {
  k: number;
  d: number;
} {
  const instance = new STOCH(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Stochastic RSI - stateful indicator.
 * Applies stochastic formula to RSI values over specified period.
 */
export class STOCHRSI {
  private rsi: RSI;
  private buffer: CircularBuffer<number>;

  constructor(opts: PeriodWith<"period">) {
    this.rsi = new RSI(opts);
    this.buffer = new CircularBuffer(opts.period);
  }

  /**
   * Process new data point.
   * @param bar Bar with close price
   * @returns Current Stochastic RSI value
   */
  onData(bar: BarWith<"close">): number {
    const rsiVal = this.rsi.onData(bar);
    this.buffer.push(rsiVal);

    if (!this.buffer.full()) {
      return 0;
    }

    let min = Infinity;
    let max = -Infinity;
    for (const val of this.buffer) {
      if (val < min) min = val;
      if (val > max) max = val;
    }

    const range = max - min;
    return range !== 0 ? ((rsiVal - min) / range) * 100 : 0;
  }
}

/**
 * Creates STOCHRSI closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns Stochastic RSI
 */
export function useSTOCHRSI(
  opts: PeriodWith<"period">
): (bar: BarWith<"close">) => number {
  const instance = new STOCHRSI(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Williams %R - stateful indicator.
 * Measures overbought/oversold levels over specified period.
 */
export class WILLR {
  private highs: CircularBuffer<number>;
  private lows: CircularBuffer<number>;

  constructor(opts: PeriodWith<"period">) {
    this.highs = new CircularBuffer(opts.period);
    this.lows = new CircularBuffer(opts.period);
  }

  /**
   * Process new data point.
   * @param bar Bar with high, low, close prices
   * @returns Current Williams %R value
   */
  onData(bar: BarWith<"high" | "low" | "close">): number {
    this.highs.push(bar.high);
    this.lows.push(bar.low);

    if (!this.highs.full()) {
      return 0;
    }

    let highest = -Infinity;
    let lowest = Infinity;
    for (const h of this.highs) {
      if (h > highest) highest = h;
    }
    for (const l of this.lows) {
      if (l < lowest) lowest = l;
    }

    const range = highest - lowest;
    return range !== 0 ? ((highest - bar.close) / range) * -100 : 0;
  }
}

/**
 * Creates WILLR closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns Williams %R
 */
export function useWILLR(
  opts: PeriodWith<"period">
): (bar: BarWith<"high" | "low" | "close">) => number {
  const instance = new WILLR(opts);
  return (bar) => instance.onData(bar);
}
