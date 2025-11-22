import type { BarWith } from "../types/BarData.js";
import {
  SMA as CoreSMA,
  EMA as CoreEMA,
  EWMA as CoreEWMA,
  CircularBuffer,
} from "@junduck/trading-core";
import { type OperatorDoc } from "../types/OpDoc.js";

/**
 * Simple Moving Average - stateful indicator.
 * Calculates arithmetic mean of close prices over period.
 */
export class SMA {
  private readonly core: CoreSMA;
  readonly buffer: CircularBuffer<number>;

  constructor(opts: { period: number }) {
    this.core = new CoreSMA(opts);
    this.buffer = this.core.buffer;
  }

  update(close: number): number {
    return this.core.update(close);
  }

  onData(bar: BarWith<"close">): number {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "SMA",
    init: "{period: number}",
    update: "close",
    output: "number",
  };
}

/**
 * Creates SMA closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns SMA
 */
export function useSMA(opts: {
  period: number;
}): (bar: BarWith<"close">) => number {
  const instance = new SMA(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Exponential Moving Average - stateful indicator.
 * Applies exponential smoothing with alpha = 2/(period+1) on close prices.
 */
export class EMA {
  private readonly core: CoreEMA;

  constructor(opts: { period: number } | { alpha: number }) {
    this.core = new CoreEMA(opts);
  }

  update(close: number): number {
    return this.core.update(close);
  }

  onData(bar: BarWith<"close">): number {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "EMA",
    init: "{period?: number, alpha?: number}",
    update: "close",
    output: "number",
  };
}

/**
 * Creates EMA closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns EMA
 */
export function useEMA(
  opts: { period: number } | { alpha: number }
): (bar: BarWith<"close">) => number {
  const instance = new EMA(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Exponentially Weighted Moving Average - stateful indicator.
 * Maintains sliding window with exponentially decaying weights on close prices.
 */
export class EWMA {
  private readonly core: CoreEWMA;
  readonly buffer: CircularBuffer<number>;

  constructor(opts: { period: number }) {
    this.core = new CoreEWMA(opts);
    this.buffer = this.core.buffer;
  }

  update(close: number): number {
    return this.core.update(close);
  }

  onData(bar: BarWith<"close">): number {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "EWMA",
    init: "{period: number}",
    update: "close",
    output: "number",
  };
}

/**
 * Creates EWMA closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns EWMA
 */
export function useEWMA(opts: {
  period: number;
}): (bar: BarWith<"close">) => number {
  const instance = new EWMA(opts);
  return (bar) => instance.onData(bar);
}
