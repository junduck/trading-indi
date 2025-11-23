import type { BarWith } from "../types/BarData.js";
import type { PeriodOptions, PeriodWith } from "../types/PeriodOptions.js";
import {
  RollingMax,
  RollingMin,
  RollingMinMax,
  SMA as CoreSMA,
} from "@junduck/trading-core";
import { RSI } from "./Momentum.js";
import { type OperatorDoc } from "../types/OpDoc.js";

/**
 * Stochastic Oscillator - stateful indicator.
 * Measures price position relative to high-low range over k_period.
 * Returns smoothed %K and %D lines.
 */
export class STOCH {
  private highest: RollingMax;
  private lowest: RollingMin;
  private smaK: CoreSMA;
  private smaD: CoreSMA;

  constructor(
    opts: PeriodOptions & {
      k_period?: number;
      k_slowing?: number;
      d_period?: number;
    } = {
      k_period: 14,
      k_slowing: 3,
      d_period: 3,
    }
  ) {
    const kPeriod = opts.k_period ?? opts.period ?? 14;
    const kSlowing = opts.k_slowing ?? 3;
    const dPeriod = opts.d_period ?? 3;

    this.highest = new RollingMax({ period: kPeriod });
    this.lowest = new RollingMin({ period: kPeriod });
    this.smaK = new CoreSMA({ period: kSlowing });
    this.smaD = new CoreSMA({ period: dPeriod });
  }

  update(high: number, low: number, close: number): { k: number; d: number } {
    const highest = this.highest.update(high);
    const lowest = this.lowest.update(low);

    if (!this.highest.buffer.full()) {
      return { k: 0, d: 0 };
    }

    const range = highest - lowest;
    const rawK = range !== 0 ? ((close - lowest) / range) * 100 : 50;
    const k = this.smaK.update(rawK);
    const d = this.smaD.update(k);
    return { k, d };
  }

  onData(bar: BarWith<"high" | "low" | "close">): { k: number; d: number } {
    return this.update(bar.high, bar.low, bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "STOCH",
    init: "{k_period?, k_slowing?, d_period?}",
    input: "high, low, close",
    output: "{k, d}",
  };
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
  private minmax: RollingMinMax;

  constructor(opts: PeriodWith<"period">) {
    this.rsi = new RSI(opts);
    this.minmax = new RollingMinMax(opts);
  }

  update(close: number): number {
    const rsi = this.rsi.update(close);
    const { min, max } = this.minmax.update(rsi);

    if (!this.minmax.buffer.full()) {
      return 0;
    }

    const range = max - min;
    return range !== 0 ? ((rsi - min) / range) * 100 : 0;
  }

  onData(bar: BarWith<"close">): number {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "STOCHRSI",
    init: "{period: number}",
    input: "close",
    output: "number",
  };
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
  private highest: RollingMax;
  private lowest: RollingMin;

  constructor(opts: PeriodWith<"period">) {
    this.highest = new RollingMax(opts);
    this.lowest = new RollingMin(opts);
  }

  update(high: number, low: number, close: number): number {
    const highest = this.highest.update(high);
    const lowest = this.lowest.update(low);

    if (!this.highest.buffer.full()) {
      return 0;
    }

    const range = highest - lowest;
    return range !== 0 ? ((highest - close) / range) * -100 : 0;
  }

  onData(bar: BarWith<"high" | "low" | "close">): number {
    return this.update(bar.high, bar.low, bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "WILLR",
    desc: "Williams %R",
    init: "{period: number}",
    input: "high, low, close",
    output: "number",
  };
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
