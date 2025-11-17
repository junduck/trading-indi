import { describe, it, expect } from "vitest";
import { Corr } from "../src/fn/Stats.js";

function naiveCorr(
  valuesX: number[],
  valuesY: number[],
  ddof: number = 1
): {
  meanX: number;
  meanY: number;
  covariance: number;
  correlation: number;
} {
  const n = valuesX.length;
  if (n === 0) {
    return { meanX: 0, meanY: 0, covariance: 0, correlation: 0 };
  }

  const meanX = valuesX.reduce((sum, x) => sum + x, 0) / n;
  const meanY = valuesY.reduce((sum, y) => sum + y, 0) / n;

  if (n <= ddof) {
    return { meanX, meanY, covariance: 0, correlation: 0 };
  }

  const sumCrossProduct = valuesX.reduce(
    (sum, x, i) => sum + (x - meanX) * (valuesY[i] - meanY),
    0
  );
  const sumSqX = valuesX.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
  const sumSqY = valuesY.reduce((sum, y) => sum + (y - meanY) ** 2, 0);

  const covariance = sumCrossProduct / (n - ddof);
  const denom = Math.sqrt(sumSqX * sumSqY);
  const correlation = denom === 0 ? 0 : sumCrossProduct / denom;

  return { meanX, meanY, covariance, correlation };
}

describe("Corr", () => {
  it("should match naive corr during fill phase with ddof=1", () => {
    const corr = new Corr({ period: 5, ddof: 1 });
    const valuesX: number[] = [];
    const valuesY: number[] = [];
    const testDataX = [10, 20, 30, 40];
    const testDataY = [100, 200, 300, 400];

    for (let i = 0; i < testDataX.length; i++) {
      valuesX.push(testDataX[i]);
      valuesY.push(testDataY[i]);
      const result = corr.onData(testDataX[i], testDataY[i]);
      const expected = naiveCorr(valuesX, valuesY, 1);
      expect(result.meanX).toBeCloseTo(expected.meanX);
      expect(result.meanY).toBeCloseTo(expected.meanY);
      expect(result.covariance).toBeCloseTo(expected.covariance);
      expect(result.correlation).toBeCloseTo(expected.correlation);
    }
  });

  it("should match naive corr during rolling phase with ddof=1", () => {
    const period = 4;
    const corr = new Corr({ period, ddof: 1 });
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
      const result = corr.onData(testDataX[i], testDataY[i]);
      const expected = naiveCorr(valuesX, valuesY, 1);
      expect(result.meanX).toBeCloseTo(expected.meanX);
      expect(result.meanY).toBeCloseTo(expected.meanY);
      expect(result.covariance).toBeCloseTo(expected.covariance);
      expect(result.correlation).toBeCloseTo(expected.correlation);
    }
  });

  it("should match naive corr with ddof=0", () => {
    const period = 4;
    const corr = new Corr({ period, ddof: 0 });
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
      const result = corr.onData(testDataX[i], testDataY[i]);
      const expected = naiveCorr(valuesX, valuesY, 0);
      expect(result.meanX).toBeCloseTo(expected.meanX);
      expect(result.meanY).toBeCloseTo(expected.meanY);
      expect(result.covariance).toBeCloseTo(expected.covariance);
      expect(result.correlation).toBeCloseTo(expected.correlation);
    }
  });

  it("should handle perfect positive correlation", () => {
    const corr = new Corr({ period: 4, ddof: 1 });
    const testDataX = [10, 20, 30, 40];
    const testDataY = [100, 200, 300, 400];

    for (let i = 0; i < testDataX.length; i++) {
      const result = corr.onData(testDataX[i], testDataY[i]);
      if (i >= 1) {
        expect(result.covariance).toBeGreaterThan(0);
        expect(result.correlation).toBeCloseTo(1);
      }
    }
  });

  it("should handle perfect negative correlation", () => {
    const corr = new Corr({ period: 4, ddof: 1 });
    const testDataX = [10, 20, 30, 40];
    const testDataY = [400, 300, 200, 100];

    for (let i = 0; i < testDataX.length; i++) {
      const result = corr.onData(testDataX[i], testDataY[i]);
      if (i >= 1) {
        expect(result.covariance).toBeLessThan(0);
        expect(result.correlation).toBeCloseTo(-1);
      }
    }
  });

  it("should handle constant values", () => {
    const corr = new Corr({ period: 4, ddof: 1 });
    const testData = [100, 100, 100, 100, 100];

    for (const x of testData) {
      const result = corr.onData(x, x);
      expect(result.meanX).toBe(100);
      expect(result.meanY).toBe(100);
      expect(result.covariance).toBeCloseTo(0);
      expect(result.correlation).toBe(0);
    }
  });

  it("should handle zero variance in one variable", () => {
    const corr = new Corr({ period: 4, ddof: 1 });
    const testDataX = [10, 20, 30, 40];
    const testDataY = [100, 100, 100, 100];
    const valuesX: number[] = [];
    const valuesY: number[] = [];

    for (let i = 0; i < testDataX.length; i++) {
      valuesX.push(testDataX[i]);
      valuesY.push(testDataY[i]);
      const result = corr.onData(testDataX[i], testDataY[i]);
      const expected = naiveCorr(valuesX, valuesY, 1);
      expect(result.correlation).toBe(expected.correlation);
      expect(result.correlation).toBe(0);
    }
  });

  it("should handle longer generated sequence with positive correlation", () => {
    const period = 20;
    const corr = new Corr({ period, ddof: 1 });
    const length = 100;
    const valuesX: number[] = [];
    const valuesY: number[] = [];

    for (let i = 0; i < length; i++) {
      const x = i * 2 + Math.sin(i / 10) * 5;
      const y = i * 3 + Math.cos(i / 10) * 8;
      valuesX.push(x);
      valuesY.push(y);
      if (valuesX.length > period) {
        valuesX.shift();
        valuesY.shift();
      }
      const result = corr.onData(x, y);
      const expected = naiveCorr(valuesX, valuesY, 1);
      expect(result.meanX).toBeCloseTo(expected.meanX, 10);
      expect(result.meanY).toBeCloseTo(expected.meanY, 10);
      expect(result.covariance).toBeCloseTo(expected.covariance, 10);
      expect(result.correlation).toBeCloseTo(expected.correlation, 10);
    }
  });

  it("should handle longer generated sequence with varying correlation", () => {
    const period = 30;
    const corr = new Corr({ period, ddof: 1 });
    const length = 150;
    const valuesX: number[] = [];
    const valuesY: number[] = [];

    for (let i = 0; i < length; i++) {
      const x = Math.sin(i / 5) * 100 + i * 0.5;
      const y = Math.cos(i / 7) * 80 + i * 0.3;
      valuesX.push(x);
      valuesY.push(y);
      if (valuesX.length > period) {
        valuesX.shift();
        valuesY.shift();
      }
      const result = corr.onData(x, y);
      const expected = naiveCorr(valuesX, valuesY, 1);
      expect(result.meanX).toBeCloseTo(expected.meanX, 10);
      expect(result.meanY).toBeCloseTo(expected.meanY, 10);
      expect(result.covariance).toBeCloseTo(expected.covariance, 10);
      expect(result.correlation).toBeCloseTo(expected.correlation, 10);
    }
  });

  it("should handle longer generated sequence with mixed patterns", () => {
    const period = 50;
    const corr = new Corr({ period, ddof: 1 });
    const length = 200;
    const valuesX: number[] = [];
    const valuesY: number[] = [];

    for (let i = 0; i < length; i++) {
      const x = i + Math.random() * 10;
      const y = x * 2 + Math.random() * 20;
      valuesX.push(x);
      valuesY.push(y);
      if (valuesX.length > period) {
        valuesX.shift();
        valuesY.shift();
      }
      const result = corr.onData(x, y);
      const expected = naiveCorr(valuesX, valuesY, 1);
      expect(result.meanX).toBeCloseTo(expected.meanX, 8);
      expect(result.meanY).toBeCloseTo(expected.meanY, 8);
      expect(result.covariance).toBeCloseTo(expected.covariance, 8);
      expect(result.correlation).toBeCloseTo(expected.correlation, 8);
    }
  });

  it("should calculate correlation for simple pattern", () => {
    const corr = new Corr({ period: 4, ddof: 0 });
    const testDataX = [0, 2, 4, 6];
    const testDataY = [0, 4, 8, 12];
    const valuesX: number[] = [];
    const valuesY: number[] = [];

    for (let i = 0; i < testDataX.length; i++) {
      valuesX.push(testDataX[i]);
      valuesY.push(testDataY[i]);
      const result = corr.onData(testDataX[i], testDataY[i]);
      const expected = naiveCorr(valuesX, valuesY, 0);
      expect(result.meanX).toBeCloseTo(expected.meanX);
      expect(result.meanY).toBeCloseTo(expected.meanY);
      expect(result.covariance).toBeCloseTo(expected.covariance);
      expect(result.correlation).toBeCloseTo(expected.correlation);
    }
  });

  it("should handle rolling window transitions", () => {
    const period = 3;
    const corr = new Corr({ period, ddof: 1 });
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
      const result = corr.onData(testDataX[i], testDataY[i]);
      const expected = naiveCorr(valuesX, valuesY, 1);
      expect(result.meanX).toBeCloseTo(expected.meanX);
      expect(result.meanY).toBeCloseTo(expected.meanY);
      expect(result.covariance).toBeCloseTo(expected.covariance);
      expect(result.correlation).toBeCloseTo(expected.correlation);
    }
  });
});
