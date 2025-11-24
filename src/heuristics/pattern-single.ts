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
    init: "{dojiThres: 0.02}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private thres: number;

  constructor(
    opts: { dojiThres?: number } = {
      dojiThres: 0.02,
    }
  ) {
    this.thres = opts.dojiThres ?? 0.02;
  }
  /**
   * Check if the OHLC values form a Doji pattern
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number, high: number, low: number): boolean {
    return isDoji({ open, close, high, low }, this.thres);
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

export function useDoji(
  opts?: { dojiThres?: number }
): (bar: BarWith<"open" | "close" | "high" | "low">) => boolean {
  const instance = new Doji(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Long-Legged Doji - doji with very long shadows
 */
export class LongLeggedDoji {
  static readonly doc: OperatorDoc = {
    type: "LongLeggedDoji",
    init: "{period: 10}",
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

export function useLongLeggedDoji(
  opts?: PeriodWith<"period">
): (bar: BarWith<"open" | "close" | "high" | "low">) => boolean {
  const instance = new LongLeggedDoji(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Dragonfly Doji - doji with long lower shadow and no upper shadow
 */
export class DragonflyDoji {
  static readonly doc: OperatorDoc = {
    type: "DragonflyDoji",
    init: "{lowerShadowThres: 0.6, upperShadowThres: 0.05}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private lowerShadowThres: number;
  private upperShadowThres: number;

  constructor(
    opts: { lowerShadowThres?: number; upperShadowThres?: number } = {
      lowerShadowThres: 0.6,
      upperShadowThres: 0.05,
    }
  ) {
    this.lowerShadowThres = opts.lowerShadowThres ?? 0.6;
    this.upperShadowThres = opts.upperShadowThres ?? 0.05;
  }

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
    return (
      open - low > range * this.lowerShadowThres &&
      high - open < range * this.upperShadowThres
    );
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

export function useDragonflyDoji(
  opts?: { lowerShadowThres?: number; upperShadowThres?: number }
): (bar: BarWith<"open" | "close" | "high" | "low">) => boolean {
  const instance = new DragonflyDoji(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Gravestone Doji - doji with long upper shadow and no lower shadow
 */
export class GravestoneDoji {
  static readonly doc: OperatorDoc = {
    type: "GravestoneDoji",
    init: "{upperShadowThres: 0.6, lowerShadowThres: 0.05}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private upperShadowThres: number;
  private lowerShadowThres: number;

  constructor(
    opts: { upperShadowThres?: number; lowerShadowThres?: number } = {
      upperShadowThres: 0.6,
      lowerShadowThres: 0.05,
    }
  ) {
    this.upperShadowThres = opts.upperShadowThres ?? 0.6;
    this.lowerShadowThres = opts.lowerShadowThres ?? 0.05;
  }

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
    return (
      high - open > range * this.upperShadowThres &&
      open - low < range * this.lowerShadowThres
    );
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

export function useGravestoneDoji(
  opts?: { upperShadowThres?: number; lowerShadowThres?: number }
): (bar: BarWith<"open" | "close" | "high" | "low">) => boolean {
  const instance = new GravestoneDoji(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Spinning Top - small body with long upper and lower shadows
 */
export class SpinningTop {
  static readonly doc: OperatorDoc = {
    type: "SpinningTop",
    init: "{period: 10, rangeMultiplier: 1.5, bodyThres: 0.3}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private avgBodyLength: AverageBodyLength;
  private rangeMultiplier: number;
  private bodyThres: number;

  /**
   * @param opts - Configuration options
   * @param opts.period - Period for average body length calculation (default: 10)
   * @param opts.rangeMultiplier - Multiplier for average body length to determine minimum range (default: 1.5)
   * @param opts.bodyThres - Threshold for body size relative to range (default: 0.3)
   */
  constructor(
    opts: PeriodWith<"period"> & {
      rangeMultiplier?: number;
      bodyThres?: number;
    } = {
      period: 10,
      rangeMultiplier: 1.5,
      bodyThres: 0.3,
    }
  ) {
    this.avgBodyLength = new AverageBodyLength(opts);
    this.rangeMultiplier = opts.rangeMultiplier ?? 1.5;
    this.bodyThres = opts.bodyThres ?? 0.3;
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

    return (
      range > avgBody * this.rangeMultiplier &&
      Math.abs(close - open) < range * this.bodyThres
    );
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

export function useSpinningTop(
  opts?: PeriodWith<"period"> & { rangeMultiplier?: number; bodyThres?: number }
): (bar: BarWith<"open" | "close" | "high" | "low">) => boolean {
  const instance = new SpinningTop(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Marubozu White - long white candle with minimal shadows
 */
export class MarubozuWhite {
  static readonly doc: OperatorDoc = {
    type: "MarubozuWhite",
    init: "{period: 10, shadowThres: 0.05}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private avgBodyLength: AverageBodyLength;
  private shadowThres: number;

  /**
   * @param opts - Configuration options
   * @param opts.period - Period for average body length calculation (default: 10)
   * @param opts.shadowThres - Threshold for shadow size relative to range (default: 0.05)
   */
  constructor(
    opts: PeriodWith<"period"> & { shadowThres?: number } = {
      period: 10,
      shadowThres: 0.05,
    }
  ) {
    this.avgBodyLength = new AverageBodyLength(opts);
    this.shadowThres = opts.shadowThres ?? 0.05;
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
      high - close < range * this.shadowThres &&
      low - open < range * this.shadowThres &&
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

export function useMarubozuWhite(
  opts?: PeriodWith<"period"> & { shadowThres?: number }
): (bar: BarWith<"open" | "close" | "high" | "low">) => boolean {
  const instance = new MarubozuWhite(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Marubozu Black - long black candle with minimal shadows
 */
export class MarubozuBlack {
  static readonly doc: OperatorDoc = {
    type: "MarubozuBlack",
    init: "{period: 10, shadowThres: 0.05}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private avgBodyLength: AverageBodyLength;
  private shadowThres: number;

  /**
   * @param opts - Configuration options
   * @param opts.period - Period for average body length calculation (default: 10)
   * @param opts.shadowThres - Threshold for shadow size relative to range (default: 0.05)
   */
  constructor(
    opts: PeriodWith<"period"> & { shadowThres?: number } = {
      period: 10,
      shadowThres: 0.05,
    }
  ) {
    this.avgBodyLength = new AverageBodyLength(opts);
    this.shadowThres = opts.shadowThres ?? 0.05;
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
      high - open < range * this.shadowThres &&
      low - close < range * this.shadowThres &&
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

export function useMarubozuBlack(
  opts?: PeriodWith<"period"> & { shadowThres?: number }
): (bar: BarWith<"open" | "close" | "high" | "low">) => boolean {
  const instance = new MarubozuBlack(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Hammer - small body at top with long lower shadow
 * Also represents Bullish Pin Bar and Hanging Man patterns (identical implementations)
 */
export class Hammer {
  static readonly doc: OperatorDoc = {
    type: "Hammer",
    init: "{bodyThres: 0.3, lowerShadowThres: 0.6, upperShadowThres: 0.1}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private bodyThres: number;
  private lowerShadowThres: number;
  private upperShadowThres: number;

  constructor(
    opts: {
      bodyThres?: number;
      lowerShadowThres?: number;
      upperShadowThres?: number;
    } = {
      bodyThres: 0.3,
      lowerShadowThres: 0.6,
      upperShadowThres: 0.1,
    }
  ) {
    this.bodyThres = opts.bodyThres ?? 0.3;
    this.lowerShadowThres = opts.lowerShadowThres ?? 0.6;
    this.upperShadowThres = opts.upperShadowThres ?? 0.1;
  }

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
      Math.abs(close - open) < range * this.bodyThres &&
      bodyBottom - low > range * this.lowerShadowThres &&
      high - bodyTop < range * this.upperShadowThres
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

export function useHammer(
  opts?: {
    bodyThres?: number;
    lowerShadowThres?: number;
    upperShadowThres?: number;
  }
): (bar: BarWith<"open" | "close" | "high" | "low">) => boolean {
  const instance = new Hammer(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Inverted Hammer - small body at bottom with long upper shadow
 * Also represents Bearish Pin Bar and Shooting Star patterns (identical implementations)
 */
export class InvertedHammer {
  static readonly doc: OperatorDoc = {
    type: "InvertedHammer",
    init: "{bodyThres: 0.3, upperShadowThres: 0.6, lowerShadowThres: 0.1}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private bodyThres: number;
  private upperShadowThres: number;
  private lowerShadowThres: number;

  constructor(
    opts: {
      bodyThres?: number;
      upperShadowThres?: number;
      lowerShadowThres?: number;
    } = {
      bodyThres: 0.3,
      upperShadowThres: 0.6,
      lowerShadowThres: 0.1,
    }
  ) {
    this.bodyThres = opts.bodyThres ?? 0.3;
    this.upperShadowThres = opts.upperShadowThres ?? 0.6;
    this.lowerShadowThres = opts.lowerShadowThres ?? 0.1;
  }

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
      Math.abs(close - open) < range * this.bodyThres &&
      high - bodyTop > range * this.upperShadowThres &&
      bodyBottom - low < range * this.lowerShadowThres
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

export function useInvertedHammer(
  opts?: {
    bodyThres?: number;
    upperShadowThres?: number;
    lowerShadowThres?: number;
  }
): (bar: BarWith<"open" | "close" | "high" | "low">) => boolean {
  const instance = new InvertedHammer(opts);
  return (bar) => instance.onData(bar);
}

/**
 * High Wave - very long shadows in both directions with small body
 */
export class HighWave {
  static readonly doc: OperatorDoc = {
    type: "HighWave",
    init: "{period: 10, rangeMultiplier: 2, bodyThres: 0.2, shadowThres: 0.3}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private avgBodyLength: AverageBodyLength;
  private rangeMultiplier: number;
  private bodyThres: number;
  private shadowThres: number;

  /**
   * @param opts - Configuration options
   * @param opts.period - Period for average body length calculation (default: 10)
   * @param opts.rangeMultiplier - Multiplier for average body length to determine minimum range (default: 2)
   * @param opts.bodyThres - Threshold for body size relative to range (default: 0.2)
   * @param opts.shadowThres - Threshold for shadow size relative to range (default: 0.3)
   */
  constructor(
    opts: PeriodWith<"period"> & {
      rangeMultiplier?: number;
      bodyThres?: number;
      shadowThres?: number;
    } = {
      period: 10,
      rangeMultiplier: 2,
      bodyThres: 0.2,
      shadowThres: 0.3,
    }
  ) {
    this.avgBodyLength = new AverageBodyLength(opts);
    this.rangeMultiplier = opts.rangeMultiplier ?? 2;
    this.bodyThres = opts.bodyThres ?? 0.2;
    this.shadowThres = opts.shadowThres ?? 0.3;
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
      range > avgBody * this.rangeMultiplier &&
      Math.abs(close - open) < range * this.bodyThres &&
      high - bodyTop > range * this.shadowThres &&
      bodyBottom - low > range * this.shadowThres
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

export function useHighWave(
  opts?: PeriodWith<"period"> & {
    rangeMultiplier?: number;
    bodyThres?: number;
    shadowThres?: number;
  }
): (bar: BarWith<"open" | "close" | "high" | "low">) => boolean {
  const instance = new HighWave(opts);
  return (bar) => instance.onData(bar);
}
