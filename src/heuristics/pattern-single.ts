import type { BarWith } from "../types/BarData.js";
import type { PeriodWith } from "../types/PeriodOptions.js";
import { AverageBodyLength } from "./utils.js";

/** @internal */
export function isDoji(
  bar: BarWith<"open" | "close" | "high" | "low">
): boolean {
  const { open, close, high, low } = bar;
  return Math.abs(close - open) < (high - low) * 0.01;
}

/**
 * Doji - open and close at nearly the same price
 */
export class Doji {
  update(open: number, close: number, high: number, low: number): boolean {
    return isDoji({ open, close, high, low });
  }

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Long-Legged Doji - doji with very long shadows
 */
export class LongLeggedDoji {
  private avgBodyLength: AverageBodyLength;

  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

  update(open: number, close: number, high: number, low: number): boolean {
    if (!isDoji({ open, close, high, low })) return false;

    const avgBody = this.avgBodyLength.update(open, close);
    return high - low > avgBody * 2;
  }

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Dragonfly Doji - doji with long lower shadow and no upper shadow
 */
export class DragonflyDoji {
  update(open: number, close: number, high: number, low: number): boolean {
    if (!isDoji({ open, close, high, low })) return false;

    const range = high - low;
    return open - low > range * 0.6 && high - open < range * 0.05;
  }

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Gravestone Doji - doji with long upper shadow and no lower shadow
 */
export class GravestoneDoji {
  update(open: number, close: number, high: number, low: number): boolean {
    if (!isDoji({ open, close, high, low })) return false;

    const range = high - low;
    return high - open > range * 0.6 && open - low < range * 0.05;
  }

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Spinning Top - small body with long upper and lower shadows
 */
export class SpinningTop {
  private avgBodyLength: AverageBodyLength;

  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

  update(open: number, close: number, high: number, low: number): boolean {
    const range = high - low;
    const avgBody = this.avgBodyLength.update(open, close);

    return range > avgBody * 1.5 && Math.abs(close - open) < range * 0.3;
  }

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Marubozu White - long white candle with minimal shadows
 */
export class MarubozuWhite {
  private avgBodyLength: AverageBodyLength;

  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

  update(open: number, close: number, high: number, low: number): boolean {
    if (close <= open) return false;

    const range = high - low;
    const avgBody = this.avgBodyLength.update(open, close);

    return (
      high - close < range * 0.02 &&
      low - open < range * 0.02 &&
      close - open > avgBody
    );
  }

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Marubozu Black - long black candle with minimal shadows
 */
export class MarubozuBlack {
  private avgBodyLength: AverageBodyLength;

  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

  update(open: number, close: number, high: number, low: number): boolean {
    if (close >= open) return false;

    const range = high - low;
    const avgBody = this.avgBodyLength.update(open, close);

    return (
      high - open < range * 0.02 &&
      low - close < range * 0.02 &&
      open - close > avgBody
    );
  }

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Hammer - small body at top with long lower shadow
 */
export class Hammer {
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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Inverted Hammer - small body at bottom with long upper shadow
 */
export class InvertedHammer {
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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Hanging Man - small body at top with long lower shadow
 */
export class HangingMan {
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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Shooting Star - small body at bottom with long upper shadow
 */
export class ShootingStar {
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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * High Wave - very long shadows in both directions with small body
 */
export class HighWave {
  private avgBodyLength: AverageBodyLength;

  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Bullish Pin Bar - hammer pattern (long lower shadow, small body at top)
 */
export class BullishPinBar {
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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Bearish Pin Bar - shooting star pattern (long upper shadow, small body at bottom)
 */
export class BearishPinBar {
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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}
