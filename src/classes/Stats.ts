import type { PeriodOptions, PeriodWith } from "../types/PeriodOptions.js";
import { exp_factor, Kahan } from "../utils/math.js";
import { CircularBuffer } from "./Containers.js";

/**
 * Exponentially Weighted Variance - stateful indicator.
 * Tracks both mean and variance with alpha = 2/(period+1).
 */
export class VarianceEW {
  private m?: number;
  private s2: number = 0;
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
      return { mean: this.m, variance: this.s2 };
    }
    const d = x - this.m;
    this.m += d * this.alpha;
    const d2 = x - this.m;
    this.s2 += (d * d2 - this.s2) * this.alpha;
    return { mean: this.m, variance: this.s2 };
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

/**
 * Covariance - stateful indicator.
 * Uses Welford's online algorithm for two variables.
 * Supports Delta Degrees of Freedom (ddof) for sample covariance.
 */
export class Cov {
  readonly bufferX: CircularBuffer<number>;
  readonly bufferY: CircularBuffer<number>;
  private readonly kahanMXY: Kahan;
  private mx: number = 0;
  private my: number = 0;
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
    this.kahanMXY = new Kahan();
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
      const dy = y - this.my;

      this.mx += (x - this.mx) * a;
      this.my += dy * a;
      this.kahanMXY.add((x - this.mx) * dy);

      this.bufferX.push(x);
      this.bufferY.push(y);

      if (n <= this.ddof) {
        return { meanX: this.mx, meanY: this.my, covariance: 0 };
      } else {
        return {
          meanX: this.mx,
          meanY: this.my,
          covariance: this.kahanMXY.sum / (n - this.ddof),
        };
      }
    } else {
      const x0 = this.bufferX.front()!;
      const y0 = this.bufferY.front()!;
      const dy = y - this.my;
      const dy0 = y0 - this.my;

      this.mx += (x - x0) * this.weight;
      this.my += (y - y0) * this.weight;
      this.kahanMXY.add((x - this.mx) * dy - (x0 - this.mx) * dy0);

      this.bufferX.push(x);
      this.bufferY.push(y);

      return {
        meanX: this.mx,
        meanY: this.my,
        covariance: this.kahanMXY.sum * this.covWeight,
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
      this.kahanMXY.add((x - this.mx) * dy);
      this.kahanM2X.add((x - this.mx) * dx);
      this.kahanM2Y.add((y - this.my) * dy);

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
        const mxy = this.kahanMXY.sum;
        const m2x = this.kahanM2X.sum;
        const m2y = this.kahanM2Y.sum;
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
      this.kahanMXY.add((x - this.mx) * dy - (x0 - this.mx) * dy0);
      this.kahanM2X.add((x - this.mx) * dx - (x0 - this.mx) * dx0);
      this.kahanM2Y.add((y - this.my) * dy - (y0 - this.my) * dy0);

      this.bufferX.push(x);
      this.bufferY.push(y);

      const mxy = this.kahanMXY.sum;
      const m2x = this.kahanM2X.sum;
      const m2y = this.kahanM2Y.sum;
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
      this.kahanMXY.add((x - this.mx) * dy);
      this.kahanM2X.add((x - this.mx) * dx);

      this.bufferX.push(x);
      this.bufferY.push(y);

      if (n <= this.ddof) {
        return { meanX: this.mx, meanY: this.my, covariance: 0, beta: 0 };
      } else {
        const mxy = this.kahanMXY.sum;
        const m2x = this.kahanM2X.sum;
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
      this.kahanMXY.add((x - this.mx) * dy - (x0 - this.mx) * dy0);
      this.kahanM2X.add((x - this.mx) * dx - (x0 - this.mx) * dx0);

      this.bufferX.push(x);
      this.bufferY.push(y);

      const mxy = this.kahanMXY.sum;
      const m2x = this.kahanM2X.sum;
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
