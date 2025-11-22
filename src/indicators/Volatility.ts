import {
  EMA as CoreEMA,
  RollingMax,
  RollingMin,
  SMA as CoreSMA,
  RollingSum,
  RollingVar,
  RollingStddev,
  CircularBuffer,
  wilders_factor,
} from "@junduck/trading-core";
import type { BarWith } from "../types/BarData.js";
import type { PeriodWith } from "../types/PeriodOptions.js";
import { type OperatorDoc } from "../types/OpDoc.js";

/**
 * Historical Volatility - stateful indicator.
 * Calculates annualized volatility using log returns and sample variance.
 */
export class Volatility {
  private prevClose?: number;
  private variance: RollingVar;
  private annualizedDays: number;

  constructor(opts: PeriodWith<"period"> & { annualizedDays?: number }) {
    this.variance = new RollingVar({ period: opts.period, ddof: 1 });
    this.annualizedDays = opts.annualizedDays ?? 250;
  }

  update(close: number): number {
    if (this.prevClose === undefined || this.prevClose === 0) {
      this.prevClose = close;
      return 0;
    }

    const logReturn = Math.log(close / this.prevClose);
    this.prevClose = close;
    const { variance: variance } = this.variance.update(logReturn);
    return Math.sqrt(variance * this.annualizedDays) * 100;
  }

  onData(bar: BarWith<"close">): number {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "Volatility",
    init: "{period, annualizedDays?}",
    update: "close",
    output: "number",
  };
}

/**
 * Creates Volatility closure for functional usage.
 * @param opts Period and annualized days configuration
 * @returns Function that processes data and returns volatility
 */
export function useVolatility(
  opts: PeriodWith<"period"> & { annualizedDays?: number }
): (bar: BarWith<"close">) => number {
  const instance = new Volatility(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Chaikins Volatility - measures rate of change in trading range.
 */
export class CVI {
  private ema: CoreEMA;
  private buffer: CircularBuffer<number>;

  constructor(opts: PeriodWith<"period">) {
    this.ema = new CoreEMA({ period: 10 });
    this.buffer = new CircularBuffer(opts.period + 1);
  }

  update(high: number, low: number): number {
    const emaVal = this.ema.update(high - low);
    this.buffer.push(emaVal);

    if (!this.buffer.full()) {
      return 0;
    }

    const old = this.buffer.front()!;
    return old !== 0 ? ((emaVal - old) / old) * 100 : 0;
  }

  onData(bar: BarWith<"high" | "low">): number {
    return this.update(bar.high, bar.low);
  }

  static readonly doc: OperatorDoc = {
    type: "CVI",
    init: "{period: number}",
    update: "high, low",
    output: "number",
  };
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
  private ema1: CoreEMA;
  private ema2: CoreEMA;
  private sum: RollingSum;

  constructor(
    opts: PeriodWith<"period"> = {
      period: 9,
    }
  ) {
    this.ema1 = new CoreEMA(opts);
    this.ema2 = new CoreEMA(opts);
    this.sum = new RollingSum(opts);
  }

  update(high: number, low: number): number {
    const range = high - low;
    const ema1Val = this.ema1.update(range);
    const ema2Val = this.ema2.update(ema1Val);
    const ratio = ema2Val !== 0 ? ema1Val / ema2Val : 0;
    const sum = this.sum.update(ratio);

    if (!this.sum.buffer.full()) {
      return 0;
    }

    return sum;
  }

  onData(bar: BarWith<"high" | "low">): number {
    return this.update(bar.high, bar.low);
  }

  static readonly doc: OperatorDoc = {
    type: "MASS",
    init: "{period?: number}",
    update: "high, low",
    output: "number",
  };
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

  update(high: number, low: number, close: number): number {
    const tr =
      this.prevClose === undefined
        ? high - low
        : Math.max(
            high - low,
            Math.abs(high - this.prevClose),
            Math.abs(low - this.prevClose)
          );

    this.prevClose = close;
    return tr;
  }

  onData(bar: BarWith<"high" | "low" | "close">): number {
    return this.update(bar.high, bar.low, bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "TR",
    update: "high, low, close",
    output: "number",
  };
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
  private ema: CoreEMA;

  constructor(opts: PeriodWith<"period">) {
    this.tr = new TR();
    this.ema = new CoreEMA({ alpha: wilders_factor(opts.period) });
  }

  update(high: number, low: number, close: number): number {
    const trValue = this.tr.update(high, low, close);
    return this.ema.update(trValue);
  }

  onData(bar: BarWith<"high" | "low" | "close">): number {
    return this.update(bar.high, bar.low, bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "ATR",
    init: "{period: number}",
    update: "high, low, close",
    output: "number",
  };
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

  update(high: number, low: number, close: number): number {
    const atrVal = this.atr.update(high, low, close);
    return close !== 0 ? (atrVal / close) * 100 : 0;
  }

  onData(bar: BarWith<"high" | "low" | "close">): number {
    return this.update(bar.high, bar.low, bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "NATR",
    init: "{period: number}",
    update: "high, low, close",
    output: "number",
  };
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

/**
 * Price Channel - simple channel based on highest high and lowest low.
 * Similar to Donchian Channels but without middle line.
 */
export class PriceChannel {
  private highMax: RollingMax;
  private lowMin: RollingMin;

  constructor(opts: PeriodWith<"period">) {
    this.highMax = new RollingMax(opts);
    this.lowMin = new RollingMin(opts);
  }

  update(high: number, low: number): { upper: number; lower: number } {
    const upper = this.highMax.update(high);
    const lower = this.lowMin.update(low);
    return { upper, lower };
  }

  onData(bar: BarWith<"high" | "low">): { upper: number; lower: number } {
    return this.update(bar.high, bar.low);
  }

  static readonly doc: OperatorDoc = {
    type: "PriceChannel",
    init: "{period: number}",
    update: "high, low",
    output: "{upper, lower}",
  };
}

/**
 * Creates PriceChannel closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns Price Channel
 */
export function usePriceChannel(opts: PeriodWith<"period">): (
  bar: BarWith<"high" | "low">
) => {
  upper: number;
  lower: number;
} {
  const instance = new PriceChannel(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Bollinger Bands - volatility bands around SMA.
 * Uses standard deviation to measure price volatility.
 */
export class BBANDS {
  private std: RollingStddev;
  private multiplier: number;

  constructor(opts: PeriodWith<"period"> & { Nstddev?: number }) {
    this.std = new RollingStddev({ period: opts.period, ddof: 1 });
    this.multiplier = opts.Nstddev ?? 2;
  }

  update(close: number): { upper: number; middle: number; lower: number } {
    const { mean, stddev } = this.std.update(close);
    const offset = this.multiplier * stddev;

    return {
      upper: mean + offset,
      middle: mean,
      lower: mean - offset,
    };
  }

  onData(bar: BarWith<"close">): {
    upper: number;
    middle: number;
    lower: number;
  } {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "BBANDS",
    init: "{period, Nstddev?}",
    update: "close",
    output: "{upper, middle, lower}",
  };
}

/**
 * Creates BBANDS closure for functional usage.
 * @param opts Period and standard deviation multiplier configuration
 * @returns Function that processes bar data and returns Bollinger Bands
 */
export function useBBANDS(opts: PeriodWith<"period"> & { stddev?: number }): (
  bar: BarWith<"close">
) => {
  upper: number;
  middle: number;
  lower: number;
} {
  const instance = new BBANDS(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Keltner Channels - volatility bands around EMA using ATR.
 * Measures volatility relative to ATR instead of standard deviation.
 */
export class KC {
  private sma: CoreSMA;
  private tr: TR;
  private sma_tr: CoreSMA;
  private multiplier: number;

  constructor(opts: PeriodWith<"period"> & { multiplier?: number }) {
    this.sma = new CoreSMA(opts);
    this.tr = new TR();
    this.sma_tr = new CoreSMA(opts);
    this.multiplier = opts.multiplier ?? 2;
  }

  update(
    high: number,
    low: number,
    close: number
  ): { upper: number; middle: number; lower: number } {
    const middle = this.sma.update(close);
    const tr = this.tr.update(high, low, close);
    const mtr = this.sma_tr.update(tr);
    const offset = this.multiplier * mtr;

    return {
      upper: middle + offset,
      middle,
      lower: middle - offset,
    };
  }

  onData(bar: BarWith<"high" | "low" | "close">): {
    upper: number;
    middle: number;
    lower: number;
  } {
    return this.update(bar.high, bar.low, bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "KC",
    init: "{period, multiplier?}",
    update: "high, low, close",
    output: "{upper, middle, lower}",
  };
}

/**
 * Creates KC closure for functional usage.
 * @param opts Period and multiplier configuration
 * @returns Function that processes bar data and returns Keltner Channels
 */
export function useKC(opts: PeriodWith<"period"> & { multiplier?: number }): (
  bar: BarWith<"high" | "low" | "close">
) => {
  upper: number;
  middle: number;
  lower: number;
} {
  const instance = new KC(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Donchian Channels - price channels based on highest high and lowest low.
 * Classic breakout indicator using price extremes.
 */
export class DC {
  private min: RollingMin;
  private max: RollingMax;

  constructor(opts: PeriodWith<"period">) {
    this.min = new RollingMin(opts);
    this.max = new RollingMax(opts);
  }

  update(
    high: number,
    low: number
  ): { upper: number; middle: number; lower: number } {
    const min = this.min.update(low);
    const max = this.max.update(high);

    return {
      upper: max,
      middle: (max + min) / 2,
      lower: min,
    };
  }

  onData(bar: BarWith<"high" | "low">): {
    upper: number;
    middle: number;
    lower: number;
  } {
    return this.update(bar.high, bar.low);
  }

  static readonly doc: OperatorDoc = {
    type: "DC",
    init: "{period: number}",
    update: "high, low",
    output: "{upper, middle, lower}",
  };
}

/**
 * Creates DC closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns Donchian Channels
 */
export function useDC(opts: PeriodWith<"period">): (
  bar: BarWith<"high" | "low">
) => {
  upper: number;
  middle: number;
  lower: number;
} {
  const instance = new DC(opts);
  return (bar) => instance.onData(bar);
}
