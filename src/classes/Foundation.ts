import type { PeriodOptions, PeriodWith } from "../types/PeriodOptions.js";
import { exp_factor, Kahan, smooth, smooth_roll } from "../utils/math.js";
import { CircularBuffer, Deque } from "./Containers.js";

/**
 * Exponential Moving Average - stateful indicator.
 * Uses exponential smoothing with alpha = 2/(period+1).
 */
export class EMA {
  private alpha: number;
  private ema?: number;

  constructor(opts: PeriodOptions & { alpha?: number }) {
    if (opts.period === undefined && opts.alpha === undefined) {
      throw new Error("EMA requires period or alpha");
    }
    if (opts.alpha) {
      this.alpha = opts.alpha;
    } else {
      this.alpha = exp_factor(opts.period!);
    }
  }

  /**
   * Process new data point.
   * @param x New price value
   * @returns Current EMA value
   */
  onData(x: number): number {
    if (this.ema === undefined) {
      this.ema = x;
    } else {
      this.ema = smooth(this.ema, x, this.alpha);
    }
    return this.ema;
  }
}

/**
 * Creates EMA closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes data and returns EMA
 */
export function useEMA(
  opts: PeriodOptions & { alpha?: number }
): (x: number) => number {
  const instance = new EMA(opts);
  return (x: number) => instance.onData(x);
}

/**
 * Simple Moving Average - stateful indicator.
 * Maintains rolling window of prices for exact average calculation.
 */
export class SMA {
  readonly buffer: CircularBuffer<number>;
  private sma: number = 0;
  private weight: number;

  constructor(opts: PeriodWith<"period">) {
    this.buffer = new CircularBuffer<number>(opts.period);
    this.weight = 1.0 / opts.period;
  }

  /**
   * Process new data point.
   * @param x New price value
   * @returns Current SMA value
   */
  onData(x: number): number {
    if (!this.buffer.full()) {
      this.buffer.push(x);
      this.sma = smooth(this.sma, x, 1 / this.buffer.size());
    } else {
      const old = this.buffer.front()!;
      this.sma = smooth_roll(this.sma, x, old, this.weight);
      this.buffer.push(x);
    }
    return this.sma;
  }
}

/**
 * Creates SMA closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes data and returns SMA
 */
export function useSMA(opts: PeriodWith<"period">): (x: number) => number {
  const instance = new SMA(opts);
  return (x: number) => instance.onData(x);
}

/**
 * Variance - stateful indicator.
 * Uses Welford's online algorithm for numerical stability.
 * Supports Delta Degrees of Freedom (ddof) for sample variance.
 */
export class Variance {
  readonly buffer: CircularBuffer<number>;
  readonly kahan: Kahan;
  private m: number = 0;
  private m2: number = 0;
  private ddof: number;
  private weight: number;
  private varWeight: number;

  constructor(opts: PeriodWith<"period"> & { ddof?: number }) {
    this.ddof = opts.ddof ?? 0;
    if (opts.period <= this.ddof) {
      throw new Error("Period should be larger than DDoF.");
    }
    this.buffer = new CircularBuffer<number>(opts.period);
    this.kahan = new Kahan();
    this.weight = 1.0 / opts.period;
    this.varWeight = 1.0 / (opts.period - this.ddof);
  }

  /**
   * Process new data point.
   * @param x New value
   * @returns Object with mean and variance
   */
  onData(x: number): { mean: number; variance: number } {
    if (!this.buffer.full()) {
      this.buffer.push(x);
      const delta = x - this.m;
      this.m += delta / this.buffer.size();
      this.m2 = this.kahan.add((x - this.m) * delta);
      if (this.buffer.size() <= this.ddof) {
        return { mean: this.m, variance: 0 };
      } else {
        return {
          mean: this.m,
          variance: this.m2 / (this.buffer.size() - this.ddof),
        };
      }
    } else {
      const x0 = this.buffer.front()!;
      const d = x - this.m;
      const d0 = x0 - this.m;
      const dx = x - x0;
      this.m += this.weight * dx;
      this.m2 = this.kahan.add(dx * (d + d0) - this.weight * dx * dx);
      this.buffer.push(x);
      return { mean: this.m, variance: this.m2 * this.varWeight };
    }
  }
}

/**
 * Creates Variance closure for functional usage.
 * @param opts Period and ddof configuration
 * @returns Function that processes data and returns {m, var}
 */
export function useVariance(
  opts: PeriodWith<"period"> & { ddof?: number }
): (x: number) => { mean: number; variance: number } {
  const instance = new Variance(opts);
  return (x: number) => instance.onData(x);
}

/**
 * Standard Deviation - stateful indicator.
 * Uses Welford's online algorithm via Variance for numerical stability.
 * Supports Delta Degrees of Freedom (ddof) for sample standard deviation.
 */
export class Stddev {
  private readonly variance: Variance;

  constructor(opts: PeriodWith<"period"> & { ddof?: number }) {
    this.variance = new Variance(opts);
  }

  /**
   * Process new data point.
   * @param x New value
   * @returns Object with mean and standard deviation
   */
  onData(x: number): { mean: number; stddev: number } {
    const { mean, variance } = this.variance.onData(x);
    return { mean, stddev: Math.sqrt(variance) };
  }
}

/**
 * Creates Stddev closure for functional usage.
 * @param opts Period and ddof configuration
 * @returns Function that processes data and returns {mean, stddev}
 */
export function useStddev(
  opts: PeriodWith<"period"> & { ddof?: number }
): (x: number) => { mean: number; stddev: number } {
  const instance = new Stddev(opts);
  return (x: number) => instance.onData(x);
}

/**
 * Min - stateful indicator.
 * Uses monotonic deque algorithm for efficient sliding window minimum.
 */
export class Min {
  readonly buffer: CircularBuffer<number>;
  private minDeque: Deque<number>;

  constructor(opts: PeriodWith<"period">) {
    this.buffer = new CircularBuffer<number>(opts.period);
    this.minDeque = new Deque(opts.period);
  }

  /**
   * Process new data point.
   * @param x New value
   * @returns Minimum value in the window
   */
  onData(x: number): number {
    if (this.buffer.full()) {
      const old = this.buffer.front()!;
      if (!this.minDeque.empty() && this.minDeque.front() === old) {
        this.minDeque.pop_front();
      }
    }

    this.buffer.push(x);

    while (!this.minDeque.empty() && this.minDeque.back()! >= x) {
      this.minDeque.pop_back();
    }
    this.minDeque.push_back(x);

    return this.minDeque.front()!;
  }
}

/**
 * Creates Min closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes data and returns min
 */
export function useMin(opts: PeriodWith<"period">): (x: number) => number {
  const instance = new Min(opts);
  return (x: number) => instance.onData(x);
}

/**
 * Max - stateful indicator.
 * Uses monotonic deque algorithm for efficient sliding window maximum.
 */
export class Max {
  readonly buffer: CircularBuffer<number>;
  private maxDeque: Deque<number>;

  constructor(opts: PeriodWith<"period">) {
    this.buffer = new CircularBuffer<number>(opts.period);
    this.maxDeque = new Deque(opts.period);
  }

  /**
   * Process new data point.
   * @param x New value
   * @returns Maximum value in the window
   */
  onData(x: number): number {
    if (this.buffer.full()) {
      const old = this.buffer.front()!;
      if (!this.maxDeque.empty() && this.maxDeque.front() === old) {
        this.maxDeque.pop_front();
      }
    }

    this.buffer.push(x);

    while (!this.maxDeque.empty() && this.maxDeque.back()! <= x) {
      this.maxDeque.pop_back();
    }
    this.maxDeque.push_back(x);

    return this.maxDeque.front()!;
  }
}

/**
 * Creates Max closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes data and returns max
 */
export function useMax(opts: PeriodWith<"period">): (x: number) => number {
  const instance = new Max(opts);
  return (x: number) => instance.onData(x);
}

/**
 * Sum - stateful indicator.
 * Uses Kahan summation for numerical stability in rolling window sum.
 */
export class Sum {
  readonly buffer: CircularBuffer<number>;
  private readonly kahan: Kahan;

  constructor(opts: PeriodWith<"period">) {
    this.buffer = new CircularBuffer<number>(opts.period);
    this.kahan = new Kahan();
  }

  /**
   * Process new data point.
   * @param x New value
   * @returns Sum of values in the window
   */
  onData(x: number): number {
    if (!this.buffer.full()) {
      this.buffer.push(x);
      return this.kahan.add(x);
    } else {
      const old = this.buffer.front()!;
      this.buffer.push(x);
      return this.kahan.add(x - old);
    }
  }
}

/**
 * Creates Sum closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes data and returns sum
 */
export function useSum(opts: PeriodWith<"period">): (x: number) => number {
  const instance = new Sum(opts);
  return (x: number) => instance.onData(x);
}

/**
 * Min/Max - stateful indicator.
 * Uses monotonic deque algorithm for efficient sliding window min/max.
 */
export class MinMax {
  readonly buffer: CircularBuffer<number>;
  private minDeque: Deque<number>;
  private maxDeque: Deque<number>;

  constructor(opts: PeriodWith<"period">) {
    this.buffer = new CircularBuffer<number>(opts.period);
    this.minDeque = new Deque(opts.period);
    this.maxDeque = new Deque(opts.period);
  }

  /**
   * Process new data point.
   * @param x New value
   * @returns Object with min and max values in the window
   */
  onData(x: number): { min: number; max: number } {
    if (this.buffer.full()) {
      const old = this.buffer.front()!;
      if (!this.minDeque.empty() && this.minDeque.front() === old) {
        this.minDeque.pop_front();
      }
      if (!this.maxDeque.empty() && this.maxDeque.front() === old) {
        this.maxDeque.pop_front();
      }
    }

    this.buffer.push(x);

    while (!this.minDeque.empty() && this.minDeque.back()! >= x) {
      this.minDeque.pop_back();
    }
    this.minDeque.push_back(x);

    while (!this.maxDeque.empty() && this.maxDeque.back()! <= x) {
      this.maxDeque.pop_back();
    }
    this.maxDeque.push_back(x);

    return {
      min: this.minDeque.front()!,
      max: this.maxDeque.front()!,
    };
  }
}

/**
 * Creates MinMax closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes data and returns {min, max}
 */
export function useMinMax(
  opts: PeriodWith<"period">
): (x: number) => { min: number; max: number } {
  const instance = new MinMax(opts);
  return (x: number) => instance.onData(x);
}
