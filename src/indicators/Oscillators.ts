import type { BarWith } from "../types/BarData.js";
import type { PeriodWith } from "../types/PeriodOptions.js";
import {
  EMA as CoreEMA,
  RollingMinMax,
  SMA as CoreSMA,
  RollingSum,
  clamp,
} from "@junduck/trading-core";
import { type OperatorDoc } from "../types/OpDoc.js";

/**
 * Awesome Oscillator - stateful indicator.
 * Measures momentum using median price with 5/34 period SMAs.
 */
export class AO {
  private smaShort = new CoreSMA({ period: 5 });
  private smaLong = new CoreSMA({ period: 34 });

  update(high: number, low: number): number {
    const midpoint = (high + low) / 2;
    return this.smaShort.update(midpoint) - this.smaLong.update(midpoint);
  }

  onData(bar: BarWith<"high" | "low">): number {
    return this.update(bar.high, bar.low);
  }

  static readonly doc: OperatorDoc = {
    type: "AO",
    input: "high, low",
    output: "number",
  };
}

/**
 * Creates AO closure for functional usage.
 * @returns Function that processes bar data and returns AO
 */
export function useAO(): (bar: BarWith<"high" | "low">) => number {
  const instance = new AO();
  return (bar) => instance.onData(bar);
}

/**
 * Absolute Price Oscillator - stateful indicator.
 * Calculates difference between short and long period EMAs.
 */
export class APO {
  private emsFast: CoreEMA;
  private emsSlow: CoreEMA;

  constructor(opts: PeriodWith<"period_fast" | "period_slow">) {
    this.emsFast = new CoreEMA({ period: opts.period_fast });
    this.emsSlow = new CoreEMA({ period: opts.period_slow });
  }

  update(close: number): number {
    return this.emsFast.update(close) - this.emsSlow.update(close);
  }

  onData(bar: BarWith<"close">): number {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "APO",
    init: "{period_fast, period_slow}",
    input: "close",
    output: "number",
  };
}

/**
 * Creates APO closure for functional usage.
 * @param opts Short and long period configuration
 * @returns Function that processes bar data and returns APO
 */
export function useAPO(
  opts: PeriodWith<"period_fast" | "period_slow">
): (bar: BarWith<"close">) => number {
  const instance = new APO(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Detrended Price Oscillator - stateful indicator.
 * Removes trend to identify cycles using displaced SMA.
 */
export class DPO {
  private sma: CoreSMA;
  private lookback: number;

  constructor(opts: PeriodWith<"period">) {
    this.sma = new CoreSMA({ period: opts.period });
    this.lookback = Math.floor(opts.period / 2) + 1;
  }

  update(close: number): number {
    const smaVal = this.sma.update(close);

    if (!this.sma.buffer.full()) {
      return 0;
    }

    const pastPrice =
      this.sma.buffer.at(this.sma.buffer.size() - this.lookback) ?? close;
    return pastPrice - smaVal;
  }

  onData(bar: BarWith<"close">): number {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "DPO",
    init: "{period: number}",
    input: "close",
    output: "number",
  };
}

/**
 * Creates DPO closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns DPO
 */
export function useDPO(
  opts: PeriodWith<"period">
): (bar: BarWith<"close">) => number {
  const instance = new DPO(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Fisher Transform - stateful indicator.
 * Transforms prices to Gaussian distribution for identifying turning points.
 */
export class Fisher {
  private minmax: RollingMinMax;
  private val: number = 0;
  private fisher: number = 0;

  constructor(opts: PeriodWith<"period">) {
    this.minmax = new RollingMinMax(opts);
  }

  update(high: number, low: number): number {
    const hl = (high + low) / 2;
    const { min, max } = this.minmax.update(hl);

    const range = max - min;
    if (range === 0) {
      return this.fisher;
    }

    const normalized = 2 * ((hl - min) / range - 0.5);
    this.val = 0.333 * normalized + 0.667 * this.val;

    const clamped = clamp(this.val, -0.999, 0.999);
    const rawFisher = 0.5 * Math.log((1 + clamped) / (1 - clamped));
    this.fisher = 0.5 * rawFisher + 0.5 * this.fisher;

    return this.fisher;
  }

  onData(bar: BarWith<"high" | "low">): number {
    return this.update(bar.high, bar.low);
  }

  static readonly doc: OperatorDoc = {
    type: "Fisher",
    init: "{period: number}",
    input: "high, low",
    output: "number",
  };
}

/**
 * Creates Fisher closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns Fisher Transform
 */
export function useFisher(
  opts: PeriodWith<"period">
): (bar: BarWith<"high" | "low">) => number {
  const instance = new Fisher(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Moving Average Convergence/Divergence - stateful indicator.
 * Trend-following momentum indicator using EMAs.
 */
export class MACD {
  private emsFast: CoreEMA;
  private emsSlow: CoreEMA;
  private emaSignal: CoreEMA;

  constructor(
    opts: PeriodWith<"period_fast" | "period_slow" | "period_signal">
  ) {
    this.emsFast = new CoreEMA({ period: opts.period_fast });
    this.emsSlow = new CoreEMA({ period: opts.period_slow });
    this.emaSignal = new CoreEMA({ period: opts.period_signal });
  }

  update(close: number): { macd: number; signal: number; histogram: number } {
    const macd = this.emsFast.update(close) - this.emsSlow.update(close);
    const signal = this.emaSignal.update(macd);
    const histogram = macd - signal;
    return { macd, signal, histogram };
  }

  onData(bar: BarWith<"close">): {
    macd: number;
    signal: number;
    histogram: number;
  } {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "MACD",
    init: "{period_fast, period_slow, period_signal}",
    input: "close",
    output: "{macd, signal, histogram}",
  };
}

/**
 * Creates MACD closure for functional usage.
 * @param opts Short, long, and signal period configuration
 * @returns Function that processes bar data and returns MACD values
 */
export function useMACD(
  opts: PeriodWith<"period_fast" | "period_slow" | "period_signal">
): (bar: BarWith<"close">) => {
  macd: number;
  signal: number;
  histogram: number;
} {
  const instance = new MACD(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Percentage Price Oscillator - stateful indicator.
 * Calculates percentage difference between short and long period EMAs.
 */
export class PPO {
  private emsFast: CoreEMA;
  private emsSlow: CoreEMA;

  constructor(opts: PeriodWith<"period_fast" | "period_slow">) {
    this.emsFast = new CoreEMA({ period: opts.period_fast });
    this.emsSlow = new CoreEMA({ period: opts.period_slow });
  }

  update(close: number): number {
    const emsFastVal = this.emsFast.update(close);
    const emsSlowVal = this.emsSlow.update(close);
    return emsSlowVal !== 0
      ? ((emsFastVal - emsSlowVal) / emsSlowVal) * 100
      : 0;
  }

  onData(bar: BarWith<"close">): number {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "PPO",
    init: "{period_fast, period_slow}",
    input: "close",
    output: "number",
  };
}

/**
 * Creates PPO closure for functional usage.
 * @param opts Short and long period configuration
 * @returns Function that processes bar data and returns PPO
 */
export function usePPO(
  opts: PeriodWith<"period_fast" | "period_slow">
): (bar: BarWith<"close">) => number {
  const instance = new PPO(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Qstick - stateful indicator.
 * Measures average difference between close and open prices.
 */
export class QSTICK {
  private sma: CoreSMA;

  constructor(opts: PeriodWith<"period">) {
    this.sma = new CoreSMA({ period: opts.period });
  }

  update(open: number, close: number): number {
    const diff = close - open;
    return this.sma.update(diff);
  }

  onData(bar: BarWith<"open" | "close">): number {
    return this.update(bar.open, bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "QSTICK",
    init: "{period: number}",
    input: "open, close",
    output: "number",
  };
}

/**
 * Creates QSTICK closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns QSTICK
 */
export function useQSTICK(
  opts: PeriodWith<"period">
): (bar: BarWith<"open" | "close">) => number {
  const instance = new QSTICK(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Trix - stateful indicator.
 * Rate of change of triple exponential moving average.
 */
export class TRIX {
  private ema1: CoreEMA;
  private ema2: CoreEMA;
  private ema3: CoreEMA;
  private prevEma3?: number;

  constructor(opts: PeriodWith<"period">) {
    this.ema1 = new CoreEMA({ period: opts.period });
    this.ema2 = new CoreEMA({ period: opts.period });
    this.ema3 = new CoreEMA({ period: opts.period });
  }

  update(close: number): number {
    const ema1Val = this.ema1.update(close);
    const ema2Val = this.ema2.update(ema1Val);
    const ema3Val = this.ema3.update(ema2Val);

    if (this.prevEma3 === undefined || this.prevEma3 === 0) {
      this.prevEma3 = ema3Val;
      return 0;
    }

    const trix = ((ema3Val - this.prevEma3) / this.prevEma3) * 100;
    this.prevEma3 = ema3Val;
    return trix;
  }

  onData(bar: BarWith<"close">): number {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "TRIX",
    init: "{period: number}",
    input: "close",
    output: "number",
  };
}

/**
 * Creates TRIX closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns TRIX
 */
export function useTRIX(
  opts: PeriodWith<"period">
): (bar: BarWith<"close">) => number {
  const instance = new TRIX(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Ultimate Oscillator - stateful indicator.
 * Momentum oscillator using weighted average of buying pressure across three timeframes.
 */
export class ULTOSC {
  private prevClose?: number;
  private sumBpFast: RollingSum;
  private sumBpMed: RollingSum;
  private sumBpSlow: RollingSum;
  private sumTrFast: RollingSum;
  private sumTrMed: RollingSum;
  private sumTrSlow: RollingSum;

  constructor(opts: PeriodWith<"period_fast" | "period_med" | "period_slow">) {
    this.sumBpFast = new RollingSum({ period: opts.period_fast });
    this.sumBpMed = new RollingSum({ period: opts.period_med });
    this.sumBpSlow = new RollingSum({ period: opts.period_slow });
    this.sumTrFast = new RollingSum({ period: opts.period_fast });
    this.sumTrMed = new RollingSum({ period: opts.period_med });
    this.sumTrSlow = new RollingSum({ period: opts.period_slow });
  }

  update(high: number, low: number, close: number): number {
    if (this.prevClose === undefined) {
      this.prevClose = close;
      return 50;
    }

    const tl = Math.min(low, this.prevClose);
    const th = Math.max(high, this.prevClose);
    const bp = close - tl;
    const tr = th - tl;

    const bpFast = this.sumBpFast.update(bp);
    const bpMed = this.sumBpMed.update(bp);
    const bpSlow = this.sumBpSlow.update(bp);
    const trFast = this.sumTrFast.update(tr);
    const trMed = this.sumTrMed.update(tr);
    const trSlow = this.sumTrSlow.update(tr);

    this.prevClose = close;

    const avg1 = trFast !== 0 ? bpFast / trFast : 0;
    const avg2 = trMed !== 0 ? bpMed / trMed : 0;
    const avg3 = trSlow !== 0 ? bpSlow / trSlow : 0;

    return (100 * (4 * avg1 + 2 * avg2 + avg3)) / 7;
  }

  onData(bar: BarWith<"high" | "low" | "close">): number {
    return this.update(bar.high, bar.low, bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "ULTOSC",
    init: "{period_fast, period_med, period_slow}",
    input: "high, low, close",
    output: "number",
  };
}

/**
 * Creates ULTOSC closure for functional usage.
 * @param opts Short, medium, and long period configuration (typically 7, 14, 28)
 * @returns Function that processes bar data and returns Ultimate Oscillator
 */
export function useULTOSC(
  opts: PeriodWith<"period_fast" | "period_med" | "period_slow">
): (bar: BarWith<"high" | "low" | "close">) => number {
  const instance = new ULTOSC(opts);
  return (bar: BarWith<"high" | "low" | "close">) => instance.onData(bar);
}
