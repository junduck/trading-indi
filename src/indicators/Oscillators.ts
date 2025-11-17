import type { BarWith } from "../types/BarData.js";
import type { PeriodWith } from "../types/PeriodOptions.js";
import { EMA, MinMax, SMA } from "../fn/Foundation.js";
import { CircularBuffer } from "../fn/Containers.js";

/**
 * Awesome Oscillator - stateful indicator.
 * Measures momentum using median price with 5/34 period SMAs.
 */
export class AO {
  private smaShort = new SMA({ period: 5 });
  private smaLong = new SMA({ period: 34 });

  /**
   * Process new bar data.
   * @param bar Bar with high and low prices
   * @returns Current AO value
   */
  onData(bar: BarWith<"high" | "low">): number {
    const midpoint = (bar.high + bar.low) / 2;
    return this.smaShort.onData(midpoint) - this.smaLong.onData(midpoint);
  }
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
  private emaShort: EMA;
  private emaLong: EMA;

  constructor(opts: PeriodWith<"period_short" | "period_long">) {
    this.emaShort = new EMA({ period: opts.period_short });
    this.emaLong = new EMA({ period: opts.period_long });
  }

  /**
   * Process new data point.
   * @param bar Bar with close price
   * @returns Current APO value
   */
  onData(bar: BarWith<"close">): number {
    return this.emaShort.onData(bar.close) - this.emaLong.onData(bar.close);
  }
}

/**
 * Creates APO closure for functional usage.
 * @param opts Short and long period configuration
 * @returns Function that processes bar data and returns APO
 */
export function useAPO(
  opts: PeriodWith<"period_short" | "period_long">
): (bar: BarWith<"close">) => number {
  const instance = new APO(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Detrended Price Oscillator - stateful indicator.
 * Removes trend to identify cycles using displaced SMA.
 */
export class DPO {
  private sma: SMA;
  private lookback: number;

  constructor(opts: PeriodWith<"period">) {
    this.sma = new SMA({ period: opts.period });
    this.lookback = Math.floor(opts.period / 2) + 1;
  }

  /**
   * Process new data point.
   * @param bar Bar with close price
   * @returns Current DPO value
   */
  onData(bar: BarWith<"close">): number {
    const smaVal = this.sma.onData(bar.close);

    if (!this.sma.buffer.full()) {
      return 0;
    }

    const pastPrice =
      this.sma.buffer.at(this.sma.buffer.size() - this.lookback) ?? bar.close;
    return pastPrice - smaVal;
  }
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
  private minmax: MinMax;
  private val: number = 0;
  private fisher: number = 0;

  constructor(opts: PeriodWith<"period">) {
    this.minmax = new MinMax({ period: opts.period });
  }

  /**
   * Process new bar data.
   * @param bar Bar with high and low prices
   * @returns Current Fisher Transform value
   */
  onData(bar: BarWith<"high" | "low">): number {
    const hl = (bar.high + bar.low) / 2;
    const { min, max } = this.minmax.onData(hl);

    const range = max - min;
    if (range === 0) {
      return this.fisher;
    }

    const normalized = 2 * ((hl - min) / range - 0.5);
    this.val = 0.333 * normalized + 0.667 * this.val;

    const clamped = Math.max(-0.999, Math.min(0.999, this.val));
    const rawFisher = 0.5 * Math.log((1 + clamped) / (1 - clamped));
    this.fisher = 0.5 * rawFisher + 0.5 * this.fisher;

    return this.fisher;
  }
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
  private emaShort: EMA;
  private emaLong: EMA;
  private emaSignal: EMA;

  constructor(
    opts: PeriodWith<"period_short" | "period_long" | "period_signal">
  ) {
    this.emaShort = new EMA({ period: opts.period_short });
    this.emaLong = new EMA({ period: opts.period_long });
    this.emaSignal = new EMA({ period: opts.period_signal });
  }

  /**
   * Process new data point.
   * @param bar Bar with close price
   * @returns Object with macd, signal, and histogram values
   */
  onData(bar: BarWith<"close">): {
    macd: number;
    signal: number;
    histogram: number;
  } {
    const macd =
      this.emaShort.onData(bar.close) - this.emaLong.onData(bar.close);
    const signal = this.emaSignal.onData(macd);
    const histogram = macd - signal;
    return { macd, signal, histogram };
  }
}

/**
 * Creates MACD closure for functional usage.
 * @param opts Short, long, and signal period configuration
 * @returns Function that processes bar data and returns MACD values
 */
export function useMACD(
  opts: PeriodWith<"period_short" | "period_long" | "period_signal">
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
  private emaShort: EMA;
  private emaLong: EMA;

  constructor(opts: PeriodWith<"period_short" | "period_long">) {
    this.emaShort = new EMA({ period: opts.period_short });
    this.emaLong = new EMA({ period: opts.period_long });
  }

  /**
   * Process new data point.
   * @param bar Bar with close price
   * @returns Current PPO value as percentage
   */
  onData(bar: BarWith<"close">): number {
    const emaShortVal = this.emaShort.onData(bar.close);
    const emaLongVal = this.emaLong.onData(bar.close);
    return emaLongVal !== 0
      ? ((emaShortVal - emaLongVal) / emaLongVal) * 100
      : 0;
  }
}

/**
 * Creates PPO closure for functional usage.
 * @param opts Short and long period configuration
 * @returns Function that processes bar data and returns PPO
 */
export function usePPO(
  opts: PeriodWith<"period_short" | "period_long">
): (bar: BarWith<"close">) => number {
  const instance = new PPO(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Qstick - stateful indicator.
 * Measures average difference between close and open prices.
 */
export class QSTICK {
  private sma: SMA;

  constructor(opts: PeriodWith<"period">) {
    this.sma = new SMA({ period: opts.period });
  }

  /**
   * Process new bar data.
   * @param bar Bar with open and close prices
   * @returns Current QSTICK value
   */
  onData(bar: BarWith<"open" | "close">): number {
    const diff = bar.close - bar.open;
    return this.sma.onData(diff);
  }
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
  private ema1: EMA;
  private ema2: EMA;
  private ema3: EMA;
  private prevEma3?: number;

  constructor(opts: PeriodWith<"period">) {
    this.ema1 = new EMA({ period: opts.period });
    this.ema2 = new EMA({ period: opts.period });
    this.ema3 = new EMA({ period: opts.period });
  }

  /**
   * Process new data point.
   * @param bar Bar with close price
   * @returns Current TRIX value as percentage
   */
  onData(bar: BarWith<"close">): number {
    const ema1Val = this.ema1.onData(bar.close);
    const ema2Val = this.ema2.onData(ema1Val);
    const ema3Val = this.ema3.onData(ema2Val);

    if (this.prevEma3 === undefined || this.prevEma3 === 0) {
      this.prevEma3 = ema3Val;
      return 0;
    }

    const trix = ((ema3Val - this.prevEma3) / this.prevEma3) * 100;
    this.prevEma3 = ema3Val;
    return trix;
  }
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
  private bpShort: CircularBuffer<number>;
  private bpMed: CircularBuffer<number>;
  private bpLong: CircularBuffer<number>;
  private trShort: CircularBuffer<number>;
  private trMed: CircularBuffer<number>;
  private trLong: CircularBuffer<number>;
  private sumBpShort: number = 0;
  private sumBpMed: number = 0;
  private sumBpLong: number = 0;
  private sumTrShort: number = 0;
  private sumTrMed: number = 0;
  private sumTrLong: number = 0;

  constructor(opts: PeriodWith<"period_short" | "period_med" | "period_long">) {
    this.bpShort = new CircularBuffer<number>(opts.period_short);
    this.bpMed = new CircularBuffer<number>(opts.period_med);
    this.bpLong = new CircularBuffer<number>(opts.period_long);
    this.trShort = new CircularBuffer<number>(opts.period_short);
    this.trMed = new CircularBuffer<number>(opts.period_med);
    this.trLong = new CircularBuffer<number>(opts.period_long);
  }

  /**
   * Process new bar data.
   * @param bar OHLC bar with high, low, close
   * @returns Ultimate Oscillator value (0-100 range)
   */
  onData(bar: BarWith<"high" | "low" | "close">): number {
    if (this.prevClose === undefined) {
      this.prevClose = bar.close;
      return 50;
    }

    const tl = Math.min(bar.low, this.prevClose);
    const th = Math.max(bar.high, this.prevClose);
    const bp = bar.close - tl;
    const tr = th - tl;

    this.updateBuffer(this.bpShort, bp, (old) => {
      this.sumBpShort -= old;
    });
    this.updateBuffer(this.trShort, tr, (old) => {
      this.sumTrShort -= old;
    });
    this.updateBuffer(this.bpMed, bp, (old) => {
      this.sumBpMed -= old;
    });
    this.updateBuffer(this.trMed, tr, (old) => {
      this.sumTrMed -= old;
    });
    this.updateBuffer(this.bpLong, bp, (old) => {
      this.sumBpLong -= old;
    });
    this.updateBuffer(this.trLong, tr, (old) => {
      this.sumTrLong -= old;
    });

    this.sumBpShort += bp;
    this.sumBpMed += bp;
    this.sumBpLong += bp;
    this.sumTrShort += tr;
    this.sumTrMed += tr;
    this.sumTrLong += tr;

    this.prevClose = bar.close;

    const avg1 = this.sumTrShort !== 0 ? this.sumBpShort / this.sumTrShort : 0;
    const avg2 = this.sumTrMed !== 0 ? this.sumBpMed / this.sumTrMed : 0;
    const avg3 = this.sumTrLong !== 0 ? this.sumBpLong / this.sumTrLong : 0;

    return (100 * (4 * avg1 + 2 * avg2 + avg3)) / 7;
  }

  private updateBuffer(
    buffer: CircularBuffer<number>,
    newValue: number,
    onRemove: (old: number) => void
  ): void {
    if (buffer.full()) {
      const old = buffer.front()!;
      onRemove(old);
    }
    buffer.push(newValue);
  }
}

/**
 * Creates ULTOSC closure for functional usage.
 * @param opts Short, medium, and long period configuration (typically 7, 14, 28)
 * @returns Function that processes bar data and returns Ultimate Oscillator
 */
export function useULTOSC(
  opts: PeriodWith<"period_short" | "period_med" | "period_long">
): (bar: BarWith<"high" | "low" | "close">) => number {
  const instance = new ULTOSC(opts);
  return (bar: BarWith<"high" | "low" | "close">) => instance.onData(bar);
}
