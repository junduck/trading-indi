import { describe, it, expect } from "vitest";
import { Cov } from "../src/fn/Stats.js";

function naiveCov(
  valuesX: number[],
  valuesY: number[],
  ddof: number = 1
): { meanX: number; meanY: number; covariance: number } {
  const n = valuesX.length;
  if (n === 0) return { meanX: 0, meanY: 0, covariance: 0 };

  const meanX = valuesX.reduce((sum, x) => sum + x, 0) / n;
  const meanY = valuesY.reduce((sum, y) => sum + y, 0) / n;

  if (n <= ddof) {
    return { meanX, meanY, covariance: 0 };
  }

  const sumCrossProduct = valuesX.reduce(
    (sum, x, i) => sum + (x - meanX) * (valuesY[i] - meanY),
    0
  );

  return { meanX, meanY, covariance: sumCrossProduct / (n - ddof) };
}

describe("Cov", () => {
  it("should match naive cov during fill phase with ddof=1", () => {
    const cov = new Cov({ period: 5, ddof: 1 });
    const valuesX: number[] = [];
    const valuesY: number[] = [];
    const testDataX = [10, 20, 30, 40];
    const testDataY = [100, 200, 300, 400];

    for (let i = 0; i < testDataX.length; i++) {
      valuesX.push(testDataX[i]);
      valuesY.push(testDataY[i]);
      const result = cov.onData(testDataX[i], testDataY[i]);
      const expected = naiveCov(valuesX, valuesY, 1);
      expect(result.meanX).toBeCloseTo(expected.meanX);
      expect(result.meanY).toBeCloseTo(expected.meanY);
      expect(result.covariance).toBeCloseTo(expected.covariance);
    }
  });

  it("should match naive cov during rolling phase with ddof=1", () => {
    const period = 4;
    const cov = new Cov({ period, ddof: 1 });
    const testDataX = [10, 20, 30, 40, 50, 60, 70, 80];
    const testDataY = [100, 200, 300, 400, 500, 600, 700, 800];
    const valuesX: number[] = [];
    const valuesY: number[] = [];

    for (let i = 0; i < testDataX.length; i++) {
      valuesX.push(testDataX[i]);
      valuesY.push(testDataY[i]);
      if (valuesX.length > period) {
        valuesX.shift();
        valuesY.shift();
      }
      const result = cov.onData(testDataX[i], testDataY[i]);
      const expected = naiveCov(valuesX, valuesY, 1);
      expect(result.meanX).toBeCloseTo(expected.meanX);
      expect(result.meanY).toBeCloseTo(expected.meanY);
      expect(result.covariance).toBeCloseTo(expected.covariance);
    }
  });

  it("should match naive cov with ddof=0", () => {
    const period = 4;
    const cov = new Cov({ period, ddof: 0 });
    const testDataX = [10, 20, 30, 40, 50, 60];
    const testDataY = [100, 200, 300, 400, 500, 600];
    const valuesX: number[] = [];
    const valuesY: number[] = [];

    for (let i = 0; i < testDataX.length; i++) {
      valuesX.push(testDataX[i]);
      valuesY.push(testDataY[i]);
      if (valuesX.length > period) {
        valuesX.shift();
        valuesY.shift();
      }
      const result = cov.onData(testDataX[i], testDataY[i]);
      const expected = naiveCov(valuesX, valuesY, 0);
      expect(result.meanX).toBeCloseTo(expected.meanX);
      expect(result.meanY).toBeCloseTo(expected.meanY);
      expect(result.covariance).toBeCloseTo(expected.covariance);
    }
  });

  it("should handle positive correlation", () => {
    const cov = new Cov({ period: 4, ddof: 1 });
    const testDataX = [10, 20, 30, 40];
    const testDataY = [100, 200, 300, 400];

    for (let i = 0; i < testDataX.length; i++) {
      const result = cov.onData(testDataX[i], testDataY[i]);
      if (i >= 1) {
        expect(result.covariance).toBeGreaterThan(0);
      }
    }
  });

  it("should handle negative correlation", () => {
    const cov = new Cov({ period: 4, ddof: 1 });
    const testDataX = [10, 20, 30, 40];
    const testDataY = [400, 300, 200, 100];

    for (let i = 0; i < testDataX.length; i++) {
      const result = cov.onData(testDataX[i], testDataY[i]);
      if (i >= 1) {
        expect(result.covariance).toBeLessThan(0);
      }
    }
  });

  it("should handle constant values", () => {
    const cov = new Cov({ period: 4, ddof: 1 });
    const testData = [100, 100, 100, 100, 100];

    for (const x of testData) {
      const result = cov.onData(x, x);
      expect(result.meanX).toBe(100);
      expect(result.meanY).toBe(100);
      if (result.covariance !== 0) {
        expect(result.covariance).toBeCloseTo(0);
      }
    }
  });

  it("should handle uncorrelated data", () => {
    const cov = new Cov({ period: 4, ddof: 1 });
    const testDataX = [10, 20, 10, 20];
    const testDataY = [100, 100, 200, 200];
    const valuesX: number[] = [];
    const valuesY: number[] = [];

    for (let i = 0; i < testDataX.length; i++) {
      valuesX.push(testDataX[i]);
      valuesY.push(testDataY[i]);
      const result = cov.onData(testDataX[i], testDataY[i]);
      const expected = naiveCov(valuesX, valuesY, 1);
      expect(result.covariance).toBeCloseTo(expected.covariance);
    }
  });

  it("should handle rolling window transitions", () => {
    const period = 3;
    const cov = new Cov({ period, ddof: 1 });
    const testDataX = [10, 20, 30, 40, 50];
    const testDataY = [100, 200, 300, 400, 500];
    const valuesX: number[] = [];
    const valuesY: number[] = [];

    for (let i = 0; i < testDataX.length; i++) {
      valuesX.push(testDataX[i]);
      valuesY.push(testDataY[i]);
      if (valuesX.length > period) {
        valuesX.shift();
        valuesY.shift();
      }
      const result = cov.onData(testDataX[i], testDataY[i]);
      const expected = naiveCov(valuesX, valuesY, 1);
      expect(result.meanX).toBeCloseTo(expected.meanX);
      expect(result.meanY).toBeCloseTo(expected.meanY);
      expect(result.covariance).toBeCloseTo(expected.covariance);
    }
  });

  it("should calculate covariance for simple pattern", () => {
    const cov = new Cov({ period: 4, ddof: 0 });
    const testDataX = [0, 2, 4, 6];
    const testDataY = [0, 4, 8, 12];
    const valuesX: number[] = [];
    const valuesY: number[] = [];

    for (let i = 0; i < testDataX.length; i++) {
      valuesX.push(testDataX[i]);
      valuesY.push(testDataY[i]);
      const result = cov.onData(testDataX[i], testDataY[i]);
      const expected = naiveCov(valuesX, valuesY, 0);
      expect(result.meanX).toBeCloseTo(expected.meanX);
      expect(result.meanY).toBeCloseTo(expected.meanY);
      expect(result.covariance).toBeCloseTo(expected.covariance);
    }
  });
});
