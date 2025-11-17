import { describe, it, expect } from "vitest";
import { EMA, useEMA } from "../src/fn/Foundation.js";

function naiveEMA(values: number[], period: number): number[] {
  const alpha = 2 / (period + 1);
  const results: number[] = [];
  let ema: number | undefined;

  for (const x of values) {
    if (ema === undefined) {
      ema = x;
    } else {
      ema = alpha * x + (1 - alpha) * ema;
    }
    results.push(ema);
  }
  return results;
}

describe("EMA", () => {
  it("should match naive EMA calculation", () => {
    const period = 5;
    const ema = new EMA({ period });
    const testData = [10, 20, 30, 40, 50, 60, 70, 80];
    const expected = naiveEMA(testData, period);

    for (let i = 0; i < testData.length; i++) {
      const result = ema.onData(testData[i]);
      expect(result).toBeCloseTo(expected[i]);
    }
  });

  it("should initialize with first value", () => {
    const ema = new EMA({ period: 10 });
    const result = ema.onData(100);
    expect(result).toBe(100);
  });

  it("should handle constant values", () => {
    const ema = new EMA({ period: 5 });
    const testData = [100, 100, 100, 100, 100];

    for (const x of testData) {
      const result = ema.onData(x);
      expect(result).toBe(100);
    }
  });

  it("should smooth values with correct alpha", () => {
    const period = 2;
    const alpha = 2 / (period + 1);
    const ema = new EMA({ period });

    const first = ema.onData(10);
    expect(first).toBe(10);

    const second = ema.onData(20);
    const expected = alpha * 20 + (1 - alpha) * 10;
    expect(second).toBeCloseTo(expected);
  });

  it("should handle upward trend", () => {
    const period = 4;
    const ema = new EMA({ period });
    const testData = [10, 20, 40, 80, 160];
    const expected = naiveEMA(testData, period);

    for (let i = 0; i < testData.length; i++) {
      const result = ema.onData(testData[i]);
      expect(result).toBeCloseTo(expected[i]);
    }
  });

  it("should handle downward trend", () => {
    const period = 4;
    const ema = new EMA({ period });
    const testData = [160, 80, 40, 20, 10];
    const expected = naiveEMA(testData, period);

    for (let i = 0; i < testData.length; i++) {
      const result = ema.onData(testData[i]);
      expect(result).toBeCloseTo(expected[i]);
    }
  });

  it("should handle period of 1", () => {
    const ema = new EMA({ period: 1 });
    const testData = [10, 20, 30, 40];

    for (const x of testData) {
      const result = ema.onData(x);
      expect(result).toBe(x);
    }
  });

  it("should throw error when period is missing", () => {
    expect(() => new EMA({} as any)).toThrow("EMA requires period");
  });
});

describe("useEMA", () => {
  it("should work as functional closure", () => {
    const emaFn = useEMA({ period: 5 });
    const testData = [10, 20, 30, 40, 50];
    const expected = naiveEMA(testData, 5);

    for (let i = 0; i < testData.length; i++) {
      const result = emaFn(testData[i]);
      expect(result).toBeCloseTo(expected[i]);
    }
  });

  it("should maintain state between calls", () => {
    const emaFn = useEMA({ period: 2 });

    const first = emaFn(10);
    expect(first).toBe(10);

    const second = emaFn(20);
    const alpha = 2 / 3;
    expect(second).toBeCloseTo(alpha * 20 + (1 - alpha) * 10);
  });
});
