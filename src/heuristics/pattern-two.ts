import type { BarWith } from "../types/BarData.js";
import type { PeriodWith } from "../types/PeriodOptions.js";
import { isBearish, isBullish, SmoothedTrend } from "./utils.js";

/**
 * Bearish Engulfing - bearish candle engulfs previous bullish candle
 */
export class BearishEngulfing {
  private prev?: BarWith<"open" | "close">;

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

  onData(bar: BarWith<"open" | "close">): boolean {
    return this.update(bar.open, bar.close);
  }
}

/**
 * Bullish Harami - small bullish candle contained within previous bearish candle
 */
export class BullishHarami {
  private prev?: BarWith<"open" | "close">;

  update(open: number, close: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close };
      return false;
    }

    const result =
      isBearish(this.prev) &&
      isBullish({ open, close }) &&
      open > this.prev.close &&
      close < this.prev.open;

    this.prev = { open, close };
    return result;
  }

  onData(bar: BarWith<"open" | "close">): boolean {
    return this.update(bar.open, bar.close);
  }
}

/**
 * Bearish Harami - small bearish candle contained within previous bullish candle
 */
export class BearishHarami {
  private prev?: BarWith<"open" | "close">;

  update(open: number, close: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close };
      return false;
    }

    const result =
      isBullish(this.prev) &&
      isBearish({ open, close }) &&
      open < this.prev.close &&
      close > this.prev.open;

    this.prev = { open, close };
    return result;
  }

  onData(bar: BarWith<"open" | "close">): boolean {
    return this.update(bar.open, bar.close);
  }
}

/**
 * Harami Cross - doji contained within previous candle's body
 */
export class HaramiCross {
  private prev?: BarWith<"open" | "close">;

  update(open: number, close: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close };
      return false;
    }

    const isDoji = close === open;

    const result = isDoji && open > this.prev.close && close < this.prev.open;

    this.prev = { open, close };
    return result;
  }

  onData(bar: BarWith<"open" | "close">): boolean {
    return this.update(bar.open, bar.close);
  }
}

/**
 * Piercing Pattern - bullish candle opens below previous close but closes above midpoint of previous body
 */
export class PiercingPattern {
  private prev?: BarWith<"open" | "close">;

  update(open: number, close: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close };
      return false;
    }

    const prevBodyMidpoint =
      this.prev.open - (this.prev.open - this.prev.close) * 0.5;

    const result =
      isBearish(this.prev) &&
      isBullish({ open, close }) &&
      open < this.prev.close &&
      close > prevBodyMidpoint;

    this.prev = { open, close };
    return result;
  }

  onData(bar: BarWith<"open" | "close">): boolean {
    return this.update(bar.open, bar.close);
  }
}

/**
 * Dark Cloud Cover - bearish candle opens above previous close but closes below midpoint of previous body
 */
export class DarkCloudCover {
  private prev?: BarWith<"open" | "close">;

  update(open: number, close: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close };
      return false;
    }

    const prevBodyMidpoint =
      this.prev.open + (this.prev.close - this.prev.open) * 0.5;

    const result =
      isBullish(this.prev) &&
      isBearish({ open, close }) &&
      open > this.prev.close &&
      close < prevBodyMidpoint;

    this.prev = { open, close };
    return result;
  }

  onData(bar: BarWith<"open" | "close">): boolean {
    return this.update(bar.open, bar.close);
  }
}

/**
 * Tweezer Tops - two candles with matching highs, first bullish then bearish
 */
export class TweezerTops {
  private prev?: BarWith<"open" | "close" | "high" | "low">;

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Tweezer Bottoms - two candles with matching lows, first bearish then bullish
 */
export class TweezerBottoms {
  private prev?: BarWith<"open" | "close" | "high" | "low">;

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Bullish Doji Star - doji gaps below previous bearish candle
 */
export class BullishDojiStar {
  private prev?: BarWith<"open" | "close">;

  update(open: number, close: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close };
      return false;
    }

    const isDoji = close === open;

    const result = isDoji && open < this.prev.close && isBearish(this.prev);

    this.prev = { open, close };
    return result;
  }

  onData(bar: BarWith<"open" | "close">): boolean {
    return this.update(bar.open, bar.close);
  }
}

/**
 * Bearish Doji Star - doji gaps above previous bullish candle
 */
export class BearishDojiStar {
  private prev?: BarWith<"open" | "close">;

  update(open: number, close: number): boolean {
    if (this.prev === undefined) {
      this.prev = { open, close };
      return false;
    }

    const isDoji = close === open;

    const result = isDoji && open > this.prev.close && isBullish(this.prev);

    this.prev = { open, close };
    return result;
  }

  onData(bar: BarWith<"open" | "close">): boolean {
    return this.update(bar.open, bar.close);
  }
}

/**
 * Inside Bar - current bar's range is within previous bar's range
 */
export class InsideBar {
  private prev?: BarWith<"high" | "low">;

  update(high: number, low: number): boolean {
    if (this.prev === undefined) {
      this.prev = { high, low };
      return false;
    }

    const result = high <= this.prev.high && low >= this.prev.low;

    this.prev = { high, low };
    return result;
  }

  onData(bar: BarWith<"high" | "low">): boolean {
    return this.update(bar.high, bar.low);
  }
}

/**
 * Outside Bar (Engulfing) - current bar's range engulfs previous bar's range
 */
export class OutsideBar {
  private prev?: BarWith<"high" | "low">;

  update(high: number, low: number): boolean {
    if (this.prev === undefined) {
      this.prev = { high, low };
      return false;
    }

    const result = high > this.prev.high && low < this.prev.low;

    this.prev = { high, low };
    return result;
  }

  onData(bar: BarWith<"high" | "low">): boolean {
    return this.update(bar.high, bar.low);
  }
}

/**
 * Railroad Tracks - two candles with equal highs and lows but opposite colors
 */
export class RailroadTracks {
  private prev?: BarWith<"open" | "close" | "high" | "low">;

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Rising Window - bullish gap continuation pattern
 */
export class RisingWindow {
  private trend: SmoothedTrend;
  private prev?: BarWith<"open" | "close" | "high" | "low">;

  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.trend = new SmoothedTrend(opts);
  }

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Falling Window - bearish gap continuation pattern
 */
export class FallingWindow {
  private trend: SmoothedTrend;
  private prev?: BarWith<"open" | "close" | "high" | "low">;

  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.trend = new SmoothedTrend(opts);
  }

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}
