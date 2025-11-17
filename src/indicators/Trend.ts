import type { BarWith } from "../types/BarData.js";
import type { PeriodWith } from "../types/PeriodOptions.js";
import { CircularBuffer } from "../fn/Containers.js";
import { EMA, SMA, Sum } from "../fn/Foundation.js";
import { ATR, PriceChannel } from "./Volatility.js";
import { wilders_factor } from "../utils/math.js";

/**
 * Aroon Indicator - identifies trend changes and strength.
 * Measures time elapsed since highest high and lowest low.
 */
export class AROON {
  private highs: CircularBuffer<number>;
  private lows: CircularBuffer<number>;
  private period: number;

  constructor(opts: PeriodWith<"period">) {
    this.period = opts.period;
    this.highs = new CircularBuffer(opts.period + 1);
    this.lows = new CircularBuffer(opts.period + 1);
  }

  /**
   * Process new bar data.
   * @param bar Bar data with high and low
   * @returns Object with up and down values (0-100 scale)
   */
  onData(bar: BarWith<"high" | "low">): {
    up: number;
    down: number;
  } {
    this.highs.push(bar.high);
    this.lows.push(bar.low);

    if (!this.highs.full()) {
      return { up: 0, down: 0 };
    }

    let highIdx = 0;
    let lowIdx = 0;
    let highest = this.highs.at(0)!;
    let lowest = this.lows.at(0)!;

    for (let i = 1; i < this.highs.size(); i++) {
      const h = this.highs.at(i)!;
      const l = this.lows.at(i)!;
      if (h >= highest) {
        highest = h;
        highIdx = i;
      }
      if (l <= lowest) {
        lowest = l;
        lowIdx = i;
      }
    }

    const periodsSinceHigh = this.highs.size() - 1 - highIdx;
    const periodsSinceLow = this.lows.size() - 1 - lowIdx;

    const up = ((this.period - periodsSinceHigh) / this.period) * 100;
    const down = ((this.period - periodsSinceLow) / this.period) * 100;
    return { up, down };
  }
}

/**
 * Creates AROON closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns {up, down}
 */
export function useAROON(opts: PeriodWith<"period">): (
  bar: BarWith<"high" | "low">
) => {
  up: number;
  down: number;
} {
  const instance = new AROON(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Aroon Oscillator - difference between Aroon Up and Aroon Down.
 * Ranges from -100 to +100, indicating trend direction and strength.
 */
export class AROONOSC {
  private aroon: AROON;

  constructor(opts: PeriodWith<"period">) {
    this.aroon = new AROON(opts);
  }

  /**
   * Process new bar data.
   * @param bar Bar data with high and low
   * @returns Aroon oscillator value (-100 to +100)
   */
  onData(bar: BarWith<"high" | "low">): number {
    const { up, down } = this.aroon.onData(bar);
    return up - down;
  }
}

/**
 * Creates AROONOSC closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns AROONOSC
 */
export function useAROONOSC(
  opts: PeriodWith<"period">
): (bar: BarWith<"high" | "low">) => number {
  const instance = new AROONOSC(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Commodity Channel Index - measures deviation from average price.
 * Calculates (TP - SMA(TP)) / (0.015 * mean_deviation).
 */
export class CCI {
  private buffer: CircularBuffer<number>;
  private sma: SMA;

  constructor(opts: PeriodWith<"period">) {
    this.buffer = new CircularBuffer(opts.period);
    this.sma = new SMA(opts);
  }

  /**
   * Process new bar data.
   * @param bar Bar data with high, low, and close
   * @returns CCI value
   */
  onData(bar: BarWith<"high" | "low" | "close">): number {
    const tp = (bar.high + bar.low + bar.close) / 3;
    this.buffer.push(tp);
    const mean = this.sma.onData(tp);

    if (!this.buffer.full()) {
      return 0;
    }

    let md = 0;
    for (const val of this.buffer) {
      md += Math.abs(val - mean);
    }
    md /= this.buffer.capacity();

    return md !== 0 ? (tp - mean) / (0.015 * md) : 0;
  }
}

/**
 * Creates CCI closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns CCI
 */
export function useCCI(
  opts: PeriodWith<"period">
): (bar: BarWith<"high" | "low" | "close">) => number {
  const instance = new CCI(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Vertical Horizontal Filter - distinguishes trending from ranging markets.
 * Calculates ratio of price range to sum of price changes.
 */
export class VHF {
  private buffer: CircularBuffer<number>;

  constructor(opts: PeriodWith<"period">) {
    this.buffer = new CircularBuffer(opts.period);
  }

  /**
   * Process new bar data.
   * @param bar Bar data with close price
   * @returns VHF value (higher indicates stronger trend)
   */
  onData(bar: BarWith<"close">): number {
    this.buffer.push(bar.close);
    if (!this.buffer.full()) {
      return 0;
    }

    let highest = -Infinity;
    let lowest = Infinity;
    let sumChanges = 0;

    for (let i = 0; i < this.buffer.size(); i++) {
      const val = this.buffer.at(i)!;
      if (val > highest) highest = val;
      if (val < lowest) lowest = val;
      if (i > 0) {
        sumChanges += Math.abs(val - this.buffer.at(i - 1)!);
      }
    }

    const numerator = Math.abs(highest - lowest);
    return sumChanges !== 0 ? numerator / sumChanges : 0;
  }
}

/**
 * Creates VHF closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns VHF
 */
export function useVHF(
  opts: PeriodWith<"period">
): (bar: BarWith<"close">) => number {
  const instance = new VHF(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Directional Movement - measures directional price movement strength.
 * Calculates smoothed +DM (upward) and -DM (downward) movements.
 */
export class DM {
  private emaPlus: EMA;
  private emaMinus: EMA;
  private prevHigh?: number;
  private prevLow?: number;

  constructor(opts: PeriodWith<"period">) {
    this.emaPlus = new EMA({ alpha: wilders_factor(opts.period) });
    this.emaMinus = new EMA({ alpha: wilders_factor(opts.period) });
  }

  /**
   * Process new bar data.
   * @param bar Bar data with high and low
   * @returns Object with plus (upward) and minus (downward) directional movements
   */
  onData(bar: BarWith<"high" | "low">): { plus: number; minus: number } {
    if (this.prevHigh === undefined || this.prevLow === undefined) {
      this.prevHigh = bar.high;
      this.prevLow = bar.low;
      const plus = this.emaPlus.onData(0);
      const minus = this.emaMinus.onData(0);
      return { plus, minus };
    }

    const upMove = bar.high - this.prevHigh;
    const downMove = this.prevLow - bar.low;

    let plusDM = 0;
    let minusDM = 0;

    if (upMove > 0 && upMove > downMove) {
      plusDM = upMove;
    }
    if (downMove > 0 && downMove > upMove) {
      minusDM = downMove;
    }

    this.prevHigh = bar.high;
    this.prevLow = bar.low;

    const plus = this.emaPlus.onData(plusDM);
    const minus = this.emaMinus.onData(minusDM);

    return { plus, minus };
  }
}

/**
 * Creates DM closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns {plus, minus}
 */
export function useDM(
  opts: PeriodWith<"period">
): (bar: BarWith<"high" | "low">) => { plus: number; minus: number } {
  const instance = new DM(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Directional Indicator - normalized directional movement strength.
 * Calculates DI+ and DI- by dividing directional movements by ATR.
 */
export class DI {
  private dm: DM;
  private atr: ATR;

  constructor(opts: PeriodWith<"period">) {
    this.dm = new DM(opts);
    this.atr = new ATR(opts);
  }

  /**
   * Process new bar data.
   * @param bar Bar data with high, low, and close
   * @returns Object with plus (DI+) and minus (DI-) indicators (0-100 scale)
   */
  onData(bar: BarWith<"high" | "low" | "close">): {
    plus: number;
    minus: number;
  } {
    const dmValue = this.dm.onData(bar);
    const atrValue = this.atr.onData(bar);

    if (atrValue === 0) {
      return { plus: 0, minus: 0 };
    }

    return {
      plus: (dmValue.plus / atrValue) * 100,
      minus: (dmValue.minus / atrValue) * 100,
    };
  }
}

/**
 * Creates DI closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns {plus, minus}
 */
export function useDI(opts: PeriodWith<"period">): (
  bar: BarWith<"high" | "low" | "close">
) => {
  plus: number;
  minus: number;
} {
  const instance = new DI(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Directional Index - measures trend strength regardless of direction.
 * Calculated as the ratio of difference to sum of DI+ and DI-.
 */
export class DX {
  private di: DI;

  constructor(opts: PeriodWith<"period">) {
    this.di = new DI(opts);
  }

  /**
   * Process new bar data.
   * @param bar Bar data with high, low, and close
   * @returns DX value (0-100 scale)
   */
  onData(bar: BarWith<"high" | "low" | "close">): number {
    const diValue = this.di.onData(bar);
    const sum = diValue.plus + diValue.minus;

    if (sum === 0) {
      return 0;
    }

    const diff = Math.abs(diValue.plus - diValue.minus);
    return (diff / sum) * 100;
  }
}

/**
 * Creates DX closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns DX
 */
export function useDX(
  opts: PeriodWith<"period">
): (bar: BarWith<"high" | "low" | "close">) => number {
  const instance = new DX(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Average Directional Index - smoothed trend strength indicator.
 * Applies EMA smoothing to DX values to measure trend strength.
 */
export class ADX {
  private dx: DX;
  private ema: EMA;

  constructor(opts: PeriodWith<"period">) {
    this.dx = new DX(opts);
    this.ema = new EMA({ alpha: wilders_factor(opts.period) });
  }

  /**
   * Process new bar data.
   * @param bar Bar data with high, low, and close
   * @returns ADX value (0-100 scale)
   */
  onData(bar: BarWith<"high" | "low" | "close">): number {
    const dxValue = this.dx.onData(bar);
    return this.ema.onData(dxValue);
  }
}

/**
 * Creates ADX closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns ADX
 */
export function useADX(
  opts: PeriodWith<"period">
): (bar: BarWith<"high" | "low" | "close">) => number {
  const instance = new ADX(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Average Directional Index Rating - measures trend strength with lag smoothing.
 * Averages current ADX with ADX from n-1 periods ago for additional smoothing.
 */
export class ADXR {
  private adx: ADX;
  private buffer: CircularBuffer<number>;

  constructor(opts: PeriodWith<"period">) {
    this.adx = new ADX(opts);
    this.buffer = new CircularBuffer<number>(opts.period);
  }

  /**
   * Process new bar data.
   * @param bar Bar data with high, low, and close
   * @returns ADXR value (0-100 scale)
   */
  onData(bar: BarWith<"high" | "low" | "close">): number {
    const adxValue = this.adx.onData(bar);
    this.buffer.push(adxValue);

    if (!this.buffer.full()) {
      return adxValue;
    }

    const oldAdx = this.buffer.front()!;
    return (adxValue + oldAdx) / 2;
  }
}

/**
 * Creates ADXR closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns ADXR
 */
export function useADXR(
  opts: PeriodWith<"period">
): (bar: BarWith<"high" | "low" | "close">) => number {
  const instance = new ADXR(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Parabolic SAR - stop and reverse indicator.
 * Pure heuristic trailing stop.
 */
export class SAR {
  private af: number;
  private maxAf: number;
  private isLong: boolean = true;
  private sar?: number;
  private ep?: number;
  private prevHigh?: number;
  private prevLow?: number;
  private prevPrevHigh?: number | undefined; // Added
  private prevPrevLow?: number | undefined; // Added
  private afIncrement: number;

  constructor(opts?: { acceleration?: number; maximum?: number }) {
    this.af = opts?.acceleration ?? 0.02;
    this.afIncrement = opts?.acceleration ?? 0.02;
    this.maxAf = opts?.maximum ?? 0.2;
  }

  /**
   * Process new bar data.
   * @param bar Bar with high and low
   * @returns Current SAR value (stop level)
   */
  onData(bar: BarWith<"high" | "low">): number {
    if (this.sar === undefined) {
      this.sar = bar.low;
      this.ep = bar.high;
      this.prevHigh = bar.high;
      this.prevLow = bar.low;
      return this.sar;
    }

    const prevSar = this.sar;

    if (this.isLong) {
      this.sar = prevSar + this.af * (this.ep! - prevSar);

      if (bar.low < this.sar) {
        this.isLong = false;
        // this.sar = this.ep!;
        // Don't penetrate current bar
        this.sar = Math.max(this.ep!, bar.high);
        this.ep = bar.low;
        this.af = this.afIncrement;
      } else {
        if (bar.high > this.ep!) {
          this.ep = bar.high;
          this.af = Math.min(this.af + this.afIncrement, this.maxAf);
        }

        // SAR must not be above prior two lows
        const minLow =
          this.prevPrevLow !== undefined
            ? Math.min(this.prevLow!, this.prevPrevLow)
            : this.prevLow!;

        this.sar = Math.min(this.sar, minLow);
      }
    } else {
      this.sar = prevSar + this.af * (this.ep! - prevSar);

      if (bar.high > this.sar) {
        this.isLong = true;
        // this.sar = this.ep!;
        // Don't penetrate current bar
        this.sar = Math.min(this.ep!, bar.low);
        this.ep = bar.high;
        this.af = this.afIncrement;
      } else {
        if (bar.low < this.ep!) {
          this.ep = bar.low;
          this.af = Math.min(this.af + this.afIncrement, this.maxAf);
        }

        // SAR must not be below prior two highs
        const maxHigh =
          this.prevPrevHigh !== undefined
            ? Math.max(this.prevHigh!, this.prevPrevHigh)
            : this.prevHigh!;

        this.sar = Math.max(this.sar, maxHigh);
      }
    }

    this.prevPrevHigh = this.prevHigh;
    this.prevPrevLow = this.prevLow;
    this.prevHigh = bar.high;
    this.prevLow = bar.low;

    return this.sar;
  }
}

/**
 * Creates SAR closure for functional usage.
 * @param opts Acceleration and maximum configuration
 * @returns Function that processes bar data and returns SAR
 */
export function useSAR(opts?: {
  acceleration?: number;
  maximum?: number;
}): (bar: BarWith<"high" | "low">) => number {
  const instance = new SAR(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Vortex Indicator - identifies trend start and end.
 * Measures positive and negative vortex movement.
 */
export class VI {
  private prevLow?: number;
  private prevHigh?: number;
  private preClose?: number;
  private vm_minus_sum: Sum;
  private vm_plus_sum: Sum;
  private tr_sum: Sum;

  constructor(opts: PeriodWith<"period">) {
    this.vm_minus_sum = new Sum(opts);
    this.vm_plus_sum = new Sum(opts);
    this.tr_sum = new Sum(opts);
  }

  /**
   * Process new bar data.
   * @param bar Bar with high, low, close
   * @returns Object with vi_plus and vi_minus
   */
  onData(bar: BarWith<"high" | "low" | "close">): {
    vi_plus: number;
    vi_minus: number;
  } {
    const { high, low, close } = bar;
    if (this.prevLow === undefined) {
      this.prevHigh = high;
      this.prevLow = low;
      this.preClose = close;
      return {
        vi_plus: 0,
        vi_minus: 0,
      };
    }

    const vm_plus = Math.abs(high - this.prevLow);
    const vm_minus = Math.abs(low - this.prevHigh!);
    const tr = Math.max(
      high - low,
      Math.abs(high - this.preClose!),
      Math.abs(low - this.preClose!)
    );

    const tr_sum = this.tr_sum.onData(tr);
    if (tr_sum === 0) {
      return { vi_plus: 0, vi_minus: 0 };
    }

    const vm_plus_sum = this.vm_plus_sum.onData(vm_plus);
    const vm_minus_sum = this.vm_minus_sum.onData(vm_minus);

    return {
      vi_plus: vm_plus_sum / tr_sum,
      vi_minus: vm_minus_sum / tr_sum,
    };
  }
}

/**
 * Creates VI closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns Vortex Indicator
 */
export function useVI(opts: PeriodWith<"period">): (
  bar: BarWith<"high" | "low" | "close">
) => {
  vi_plus: number;
  vi_minus: number;
} {
  const instance = new VI(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Ichimoku Cloud - comprehensive trend indicator.
 * Provides multiple components for support/resistance and trend analysis.
 */
export class ICHIMOKU {
  private tenkanChannel: PriceChannel;
  private kijunChannel: PriceChannel;
  private senkouChannel: PriceChannel;
  private chikouBuffer: CircularBuffer<number>;

  constructor(opts?: {
    tenkan_period?: number;
    kijun_period?: number;
    senkou_b_period?: number;
    displacement?: number;
  }) {
    const tenkanPeriod = opts?.tenkan_period ?? 9;
    const kijunPeriod = opts?.kijun_period ?? 26;
    const senkouPeriod = opts?.senkou_b_period ?? 52;
    const displacement = opts?.displacement ?? 26;

    this.tenkanChannel = new PriceChannel({ period: tenkanPeriod });
    this.kijunChannel = new PriceChannel({ period: kijunPeriod });
    this.senkouChannel = new PriceChannel({ period: senkouPeriod });
    this.chikouBuffer = new CircularBuffer(displacement);
  }

  /**
   * Process new bar data.
   * @param bar Bar with high, low, close
   * @returns Ichimoku components
   */
  onData(bar: BarWith<"high" | "low" | "close">): {
    tenkan: number;
    kijun: number;
    senkou_a: number;
    senkou_b: number;
    chikou: number;
  } {
    const tenkanHL = this.tenkanChannel.onData(bar);
    const kijunHL = this.kijunChannel.onData(bar);
    const senkouHL = this.senkouChannel.onData(bar);
    this.chikouBuffer.push(bar.close);

    const tenkan = (tenkanHL.upper + tenkanHL.lower) / 2;
    const kijun = (kijunHL.upper + kijunHL.lower) / 2;
    const senkou_b = (senkouHL.upper + senkouHL.lower) / 2;
    const senkou_a = (tenkan + kijun) / 2;
    const chikou = this.chikouBuffer.full()
      ? this.chikouBuffer.front()!
      : bar.close;

    return { tenkan, kijun, senkou_a, senkou_b, chikou };
  }
}

/**
 * Creates ICHIMOKU closure for functional usage.
 * @param opts Ichimoku period configuration
 * @returns Function that processes bar data and returns Ichimoku components
 */
export function useICHIMOKU(opts?: {
  tenkan_period?: number;
  kijun_period?: number;
  senkou_b_period?: number;
  displacement?: number;
}): (bar: BarWith<"high" | "low" | "close">) => {
  tenkan: number;
  kijun: number;
  senkou_a: number;
  senkou_b: number;
  chikou: number;
} {
  const instance = new ICHIMOKU(opts);
  return (bar) => instance.onData(bar);
}
