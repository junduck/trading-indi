import type { BarWith } from "../types/BarData.js";
import type { PeriodWith } from "../types/PeriodOptions.js";
import { Stddev } from "../classes/Foundation.js";
import { CircularBuffer } from "../classes/Containers.js";

/**
 * Z-Score - statistical measure of deviation from mean.
 * Measures how many standard deviations a value is from the mean.
 */
export class ZSCORE {
  private stddev: Stddev;

  constructor(opts: PeriodWith<"period">) {
    this.stddev = new Stddev({ period: opts.period, ddof: 0 });
  }

  /**
   * Process new data point.
   * @param bar Bar with close price
   * @returns Z-Score value
   */
  onData(bar: BarWith<"close">): number {
    const { mean, stddev } = this.stddev.onData(bar.close);
    if (stddev === 0) {
      return 0;
    }

    return (bar.close - mean) / stddev;
  }
}

/**
 * Creates ZSCORE closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns Z-Score
 */
export function useZSCORE(
  opts: PeriodWith<"period">
): (bar: BarWith<"close">) => number {
  const instance = new ZSCORE(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Correlation - measures correlation between two price series.
 */
export class CORRELATION {
  private buffer1: CircularBuffer<number>;
  private buffer2: CircularBuffer<number>;

  constructor(opts: PeriodWith<"period">) {
    this.buffer1 = new CircularBuffer(opts.period);
    this.buffer2 = new CircularBuffer(opts.period);
  }

  /**
   * Process new data points.
   * @param price1 First price series value
   * @param price2 Second price series value
   * @returns Correlation coefficient (-1 to +1)
   */
  onData(price1: number, price2: number): number {
    this.buffer1.push(price1);
    this.buffer2.push(price2);

    if (!this.buffer1.full()) {
      return 0;
    }

    const n = this.buffer1.size();
    let sum1 = 0;
    let sum2 = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;
    let sumProduct = 0;

    for (let i = 0; i < n; i++) {
      const val1 = this.buffer1.at(i)!;
      const val2 = this.buffer2.at(i)!;
      sum1 += val1;
      sum2 += val2;
      sum1Sq += val1 * val1;
      sum2Sq += val2 * val2;
      sumProduct += val1 * val2;
    }

    const numerator = n * sumProduct - sum1 * sum2;
    const denominator = Math.sqrt(
      (n * sum1Sq - sum1 * sum1) * (n * sum2Sq - sum2 * sum2)
    );

    return denominator !== 0 ? numerator / denominator : 0;
  }
}

/**
 * Creates CORRELATION closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes two prices and returns correlation
 */
export function useCORRELATION(
  opts: PeriodWith<"period">
): (price1: number, price2: number) => number {
  const instance = new CORRELATION(opts);
  return (price1, price2) => instance.onData(price1, price2);
}

/**
 * Beta - measures volatility relative to benchmark.
 */
export class BETA {
  private buffer: CircularBuffer<{ asset: number; benchmark: number }>;
  private prevAsset?: number;
  private prevBenchmark?: number;

  constructor(opts: PeriodWith<"period">) {
    this.buffer = new CircularBuffer(opts.period);
  }

  /**
   * Process new data points.
   * @param assetPrice Asset price
   * @param benchmarkPrice Benchmark price
   * @returns Beta coefficient
   */
  onData(assetPrice: number, benchmarkPrice: number): number {
    if (this.prevAsset === undefined || this.prevBenchmark === undefined) {
      this.prevAsset = assetPrice;
      this.prevBenchmark = benchmarkPrice;
      return 1;
    }

    const assetReturn =
      this.prevAsset !== 0 ? (assetPrice - this.prevAsset) / this.prevAsset : 0;
    const benchmarkReturn =
      this.prevBenchmark !== 0
        ? (benchmarkPrice - this.prevBenchmark) / this.prevBenchmark
        : 0;

    this.buffer.push({ asset: assetReturn, benchmark: benchmarkReturn });
    this.prevAsset = assetPrice;
    this.prevBenchmark = benchmarkPrice;

    if (!this.buffer.full()) {
      return 1;
    }

    let sumAsset = 0;
    let sumBenchmark = 0;
    let sumProduct = 0;
    let sumBenchmarkSq = 0;

    for (const item of this.buffer) {
      sumAsset += item.asset;
      sumBenchmark += item.benchmark;
      sumProduct += item.asset * item.benchmark;
      sumBenchmarkSq += item.benchmark * item.benchmark;
    }

    const n = this.buffer.size();
    const covariance = sumProduct / n - (sumAsset * sumBenchmark) / (n * n);
    const variance =
      sumBenchmarkSq / n - (sumBenchmark * sumBenchmark) / (n * n);

    return variance !== 0 ? covariance / variance : 1;
  }
}

/**
 * Creates BETA closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes asset and benchmark prices and returns Beta
 */
export function useBETA(
  opts: PeriodWith<"period">
): (assetPrice: number, benchmarkPrice: number) => number {
  const instance = new BETA(opts);
  return (assetPrice, benchmarkPrice) =>
    instance.onData(assetPrice, benchmarkPrice);
}
