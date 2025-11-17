import { describe, it, expect } from "vitest";
import { EWMA } from "../src/fn/Foundation.js";

class NaiveEWMA {
  private readonly period: number;
  private readonly weights: number[];
  private readonly values: number[] = [];
  private totalWeight: number = 0;

  constructor(period: number) {
    this.period = period;
    const alpha = 2 / (period + 1);
    const a1 = 1 - alpha;

    this.weights = new Array(period);
    let w = 1;
    for (let i = 0; i < period; i++) {
      this.weights[period - 1 - i] = w;
      w *= a1;
    }
  }

  onData(x: number): number {
    this.values.push(x);
    if (this.values.length > this.period) {
      this.values.shift();
    }

    const n = this.values.length;
    if (n <= this.period) {
      this.totalWeight = 0;
      for (let i = 0; i < n; i++) {
        this.totalWeight += this.weights[this.period - n + i];
      }
    }

    let weightedSum = 0;
    for (let i = 0; i < n; i++) {
      weightedSum += this.values[i] * this.weights[this.period - n + i];
    }

    return weightedSum / this.totalWeight;
  }
}

describe("EWMA", () => {
  it("should match naive EWMA during fill phase", () => {
    const period = 5;
    const ewma = new EWMA({ period });
    const naive = new NaiveEWMA(period);
    const testData = [10, 20, 30, 40];

    for (const x of testData) {
      const result = ewma.onData(x);
      const expected = naive.onData(x);
      expect(result).toBeCloseTo(expected);
    }
  });

  it("should match naive EWMA during rolling phase", () => {
    const period = 4;
    const ewma = new EWMA({ period });
    const naive = new NaiveEWMA(period);
    const testData = [10, 20, 30, 40, 50, 60, 70, 80];

    for (const x of testData) {
      const result = ewma.onData(x);
      const expected = naive.onData(x);
      expect(result).toBeCloseTo(expected);
    }
  });

  it("should handle constant values", () => {
    const ewma = new EWMA({ period: 4 });
    const testData = [100, 100, 100, 100, 100];

    for (const x of testData) {
      const result = ewma.onData(x);
      expect(result).toBeCloseTo(100);
    }
  });

  it("should calculate EWMA for simple pattern", () => {
    const period = 4;
    const ewma = new EWMA({ period });
    const naive = new NaiveEWMA(period);
    const testData = [0, 10, 20, 30];

    for (const x of testData) {
      const result = ewma.onData(x);
      const expected = naive.onData(x);
      expect(result).toBeCloseTo(expected);
    }
  });

  it("should handle rolling window transitions", () => {
    const period = 3;
    const ewma = new EWMA({ period });
    const naive = new NaiveEWMA(period);
    const testData = [10, 20, 30, 40, 50];

    for (const x of testData) {
      const result = ewma.onData(x);
      const expected = naive.onData(x);
      expect(result).toBeCloseTo(expected);
    }
  });

  it("should handle period of 1", () => {
    const ewma = new EWMA({ period: 1 });
    const testData = [10, 20, 30];

    for (const x of testData) {
      const result = ewma.onData(x);
      expect(result).toBe(x);
    }
  });

  it("should weight recent values more heavily", () => {
    const period = 10;
    const ewma = new EWMA({ period });
    const naive = new NaiveEWMA(period);
    const testData = [100, 100, 100, 100, 100, 200, 200, 200, 200, 200];

    for (const x of testData) {
      const result = ewma.onData(x);
      const expected = naive.onData(x);
      expect(result).toBeCloseTo(expected);
    }

    const lastResult = ewma.onData(200);
    expect(lastResult).toBeGreaterThan(150);
  });

  it("should match naive EWMA with generated data", () => {
    const period = 8;
    const ewma = new EWMA({ period });
    const naive = new NaiveEWMA(period);
    const testData = Array.from({ length: 20 }, (_, i) => 10 + i * 2);

    for (const x of testData) {
      const result = ewma.onData(x);
      const expected = naive.onData(x);
      expect(result).toBeCloseTo(expected);
    }
  });
});
