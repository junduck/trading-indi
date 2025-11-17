import { describe, it, expect } from "vitest";
import { SMA } from "../src/fn/Foundation.js";

function naiveSMA(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  return values.reduce((sum, x) => sum + x, 0) / n;
}

describe("SMA", () => {
  it("should match naive SMA during fill phase", () => {
    const sma = new SMA({ period: 5 });
    const values: number[] = [];
    const testData = [10, 20, 30, 40];

    for (const x of testData) {
      values.push(x);
      const result = sma.onData(x);
      const expected = naiveSMA(values);
      expect(result).toBeCloseTo(expected);
    }
  });

  it("should match naive SMA during rolling phase", () => {
    const period = 4;
    const sma = new SMA({ period });
    const testData = [10, 20, 30, 40, 50, 60, 70, 80];
    const values: number[] = [];

    for (let i = 0; i < testData.length; i++) {
      const x = testData[i];
      values.push(x);
      if (values.length > period) {
        values.shift();
      }
      const result = sma.onData(x);
      const expected = naiveSMA(values);
      expect(result).toBeCloseTo(expected);
    }
  });

  it("should handle constant values", () => {
    const sma = new SMA({ period: 4 });
    const testData = [100, 100, 100, 100, 100];

    for (const x of testData) {
      const result = sma.onData(x);
      expect(result).toBe(100);
    }
  });

  it("should calculate SMA for simple pattern", () => {
    const sma = new SMA({ period: 4 });
    const testData = [0, 2, 4, 6];
    const values: number[] = [];

    for (const x of testData) {
      values.push(x);
      const result = sma.onData(x);
      const expected = naiveSMA(values);
      expect(result).toBeCloseTo(expected);
    }
  });

  it("should handle rolling window transitions", () => {
    const period = 3;
    const sma = new SMA({ period });
    const testData = [10, 20, 30, 40, 50];
    const values: number[] = [];

    for (const x of testData) {
      values.push(x);
      if (values.length > period) {
        values.shift();
      }
      const result = sma.onData(x);
      const expected = naiveSMA(values);
      expect(result).toBeCloseTo(expected);
    }
  });

  it("should handle period of 1", () => {
    const sma = new SMA({ period: 1 });
    const testData = [10, 20, 30];

    for (const x of testData) {
      const result = sma.onData(x);
      expect(result).toBe(x);
    }
  });
});
