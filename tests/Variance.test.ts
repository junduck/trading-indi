import { describe, it, expect } from "vitest";
import { Variance } from "../src/fn/Stats.js";

function naiveStats(
  values: number[],
  ddof: number = 0
): { mean: number; variance: number } {
  const n = values.length;
  if (n === 0) return { mean: 0, variance: 0 };
  const mean = values.reduce((sum, x) => sum + x, 0) / n;
  const sumSquares = values.reduce((sum, x) => sum + (x - mean) ** 2, 0);
  return { mean, variance: sumSquares / Math.max(1, n - ddof) };
}

describe("Variance", () => {
  it("should match naive stats during fill phase with ddof=0", () => {
    const variance = new Variance({ period: 5, ddof: 0 });
    const values: number[] = [];
    const testData = [10, 20, 30, 40];

    for (const x of testData) {
      values.push(x);
      const result = variance.onData(x);
      const expected = naiveStats(values, 0);
      expect(result.mean).toBeCloseTo(expected.mean);
      expect(result.variance).toBeCloseTo(expected.variance);
    }
  });

  it("should match naive stats during rolling phase with ddof=0", () => {
    const period = 4;
    const variance = new Variance({ period, ddof: 0 });
    const testData = [10, 20, 30, 40, 50, 60, 70, 80];
    const values: number[] = [];

    for (let i = 0; i < testData.length; i++) {
      const x = testData[i];
      values.push(x);
      if (values.length > period) {
        values.shift();
      }
      const result = variance.onData(x);
      const expected = naiveStats(values, 0);
      expect(result.mean).toBeCloseTo(expected.mean);
      expect(result.variance).toBeCloseTo(expected.variance);
    }
  });

  it("should match naive stats with ddof=1", () => {
    const period = 4;
    const variance = new Variance({ period, ddof: 1 });
    const testData = [10, 20, 30, 40, 50, 60, 70, 80];
    const values: number[] = [];

    for (let i = 0; i < testData.length; i++) {
      const x = testData[i];
      values.push(x);
      if (values.length > period) {
        values.shift();
      }
      const result = variance.onData(x);
      const expected = naiveStats(values, 1);
      expect(result.mean).toBeCloseTo(expected.mean);
      expect(result.variance).toBeCloseTo(expected.variance);
    }
  });

  it("should handle constant values", () => {
    const variance = new Variance({ period: 4, ddof: 0 });
    const testData = [100, 100, 100, 100, 100];

    for (const x of testData) {
      const result = variance.onData(x);
      expect(result.mean).toBe(100);
      expect(result.variance).toBe(0);
    }
  });

  it("should calculate stats for simple pattern", () => {
    const variance = new Variance({ period: 4, ddof: 0 });
    const testData = [0, 2, 4, 6];
    const values: number[] = [];

    for (const x of testData) {
      values.push(x);
      const result = variance.onData(x);
      const expected = naiveStats(values, 0);
      expect(result.mean).toBeCloseTo(expected.mean);
      expect(result.variance).toBeCloseTo(expected.variance);
    }
  });

  it("should handle rolling window transitions", () => {
    const period = 3;
    const variance = new Variance({ period, ddof: 0 });
    const testData = [10, 20, 30, 40, 50];
    const values: number[] = [];

    for (const x of testData) {
      values.push(x);
      if (values.length > period) {
        values.shift();
      }
      const result = variance.onData(x);
      const expected = naiveStats(values, 0);
      expect(result.mean).toBeCloseTo(expected.mean);
      expect(result.variance).toBeCloseTo(expected.variance);
    }
  });
});
