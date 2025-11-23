import type { BarWith } from "../types/BarData.js";
import type { PeriodWith } from "../types/PeriodOptions.js";
import { isBearish, isBullish, SmoothedTrend } from "./utils.js";
import type { OperatorDoc } from "../types/OpDoc.js";
import { isDoji } from "./pattern-single.js";

/**
 * Bearish Engulfing - bearish candle engulfs previous bullish candle
 */
export class BearishEngulfing {
  static readonly doc: OperatorDoc = {
    type: "BearishEngulfing",
    update: "open, close",
    output: "boolean",
  };

  private prev?: BarWith<"open" | "close">;

  /**
   * Check if the OHLC values form a Bearish Engulfing pattern
   * @param open - Opening price
   * @param close - Closing price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close };
      return false;
    }

    const result =
      isBullish(this.prev) &&
      isBearish({ open, close }) &&
      open > this.prev.close &&
      close < this.prev.open;

    this.prev = { open, close };
    return result;
  }

  /**
   * Check if a bar forms a Bearish Engulfing pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close">): boolean {
    return this.update(bar.open, bar.close);
  }
}

export function useBearishEngulfing() {
  return new BearishEngulfing();
}

/**
 * Bullish Harami - small bullish candle contained within previous bearish candle
 */
export class BullishHarami {
  static readonly doc: OperatorDoc = {
    type: "BullishHarami",
    update: "open, close",
    output: "boolean",
  };

  private prev?: BarWith<"open" | "close">;

  /**
   * Check if the OHLC values form a Bullish Harami pattern
   * @param open - Opening price
   * @param close - Closing price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close };
      return false;
    }

    const result =
      isBearish(this.prev) &&
      isBullish({ open, close }) &&
      open > this.prev.close && // Fixed: current open should be greater than prev close (for bearish prev)
      close < this.prev.open; // Fixed: current close should be less than prev open (for bearish prev)

    this.prev = { open, close };
    return result;
  }

  /**
   * Check if a bar forms a Bullish Harami pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close">): boolean {
    return this.update(bar.open, bar.close);
  }
}

export function useBullishHarami() {
  return new BullishHarami();
}

/**
 * Bearish Harami - small bearish candle contained within previous bullish candle
 */
export class BearishHarami {
  static readonly doc: OperatorDoc = {
    type: "BearishHarami",
    update: "open, close",
    output: "boolean",
  };

  private prev?: BarWith<"open" | "close">;

  /**
   * Check if the OHLC values form a Bearish Harami pattern
   * @param open - Opening price
   * @param close - Closing price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close };
      return false;
    }

    const result =
      isBullish(this.prev) &&
      isBearish({ open, close }) &&
      open > this.prev.open && // Fixed: current open should be greater than prev open (for bullish prev)
      close < this.prev.close; // Fixed: current close should be less than prev close (for bullish prev)

    this.prev = { open, close };
    return result;
  }

  /**
   * Check if a bar forms a Bearish Harami pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close">): boolean {
    return this.update(bar.open, bar.close);
  }
}

export function useBearishHarami() {
  return new BearishHarami();
}

/**
 * Harami Cross - doji contained within previous candle's body
 */
export class HaramiCross {
  static readonly doc: OperatorDoc = {
    type: "HaramiCross",
    update: "open, close, high, low",
    output: "boolean",
  };

  private prev?: BarWith<"open" | "close">;

  /**
   * Check if the OHLC values form a Harami Cross pattern
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number, high: number, low: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close };
      return false;
    }

    const result =
      isDoji({ open, close, high, low }) &&
      open > this.prev.close &&
      close < this.prev.open;

    this.prev = { open, close };
    return result;
  }

  /**
   * Check if a bar forms a Harami Cross pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useHaramiCross() {
  return new HaramiCross();
}

/**
 * Piercing Pattern - bullish candle opens below previous close but closes above midpoint of previous body
 */
export class PiercingPattern {
  static readonly doc: OperatorDoc = {
    type: "PiercingPattern",
    update: "open, close",
    output: "boolean",
  };

  private prev?: BarWith<"open" | "close">;

  /**
   * Check if the OHLC values form a Piercing Pattern
   * @param open - Opening price
   * @param close - Closing price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close };
      return false;
    }

    // Fixed: For a bearish candle, the midpoint is (prev.open + prev.close) / 2
    const prevBodyMidpoint = (this.prev.open + this.prev.close) * 0.5;

    const result =
      isBearish(this.prev) &&
      isBullish({ open, close }) &&
      open < this.prev.close &&
      close > prevBodyMidpoint;

    this.prev = { open, close };
    return result;
  }

  /**
   * Check if a bar forms a Piercing Pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close">): boolean {
    return this.update(bar.open, bar.close);
  }
}

export function usePiercingPattern() {
  return new PiercingPattern();
}

/**
 * Dark Cloud Cover - bearish candle opens above previous close but closes below midpoint of previous body
 */
export class DarkCloudCover {
  static readonly doc: OperatorDoc = {
    type: "DarkCloudCover",
    update: "open, close",
    output: "boolean",
  };

  private prev?: BarWith<"open" | "close">;

  /**
   * Check if the OHLC values form a Dark Cloud Cover pattern
   * @param open - Opening price
   * @param close - Closing price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close };
      return false;
    }

    // Fixed: For a bullish candle, the midpoint is (prev.open + prev.close) / 2
    const prevBodyMidpoint = (this.prev.open + this.prev.close) * 0.5;

    const result =
      isBullish(this.prev) &&
      isBearish({ open, close }) &&
      open > this.prev.close &&
      close < prevBodyMidpoint;

    this.prev = { open, close };
    return result;
  }

  /**
   * Check if a bar forms a Dark Cloud Cover pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close">): boolean {
    return this.update(bar.open, bar.close);
  }
}

export function useDarkCloudCover() {
  return new DarkCloudCover();
}

/**
 * Tweezer Tops - two candles with matching highs, first bullish then bearish
 */
export class TweezerTops {
  private prev?: BarWith<"open" | "close" | "high" | "low">;

  /**
   * Check if the OHLC values form a Tweezer Tops pattern
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number, high: number, low: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close, high, low };
      return false;
    }

    const result =
      Math.abs(high - this.prev.high) <
        (this.prev.high - this.prev.low) * 0.01 &&
      isBullish(this.prev) &&
      isBearish({ open, close });

    this.prev = { open, close, high, low };
    return result;
  }

  /**
   * Check if a bar forms a Tweezer Tops pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Tweezer Bottoms - two candles with matching lows, first bearish then bullish
 */
export class TweezerBottoms {
  private prev?: BarWith<"open" | "close" | "high" | "low">;

  /**
   * Check if the OHLC values form a Tweezer Bottoms pattern
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number, high: number, low: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close, high, low };
      return false;
    }

    const result =
      Math.abs(low - this.prev.low) < (this.prev.high - this.prev.low) * 0.01 &&
      isBearish(this.prev) &&
      isBullish({ open, close });

    this.prev = { open, close, high, low };
    return result;
  }

  /**
   * Check if a bar forms a Tweezer Bottoms pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Bullish Doji Star - doji gaps below previous bearish candle
 */
export class BullishDojiStar {
  static readonly doc: OperatorDoc = {
    type: "BullishDojiStar",
    update: "open, close, high, low",
    output: "boolean",
  };

  private prev?: BarWith<"open" | "close">;

  /**
   * Check if the OHLC values form a Bullish Doji Star pattern
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number, high: number, low: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close };
      return false;
    }

    const result =
      isDoji({ open, close, high, low }) &&
      open < this.prev.close &&
      isBearish(this.prev);

    this.prev = { open, close };
    return result;
  }

  /**
   * Check if a bar forms a Bullish Doji Star pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useBullishDojiStar() {
  return new BullishDojiStar();
}

/**
 * Bearish Doji Star - doji gaps above previous bullish candle
 */
export class BearishDojiStar {
  static readonly doc: OperatorDoc = {
    type: "BearishDojiStar",
    update: "open, close, high, low",
    output: "boolean",
  };

  private prev?: BarWith<"open" | "close">;

  /**
   * Check if the OHLC values form a Bearish Doji Star pattern
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number, high: number, low: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close };
      return false;
    }

    const result =
      isDoji({ open, close, high, low }) &&
      open > this.prev.close &&
      isBullish(this.prev);

    this.prev = { open, close };
    return result;
  }

  /**
   * Check if a bar forms a Bearish Doji Star pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useBearishDojiStar() {
  return new BearishDojiStar();
}

/**
 * Inside Bar - current bar's range is within previous bar's range
 */
export class InsideBar {
  static readonly doc: OperatorDoc = {
    type: "InsideBar",
    update: "high, low",
    output: "boolean",
  };

  private prev?: BarWith<"high" | "low">;

  /**
   * Check if the HL values form an Inside Bar pattern
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(high: number, low: number): boolean {
    if (this.prev === undefined) {
      this.prev = { high, low };
      return false;
    }

    const result = high <= this.prev.high && low >= this.prev.low;

    this.prev = { high, low };
    return result;
  }

  /**
   * Check if a bar forms an Inside Bar pattern
   * @param bar - Bar data with HL values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"high" | "low">): boolean {
    return this.update(bar.high, bar.low);
  }
}

export function useInsideBar() {
  return new InsideBar();
}

/**
 * Outside Bar (Engulfing) - current bar's range engulfs previous bar's range
 */
export class OutsideBar {
  static readonly doc: OperatorDoc = {
    type: "OutsideBar",
    update: "high, low",
    output: "boolean",
  };

  private prev?: BarWith<"high" | "low">;

  /**
   * Check if the HL values form an Outside Bar pattern
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(high: number, low: number): boolean {
    if (this.prev === undefined) {
      this.prev = { high, low };
      return false;
    }

    const result = high > this.prev.high && low < this.prev.low;

    this.prev = { high, low };
    return result;
  }

  /**
   * Check if a bar forms an Outside Bar pattern
   * @param bar - Bar data with HL values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"high" | "low">): boolean {
    return this.update(bar.high, bar.low);
  }
}

export function useOutsideBar() {
  return new OutsideBar();
}

/**
 * Railroad Tracks - two candles with equal highs and lows but opposite colors
 */
export class RailroadTracks {
  static readonly doc: OperatorDoc = {
    type: "RailroadTracks",
    update: "open, close, high, low",
    output: "boolean",
  };

  private prev?: BarWith<"open" | "close" | "high" | "low">;

  /**
   * Check if the OHLC values form a Railroad Tracks pattern
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number, high: number, low: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close, high, low };
      return false;
    }

    const result =
      Math.abs(high - this.prev.high) <
        (this.prev.high - this.prev.low) * 0.01 &&
      Math.abs(low - this.prev.low) < (this.prev.high - this.prev.low) * 0.01 &&
      isBullish({ open, close }) &&
      isBearish(this.prev);

    this.prev = { open, close, high, low };
    return result;
  }

  /**
   * Check if a bar forms a Railroad Tracks pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useRailroadTracks() {
  return new RailroadTracks();
}

/**
 * Rising Window - bullish gap continuation pattern
 */
export class RisingWindow {
  static readonly doc: OperatorDoc = {
    type: "RisingWindow",
    init: "{period?: number}",
    update: "open, close, high, low",
    output: "boolean",
  };

  private trend: SmoothedTrend;
  private prev?: BarWith<"open" | "close" | "high" | "low">;

  /**
   * @param opts - Configuration options
   * @param opts.period - Period for trend calculation (default: 10)
   */
  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.trend = new SmoothedTrend(opts);
  }

  /**
   * Check if the OHLC values form a Rising Window pattern
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number, high: number, low: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close, high, low };
      return false;
    }

    const { beta } = this.trend.update(close);
    const isUptrend = beta > 0;

    // Gap up between two candles in uptrend
    return isUptrend && low > this.prev.high;
  }

  /**
   * Check if a bar forms a Rising Window pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useRisingWindow(opts?: PeriodWith<"period">) {
  return new RisingWindow(opts);
}

/**
 * Falling Window - bearish gap continuation pattern
 */
export class FallingWindow {
  static readonly doc: OperatorDoc = {
    type: "FallingWindow",
    init: "{period?: number}",
    update: "open, close, high, low",
    output: "boolean",
  };

  private trend: SmoothedTrend;
  private prev?: BarWith<"open" | "close" | "high" | "low">;

  /**
   * @param opts - Configuration options
   * @param opts.period - Period for trend calculation (default: 10)
   */
  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.trend = new SmoothedTrend(opts);
  }

  /**
   * Check if the OHLC values form a Falling Window pattern
   * @param open - Opening price
   * @param close - Closing price
   * @param high - Highest price
   * @param low - Lowest price
   * @returns True if the pattern is detected
   */
  update(open: number, close: number, high: number, low: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close, high, low };
      return false;
    }

    // Simple trend detection - if we have more data points, we could improve this
    const { beta } = this.trend.update(close);
    const isDowntrend = beta < 0;

    // Gap down between two candles in downtrend
    return isDowntrend && high < this.prev.low;
  }

  /**
   * Check if a bar forms a Falling Window pattern
   * @param bar - Bar data with OHLC values
   * @returns True if the pattern is detected
   */
  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

export function useFallingWindow(opts?: PeriodWith<"period">) {
  return new FallingWindow(opts);
}
