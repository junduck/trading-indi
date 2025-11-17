import { describe, it, expect } from "vitest";
import { MeanAD } from "../src/fn/StatsDeviation.js";

function naiveMeanAD(values: number[]): { mean: number; mad: number } {
  const n = values.length;
  if (n === 0) return { mean: 0, mad: 0 };

  const mean = values.reduce((sum, x) => sum + x, 0) / n;
  const sumAbsDev = values.reduce((sum, x) => sum + Math.abs(x - mean), 0);

  return { mean, mad: sumAbsDev / n };
}

describe("MeanAD", () => {
  it("should match naive MAD during fill phase", () => {
    const mad = new MeanAD({ period: 5 });
    const values: number[] = [];
    const testData = [10, 20, 30, 40];

    for (const x of testData) {
      values.push(x);
      const result = mad.onData(x);
      const expected = naiveMeanAD(values);
      expect(result.mean).toBeCloseTo(expected.mean);
      expect(result.mad).toBeCloseTo(expected.mad);
    }
  });

  it("should match naive MAD during rolling phase", () => {
    const period = 4;
    const mad = new MeanAD({ period });
    const testData = [10, 20, 30, 40, 50, 60, 70, 80];
    const values: number[] = [];

    for (let i = 0; i < testData.length; i++) {
      const x = testData[i];
      values.push(x);
      if (values.length > period) {
        values.shift();
      }
      const result = mad.onData(x);
      const expected = naiveMeanAD(values);
      expect(result.mean).toBeCloseTo(expected.mean);
      expect(result.mad).toBeCloseTo(expected.mad);
    }
  });

  it("should handle constant values", () => {
    const mad = new MeanAD({ period: 4 });
    const testData = [100, 100, 100, 100, 100];

    for (const x of testData) {
      const result = mad.onData(x);
      expect(result.mean).toBe(100);
      expect(result.mad).toBe(0);
    }
  });

  it("should calculate MAD for simple pattern", () => {
    const mad = new MeanAD({ period: 4 });
    const testData = [10, 20, 30, 40];
    const values: number[] = [];
    let lastResult = { mean: 0, mad: 0 };

    for (const x of testData) {
      values.push(x);
      lastResult = mad.onData(x);
      const expected = naiveMeanAD(values);
      expect(lastResult.mean).toBeCloseTo(expected.mean);
      expect(lastResult.mad).toBeCloseTo(expected.mad);
    }

    expect(lastResult.mean).toBeCloseTo(25);
    expect(lastResult.mad).toBeCloseTo(10);
  });

  it("should match naive MAD with random generated sequence", () => {
    const period = 10;
    const mad = new MeanAD({ period });
    const values: number[] = [];

    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 1000;
      values.push(x);
      if (values.length > period) {
        values.shift();
      }
      const result = mad.onData(x);
      const expected = naiveMeanAD(values);
      expect(result.mean).toBeCloseTo(expected.mean);
      expect(result.mad).toBeCloseTo(expected.mad);
    }
  });

  it("should handle rolling window transitions", () => {
    const period = 3;
    const mad = new MeanAD({ period });
    const testData = [10, 20, 30, 40, 50];
    const values: number[] = [];

    for (const x of testData) {
      values.push(x);
      if (values.length > period) {
        values.shift();
      }
      const result = mad.onData(x);
      const expected = naiveMeanAD(values);
      expect(result.mean).toBeCloseTo(expected.mean);
      expect(result.mad).toBeCloseTo(expected.mad);
    }
  });

  it("should handle period of 1", () => {
    const mad = new MeanAD({ period: 1 });
    const testData = [10, 20, 30];

    for (const x of testData) {
      const result = mad.onData(x);
      expect(result.mean).toBe(x);
      expect(result.mad).toBe(0);
    }
  });

  it("should handle negative values", () => {
    const period = 4;
    const mad = new MeanAD({ period });
    const testData = [-10, -20, 10, 20];
    const values: number[] = [];

    for (const x of testData) {
      values.push(x);
      const result = mad.onData(x);
      const expected = naiveMeanAD(values);
      expect(result.mean).toBeCloseTo(expected.mean);
      expect(result.mad).toBeCloseTo(expected.mad);
    }
  });
});
