import { type OperatorDoc } from "../types/OpDoc.js";

export interface OHLCVBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OHLCVTick {
  timestamp: number;
  price: number;
  volume: number;
}

/**
 * OHLCV Aggregator - stateful time-based candle aggregator.
 * Aggregates tick data into OHLCV bars based on time intervals.
 */
export class OHLCV {
  private readonly intervalMs: number;
  private currentBar: OHLCVBar | undefined;
  private intervalStart: number | undefined;

  constructor(opts: { intervalMs: number }) {
    this.intervalMs = opts.intervalMs;
  }

  /**
   * Process new tick data with numeric parameters.
   * @param timestamp Tick timestamp
   * @param price Tick price
   * @param volume Tick volume
   * @returns Completed OHLCV bar or undefined if bar still in progress
   */
  update(timestamp: number, price: number, volume: number): OHLCVBar | undefined {
    if (!this.currentBar || !this.intervalStart) {
      // First tick - initialize new bar
      this.intervalStart = this.alignTimestamp(timestamp);
      this.currentBar = {
        timestamp: this.intervalStart,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: volume,
      };
      return undefined;
    }

    const expectedIntervalEnd = this.intervalStart + this.intervalMs;

    if (timestamp >= expectedIntervalEnd) {
      // New interval - complete current bar and start new one
      const completedBar = { ...this.currentBar };

      this.intervalStart = this.alignTimestamp(timestamp);
      this.currentBar = {
        timestamp: this.intervalStart,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: volume,
      };

      return completedBar;
    }

    // Same interval - update current bar
    this.currentBar.high = Math.max(this.currentBar.high, price);
    this.currentBar.low = Math.min(this.currentBar.low, price);
    this.currentBar.close = price;
    this.currentBar.volume += volume;

    return undefined;
  }

  /**
   * Process new tick data.
   * @param tick Tick with timestamp, price, and volume
   * @returns Completed OHLCV bar or undefined if bar still in progress
   */
  onData(tick: OHLCVTick): OHLCVBar | undefined {
    return this.update(tick.timestamp, tick.price, tick.volume);
  }

  /**
   * Get current incomplete bar (if any).
   * @returns Current bar or undefined
   */
  getCurrentBar(): OHLCVBar | undefined {
    return this.currentBar ? { ...this.currentBar } : undefined;
  }

  /**
   * Reset aggregator state.
   */
  reset(): void {
    this.currentBar = undefined;
    this.intervalStart = undefined;
  }

  private alignTimestamp(timestamp: number): number {
    return Math.floor(timestamp / this.intervalMs) * this.intervalMs;
  }

  static readonly doc: OperatorDoc = {
    type: "OHLCV",
    desc: "Time-based OHLCV candle aggregator",
    init: "{intervalMs: number}",
    update: "timestamp, price, volume",
    output: "{timestamp, open, high, low, close, volume} | undefined",
  };
}

/**
 * Creates OHLCV aggregator closure for functional usage.
 * @param opts Interval configuration
 * @returns Function that processes ticks and returns completed bars
 */
export function useOHLCV(opts: {
  intervalMs: number;
}): (tick: OHLCVTick) => OHLCVBar | undefined {
  const instance = new OHLCV(opts);
  return (tick: OHLCVTick) => instance.onData(tick);
}
