import type { PeriodWith } from "../types/PeriodOptions.js";
import type { BarWith } from "../types/BarData.js";
import { CircularBuffer } from "../classes/Containers.js";
import { wilders_factor, smooth } from "../utils/math.js";
import { EMA, SMA } from "../classes/Foundation.js";

/**
 * Balance of Power - measures buying vs selling pressure.
 * Calculates (close - open) / (high - low) ratio.
 */
export class BOP {
  /**
   * Process new bar data.
   * @param bar OHLC bar data
   * @returns Balance of Power value
   */
  onData(bar: BarWith<"open" | "high" | "low" | "close">): number {
    const range = bar.high - bar.low;
    return range !== 0 ? (bar.close - bar.open) / range : 0;
  }
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

  /**
   * Process new data point.
   * @param bar Bar data with close price
   * @returns Price change from period ago
   */
  onData(bar: BarWith<"close">): number {
    this.buffer.push(bar.close);
    if (!this.buffer.full()) {
      return 0;
    }
    return bar.close - this.buffer.front()!;
  }
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

  /**
   * Process new data point.
   * @param bar Bar data with close price
   * @returns Percentage change from period ago
   */
  onData(bar: BarWith<"close">): number {
    this.buffer.push(bar.close);
    if (!this.buffer.full()) {
      return 0;
    }
    const old = this.buffer.front()!;
    return old !== 0 ? ((bar.close - old) / old) * 100 : 0;
  }
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

  /**
   * Process new data point.
   * @param bar Bar data with close price
   * @returns Price ratio from period ago
   */
  onData(bar: BarWith<"close">): number {
    this.buffer.push(bar.close);
    if (!this.buffer.full()) {
      return 1;
    }
    const old = this.buffer.front()!;
    return old !== 0 ? bar.close / old : 1;
  }
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
  private avgGain?: number;
  private avgLoss?: number;
  private prevClose?: number;

  constructor(opts: PeriodWith<"period">) {
    this.alpha = wilders_factor(opts.period);
  }

  /**
   * Process new data point.
   * @param bar Bar data with close price
   * @returns RSI value (0-100)
   */
  onData(bar: BarWith<"close">): number {
    if (this.prevClose === undefined) {
      this.prevClose = bar.close;
      return 50;
    }

    const change = bar.close - this.prevClose;
    this.prevClose = bar.close;

    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    if (this.avgGain === undefined) {
      this.avgGain = gain;
      this.avgLoss = loss;
    } else {
      this.avgGain = smooth(this.avgGain, gain, this.alpha);
      this.avgLoss = smooth(this.avgLoss!, loss, this.alpha);
    }

    if (this.avgLoss === 0) {
      return 100;
    }

    const rs = this.avgGain / this.avgLoss;
    return 100 - 100 / (1 + rs);
  }
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
  private prevClose?: number;

  constructor(opts: PeriodWith<"period">) {
    this.buffer = new CircularBuffer(opts.period);
  }

  /**
   * Process new data point.
   * @param bar Bar data with close price
   * @returns CMO value (-100 to 100)
   */
  onData(bar: BarWith<"close">): number {
    if (this.prevClose === undefined) {
      this.prevClose = bar.close;
      return 0;
    }

    const change = bar.close - this.prevClose;
    this.prevClose = bar.close;
    this.buffer.push(change);

    if (!this.buffer.full()) {
      return 0;
    }

    let upSum = 0;
    let downSum = 0;
    for (const val of this.buffer) {
      if (val > 0) upSum += val;
      else downSum -= val;
    }

    const total = upSum + downSum;
    return total !== 0 ? ((upSum - downSum) / total) * 100 : 0;
  }
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

  /**
   * Process new bar data.
   * @param bar Bar data with high, low, close
   * @returns Current WAD value
   */
  onData(bar: BarWith<"high" | "low" | "close">): number {
    if (this.prevClose === undefined) {
      this.prevClose = bar.close;
      return this.wad;
    }

    if (bar.close > this.prevClose) {
      this.wad += bar.close - Math.min(this.prevClose, bar.low);
    } else if (bar.close < this.prevClose) {
      this.wad += bar.close - Math.max(this.prevClose, bar.high);
    }

    this.prevClose = bar.close;
    return this.wad;
  }
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
  private numeratorSma: SMA;
  private denominatorSma: SMA;
  private signalSma: SMA;

  constructor(opts: PeriodWith<"period">) {
    this.numeratorSma = new SMA(opts);
    this.denominatorSma = new SMA(opts);
    this.signalSma = new SMA({ period: 4 });
  }

  /**
   * Process new bar data.
   * @param bar Bar with open, high, low, close
   * @returns Object with rvi and signal values
   */
  onData(bar: BarWith<"open" | "high" | "low" | "close">): {
    rvi: number;
    signal: number;
  } {
    const numerator = bar.close - bar.open;
    const denominator = bar.high - bar.low;

    const avgNum = this.numeratorSma.onData(numerator);
    const avgDenom = this.denominatorSma.onData(denominator);

    const rvi = avgDenom !== 0 ? avgNum / avgDenom : 0;
    const signal = this.signalSma.onData(rvi);

    return { rvi, signal };
  }
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
  private emaLong1: EMA;
  private emaShort1: EMA;
  private emaLong2: EMA;
  private emaShort2: EMA;
  private emaSignal: EMA;
  private prevClose?: number;

  constructor(opts?: {
    long_period?: number;
    short_period?: number;
    signal_period?: number;
  }) {
    const longPeriod = opts?.long_period ?? 25;
    const shortPeriod = opts?.short_period ?? 13;
    const signalPeriod = opts?.signal_period ?? 13;

    this.emaLong1 = new EMA({ period: longPeriod });
    this.emaShort1 = new EMA({ period: shortPeriod });
    this.emaLong2 = new EMA({ period: longPeriod });
    this.emaShort2 = new EMA({ period: shortPeriod });
    this.emaSignal = new EMA({ period: signalPeriod });
  }

  /**
   * Process new data point.
   * @param bar Bar with close price
   * @returns Object with tsi and signal values
   */
  onData(bar: BarWith<"close">): { tsi: number; signal: number } {
    if (this.prevClose === undefined) {
      this.prevClose = bar.close;
      this.emaLong1.onData(0);
      this.emaShort1.onData(0);
      this.emaLong2.onData(0);
      this.emaShort2.onData(0);
      return { tsi: 0, signal: 0 };
    }

    const momentum = bar.close - this.prevClose;
    this.prevClose = bar.close;

    const smoothed1 = this.emaLong1.onData(momentum);
    const doubleSmoothNum = this.emaShort1.onData(smoothed1);

    const absMomentum = Math.abs(momentum);
    const smoothed2 = this.emaLong2.onData(absMomentum);
    const doubleSmoothDenom = this.emaShort2.onData(smoothed2);

    const tsi =
      doubleSmoothDenom !== 0 ? (doubleSmoothNum / doubleSmoothDenom) * 100 : 0;
    const signal = this.emaSignal.onData(tsi);

    return { tsi, signal };
  }
}

/**
 * Creates TSI closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns TSI
 */
export function useTSI(opts?: {
  long_period?: number;
  short_period?: number;
  signal_period?: number;
}): (bar: BarWith<"close">) => { tsi: number; signal: number } {
  const instance = new TSI(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Elder's Bull/Bear Power - measures buying and selling pressure.
 * Compares highs and lows to EMA.
 */
export class BBPOWER {
  private ema: EMA;

  constructor(opts: PeriodWith<"period">) {
    this.ema = new EMA(opts);
  }

  /**
   * Process new bar data.
   * @param bar Bar with high, low, close
   * @returns Object with bull_power and bear_power
   */
  onData(bar: BarWith<"high" | "low" | "close">): {
    bull_power: number;
    bear_power: number;
  } {
    const emaValue = this.ema.onData(bar.close);
    return {
      bull_power: bar.high - emaValue,
      bear_power: bar.low - emaValue,
    };
  }
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
