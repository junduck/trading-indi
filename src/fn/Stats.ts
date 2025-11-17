import type { PeriodOptions, PeriodWith } from "../types/PeriodOptions.js";
import { exp_factor, Kahan, SmoothedAccum } from "../utils/math.js";
import { CircularBuffer } from "./Containers.js";

/**
 * Variance - stateful indicator.
 * Uses Welford's online algorithm for numerical stability.
 * Supports Delta Degrees of Freedom (ddof) for sample variance.
 */
export class Variance {
  readonly buffer: CircularBuffer<number>;
  private m: Kahan = new Kahan();
  private m2: Kahan = new Kahan();
  private ddof: number;
  private weight: number;
  private varWeight: number;

  constructor(opts: PeriodWith<"period"> & { ddof?: number }) {
    this.ddof = opts.ddof ?? 0;
    if (opts.period <= this.ddof) {
      throw new Error("Period should be larger than DDoF.");
    }
    this.buffer = new CircularBuffer<number>(opts.period);
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
      const delta = x - this.m.val;
      this.m.accum(delta / this.buffer.size());
      this.m2.accum((x - this.m.val) * delta);
      if (this.buffer.size() <= this.ddof) {
        return { mean: this.m.val, variance: 0 };
      } else {
        return {
          mean: this.m.val,
          variance: this.m2.val / (this.buffer.size() - this.ddof),
        };
      }
    } else {
      const x0 = this.buffer.front()!;
      const d = x - this.m.val;
      const d0 = x0 - this.m.val;
      const dx = x - x0;
      this.m.accum(this.weight * dx);
      this.m2.accum(dx * (d + d0) - this.weight * dx * dx);
      this.buffer.push(x);
      return { mean: this.m.val, variance: this.m2.val * this.varWeight };
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
 * Z-Score - statistical measure of deviation from mean.
 * Measures how many standard deviations a value is from the mean.
 */
export class ZScore {
  private stddev: Stddev;

  constructor(opts: PeriodWith<"period">) {
    this.stddev = new Stddev({ period: opts.period, ddof: 0 });
  }

  /**
   * Process new data point.
   * @param x New value
   * @returns Z-Score value
   */
  onData(x: number): number {
    const { mean, stddev } = this.stddev.onData(x);
    if (stddev === 0) {
      return 0;
    }

    return (x - mean) / stddev;
  }
}

/**
 * Creates Zscore closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns Z-Score
 */
export function useZScore(opts: PeriodWith<"period">): (x: number) => number {
  const instance = new ZScore(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Exponentially Weighted Variance - stateful indicator.
 * Tracks both mean and variance with alpha = 2/(period+1).
 */
export class VarianceEW {
  private m?: number;
  private s2: SmoothedAccum = new SmoothedAccum();
  private alpha: number;

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
   * @param x New value
   * @returns Object with mean and variance
   */
  onData(x: number): { mean: number; variance: number } {
    if (this.m === undefined) {
      this.m = x;
      return { mean: this.m, variance: this.s2.val };
    }
    const d = x - this.m;
    this.m += d * this.alpha;
    const d2 = x - this.m;
    this.s2.accum(d * d2, this.alpha);
    return { mean: this.m, variance: this.s2.val };
  }
}

/**
 * Creates VarianceEW closure for functional usage.
 * @param opts Period or alpha configuration
 * @returns Function that processes data and returns {mean, variance}
 */
export function useVarianceEW(
  opts: PeriodOptions & { alpha?: number }
): (x: number) => { mean: number; variance: number } {
  const instance = new VarianceEW(opts);
  return (x: number) => instance.onData(x);
}

export class ZScoreEW {
  private var: VarianceEW;

  constructor(opts: PeriodOptions & { alpha?: number }) {
    this.var = new VarianceEW(opts);
  }

  /**
   * Process new data point.
   * @param x New value
   * @returns Z-Score value
   */
  onData(x: number): number {
    const { mean, variance } = this.var.onData(x);
    if (variance === 0) {
      return 0;
    }

    return (x - mean) / Math.sqrt(variance);
  }
}

/**
 * Covariance - stateful indicator.
 * Uses Welford's online algorithm for two variables.
 * Supports Delta Degrees of Freedom (ddof) for sample covariance.
 */
export class Cov {
  readonly bufferX: CircularBuffer<number>;
  readonly bufferY: CircularBuffer<number>;
  private readonly kahanMXY: Kahan = new Kahan();
  private mx: SmoothedAccum = new SmoothedAccum();
  private my: SmoothedAccum = new SmoothedAccum();
  private ddof: number;
  private weight: number;
  private covWeight: number;

  constructor(opts: PeriodWith<"period"> & { ddof?: number }) {
    this.ddof = opts.ddof ?? 1;
    if (opts.period <= this.ddof) {
      throw new Error("Period should be larger than DDoF.");
    }
    this.bufferX = new CircularBuffer<number>(opts.period);
    this.bufferY = new CircularBuffer<number>(opts.period);
    this.weight = 1.0 / opts.period;
    this.covWeight = 1.0 / (opts.period - this.ddof);
  }

  /**
   * Process new data point pair.
   * @param x First variable value
   * @param y Second variable value
   * @returns Object with means and covariance
   */
  onData(
    x: number,
    y: number
  ): { meanX: number; meanY: number; covariance: number } {
    if (!this.bufferX.full()) {
      const n = this.bufferX.size() + 1;
      const a = 1.0 / n;
      const dy = y - this.my.val;

      this.mx.accum(x, a);
      this.my.accum(y, a);
      this.kahanMXY.accum((x - this.mx.val) * dy);

      this.bufferX.push(x);
      this.bufferY.push(y);

      if (n <= this.ddof) {
        return { meanX: this.mx.val, meanY: this.my.val, covariance: 0 };
      } else {
        return {
          meanX: this.mx.val,
          meanY: this.my.val,
          covariance: this.kahanMXY.val / (n - this.ddof),
        };
      }
    } else {
      const x0 = this.bufferX.front()!;
      const y0 = this.bufferY.front()!;
      const dy = y - this.my.val;
      const dy0 = y0 - this.my.val;

      this.mx.roll(x, x0, this.weight);
      this.my.roll(y, y0, this.weight);
      this.kahanMXY.accum((x - this.mx.val) * dy - (x0 - this.mx.val) * dy0);

      this.bufferX.push(x);
      this.bufferY.push(y);

      return {
        meanX: this.mx.val,
        meanY: this.my.val,
        covariance: this.kahanMXY.val * this.covWeight,
      };
    }
  }
}

/**
 * Creates Cov closure for functional usage.
 * @param opts Period and ddof configuration
 * @returns Function that processes data and returns {meanX, meanY, covariance}
 */
export function useCov(
  opts: PeriodWith<"period"> & { ddof?: number }
): (
  x: number,
  y: number
) => { meanX: number; meanY: number; covariance: number } {
  const instance = new Cov(opts);
  return (x: number, y: number) => instance.onData(x, y);
}

/**
 * Correlation - stateful indicator.
 * Uses Welford's online algorithm for two variables with correlation coefficient.
 * Supports Delta Degrees of Freedom (ddof) for sample statistics.
 */
export class Corr {
  readonly bufferX: CircularBuffer<number>;
  readonly bufferY: CircularBuffer<number>;
  private readonly kahanMXY: Kahan;
  private readonly kahanM2X: Kahan;
  private readonly kahanM2Y: Kahan;
  private mx: number = 0;
  private my: number = 0;
  private ddof: number;
  private weight: number;
  private statWeight: number;

  constructor(opts: PeriodWith<"period"> & { ddof?: number }) {
    this.ddof = opts.ddof ?? 1;
    if (opts.period <= this.ddof) {
      throw new Error("Period should be larger than DDoF.");
    }
    this.bufferX = new CircularBuffer<number>(opts.period);
    this.bufferY = new CircularBuffer<number>(opts.period);
    this.kahanMXY = new Kahan();
    this.kahanM2X = new Kahan();
    this.kahanM2Y = new Kahan();
    this.weight = 1.0 / opts.period;
    this.statWeight = 1.0 / (opts.period - this.ddof);
  }

  /**
   * Process new data point pair.
   * @param x First variable value
   * @param y Second variable value
   * @returns Object with means, covariance, and correlation
   */
  onData(
    x: number,
    y: number
  ): {
    meanX: number;
    meanY: number;
    covariance: number;
    correlation: number;
  } {
    if (!this.bufferX.full()) {
      const n = this.bufferX.size() + 1;
      const a = 1.0 / n;
      const dx = x - this.mx;
      const dy = y - this.my;

      this.mx += dx * a;
      this.my += dy * a;
      this.kahanMXY.accum((x - this.mx) * dy);
      this.kahanM2X.accum((x - this.mx) * dx);
      this.kahanM2Y.accum((y - this.my) * dy);

      this.bufferX.push(x);
      this.bufferY.push(y);

      if (n <= this.ddof) {
        return {
          meanX: this.mx,
          meanY: this.my,
          covariance: 0,
          correlation: 0,
        };
      } else {
        const mxy = this.kahanMXY.val;
        const m2x = this.kahanM2X.val;
        const m2y = this.kahanM2Y.val;
        const denom = Math.sqrt(m2x * m2y);
        return {
          meanX: this.mx,
          meanY: this.my,
          covariance: mxy / (n - this.ddof),
          correlation: denom === 0 ? 0 : mxy / denom,
        };
      }
    } else {
      const x0 = this.bufferX.front()!;
      const y0 = this.bufferY.front()!;
      const dx = x - this.mx;
      const dy = y - this.my;
      const dx0 = x0 - this.mx;
      const dy0 = y0 - this.my;

      this.mx += (x - x0) * this.weight;
      this.my += (y - y0) * this.weight;
      this.kahanMXY.accum((x - this.mx) * dy - (x0 - this.mx) * dy0);
      this.kahanM2X.accum((x - this.mx) * dx - (x0 - this.mx) * dx0);
      this.kahanM2Y.accum((y - this.my) * dy - (y0 - this.my) * dy0);

      this.bufferX.push(x);
      this.bufferY.push(y);

      const mxy = this.kahanMXY.val;
      const m2x = this.kahanM2X.val;
      const m2y = this.kahanM2Y.val;
      const denom = Math.sqrt(m2x * m2y);

      return {
        meanX: this.mx,
        meanY: this.my,
        covariance: mxy * this.statWeight,
        correlation: denom === 0 ? 0 : mxy / denom,
      };
    }
  }
}

/**
 * Creates Corr closure for functional usage.
 * @param opts Period and ddof configuration
 * @returns Function that processes data and returns {meanX, meanY, covariance, correlation}
 */
export function useCorr(opts: PeriodWith<"period"> & { ddof?: number }): (
  x: number,
  y: number
) => {
  meanX: number;
  meanY: number;
  covariance: number;
  correlation: number;
} {
  const instance = new Corr(opts);
  return (x: number, y: number) => instance.onData(x, y);
}

/**
 * Beta - stateful indicator.
 * Measures the sensitivity of y to changes in x using beta = Cov(x,y) / Var(x).
 * Uses Welford's online algorithm for numerical stability.
 * Supports Delta Degrees of Freedom (ddof) for sample statistics.
 */
export class Beta {
  readonly bufferX: CircularBuffer<number>;
  readonly bufferY: CircularBuffer<number>;
  private readonly kahanMXY: Kahan;
  private readonly kahanM2X: Kahan;
  private mx: number = 0;
  private my: number = 0;
  private ddof: number;
  private weight: number;
  private statWeight: number;

  constructor(opts: PeriodWith<"period"> & { ddof?: number }) {
    this.ddof = opts.ddof ?? 1;
    if (opts.period <= this.ddof) {
      throw new Error("Period should be larger than DDoF.");
    }
    this.bufferX = new CircularBuffer<number>(opts.period);
    this.bufferY = new CircularBuffer<number>(opts.period);
    this.kahanMXY = new Kahan();
    this.kahanM2X = new Kahan();
    this.weight = 1.0 / opts.period;
    this.statWeight = 1.0 / (opts.period - this.ddof);
  }

  /**
   * Process new data point pair.
   * @param x Independent variable value
   * @param y Dependent variable value
   * @returns Object with means, covariance, and beta
   */
  onData(
    x: number,
    y: number
  ): { meanX: number; meanY: number; covariance: number; beta: number } {
    if (!this.bufferX.full()) {
      const n = this.bufferX.size() + 1;
      const a = 1.0 / n;
      const dx = x - this.mx;
      const dy = y - this.my;

      this.mx += dx * a;
      this.my += dy * a;
      this.kahanMXY.accum((x - this.mx) * dy);
      this.kahanM2X.accum((x - this.mx) * dx);

      this.bufferX.push(x);
      this.bufferY.push(y);

      if (n <= this.ddof) {
        return { meanX: this.mx, meanY: this.my, covariance: 0, beta: 0 };
      } else {
        const mxy = this.kahanMXY.val;
        const m2x = this.kahanM2X.val;
        const covariance = mxy / (n - this.ddof);
        const beta = m2x > 0 ? mxy / m2x : 0;
        return { meanX: this.mx, meanY: this.my, covariance, beta };
      }
    } else {
      const x0 = this.bufferX.front()!;
      const y0 = this.bufferY.front()!;
      const dx = x - this.mx;
      const dy = y - this.my;
      const dx0 = x0 - this.mx;
      const dy0 = y0 - this.my;

      this.mx += (x - x0) * this.weight;
      this.my += (y - y0) * this.weight;
      this.kahanMXY.accum((x - this.mx) * dy - (x0 - this.mx) * dy0);
      this.kahanM2X.accum((x - this.mx) * dx - (x0 - this.mx) * dx0);

      this.bufferX.push(x);
      this.bufferY.push(y);

      const mxy = this.kahanMXY.val;
      const m2x = this.kahanM2X.val;
      const covariance = mxy * this.statWeight;
      const beta = m2x > 0 ? mxy / m2x : 0;

      return { meanX: this.mx, meanY: this.my, covariance, beta };
    }
  }
}

/**
 * Creates Beta closure for functional usage.
 * @param opts Period and ddof configuration
 * @returns Function that processes data and returns {meanX, meanY, covariance, beta}
 */
export function useBeta(
  opts: PeriodWith<"period"> & { ddof?: number }
): (
  x: number,
  y: number
) => { meanX: number; meanY: number; covariance: number; beta: number } {
  const instance = new Beta(opts);
  return (x: number, y: number) => instance.onData(x, y);
}
