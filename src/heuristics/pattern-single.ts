import type { BarWith } from "../types/BarData.js";
import type { PeriodWith } from "../types/PeriodOptions.js";
import { AverageBodyLength } from "./utils.js";
import type { OperatorDoc } from "../types/OpDoc.js";

/** @internal */
export function isDoji(
  bar: BarWith<"open" | "close" | "high" | "low">,
  thres: number = 0.02
): boolean {
  const { open, close, high, low } = bar;
  return Math.abs(close - open) < (high - low) * thres;
}

/**
 * Doji - open and close at nearly the same price
 */
export class Doji {
  static readonly doc: OperatorDoc = {
    type: "Doji",
    input: "open, close, high, low",
    output: "boolean",
  };

  /**
   * Check if the OHLC values form a Doji pattern
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number, high: number, low: number): boolean {
    return isDoji({ open, close, high, low });
  }

  /**
   * Check if a bar forms a Doji pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useDoji() {
  return new Doji();
}

/**
 * Long-Legged Doji - doji with very long shadows
 */
export class LongLeggedDoji {
  static readonly doc: OperatorDoc = {
    type: "LongLeggedDoji",
    init: "{period?: number}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private avgBodyLength: AverageBodyLength;

  /**
   * @param opts - Configuration options
   * @param opts.period - Period for average body length calculation (default: 10)
   */
  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

  /**
   * Check if the OHLC values form a Long-Legged Doji pattern
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number, high: number, low: number): boolean {
    if (!isDoji({ open, close, high, low })) return false;

    const avgBody = this.avgBodyLength.update(open, close);
    return high - low > avgBody * 2;
  }

  /**
   * Check if a bar forms a Long-Legged Doji pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useLongLeggedDoji(opts?: PeriodWith<"period">) {
  return new LongLeggedDoji(opts);
}

/**
 * Dragonfly Doji - doji with long lower shadow and no upper shadow
 */
export class DragonflyDoji {
  static readonly doc: OperatorDoc = {
    type: "DragonflyDoji",
    input: "open, close, high, low",
    output: "boolean",
  };

  /**
   * Check if the OHLC values form a Dragonfly Doji pattern
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number, high: number, low: number): boolean {
    if (!isDoji({ open, close, high, low })) return false;

    const range = high - low;
    return open - low > range * 0.6 && high - open < range * 0.05;
  }

  /**
   * Check if a bar forms a Dragonfly Doji pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useDragonflyDoji() {
  return new DragonflyDoji();
}

/**
 * Gravestone Doji - doji with long upper shadow and no lower shadow
 */
export class GravestoneDoji {
  static readonly doc: OperatorDoc = {
    type: "GravestoneDoji",
    input: "open, close, high, low",
    output: "boolean",
  };

  /**
   * Check if the OHLC values form a Gravestone Doji pattern
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number, high: number, low: number): boolean {
    if (!isDoji({ open, close, high, low })) return false;

    const range = high - low;
    return high - open > range * 0.6 && open - low < range * 0.05;
  }

  /**
   * Check if a bar forms a Gravestone Doji pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useGravestoneDoji() {
  return new GravestoneDoji();
}

/**
 * Spinning Top - small body with long upper and lower shadows
 */
export class SpinningTop {
  static readonly doc: OperatorDoc = {
    type: "SpinningTop",
    init: "{period?: number}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private avgBodyLength: AverageBodyLength;

  /**
   * @param opts - Configuration options
   * @param opts.period - Period for average body length calculation (default: 10)
   */
  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

  /**
   * Check if the OHLC values form a Spinning Top pattern
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const range = high - low;
    const avgBody = this.avgBodyLength.update(open, close);

    return range > avgBody * 1.5 && Math.abs(close - open) < range * 0.3;
  }

  /**
   * Check if a bar forms a Spinning Top pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useSpinningTop(opts?: PeriodWith<"period">) {
  return new SpinningTop(opts);
}

/**
 * Marubozu White - long white candle with minimal shadows
 */
export class MarubozuWhite {
  static readonly doc: OperatorDoc = {
    type: "MarubozuWhite",
    init: "{period?: number}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private avgBodyLength: AverageBodyLength;

  /**
   * @param opts - Configuration options
   * @param opts.period - Period for average body length calculation (default: 10)
   */
  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

  /**
   * Check if the OHLC values form a Marubozu White pattern
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number, high: number, low: number): boolean {
    if (close <= open) return false;

    const range = high - low;
    const avgBody = this.avgBodyLength.update(open, close);

    return (
      high - close < range * 0.05 && // Changed from 0.02 to 0.05 (5% instead of 2%)
      low - open < range * 0.05 && // Changed from 0.02 to 0.05 (5% instead of 2%)
      close - open > avgBody
    );
  }

  /**
   * Check if a bar forms a Marubozu White pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useMarubozuWhite(opts?: PeriodWith<"period">) {
  return new MarubozuWhite(opts);
}

/**
 * Marubozu Black - long black candle with minimal shadows
 */
export class MarubozuBlack {
  static readonly doc: OperatorDoc = {
    type: "MarubozuBlack",
    init: "{period?: number}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private avgBodyLength: AverageBodyLength;

  /**
   * @param opts - Configuration options
   * @param opts.period - Period for average body length calculation (default: 10)
   */
  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

  /**
   * Check if the OHLC values form a Marubozu Black pattern
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number, high: number, low: number): boolean {
    if (close >= open) return false;

    const range = high - low;
    const avgBody = this.avgBodyLength.update(open, close);

    return (
      high - open < range * 0.05 && // Changed from 0.02 to 0.05 (5% instead of 2%)
      low - close < range * 0.05 && // Changed from 0.02 to 0.05 (5% instead of 2%)
      open - close > avgBody
    );
  }

  /**
   * Check if a bar forms a Marubozu Black pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useMarubozuBlack(opts?: PeriodWith<"period">) {
  return new MarubozuBlack(opts);
}

/**
 * Hammer - small body at top with long lower shadow
 * Also represents Bullish Pin Bar and Hanging Man patterns (identical implementations)
 */
export class Hammer {
  static readonly doc: OperatorDoc = {
    type: "Hammer",
    input: "open, close, high, low",
    output: "boolean",
  };

  /**
   * Check if the OHLC values form a Hammer pattern
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const range = high - low;
    const bodyTop = Math.max(open, close);
    const bodyBottom = Math.min(open, close);

    return (
      Math.abs(close - open) < range * 0.3 &&
      bodyBottom - low > range * 0.6 &&
      high - bodyTop < range * 0.1
    );
  }

  /**
   * Check if a bar forms a Hammer pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useHammer() {
  return new Hammer();
}

/**
 * Inverted Hammer - small body at bottom with long upper shadow
 * Also represents Bearish Pin Bar and Shooting Star patterns (identical implementations)
 */
export class InvertedHammer {
  static readonly doc: OperatorDoc = {
    type: "InvertedHammer",
    input: "open, close, high, low",
    output: "boolean",
  };

  /**
   * Check if the OHLC values form an Inverted Hammer pattern
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const range = high - low;
    const bodyTop = Math.max(open, close);
    const bodyBottom = Math.min(open, close);

    return (
      Math.abs(close - open) < range * 0.3 &&
      high - bodyTop > range * 0.6 &&
      bodyBottom - low < range * 0.1
    );
  }

  /**
   * Check if a bar forms an Inverted Hammer pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useInvertedHammer() {
  return new InvertedHammer();
}

/**
 * High Wave - very long shadows in both directions with small body
 */
export class HighWave {
  static readonly doc: OperatorDoc = {
    type: "HighWave",
    init: "{period?: number}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private avgBodyLength: AverageBodyLength;

  /**
   * @param opts - Configuration options
   * @param opts.period - Period for average body length calculation (default: 10)
   */
  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

  /**
   * Check if the OHLC values form a High Wave pattern
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const range = high - low;
    const bodyTop = Math.max(open, close);
    const bodyBottom = Math.min(open, close);
    const avgBody = this.avgBodyLength.update(open, close);

    return (
      range > avgBody * 2 &&
      Math.abs(close - open) < range * 0.2 &&
      high - bodyTop > range * 0.3 &&
      bodyBottom - low > range * 0.3
    );
  }

  /**
   * Check if a bar forms a High Wave pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useHighWave(opts?: PeriodWith<"period">) {
  return new HighWave(opts);
}
