import type { BarWith } from "../types/BarData.js";
import type { PeriodWith } from "../types/PeriodOptions.js";
import {
  AverageBodyLength,
  bodyLength,
  isBearish,
  isBullish,
} from "./utils.js";
import { isDoji } from "./pattern-single.js";

/**
 * Evening Star - bearish reversal pattern
 */
export class EveningStar {
  private avgBodyLength: AverageBodyLength;
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Morning Doji Star - bullish reversal pattern with doji
 */
export class MorningDojiStar {
  private avgBodyLength: AverageBodyLength;
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Evening Doji Star - bearish reversal pattern with doji
 */
export class EveningDojiStar {
  private avgBodyLength: AverageBodyLength;
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Abandoned Baby Bullish - rare bullish reversal pattern
 */
export class AbandonedBabyBullish {
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Abandoned Baby Bearish - rare bearish reversal pattern
 */
export class AbandonedBabyBearish {
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Three White Soldiers - bullish continuation pattern
 */
export class ThreeWhiteSoldiers {
  private avgBodyLength: AverageBodyLength;
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Three Black Crows - bearish continuation pattern
 */
export class ThreeBlackCrows {
  private avgBodyLength: AverageBodyLength;
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Three Inside Up - bullish reversal pattern
 */
export class ThreeInsideUp {
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Three Inside Down - bearish reversal pattern
 */
export class ThreeInsideDown {
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Three Outside Up - bullish reversal pattern
 */
export class ThreeOutsideUp {
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Three Outside Down - bearish reversal pattern
 */
export class ThreeOutsideDown {
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Fakey Pattern Bullish - bullish false breakout pattern
 */
export class FakeyPatternBullish {
  private avgBodyLength: AverageBodyLength;
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Fakey Pattern Bearish - bearish false breakout pattern
 */
export class FakeyPatternBearish {
  private avgBodyLength: AverageBodyLength;
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

// Five Bar Patterns

/**
 * Rising Three Methods - bullish continuation pattern
 */
export class RisingThreeMethods {
  private avgBodyLength: AverageBodyLength;
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Falling Three Methods - bearish continuation pattern
 */
export class FallingThreeMethods {
  private avgBodyLength: AverageBodyLength;
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];

  constructor(opts: PeriodWith<"period"> = { period: 10 }) {
    this.avgBodyLength = new AverageBodyLength(opts);
  }

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

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

// Four Bar Patterns

/**
 * Three Buddha Top - head and shoulders pattern
 */
export class ThreeBuddhaTop {
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];
  private peaks: { high: number; index: number }[] = [];
  private valleys: { low: number; index: number }[] = [];

  update(open: number, close: number, high: number, low: number): boolean {
    const bar = { open, close, high, low };
    this.bars.push(bar);

    if (this.bars.length > 4) {
      this.bars.shift();
    }

    if (this.bars.length < 4) {
      return false;
    }

    // Reset peaks and valleys
    this.peaks = [];
    this.valleys = [];

    // Find peaks and valleys
    for (let i = 1; i < this.bars.length - 1; i++) {
      const prevBar = this.bars[i - 1]!;
      const currentBar = this.bars[i]!;
      const nextBar = this.bars[i + 1]!;

      // Peak detection
      if (currentBar.high > prevBar.high && currentBar.high > nextBar.high) {
        this.peaks.push({ high: currentBar.high, index: i });
      }

      // Valley detection
      if (currentBar.low < prevBar.low && currentBar.low < nextBar.low) {
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

    // Fourth bar should close below neckline
    const neckline = (valley1.low + valley2.low) / 2;
    const bar4 = this.bars[3]!;

    return bar4.close < neckline && bar4.high < peak2.high;
  }

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}

/**
 * Inverted Three Buddha - inverse head and shoulders pattern
 */
export class InvertedThreeBuddha {
  private bars: BarWith<"open" | "close" | "high" | "low">[] = [];
  private peaks: { high: number; index: number }[] = [];
  private valleys: { low: number; index: number }[] = [];

  update(open: number, close: number, high: number, low: number): boolean {
    const bar = { open, close, high, low };
    this.bars.push(bar);

    if (this.bars.length > 4) {
      this.bars.shift();
    }

    if (this.bars.length < 4) {
      return false;
    }

    // Reset peaks and valleys
    this.peaks = [];
    this.valleys = [];

    // Find peaks and valleys
    for (let i = 1; i < this.bars.length - 1; i++) {
      const prevBar = this.bars[i - 1]!;
      const currentBar = this.bars[i]!;
      const nextBar = this.bars[i + 1]!;

      // Peak detection
      if (currentBar.high > prevBar.high && currentBar.high > nextBar.high) {
        this.peaks.push({ high: currentBar.high, index: i });
      }

      // Valley detection
      if (currentBar.low < prevBar.low && currentBar.low < nextBar.low) {
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

    // Fourth bar should close above neckline
    const neckline = (peak1.high + peak2.high) / 2;
    const bar4 = this.bars[3]!;

    return bar4.close > neckline && bar4.low > valley2.low;
  }

  onData(bar: BarWith<"open" | "close" | "high" | "low">): boolean {
    return this.update(bar.open, bar.close, bar.high, bar.low);
  }
}
