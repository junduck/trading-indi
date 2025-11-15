import type { BarData } from "../src/types/BarData.js";

/**
 * Generates a sequence of numbers with optional step
 */
export function sequence(
  start: number,
  count: number,
  step: number = 1
): number[] {
  return Array.from({ length: count }, (_, i) => start + i * step);
}

/**
 * Generates constant values
 */
export function constant(value: number, count: number): number[] {
  return Array(count).fill(value);
}

/**
 * Generates alternating values
 */
export function alternating(
  low: number,
  high: number,
  count: number
): number[] {
  return Array.from({ length: count }, (_, i) => (i % 2 === 0 ? low : high));
}

/**
 * Generates simple bar data with OHLC values
 */
export function generateBars(config: {
  count: number;
  basePrice?: number;
  volatility?: number;
  trend?: number;
}): BarData[] {
  const { count, basePrice = 100, volatility = 10, trend = 0 } = config;
  const bars: BarData[] = [];

  for (let i = 0; i < count; i++) {
    const trendPrice = basePrice + trend * i;
    const open = trendPrice + (Math.random() - 0.5) * volatility;
    const close = trendPrice + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + (Math.random() * volatility) / 2;
    const low = Math.min(open, close) - (Math.random() * volatility) / 2;
    const volume = 1000 + Math.random() * 1000;

    bars.push({
      open,
      high,
      low,
      close,
      volume,
    });
  }

  return bars;
}

/**
 * Generates simple bar data with fixed OHLC pattern
 */
export function generateSimpleBars(
  count: number,
  basePrice: number = 100
): BarData[] {
  return Array.from({ length: count }, (_, i) => {
    const price = basePrice + i * 10;
    return {
      timestamp: Date.now() + i * 60000,
      open: price,
      high: price + 5,
      low: price - 5,
      close: price + 2,
      volume: 1000,
    };
  });
}

/**
 * Compares two numbers with tolerance
 */
export function closeTo(
  actual: number,
  expected: number,
  epsilon: number = 1e-8
): boolean {
  return Math.abs(actual - expected) < epsilon;
}

/**
 * Compares arrays element by element
 */
export function arraysClose(
  actual: number[],
  expected: number[],
  epsilon: number = 1e-10
): boolean {
  if (actual.length !== expected.length) return false;
  return actual.every((val, i) => closeTo(val, expected[i], epsilon));
}

/**
 * Calculates simple moving average (for test validation)
 */
export function naiveSMA(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, x) => sum + x, 0) / values.length;
}

/**
 * Calculates simple statistics (for test validation)
 */
export function naiveStats(
  values: number[],
  ddof: number = 0
): {
  mean: number;
  variance: number;
  stddev: number;
} {
  if (values.length === 0) {
    return { mean: 0, variance: 0, stddev: 0 };
  }

  const mean = naiveSMA(values);
  const sumSquares = values.reduce((sum, x) => sum + (x - mean) ** 2, 0);
  const variance = sumSquares / Math.max(1, values.length - ddof);

  return {
    mean,
    variance,
    stddev: Math.sqrt(variance),
  };
}

/**
 * Finds min and max in array
 */
export function naiveMinMax(
  values: number[]
): { min: number; max: number } | undefined {
  if (values.length === 0) return undefined;

  let min = values[0];
  let max = values[0];

  for (const val of values) {
    if (val < min) min = val;
    if (val > max) max = val;
  }

  return { min, max };
}

/**
 * Creates a sliding window from array
 */
export function slidingWindow<T>(arr: T[], windowSize: number): T[][] {
  const windows: T[][] = [];
  for (let i = 0; i <= arr.length - windowSize; i++) {
    windows.push(arr.slice(i, i + windowSize));
  }
  return windows;
}
