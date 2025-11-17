import { describe, it, expect } from "vitest";
import { Beta, useBeta } from "../src/fn/Stats.js";

function naiveBeta(
  valuesX: number[],
  valuesY: number[],
  ddof: number = 1
): { meanX: number; meanY: number; covariance: number; beta: number } {
  const n = valuesX.length;
  if (n === 0) return { meanX: 0, meanY: 0, covariance: 0, beta: 0 };

  const meanX = valuesX.reduce((sum, x) => sum + x, 0) / n;
  const meanY = valuesY.reduce((sum, y) => sum + y, 0) / n;

  if (n <= ddof) {
    return { meanX, meanY, covariance: 0, beta: 0 };
  }

  const sumCrossProduct = valuesX.reduce(
    (sum, x, i) => sum + (x - meanX) * (valuesY[i] - meanY),
    0
  );
  const sumSquaredX = valuesX.reduce((sum, x) => sum + (x - meanX) ** 2, 0);

  const covariance = sumCrossProduct / (n - ddof);
  const beta = sumSquaredX > 0 ? sumCrossProduct / sumSquaredX : 0;

  return { meanX, meanY, covariance, beta };
}

describe("Beta", () => {
  it("should match naive beta during fill phase with ddof=1", () => {
    const beta = new Beta({ period: 5, ddof: 1 });
    const valuesX: number[] = [];
    const valuesY: number[] = [];
    const testDataX = [10, 20, 30, 40];
    const testDataY = [100, 200, 300, 400];

    for (let i = 0; i < testDataX.length; i++) {
      valuesX.push(testDataX[i]);
      valuesY.push(testDataY[i]);
      const result = beta.onData(testDataX[i], testDataY[i]);
      const expected = naiveBeta(valuesX, valuesY, 1);
      expect(result.meanX).toBeCloseTo(expected.meanX);
      expect(result.meanY).toBeCloseTo(expected.meanY);
      expect(result.covariance).toBeCloseTo(expected.covariance);
      expect(result.beta).toBeCloseTo(expected.beta);
    }
  });

  it("should match naive beta during rolling phase with ddof=1", () => {
    const period = 4;
    const beta = new Beta({ period, ddof: 1 });
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
      const result = beta.onData(testDataX[i], testDataY[i]);
      const expected = naiveBeta(valuesX, valuesY, 1);
      expect(result.meanX).toBeCloseTo(expected.meanX);
      expect(result.meanY).toBeCloseTo(expected.meanY);
      expect(result.covariance).toBeCloseTo(expected.covariance);
      expect(result.beta).toBeCloseTo(expected.beta);
    }
  });

  it("should match naive beta with ddof=0", () => {
    const period = 4;
    const beta = new Beta({ period, ddof: 0 });
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
      const result = beta.onData(testDataX[i], testDataY[i]);
      const expected = naiveBeta(valuesX, valuesY, 0);
      expect(result.meanX).toBeCloseTo(expected.meanX);
      expect(result.meanY).toBeCloseTo(expected.meanY);
      expect(result.covariance).toBeCloseTo(expected.covariance);
      expect(result.beta).toBeCloseTo(expected.beta);
    }
  });

  it("should return zero beta when x has no variance", () => {
    const beta = new Beta({ period: 4, ddof: 1 });

    const result1 = beta.onData(10, 100);
    const result2 = beta.onData(10, 200);
    const result3 = beta.onData(10, 300);
    const result4 = beta.onData(10, 400);

    expect(result4.meanX).toBe(10);
    expect(result4.meanY).toBe(250);
    expect(result4.beta).toBe(0);
  });

  it("should handle positive correlation", () => {
    const beta = new Beta({ period: 4, ddof: 1 });
    const testDataX = [10, 20, 30, 40];
    const testDataY = [100, 200, 300, 400];

    for (let i = 0; i < testDataX.length; i++) {
      const result = beta.onData(testDataX[i], testDataY[i]);
      if (i >= 1) {
        expect(result.beta).toBeGreaterThan(0);
      }
    }
  });

  it("should handle negative correlation", () => {
    const beta = new Beta({ period: 4, ddof: 1 });
    const testDataX = [10, 20, 30, 40];
    const testDataY = [400, 300, 200, 100];

    for (let i = 0; i < testDataX.length; i++) {
      const result = beta.onData(testDataX[i], testDataY[i]);
      if (i >= 1) {
        expect(result.beta).toBeLessThan(0);
      }
    }
  });

  it("should handle rolling window transitions", () => {
    const period = 3;
    const beta = new Beta({ period, ddof: 1 });
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
      const result = beta.onData(testDataX[i], testDataY[i]);
      const expected = naiveBeta(valuesX, valuesY, 1);
      expect(result.meanX).toBeCloseTo(expected.meanX);
      expect(result.meanY).toBeCloseTo(expected.meanY);
      expect(result.covariance).toBeCloseTo(expected.covariance);
      expect(result.beta).toBeCloseTo(expected.beta);
    }
  });

  it("should calculate beta=10 for simple pattern", () => {
    const beta = new Beta({ period: 4, ddof: 0 });
    const testDataX = [0, 2, 4, 6];
    const testDataY = [0, 20, 40, 60];
    const valuesX: number[] = [];
    const valuesY: number[] = [];

    for (let i = 0; i < testDataX.length; i++) {
      valuesX.push(testDataX[i]);
      valuesY.push(testDataY[i]);
      const result = beta.onData(testDataX[i], testDataY[i]);
      const expected = naiveBeta(valuesX, valuesY, 0);
      expect(result.meanX).toBeCloseTo(expected.meanX);
      expect(result.meanY).toBeCloseTo(expected.meanY);
      expect(result.covariance).toBeCloseTo(expected.covariance);
      expect(result.beta).toBeCloseTo(expected.beta);
    }

    const valuesX2 = [0, 2, 4, 6];
    const valuesY2 = [0, 20, 40, 60];
    const expected = naiveBeta(valuesX2, valuesY2, 0);
    expect(expected.beta).toBeCloseTo(10);
  });

  it("should work with functional usage", () => {
    const betaFn = useBeta({ period: 4, ddof: 1 });
    const testDataX = [10, 20, 30, 40];
    const testDataY = [100, 200, 300, 400];

    let result;
    for (let i = 0; i < testDataX.length; i++) {
      result = betaFn(testDataX[i], testDataY[i]);
    }

    expect(result?.meanX).toBeCloseTo(25);
    expect(result?.meanY).toBeCloseTo(250);
    expect(result?.beta).toBeCloseTo(10);
  });
});
