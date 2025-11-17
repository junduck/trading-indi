import type { PeriodOptions, PeriodWith } from "../types/PeriodOptions.js";
import type { BarWith } from "../types/BarData.js";
import * as fn from "../fn/Foundation.js";

/**
 * Simple Moving Average - stateful indicator.
 * Calculates arithmetic mean of close prices over period.
 */
export class SMA {
  private readonly core: fn.SMA;

  constructor(opts: PeriodWith<"period">) {
    this.core = new fn.SMA(opts);
  }

  /**
   * Process new bar data.
   * @param bar Bar data with close price
   * @returns Current SMA value
   */
  onData(bar: BarWith<"close">): number {
    return this.core.onData(bar.close);
  }
}

/**
 * Creates SMA closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns SMA
 */
export function useSMA(
  opts: PeriodWith<"period">
): (bar: BarWith<"close">) => number {
  const instance = new SMA(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Exponential Moving Average - stateful indicator.
 * Applies exponential smoothing with alpha = 2/(period+1) on close prices.
 */
export class EMA {
  private readonly core: fn.EMA;

  constructor(opts: PeriodOptions & { alpha?: number }) {
    this.core = new fn.EMA(opts);
  }

  /**
   * Process new bar data.
   * @param bar Bar data with close price
   * @returns Current EMA value
   */
  onData(bar: BarWith<"close">): number {
    return this.core.onData(bar.close);
  }
}

/**
 * Creates EMA closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns EMA
 */
export function useEMA(
  opts: PeriodOptions & { alpha?: number }
): (bar: BarWith<"close">) => number {
  const instance = new EMA(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Exponentially Weighted Moving Average - stateful indicator.
 * Maintains sliding window with exponentially decaying weights on close prices.
 */
export class EWMA {
  private readonly core: fn.EWMA;

  constructor(opts: PeriodWith<"period">) {
    this.core = new fn.EWMA(opts);
  }

  /**
   * Process new bar data.
   * @param bar Bar data with close price
   * @returns Current EWMA value
   */
  onData(bar: BarWith<"close">): number {
    return this.core.onData(bar.close);
  }
}

/**
 * Creates EWMA closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns EWMA
 */
export function useEWMA(
  opts: PeriodWith<"period">
): (bar: BarWith<"close">) => number {
  const instance = new EWMA(opts);
  return (bar) => instance.onData(bar);
}
