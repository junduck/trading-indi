import type { PeriodWith } from "../types/PeriodOptions.js";
import type { BarWith } from "../types/BarData.js";
import {
  CircularBuffer,
  wilders_factor,
  SmoothedAccum,
  EMA as CoreEMA,
  SMA as CoreSMA,
} from "@junduck/trading-core";

import { type OperatorDoc } from "../types/OpDoc.js";

/**
 * Balance of Power - measures buying vs selling pressure.
 * Calculates (close - open) / (high - low) ratio.
 */
export class BOP {
  update(open: number, high: number, low: number, close: number): number {
    const range = high - low;
    return range !== 0 ? (close - open) / range : 0;
  }

  onData(bar: BarWith<"open" | "high" | "low" | "close">): number {
    return this.update(bar.open, bar.high, bar.low, bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "BOP",
    input: "open, high, low, close",
    output: "number",
  };
}

/**
 * Creates BOP closure for functional usage.
 * @returns Function that processes bar data and returns BOP
 */
export function useBOP(): (
  bar: BarWith<"open" | "high" | "low" | "close">
) => number {
  const instance = new BOP();
  return (bar) => instance.onData(bar);
}

/**
 * Momentum - stateful indicator.
 * Measures rate of price change over period.
 */
export class MOM {
  private buffer: CircularBuffer<number>;

  constructor(opts: PeriodWith<"period">) {
    this.buffer = new CircularBuffer(opts.period + 1);
  }

  update(close: number): number {
    this.buffer.push(close);
    if (!this.buffer.full()) {
      return 0;
    }
    return close - this.buffer.front()!;
  }

  onData(bar: BarWith<"close">): number {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "MOM",
    init: "{period: number}",
    input: "close",
    output: "number",
  };
}

/**
 * Creates MOM closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes data and returns momentum
 */
export function useMOM(
  opts: PeriodWith<"period">
): (bar: BarWith<"close">) => number {
  const instance = new MOM(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Rate of Change - stateful indicator.
 * Calculates percentage price change over period.
 */
export class ROC {
  private buffer: CircularBuffer<number>;

  constructor(opts: PeriodWith<"period">) {
    this.buffer = new CircularBuffer(opts.period + 1);
  }

  update(close: number): number {
    this.buffer.push(close);
    if (!this.buffer.full()) {
      return 0;
    }
    const old = this.buffer.front()!;
    return old !== 0 ? ((close - old) / old) * 100 : 0;
  }

  onData(bar: BarWith<"close">): number {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "ROC",
    desc: "Rate of Change",
    init: "{period: number}",
    input: "close",
    output: "number",
  };
}

/**
 * Creates ROC closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes data and returns rate of change
 */
export function useROC(
  opts: PeriodWith<"period">
): (bar: BarWith<"close">) => number {
  const instance = new ROC(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Rate of Change Ratio - stateful indicator.
 * Calculates price change ratio over period.
 */
export class ROCR {
  private buffer: CircularBuffer<number>;

  constructor(opts: PeriodWith<"period">) {
    this.buffer = new CircularBuffer(opts.period + 1);
  }

  update(close: number): number {
    this.buffer.push(close);
    if (!this.buffer.full()) {
      return 1;
    }
    const old = this.buffer.front()!;
    return old !== 0 ? close / old : 1;
  }

  onData(bar: BarWith<"close">): number {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "ROCR",
    init: "{period: number}",
    input: "close",
    output: "number",
  };
}

/**
 * Creates ROCR closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes data and returns rate of change ratio
 */
export function useROCR(
  opts: PeriodWith<"period">
): (bar: BarWith<"close">) => number {
  const instance = new ROCR(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Relative Strength Index - stateful indicator.
 * Uses Wilder's smoothing to measure overbought/oversold conditions.
 */
export class RSI {
  private alpha: number;
  private avgGain?: SmoothedAccum;
  private avgLoss?: SmoothedAccum;
  private prevClose?: number;

  constructor(opts: PeriodWith<"period">) {
    this.alpha = wilders_factor(opts.period);
  }

  update(close: number): number {
    if (this.prevClose === undefined) {
      this.prevClose = close;
      return 50;
    }

    const change = close - this.prevClose;
    this.prevClose = close;

    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    if (this.avgGain === undefined) {
      this.avgGain = new SmoothedAccum(gain);
      this.avgLoss = new SmoothedAccum(loss);
    } else {
      this.avgGain.accum(gain, this.alpha);
      this.avgLoss!.accum(loss, this.alpha);
    }

    if (this.avgLoss!.val === 0) {
      return 100;
    }

    const rs = this.avgGain.val / this.avgLoss!.val;
    return 100 - 100 / (1 + rs);
  }

  onData(bar: BarWith<"close">): number {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "RSI",
    init: "{period: number}",
    input: "close",
    output: "number",
  };
}

/**
 * Creates RSI closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes data and returns RSI
 */
export function useRSI(
  opts: PeriodWith<"period">
): (bar: BarWith<"close">) => number {
  const instance = new RSI(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Chande Momentum Oscillator - stateful indicator.
 * Measures momentum using sum of gains vs losses over period.
 */
export class CMO {
  private buffer: CircularBuffer<number>;
  private upSum: number = 0;
  private downSum: number = 0;
  private prevClose?: number;

  constructor(opts: PeriodWith<"period">) {
    this.buffer = new CircularBuffer(opts.period);
  }

  update(close: number): number {
    if (this.prevClose === undefined) {
      this.prevClose = close;
      return 0;
    }

    const change = close - this.prevClose;
    this.prevClose = close;

    if (change > 0) {
      this.upSum += change;
    } else {
      this.downSum -= change;
    }

    if (this.buffer.full()) {
      const change0 = this.buffer.front()!;
      if (change0 > 0) {
        this.upSum -= change0;
      } else {
        this.downSum += change0;
      }
    }
    this.buffer.push(change);

    if (!this.buffer.full()) {
      return 0;
    }

    const total = this.upSum + this.downSum;
    return total !== 0 ? ((this.upSum - this.downSum) / total) * 100 : 0;
  }

  onData(bar: BarWith<"close">): number {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "CMO",
    init: "{period: number}",
    input: "close",
    output: "number",
  };
}

/**
 * Creates CMO closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes data and returns CMO
 */
export function useCMO(
  opts: PeriodWith<"period">
): (bar: BarWith<"close">) => number {
  const instance = new CMO(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Williams Accumulation/Distribution - stateful indicator.
 * Cumulative indicator measuring buying and selling pressure.
 */
export class WAD {
  private wad: number = 0;
  private prevClose?: number;

  update(high: number, low: number, close: number): number {
    if (this.prevClose === undefined) {
      this.prevClose = close;
      return this.wad;
    }

    if (close > this.prevClose) {
      this.wad += close - Math.min(this.prevClose, low);
    } else if (close < this.prevClose) {
      this.wad += close - Math.max(this.prevClose, high);
    }

    this.prevClose = close;
    return this.wad;
  }

  onData(bar: BarWith<"high" | "low" | "close">): number {
    return this.update(bar.high, bar.low, bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "WAD",
    input: "high, low, close",
    output: "number",
  };
}

/**
 * Creates WAD closure for functional usage.
 * @returns Function that processes bar data and returns WAD
 */
export function useWAD(): (bar: BarWith<"high" | "low" | "close">) => number {
  const instance = new WAD();
  return (bar) => instance.onData(bar);
}

/**
 * Relative Vigor Index - measures trend conviction.
 * Compares close relative to open with range.
 */
export class RVI {
  private numeratorSma: CoreSMA;
  private denominatorSma: CoreSMA;
  private signalSma: CoreSMA;

  constructor(opts: PeriodWith<"period">) {
    this.numeratorSma = new CoreSMA(opts);
    this.denominatorSma = new CoreSMA(opts);
    this.signalSma = new CoreSMA({ period: 4 });
  }

  update(
    open: number,
    high: number,
    low: number,
    close: number
  ): { rvi: number; signal: number } {
    const numerator = close - open;
    const denominator = high - low;

    const avgNum = this.numeratorSma.update(numerator);
    const avgDenom = this.denominatorSma.update(denominator);

    const rvi = avgDenom !== 0 ? avgNum / avgDenom : 0;
    const signal = this.signalSma.update(rvi);

    return { rvi, signal };
  }

  onData(bar: BarWith<"open" | "high" | "low" | "close">): {
    rvi: number;
    signal: number;
  } {
    return this.update(bar.open, bar.high, bar.low, bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "RVI",
    init: "{period: number}",
    input: "open, high, low, close",
    output: "{rvi, signal}",
  };
}

/**
 * Creates RVI closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns RVI
 */
export function useRVI(opts: PeriodWith<"period">): (
  bar: BarWith<"open" | "high" | "low" | "close">
) => {
  rvi: number;
  signal: number;
} {
  const instance = new RVI(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Trend Strength Index - momentum indicator.
 * Double-smoothed momentum oscillator.
 */
export class TSI {
  private emsSlow1: CoreEMA;
  private emsFast1: CoreEMA;
  private emsSlow2: CoreEMA;
  private emsFast2: CoreEMA;
  private emaSignal: CoreEMA;
  private prevClose?: number;

  constructor(
    opts: PeriodWith<"period_fast" | "period_slow" | "period_signal"> = {
      period_fast: 13,
      period_slow: 25,
      period_signal: 13,
    }
  ) {
    this.emsSlow1 = new CoreEMA({ period: opts.period_slow });
    this.emsFast1 = new CoreEMA({ period: opts.period_fast });
    this.emsSlow2 = new CoreEMA({ period: opts.period_slow });
    this.emsFast2 = new CoreEMA({ period: opts.period_fast });
    this.emaSignal = new CoreEMA({ period: opts.period_signal });
  }

  update(close: number): { tsi: number; signal: number } {
    if (this.prevClose === undefined) {
      this.prevClose = close;
      this.emsSlow1.update(0);
      this.emsFast1.update(0);
      this.emsSlow2.update(0);
      this.emsFast2.update(0);
      return { tsi: 0, signal: 0 };
    }

    const momentum = close - this.prevClose;
    this.prevClose = close;

    const smoothed1 = this.emsSlow1.update(momentum);
    const doubleSmoothNum = this.emsFast1.update(smoothed1);

    const absMomentum = Math.abs(momentum);
    const smoothed2 = this.emsSlow2.update(absMomentum);
    const doubleSmoothDenom = this.emsFast2.update(smoothed2);

    const tsi =
      doubleSmoothDenom !== 0 ? (doubleSmoothNum / doubleSmoothDenom) * 100 : 0;
    const signal = this.emaSignal.update(tsi);

    return { tsi, signal };
  }

  onData(bar: BarWith<"close">): { tsi: number; signal: number } {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "TSI",
    desc: "Trend Strength Index", // Agent: mistakes for True Strength Index
    init: "{period_fast?: number, period_slow?: number, period_signal?: number}",
    input: "close",
    output: "{tsi, signal}",
  };
}

/**
 * Creates TSI closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns TSI
 */
export function useTSI(
  opts: PeriodWith<"period_fast" | "period_slow" | "period_signal"> = {
    period_fast: 13,
    period_slow: 25,
    period_signal: 13,
  }
): (bar: BarWith<"close">) => { tsi: number; signal: number } {
  const instance = new TSI(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Elder's Bull/Bear Power - measures buying and selling pressure.
 * Compares highs and lows to EMA.
 */
export class BBPOWER {
  private ema: CoreEMA;

  constructor(opts: PeriodWith<"period">) {
    this.ema = new CoreEMA(opts);
  }

  update(
    high: number,
    low: number,
    close: number
  ): { bull_power: number; bear_power: number } {
    const emaValue = this.ema.update(close);
    return {
      bull_power: high - emaValue,
      bear_power: low - emaValue,
    };
  }

  onData(bar: BarWith<"high" | "low" | "close">): {
    bull_power: number;
    bear_power: number;
  } {
    return this.update(bar.high, bar.low, bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "BBPOWER",
    desc: "Elder's Bull/Bear Power", // Agent: mistakes for Bollinger Bands Power
    init: "{period: number}",
    input: "high, low, close",
    output: "{bull_power, bear_power}",
  };
}

/**
 * Creates BBPOWER closure for functional usage.
 * @param opts Period configuration (typically 13)
 * @returns Function that processes bar data and returns Bull/Bear Power
 */
export function useBBPOWER(opts: PeriodWith<"period">): (
  bar: BarWith<"high" | "low" | "close">
) => {
  bull_power: number;
  bear_power: number;
} {
  const instance = new BBPOWER(opts);
  return (bar) => instance.onData(bar);
}
