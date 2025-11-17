import { describe, it, expect } from "vitest";
import { MinMax, useMinMax } from "../src/fn/Foundation.js";

function naiveMinMax(
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

describe("MinMax", () => {
  it("should match naive MinMax during fill phase", () => {
    const minmax = new MinMax({ period: 5 });
    const values: number[] = [];
    const testData = [10, 30, 20, 40];

    for (const x of testData) {
      values.push(x);
      const result = minmax.onData(x);
      const expected = naiveMinMax(values)!;
      expect(result.min).toBe(expected.min);
      expect(result.max).toBe(expected.max);
    }
  });

  it("should match naive MinMax during rolling phase", () => {
    const period = 4;
    const minmax = new MinMax({ period });
    const testData = [10, 30, 20, 40, 50, 60, 10, 80];
    const values: number[] = [];

    for (let i = 0; i < testData.length; i++) {
      const x = testData[i];
      values.push(x);
      if (values.length > period) {
        values.shift();
      }
      const result = minmax.onData(x);
      const expected = naiveMinMax(values)!;
      expect(result.min).toBe(expected.min);
      expect(result.max).toBe(expected.max);
    }
  });

  it("should handle constant values", () => {
    const minmax = new MinMax({ period: 4 });
    const testData = [100, 100, 100, 100, 100];

    for (const x of testData) {
      const result = minmax.onData(x);
      expect(result.min).toBe(100);
      expect(result.max).toBe(100);
    }
  });

  it("should track min correctly when old min exits window", () => {
    const minmax = new MinMax({ period: 3 });

    minmax.onData(10);
    minmax.onData(20);
    minmax.onData(30);

    let result = minmax.onData(40);
    expect(result.min).toBe(20);
    expect(result.max).toBe(40);

    result = minmax.onData(50);
    expect(result.min).toBe(30);
    expect(result.max).toBe(50);
  });

  it("should track max correctly when old max exits window", () => {
    const minmax = new MinMax({ period: 3 });

    minmax.onData(40);
    minmax.onData(30);
    minmax.onData(20);

    let result = minmax.onData(10);
    expect(result.min).toBe(10);
    expect(result.max).toBe(30);

    result = minmax.onData(5);
    expect(result.min).toBe(5);
    expect(result.max).toBe(20);
  });

  it("should handle ascending sequence", () => {
    const minmax = new MinMax({ period: 4 });
    const testData = [10, 20, 30, 40, 50, 60];

    for (let i = 0; i < testData.length; i++) {
      const result = minmax.onData(testData[i]);
      expect(result.min).toBe(testData[Math.max(0, i - 3)]);
      expect(result.max).toBe(testData[i]);
    }
  });

  it("should handle descending sequence", () => {
    const minmax = new MinMax({ period: 4 });
    const testData = [60, 50, 40, 30, 20, 10];

    for (let i = 0; i < testData.length; i++) {
      const result = minmax.onData(testData[i]);
      expect(result.min).toBe(testData[i]);
      expect(result.max).toBe(testData[Math.max(0, i - 3)]);
    }
  });

  it("should handle zigzag pattern", () => {
    const period = 4;
    const minmax = new MinMax({ period });
    const testData = [10, 80, 20, 60, 30, 50];
    const values: number[] = [];

    for (let i = 0; i < testData.length; i++) {
      const x = testData[i];
      values.push(x);
      if (values.length > period) {
        values.shift();
      }
      const result = minmax.onData(x);
      const expected = naiveMinMax(values)!;
      expect(result.min).toBe(expected.min);
      expect(result.max).toBe(expected.max);
    }
  });

  it("should handle period of 1", () => {
    const minmax = new MinMax({ period: 1 });
    const testData = [10, 20, 30, 5, 40];

    for (const x of testData) {
      const result = minmax.onData(x);
      expect(result.min).toBe(x);
      expect(result.max).toBe(x);
    }
  });

  it("should handle rolling window transitions", () => {
    const period = 3;
    const minmax = new MinMax({ period });
    const testData = [10, 5, 20, 15, 30];
    const values: number[] = [];

    for (const x of testData) {
      values.push(x);
      if (values.length > period) {
        values.shift();
      }
      const result = minmax.onData(x);
      const expected = naiveMinMax(values)!;
      expect(result.min).toBe(expected.min);
      expect(result.max).toBe(expected.max);
    }
  });

  it("should throw error when period is missing", () => {
    expect(() => new MinMax({} as any)).toThrow("MinMax requires period");
  });
});

describe("useMinMax", () => {
  it("should work as functional closure", () => {
    const minmaxFn = useMinMax({ period: 4 });
    const testData = [10, 30, 20, 40, 50];
    const values: number[] = [];

    for (let i = 0; i < testData.length; i++) {
      const x = testData[i];
      values.push(x);
      if (values.length > 4) {
        values.shift();
      }
      const result = minmaxFn(x);
      const expected = naiveMinMax(values)!;
      expect(result.min).toBe(expected.min);
      expect(result.max).toBe(expected.max);
    }
  });

  it("should maintain state between calls", () => {
    const minmaxFn = useMinMax({ period: 3 });

    let result = minmaxFn(10);
    expect(result.min).toBe(10);
    expect(result.max).toBe(10);

    result = minmaxFn(20);
    expect(result.min).toBe(10);
    expect(result.max).toBe(20);

    result = minmaxFn(5);
    expect(result.min).toBe(5);
    expect(result.max).toBe(20);

    result = minmaxFn(30);
    expect(result.min).toBe(5);
    expect(result.max).toBe(30);
  });
});
