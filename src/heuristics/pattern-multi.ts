import type { BarWith } from "../types/BarData.js";
import type { PeriodWith } from "../types/PeriodOptions.js";
import {
  AverageBodyLength,
  bodyLength,
  isBearish,
  isBullish,
} from "./utils.js";
import { isDoji } from "./pattern-single.js";
import type { OperatorDoc } from "../types/OpDoc.js";

/**
 * Evening Star - bearish reversal pattern
 * Detects a three-candle pattern where a large bullish candle is followed by a small body candle
 * that gaps up, and then a large bearish candle that closes below the midpoint of the first candle.
 */
export class EveningStar {
  static readonly doc: OperatorDoc = {
    type: "EveningStar",
    init: "{period: 10}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private avgBodyLength: AverageBodyLength;
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  /**
   * Creates an instance of EveningStar pattern detector
   * @param opts - Configuration options for the pattern detector
   * @param opts.period - Period for calculating average body length (default: 10)
   */
  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

  /**
   * Updates the pattern detector with new OHLCV data
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if Evening Star pattern is detected, false otherwise
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const bar = { open, close, high, low };
    this.bars.push(bar);

    if (this.bars.length > 3) {
      this.bars.shift();
    }

    if (this.bars.length < 3) {
      return false;
    }

    const bar1 = this.bars[0]!;
    const bar2 = this.bars[1]!;
    const bar3 = this.bars[2]!;
    const avgBody = this.avgBodyLength.update(open, close);

    // First bar: large bullish
    if (!isBullish(bar1) || bar1.close - bar1.open <= avgBody) {
      return false;
    }

    // Second bar: small body, gaps up from first bar's range
    if (bar2.low <= bar1.high || bodyLength(bar2) >= avgBody * 0.3) {
      return false;
    }

    // Third bar: large bearish, closes below midpoint of first bar
    if (!isBearish(bar3) || bar3.open - bar3.close <= avgBody) {
      return false;
    }

    return bar3.close < (bar1.open + bar1.close) / 2;
  }

  /**
   * Updates the pattern detector with a bar object
   * @param bar - Bar object containing OHLC data
   * @returns True if Evening Star pattern is detected, false otherwise
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useEveningStar(
  opts?: PeriodWith<"period">
): (bar: BarWith<"open" | "close" | "high" | "low">) => boolean {
  const instance = new EveningStar(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Morning Doji Star - bullish reversal pattern with doji
 * Detects a three-candle pattern where a large bearish candle is followed by a doji
 * that gaps down, and then a large bullish candle that closes above the midpoint of the first candle.
 */
export class MorningDojiStar {
  static readonly doc: OperatorDoc = {
    type: "MorningDojiStar",
    init: "{period: 10}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private avgBodyLength: AverageBodyLength;
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  /**
   * Creates an instance of MorningDojiStar pattern detector
   * @param opts - Configuration options for the pattern detector
   * @param opts.period - Period for calculating average body length (default: 10)
   */
  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

  /**
   * Updates the pattern detector with new OHLCV data
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if Morning Doji Star pattern is detected, false otherwise
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const bar = { open, close, high, low };
    this.bars.push(bar);

    if (this.bars.length > 3) {
      this.bars.shift();
    }

    if (this.bars.length < 3) {
      return false;
    }

    const bar1 = this.bars[0]!;
    const bar2 = this.bars[1]!;
    const bar3 = this.bars[2]!;
    const avgBody = this.avgBodyLength.update(open, close);

    // First bar: large bearish
    if (!isBearish(bar1) || bar1.open - bar1.close <= avgBody) {
      return false;
    }

    // Second bar: doji, gaps down from first bar's range
    if (!isDoji(bar2) || bar2.high >= bar1.low) {
      return false;
    }

    // Third bar: large bullish, closes above midpoint of first bar
    if (!isBullish(bar3) || bar3.close - bar3.open <= avgBody) {
      return false;
    }

    return bar3.close > (bar1.open + bar1.close) / 2;
  }

  /**
   * Updates the pattern detector with a bar object
   * @param bar - Bar object containing OHLC data
   * @returns True if Morning Doji Star pattern is detected, false otherwise
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useMorningDojiStar(
  opts?: PeriodWith<"period">
): (bar: BarWith<"open" | "close" | "high" | "low">) => boolean {
  const instance = new MorningDojiStar(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Evening Doji Star - bearish reversal pattern with doji
 * Detects a three-candle pattern where a large bullish candle is followed by a doji
 * that gaps up, and then a large bearish candle that closes below the midpoint of the first candle.
 */
export class EveningDojiStar {
  static readonly doc: OperatorDoc = {
    type: "EveningDojiStar",
    init: "{period: 10}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private avgBodyLength: AverageBodyLength;
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  /**
   * Creates an instance of EveningDojiStar pattern detector
   * @param opts - Configuration options for the pattern detector
   * @param opts.period - Period for calculating average body length (default: 10)
   */
  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

  /**
   * Updates the pattern detector with new OHLCV data
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if Evening Doji Star pattern is detected, false otherwise
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const bar = { open, close, high, low };
    this.bars.push(bar);

    if (this.bars.length > 3) {
      this.bars.shift();
    }

    if (this.bars.length < 3) {
      return false;
    }

    const bar1 = this.bars[0]!;
    const bar2 = this.bars[1]!;
    const bar3 = this.bars[2]!;
    const avgBody = this.avgBodyLength.update(open, close);

    // First bar: large bullish
    if (!isBullish(bar1) || bar1.close - bar1.open <= avgBody) {
      return false;
    }

    // Second bar: doji, gaps up from first bar's range
    if (!isDoji(bar2) || bar2.low <= bar1.high) {
      return false;
    }

    // Third bar: large bearish, closes below midpoint of first bar
    if (!isBearish(bar3) || bar3.open - bar3.close <= avgBody) {
      return false;
    }

    return bar3.close < (bar1.open + bar1.close) / 2;
  }

  /**
   * Updates the pattern detector with a bar object
   * @param bar - Bar object containing OHLC data
   * @returns True if Evening Doji Star pattern is detected, false otherwise
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useEveningDojiStar(
  opts?: PeriodWith<"period">
): (bar: BarWith<"open" | "close" | "high" | "low">) => boolean {
  const instance = new EveningDojiStar(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Abandoned Baby Bullish - rare bullish reversal pattern
 * Detects a three-candle pattern where a bearish candle is followed by a doji that gaps down,
 * and then a bullish candle that gaps up from the doji.
 */
export class AbandonedBabyBullish {
  static readonly doc: OperatorDoc = {
    type: "AbandonedBabyBullish",
    input: "open, close, high, low",
    output: "boolean",
  };

  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  /**
   * Updates the pattern detector with new OHLCV data
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if Abandoned Baby Bullish pattern is detected, false otherwise
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const bar = { open, close, high, low };
    this.bars.push(bar);

    if (this.bars.length > 3) {
      this.bars.shift();
    }

    if (this.bars.length < 3) {
      return false;
    }

    const bar1 = this.bars[0]!;
    const bar2 = this.bars[1]!;
    const bar3 = this.bars[2]!;

    // First bar: bearish
    if (!isBearish(bar1)) {
      return false;
    }

    // Second bar: doji, gaps down from first bar's entire range
    if (!isDoji(bar2) || bar2.high >= bar1.low) {
      return false;
    }

    // Third bar: bullish, gaps up from doji's entire range
    if (!isBullish(bar3) || bar3.low <= bar2.high) {
      return false;
    }

    return true;
  }

  /**
   * Updates the pattern detector with a bar object
   * @param bar - Bar object containing OHLC data
   * @returns True if Abandoned Baby Bullish pattern is detected, false otherwise
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useAbandonedBabyBullish(): (
  bar: BarWith<"open" | "close" | "high" | "low">
) => boolean {
  const instance = new AbandonedBabyBullish();
  return (bar) => instance.onData(bar);
}

/**
 * Abandoned Baby Bearish - rare bearish reversal pattern
 * Detects a three-candle pattern where a bullish candle is followed by a doji that gaps up,
 * and then a bearish candle that gaps down from the doji.
 */
export class AbandonedBabyBearish {
  static readonly doc: OperatorDoc = {
    type: "AbandonedBabyBearish",
    input: "open, close, high, low",
    output: "boolean",
  };

  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  /**
   * Updates the pattern detector with new OHLCV data
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if Abandoned Baby Bearish pattern is detected, false otherwise
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const bar = { open, close, high, low };
    this.bars.push(bar);

    if (this.bars.length > 3) {
      this.bars.shift();
    }

    if (this.bars.length < 3) {
      return false;
    }

    const bar1 = this.bars[0]!;
    const bar2 = this.bars[1]!;
    const bar3 = this.bars[2]!;

    // First bar: bullish
    if (!isBullish(bar1)) {
      return false;
    }

    // Second bar: doji, gaps up from first bar's entire range
    if (!isDoji(bar2) || bar2.low <= bar1.high) {
      return false;
    }

    // Third bar: bearish, gaps down from doji's entire range
    if (!isBearish(bar3) || bar3.high >= bar2.low) {
      return false;
    }

    return true;
  }

  /**
   * Updates the pattern detector with a bar object
   * @param bar - Bar object containing OHLC data
   * @returns True if Abandoned Baby Bearish pattern is detected, false otherwise
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useAbandonedBabyBearish(): (
  bar: BarWith<"open" | "close" | "high" | "low">
) => boolean {
  const instance = new AbandonedBabyBearish();
  return (bar) => instance.onData(bar);
}

/**
 * Three White Soldiers - bullish continuation pattern
 * Detects three consecutive long bullish candles with specific opening and closing relationships.
 */
export class ThreeWhiteSoldiers {
  static readonly doc: OperatorDoc = {
    type: "ThreeWhiteSoldiers",
    init: "{period: 10}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private avgBodyLength: AverageBodyLength;
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  /**
   * Creates an instance of ThreeWhiteSoldiers pattern detector
   * @param opts - Configuration options for the pattern detector
   * @param opts.period - Period for calculating average body length (default: 10)
   */
  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

  /**
   * Updates the pattern detector with new OHLCV data
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if Three White Soldiers pattern is detected, false otherwise
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const bar = { open, close, high, low };
    this.bars.push(bar);

    if (this.bars.length > 3) {
      this.bars.shift();
    }

    if (this.bars.length < 3) {
      return false;
    }

    const bar1 = this.bars[0]!;
    const bar2 = this.bars[1]!;
    const bar3 = this.bars[2]!;
    const avgBody = this.avgBodyLength.update(open, close);

    // Three consecutive long bullish candles
    if (!isBullish(bar1) || bar1.close - bar1.open <= avgBody) {
      return false;
    }
    if (!isBullish(bar2) || bar2.close - bar2.open <= avgBody) {
      return false;
    }
    if (!isBullish(bar3) || bar3.close - bar3.open <= avgBody) {
      return false;
    }

    // Each candle opens within previous candle's body
    if (bar2.open <= bar1.open || bar2.open >= bar1.close) {
      return false;
    }
    if (bar3.open <= bar2.open || bar3.open >= bar2.close) {
      return false;
    }

    // Each candle opens near the close of the previous candle (small gap)
    if (bar2.open > bar1.close + (bar1.close - bar1.open) * 0.2) {
      return false;
    }
    if (bar3.open > bar2.close + (bar2.close - bar2.open) * 0.2) {
      return false;
    }

    // Each candle closes higher than previous
    if (bar2.close <= bar1.close || bar3.close <= bar2.close) {
      return false;
    }

    return true;
  }

  /**
   * Updates the pattern detector with a bar object
   * @param bar - Bar object containing OHLC data
   * @returns True if Three White Soldiers pattern is detected, false otherwise
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useThreeWhiteSoldiers(
  opts?: PeriodWith<"period">
): (bar: BarWith<"open" | "close" | "high" | "low">) => boolean {
  const instance = new ThreeWhiteSoldiers(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Three Black Crows - bearish continuation pattern
 * Detects three consecutive long bearish candles with specific opening and closing relationships.
 */
export class ThreeBlackCrows {
  static readonly doc: OperatorDoc = {
    type: "ThreeBlackCrows",
    init: "{period: 10}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private avgBodyLength: AverageBodyLength;
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  /**
   * Creates an instance of ThreeBlackCrows pattern detector
   * @param opts - Configuration options for the pattern detector
   * @param opts.period - Period for calculating average body length (default: 10)
   */
  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

  /**
   * Updates the pattern detector with new OHLCV data
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if Three Black Crows pattern is detected, false otherwise
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const bar = { open, close, high, low };
    this.bars.push(bar);

    if (this.bars.length > 3) {
      this.bars.shift();
    }

    if (this.bars.length < 3) {
      return false;
    }

    const bar1 = this.bars[0]!;
    const bar2 = this.bars[1]!;
    const bar3 = this.bars[2]!;
    const avgBody = this.avgBodyLength.update(open, close);

    // Three consecutive long bearish candles
    if (!isBearish(bar1) || bar1.open - bar1.close <= avgBody) {
      return false;
    }
    if (!isBearish(bar2) || bar2.open - bar2.close <= avgBody) {
      return false;
    }
    if (!isBearish(bar3) || bar3.open - bar3.close <= avgBody) {
      return false;
    }

    // Each candle opens within previous candle's body
    if (bar2.open <= bar1.close || bar2.open >= bar1.open) {
      return false;
    }
    if (bar3.open <= bar2.close || bar3.open >= bar2.open) {
      return false;
    }

    // Each candle opens near the close of the previous candle (small gap)
    if (bar2.open < bar1.close - (bar1.open - bar1.close) * 0.2) {
      return false;
    }
    if (bar3.open < bar2.close - (bar2.open - bar2.close) * 0.2) {
      return false;
    }

    // Each candle closes lower than previous
    if (bar2.close >= bar1.close || bar3.close >= bar2.close) {
      return false;
    }

    return true;
  }

  /**
   * Updates the pattern detector with a bar object
   * @param bar - Bar object containing OHLC data
   * @returns True if Three Black Crows pattern is detected, false otherwise
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useThreeBlackCrows(
  opts?: PeriodWith<"period">
): (bar: BarWith<"open" | "close" | "high" | "low">) => boolean {
  const instance = new ThreeBlackCrows(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Three Inside Up - bullish reversal pattern
 * Detects a three-candle pattern where the first two bars form a bullish harami,
 * and the third bar confirms with a higher close.
 */
export class ThreeInsideUp {
  static readonly doc: OperatorDoc = {
    type: "ThreeInsideUp",
    input: "open, close, high, low",
    output: "boolean",
  };

  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  /**
   * Updates the pattern detector with new OHLCV data
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if Three Inside Up pattern is detected, false otherwise
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const bar = { open, close, high, low };
    this.bars.push(bar);

    if (this.bars.length > 3) {
      this.bars.shift();
    }

    if (this.bars.length < 3) {
      return false;
    }

    const bar1 = this.bars[0]!;
    const bar2 = this.bars[1]!;
    const bar3 = this.bars[2]!;

    // First two bars form bullish harami
    if (!isBearish(bar1) || !isBullish(bar2)) {
      return false;
    }
    if (bar2.open <= bar1.close || bar2.close >= bar1.open) {
      return false;
    }

    // Third bar confirms with higher close
    if (bar3.close <= bar2.close || bar3.close <= bar1.open) {
      return false;
    }

    return true;
  }

  /**
   * Updates the pattern detector with a bar object
   * @param bar - Bar object containing OHLC data
   * @returns True if Three Inside Up pattern is detected, false otherwise
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useThreeInsideUp(): (
  bar: BarWith<"open" | "close" | "high" | "low">
) => boolean {
  const instance = new ThreeInsideUp();
  return (bar) => instance.onData(bar);
}

/**
 * Three Inside Down - bearish reversal pattern
 * Detects a three-candle pattern where the first two bars form a bearish harami,
 * and the third bar confirms with a lower close.
 */
export class ThreeInsideDown {
  static readonly doc: OperatorDoc = {
    type: "ThreeInsideDown",
    input: "open, close, high, low",
    output: "boolean",
  };

  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  /**
   * Updates the pattern detector with new OHLCV data
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if Three Inside Down pattern is detected, false otherwise
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const bar = { open, close, high, low };
    this.bars.push(bar);

    if (this.bars.length > 3) {
      this.bars.shift();
    }

    if (this.bars.length < 3) {
      return false;
    }

    const bar1 = this.bars[0]!;
    const bar2 = this.bars[1]!;
    const bar3 = this.bars[2]!;

    // First two bars form bearish harami
    if (!isBullish(bar1) || !isBearish(bar2)) {
      return false;
    }
    if (bar2.open >= bar1.close || bar2.close <= bar1.open) {
      return false;
    }

    // Third bar confirms with lower close
    if (bar3.close >= bar2.close || bar3.close >= bar1.open) {
      return false;
    }

    return true;
  }

  /**
   * Updates the pattern detector with a bar object
   * @param bar - Bar object containing OHLC data
   * @returns True if Three Inside Down pattern is detected, false otherwise
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useThreeInsideDown(): (
  bar: BarWith<"open" | "close" | "high" | "low">
) => boolean {
  const instance = new ThreeInsideDown();
  return (bar) => instance.onData(bar);
}

/**
 * Three Outside Up - bullish reversal pattern
 * Detects a three-candle pattern where the first two bars form a bullish engulfing,
 * and the third bar confirms with a higher close and higher high.
 */
export class ThreeOutsideUp {
  static readonly doc: OperatorDoc = {
    type: "ThreeOutsideUp",
    input: "open, close, high, low",
    output: "boolean",
  };

  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  /**
   * Updates the pattern detector with new OHLCV data
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if Three Outside Up pattern is detected, false otherwise
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const bar = { open, close, high, low };
    this.bars.push(bar);

    if (this.bars.length > 3) {
      this.bars.shift();
    }

    if (this.bars.length < 3) {
      return false;
    }

    const bar1 = this.bars[0]!;
    const bar2 = this.bars[1]!;
    const bar3 = this.bars[2]!;

    // First two bars form bullish engulfing
    if (!isBearish(bar1) || !isBullish(bar2)) {
      return false;
    }
    if (bar2.open >= bar1.close || bar2.close <= bar1.open) {
      return false;
    }

    // Third bar confirms with higher close and higher high
    if (
      bar3.close <= bar2.close ||
      bar3.high <= bar2.high ||
      bar3.close <= bar1.open
    ) {
      return false;
    }

    return true;
  }

  /**
   * Updates the pattern detector with a bar object
   * @param bar - Bar object containing OHLC data
   * @returns True if Three Outside Up pattern is detected, false otherwise
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useThreeOutsideUp(): (
  bar: BarWith<"open" | "close" | "high" | "low">
) => boolean {
  const instance = new ThreeOutsideUp();
  return (bar) => instance.onData(bar);
}

/**
 * Three Outside Down - bearish reversal pattern
 * Detects a three-candle pattern where the first two bars form a bearish engulfing,
 * and the third bar confirms with a lower close and lower low.
 */
export class ThreeOutsideDown {
  static readonly doc: OperatorDoc = {
    type: "ThreeOutsideDown",
    input: "open, close, high, low",
    output: "boolean",
  };

  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  /**
   * Updates the pattern detector with new OHLCV data
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if Three Outside Down pattern is detected, false otherwise
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const bar = { open, close, high, low };
    this.bars.push(bar);

    if (this.bars.length > 3) {
      this.bars.shift();
    }

    if (this.bars.length < 3) {
      return false;
    }

    const bar1 = this.bars[0]!;
    const bar2 = this.bars[1]!;
    const bar3 = this.bars[2]!;

    // First two bars form bearish engulfing
    if (!isBullish(bar1) || !isBearish(bar2)) {
      return false;
    }
    if (bar2.open <= bar1.close || bar2.close >= bar1.open) {
      return false;
    }

    // Third bar confirms with lower close and lower low
    if (
      bar3.close >= bar2.close ||
      bar3.low >= bar2.low ||
      bar3.close >= bar1.open
    ) {
      return false;
    }

    return true;
  }

  /**
   * Updates the pattern detector with a bar object
   * @param bar - Bar object containing OHLC data
   * @returns True if Three Outside Down pattern is detected, false otherwise
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useThreeOutsideDown(): (
  bar: BarWith<"open" | "close" | "high" | "low">
) => boolean {
  const instance = new ThreeOutsideDown();
  return (bar) => instance.onData(bar);
}

/**
 * Fakey Pattern Bullish - bullish false breakout pattern
 * Detects a three-candle pattern where a strong bearish move is followed by an inside bar,
 * and then a false breakout below followed by a reversal above the first bar's high.
 */
export class FakeyPatternBullish {
  static readonly doc: OperatorDoc = {
    type: "FakeyPatternBullish",
    init: "{period: 10}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private avgBodyLength: AverageBodyLength;
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  /**
   * Creates an instance of FakeyPatternBullish pattern detector
   * @param opts - Configuration options for the pattern detector
   * @param opts.period - Period for calculating average body length (default: 10)
   */
  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

  /**
   * Updates the pattern detector with new OHLCV data
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if Fakey Pattern Bullish is detected, false otherwise
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const bar = { open, close, high, low };
    this.bars.push(bar);

    if (this.bars.length > 3) {
      this.bars.shift();
    }

    if (this.bars.length < 3) {
      return false;
    }

    const bar1 = this.bars[0]!;
    const bar2 = this.bars[1]!;
    const bar3 = this.bars[2]!;
    const avgBody = this.avgBodyLength.update(open, close);

    // First bar: strong bearish move
    if (!isBearish(bar1) || bar1.open - bar1.close <= avgBody) {
      return false;
    }

    // Second bar: inside bar
    if (bar2.high > bar1.high || bar2.low < bar1.low) {
      return false;
    }

    // Third bar: false breakout below then reversal above first bar high
    if (bar3.low >= bar1.low || bar3.close <= bar1.high) {
      return false;
    }

    return true;
  }

  /**
   * Updates the pattern detector with a bar object
   * @param bar - Bar object containing OHLC data
   * @returns True if Fakey Pattern Bullish is detected, false otherwise
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useFakeyPatternBullish(
  opts?: PeriodWith<"period">
): (bar: BarWith<"open" | "close" | "high" | "low">) => boolean {
  const instance = new FakeyPatternBullish(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Fakey Pattern Bearish - bearish false breakout pattern
 * Detects a three-candle pattern where a strong bullish move is followed by an inside bar,
 * and then a false breakout above followed by a reversal below the first bar's low.
 */
export class FakeyPatternBearish {
  static readonly doc: OperatorDoc = {
    type: "FakeyPatternBearish",
    init: "{period: 10}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private avgBodyLength: AverageBodyLength;
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  /**
   * Creates an instance of FakeyPatternBearish pattern detector
   * @param opts - Configuration options for the pattern detector
   * @param opts.period - Period for calculating average body length (default: 10)
   */
  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

  /**
   * Updates the pattern detector with new OHLCV data
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if Fakey Pattern Bearish is detected, false otherwise
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const bar = { open, close, high, low };
    this.bars.push(bar);

    if (this.bars.length > 3) {
      this.bars.shift();
    }

    if (this.bars.length < 3) {
      return false;
    }

    const bar1 = this.bars[0]!;
    const bar2 = this.bars[1]!;
    const bar3 = this.bars[2]!;
    const avgBody = this.avgBodyLength.update(open, close);

    // First bar: strong bullish move
    if (!isBullish(bar1) || bar1.close - bar1.open <= avgBody) {
      return false;
    }

    // Second bar: inside bar
    if (bar2.high > bar1.high || bar2.low < bar1.low) {
      return false;
    }

    // Third bar: false breakout above then reversal below first bar low
    if (bar3.high <= bar1.high || bar3.close >= bar1.low) {
      return false;
    }

    return true;
  }

  /**
   * Updates the pattern detector with a bar object
   * @param bar - Bar object containing OHLC data
   * @returns True if Fakey Pattern Bearish is detected, false otherwise
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useFakeyPatternBearish(
  opts?: PeriodWith<"period">
): (bar: BarWith<"open" | "close" | "high" | "low">) => boolean {
  const instance = new FakeyPatternBearish(opts);
  return (bar) => instance.onData(bar);
}

// Five Bar Patterns

/**
 * Rising Three Methods - bullish continuation pattern
 * Detects a five-candle pattern where a long bullish candle is followed by three small bearish candles
 * within its range, and then another bullish candle that closes above the first candle's high.
 */
export class RisingThreeMethods {
  static readonly doc: OperatorDoc = {
    type: "RisingThreeMethods",
    init: "{period: 10}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private avgBodyLength: AverageBodyLength;
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  /**
   * Creates an instance of RisingThreeMethods pattern detector
   * @param opts - Configuration options for the pattern detector
   * @param opts.period - Period for calculating average body length (default: 10)
   */
  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

  /**
   * Updates the pattern detector with new OHLCV data
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if Rising Three Methods pattern is detected, false otherwise
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const bar = { open, close, high, low };
    this.bars.push(bar);

    if (this.bars.length > 5) {
      this.bars.shift();
    }

    if (this.bars.length < 5) {
      return false;
    }

    const bar1 = this.bars[0]!;
    const bar2 = this.bars[1]!;
    const bar3 = this.bars[2]!;
    const bar4 = this.bars[3]!;
    const bar5 = this.bars[4]!;
    const avgBody = this.avgBodyLength.update(open, close);

    // First bar: long bullish
    if (!isBullish(bar1) || bar1.close - bar1.open <= avgBody) {
      return false;
    }

    // Second to fourth bars: small bearish within first bar's range
    const middleBars = [bar2, bar3, bar4];
    for (const currentBar of middleBars) {
      if (
        !isBearish(currentBar) ||
        currentBar.high >= bar1.high ||
        currentBar.low <= bar1.low ||
        bodyLength(currentBar) >= avgBody * 0.5
      ) {
        return false;
      }
    }

    // Fifth bar: bullish that closes above first bar high
    if (!isBullish(bar5) || bar5.close <= bar1.high) {
      return false;
    }

    return true;
  }

  /**
   * Updates the pattern detector with a bar object
   * @param bar - Bar object containing OHLC data
   * @returns True if Rising Three Methods pattern is detected, false otherwise
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useRisingThreeMethods(
  opts?: PeriodWith<"period">
): (bar: BarWith<"open" | "close" | "high" | "low">) => boolean {
  const instance = new RisingThreeMethods(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Falling Three Methods - bearish continuation pattern
 * Detects a five-candle pattern where a long bearish candle is followed by three small bullish candles
 * within its range, and then another bearish candle that closes below the first candle's low.
 */
export class FallingThreeMethods {
  static readonly doc: OperatorDoc = {
    type: "FallingThreeMethods",
    init: "{period: 10}",
    input: "open, close, high, low",
    output: "boolean",
  };

  private avgBodyLength: AverageBodyLength;
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  /**
   * Creates an instance of FallingThreeMethods pattern detector
   * @param opts - Configuration options for the pattern detector
   * @param opts.period - Period for calculating average body length (default: 10)
   */
  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

  /**
   * Updates the pattern detector with new OHLCV data
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if Falling Three Methods pattern is detected, false otherwise
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const bar = { open, close, high, low };
    this.bars.push(bar);

    if (this.bars.length > 5) {
      this.bars.shift();
    }

    if (this.bars.length < 5) {
      return false;
    }

    const bar1 = this.bars[0]!;
    const bar2 = this.bars[1]!;
    const bar3 = this.bars[2]!;
    const bar4 = this.bars[3]!;
    const bar5 = this.bars[4]!;
    const avgBody = this.avgBodyLength.update(open, close);

    // First bar: long bearish
    if (!isBearish(bar1) || bar1.open - bar1.close <= avgBody) {
      return false;
    }

    // Second to fourth bars: small bullish within first bar's range
    const middleBars = [bar2, bar3, bar4];
    for (const currentBar of middleBars) {
      if (
        !isBullish(currentBar) ||
        currentBar.high >= bar1.high ||
        currentBar.low <= bar1.low ||
        bodyLength(currentBar) >= avgBody * 0.5
      ) {
        return false;
      }
    }

    // Fifth bar: bearish that closes below first bar low
    if (!isBearish(bar5) || bar5.close >= bar1.low) {
      return false;
    }

    return true;
  }

  /**
   * Updates the pattern detector with a bar object
   * @param bar - Bar object containing OHLC data
   * @returns True if Falling Three Methods pattern is detected, false otherwise
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useFallingThreeMethods(
  opts?: PeriodWith<"period">
): (bar: BarWith<"open" | "close" | "high" | "low">) => boolean {
  const instance = new FallingThreeMethods(opts);
  return (bar) => instance.onData(bar);
}

// Four Bar Patterns

/**
 * Three Buddha Top - head and shoulders pattern
 * Detects a head and shoulders topping pattern with three peaks and two valleys.
 * Uses an improved detection algorithm with a larger window for proper pattern identification.
 */
export class ThreeBuddhaTop {
  static readonly doc: OperatorDoc = {
    type: "ThreeBuddhaTop",
    input: "open, close, high, low",
    output: "boolean",
  };

  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];
  private peaks: { high: number; index: number }[] = [];
  private valleys: { low: number; index: number }[] = [];

  /**
   * Updates the pattern detector with new OHLCV data
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if Three Buddha Top pattern is detected, false otherwise
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const bar = { open, close, high, low };
    this.bars.push(bar);

    // Increased window size for better pattern detection
    if (this.bars.length > 8) {
      this.bars.shift();
    }

    if (this.bars.length < 8) {
      return false;
    }

    // Reset peaks and valleys
    this.peaks = [];
    this.valleys = [];

    // Find peaks and valleys with improved detection
    for (let i = 2; i < this.bars.length - 2; i++) {
      const prev2Bar = this.bars[i - 2]!;
      const prevBar = this.bars[i - 1]!;
      const currentBar = this.bars[i]!;
      const nextBar = this.bars[i + 1]!;
      const next2Bar = this.bars[i + 2]!;

      // Peak detection: current high is higher than surrounding bars
      if (
        currentBar.high > prevBar.high &&
        currentBar.high > nextBar.high &&
        currentBar.high > prev2Bar.high &&
        currentBar.high > next2Bar.high
      ) {
        this.peaks.push({ high: currentBar.high, index: i });
      }

      // Valley detection: current low is lower than surrounding bars
      if (
        currentBar.low < prevBar.low &&
        currentBar.low < nextBar.low &&
        currentBar.low < prev2Bar.low &&
        currentBar.low < next2Bar.low
      ) {
        this.valleys.push({ low: currentBar.low, index: i });
      }
    }

    // Need exactly 3 peaks and at least 2 valleys
    if (this.peaks.length !== 3 || this.valleys.length < 2) {
      return false;
    }

    const peak1 = this.peaks[0]!;
    const peak2 = this.peaks[1]!;
    const peak3 = this.peaks[2]!;
    const valley1 = this.valleys[0]!;
    const valley2 = this.valleys[1]!;

    // Second peak (head) should be highest
    if (peak2.high <= peak1.high || peak2.high <= peak3.high) {
      return false;
    }

    // Third peak should be similar to first peak
    if (Math.abs(peak3.high - peak1.high) > (peak2.high - valley1.low) * 0.1) {
      return false;
    }

    // Latest bar should close below neckline
    const neckline = (valley1.low + valley2.low) / 2;
    const latestBar = this.bars[this.bars.length - 1]!;

    return latestBar.close < neckline && latestBar.high < peak2.high;
  }

  /**
   * Updates the pattern detector with a bar object
   * @param bar - Bar object containing OHLC data
   * @returns True if Three Buddha Top pattern is detected, false otherwise
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useThreeBuddhaTop(): (
  bar: BarWith<"open" | "close" | "high" | "low">
) => boolean {
  const instance = new ThreeBuddhaTop();
  return (bar) => instance.onData(bar);
}

/**
 * Inverted Three Buddha - inverse head and shoulders pattern
 * Detects an inverse head and shoulders bottoming pattern with three valleys and two peaks.
 * Uses an improved detection algorithm with a larger window for proper pattern identification.
 */
export class InvertedThreeBuddha {
  static readonly doc: OperatorDoc = {
    type: "InvertedThreeBuddha",
    input: "open, close, high, low",
    output: "boolean",
  };

  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];
  private peaks: { high: number; index: number }[] = [];
  private valleys: { low: number; index: number }[] = [];

  /**
   * Updates the pattern detector with new OHLCV data
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if Inverted Three Buddha pattern is detected, false otherwise
   */
  update(open: number, close: number, high: number, low: number): boolean {
    const bar = { open, close, high, low };
    this.bars.push(bar);

    // Increased window size for better pattern detection
    if (this.bars.length > 8) {
      this.bars.shift();
    }

    if (this.bars.length < 8) {
      return false;
    }

    // Reset peaks and valleys
    this.peaks = [];
    this.valleys = [];

    // Find peaks and valleys with improved detection
    for (let i = 2; i < this.bars.length - 2; i++) {
      const prev2Bar = this.bars[i - 2]!;
      const prevBar = this.bars[i - 1]!;
      const currentBar = this.bars[i]!;
      const nextBar = this.bars[i + 1]!;
      const next2Bar = this.bars[i + 2]!;

      // Peak detection: current high is higher than surrounding bars
      if (
        currentBar.high > prevBar.high &&
        currentBar.high > nextBar.high &&
        currentBar.high > prev2Bar.high &&
        currentBar.high > next2Bar.high
      ) {
        this.peaks.push({ high: currentBar.high, index: i });
      }

      // Valley detection: current low is lower than surrounding bars
      if (
        currentBar.low < prevBar.low &&
        currentBar.low < nextBar.low &&
        currentBar.low < prev2Bar.low &&
        currentBar.low < next2Bar.low
      ) {
        this.valleys.push({ low: currentBar.low, index: i });
      }
    }

    // Need exactly 3 valleys and at least 2 peaks
    if (this.valleys.length !== 3 || this.peaks.length < 2) {
      return false;
    }

    const valley1 = this.valleys[0]!;
    const valley2 = this.valleys[1]!;
    const valley3 = this.valleys[2]!;
    const peak1 = this.peaks[0]!;
    const peak2 = this.peaks[1]!;

    // Second valley (head) should be lowest
    if (valley2.low >= valley1.low || valley2.low >= valley3.low) {
      return false;
    }

    // Third valley should be similar to first valley
    if (
      Math.abs(valley3.low - valley1.low) >
      (peak1.high - valley2.low) * 0.1
    ) {
      return false;
    }

    // Latest bar should close above neckline
    const neckline = (peak1.high + peak2.high) / 2;
    const latestBar = this.bars[this.bars.length - 1]!;

    return latestBar.close > neckline && latestBar.low > valley2.low;
  }

  /**
   * Updates the pattern detector with a bar object
   * @param bar - Bar object containing OHLC data
   * @returns True if Inverted Three Buddha pattern is detected, false otherwise
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useInvertedThreeBuddha(): (
  bar: BarWith<"open" | "close" | "high" | "low">
) => boolean {
  const instance = new InvertedThreeBuddha();
  return (bar) => instance.onData(bar);
}
