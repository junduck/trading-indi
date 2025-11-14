import { Variance, EMA } from "../classes/Foundation.js";
import type { BarWith } from "../types/BarData.js";
import type { PeriodWith } from "../types/PeriodOptions.js";
import { CircularBuffer } from "../classes/Containers.js";
import { wilders_factor } from "../utils/math.js";

/**
 * Historical Volatility - stateful indicator.
 * Calculates annualized volatility using log returns and sample variance.
 */
export class VOLATILITY {
  private prevClose?: number;
  private variance: Variance;
  private annualizedDays: number;

  constructor(opts: PeriodWith<"period"> & { annualizedDays?: number }) {
    this.variance = new Variance({ period: opts.period, ddof: 1 });
    this.annualizedDays = opts.annualizedDays ?? 250;
  }

  /**
   * Process new data point.
   * @param bar Bar data with close price
   * @returns Annualized volatility as percentage
   */
  onData(bar: BarWith<"close">): number {
    if (this.prevClose === undefined || this.prevClose === 0) {
      this.prevClose = bar.close;
      return 0;
    }

    const logReturn = Math.log(bar.close / this.prevClose);
    this.prevClose = bar.close;
    const { variance: variance } = this.variance.onData(logReturn);
    return Math.sqrt(variance * this.annualizedDays) * 100;
  }
}

/**
 * Creates VOLATILITY closure for functional usage.
 * @param opts Period and annualized days configuration
 * @returns Function that processes data and returns volatility
 */
export function useVOLATILITY(
  opts: PeriodWith<"period"> & { annualizedDays?: number }
): (bar: BarWith<"close">) => number {
  const instance = new VOLATILITY(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Chaikins Volatility - measures rate of change in trading range.
 */
export class CVI {
  private ema: EMA;
  private buffer: CircularBuffer<number>;

  constructor(opts: PeriodWith<"period">) {
    if (opts.period === undefined) {
      throw new Error("CVI requires period");
    }
    this.ema = new EMA({ period: 10 });
    this.buffer = new CircularBuffer(opts.period + 1);
  }

  /**
   * Process new data point.
   * @param bar Bar data with high and low
   * @returns Current CVI value
   */
  onData(bar: BarWith<"high" | "low">): number {
    const emaVal = this.ema.onData(bar.high - bar.low);
    this.buffer.push(emaVal);

    if (!this.buffer.full()) {
      return 0;
    }

    const old = this.buffer.front()!;
    return old !== 0 ? ((emaVal - old) / old) * 100 : 0;
  }
}

/**
 * Creates CVI closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns CVI
 */
export function useCVI(
  opts: PeriodWith<"period">
): (bar: BarWith<"high" | "low">) => number {
  const instance = new CVI(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Mass Index - identifies trend reversals by analyzing range expansion.
 */
export class MASS {
  private ema1: EMA;
  private ema2: EMA;
  private buffer: CircularBuffer<number>;

  constructor(opts: PeriodWith<"period">) {
    if (opts.period === undefined) {
      throw new Error("MASS requires period");
    }
    this.ema1 = new EMA({ period: 9 });
    this.ema2 = new EMA({ period: 9 });
    this.buffer = new CircularBuffer(opts.period);
  }

  /**
   * Process new data point.
   * @param bar Bar data with high and low
   * @returns Current Mass Index value
   */
  onData(bar: BarWith<"high" | "low">): number {
    const range = bar.high - bar.low;
    const ema1Val = this.ema1.onData(range);
    const ema2Val = this.ema2.onData(ema1Val);
    const ratio = ema2Val !== 0 ? ema1Val / ema2Val : 0;
    this.buffer.push(ratio);

    if (!this.buffer.full()) {
      return 0;
    }

    let sum = 0;
    for (const val of this.buffer) {
      sum += val;
    }
    return sum;
  }
}

/**
 * Creates MASS closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns Mass Index
 */
export function useMASS(
  opts: PeriodWith<"period">
): (bar: BarWith<"high" | "low">) => number {
  const instance = new MASS(opts);
  return (bar) => instance.onData(bar);
}

/**
 * True Range - measures price volatility range.
 */
export class TR {
  private prevClose?: number;

  /**
   * Process new data point.
   * @param bar Bar data with high, low, and close
   * @returns Current True Range value
   */
  onData(bar: BarWith<"high" | "low" | "close">): number {
    const tr =
      this.prevClose === undefined
        ? bar.high - bar.low
        : Math.max(
            bar.high - bar.low,
            Math.abs(bar.high - this.prevClose),
            Math.abs(bar.low - this.prevClose)
          );

    this.prevClose = bar.close;
    return tr;
  }
}

/**
 * Creates TR closure for functional usage.
 * @returns Function that processes bar data and returns TR
 */
export function useTR(): (bar: BarWith<"high" | "low" | "close">) => number {
  const instance = new TR();
  return (bar) => instance.onData(bar);
}

/**
 * Average True Range - measures market volatility.
 */
export class ATR {
  private tr: TR;
  private ema: EMA;

  constructor(opts: PeriodWith<"period">) {
    this.tr = new TR();
    this.ema = new EMA({ alpha: wilders_factor(opts.period) });
  }

  /**
   * Process new data point.
   * @param bar Bar data with high, low, and close
   * @returns Current ATR value
   */
  onData(bar: BarWith<"high" | "low" | "close">): number {
    const trValue = this.tr.onData(bar);
    return this.ema.onData(trValue);
  }
}

/**
 * Creates ATR closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns ATR
 */
export function useATR(
  opts: PeriodWith<"period">
): (bar: BarWith<"high" | "low" | "close">) => number {
  const instance = new ATR(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Normalized Average True Range - ATR as percentage of close price.
 */
export class NATR {
  private atr: ATR;

  constructor(opts: PeriodWith<"period">) {
    this.atr = new ATR(opts);
  }

  /**
   * Process new data point.
   * @param bar Bar data with high, low, and close
   * @returns Current NATR value as percentage
   */
  onData(bar: BarWith<"high" | "low" | "close">): number {
    const atrVal = this.atr.onData(bar);
    return bar.close !== 0 ? (atrVal / bar.close) * 100 : 0;
  }
}

/**
 * Creates NATR closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns NATR
 */
export function useNATR(
  opts: PeriodWith<"period">
): (bar: BarWith<"high" | "low" | "close">) => number {
  const instance = new NATR(opts);
  return (bar) => instance.onData(bar);
}
