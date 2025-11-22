import type { BarWith } from "../types/BarData.js";
import type { PeriodWith } from "../types/PeriodOptions.js";
import {
  CircularBuffer,
  MeanAbsDeviation,
  RollingArgMax,
  RollingArgMin,
  EMA as CoreEMA,
  RollingMinMax,
  RollingSum,
  wilders_factor,
} from "@junduck/trading-core";
import { ATR, PriceChannel } from "./Volatility.js";
import { type OperatorDoc } from "../types/OpDoc.js";

/**
 * Aroon Indicator - identifies trend changes and strength.
 * Measures time elapsed since highest high and lowest low.
 */
export class AROON {
  private highest: RollingArgMax;
  private lowest: RollingArgMin;
  private period: number;

  constructor(opts: PeriodWith<"period">) {
    this.period = opts.period;
    this.highest = new RollingArgMax(opts);
    this.lowest = new RollingArgMin(opts);
  }

  update(high: number, low: number): { up: number; down: number } {
    const highest = this.highest.update(high);
    const lowest = this.lowest.update(low);

    if (!this.highest.buffer.full()) {
      return { up: 0, down: 0 };
    }

    const up = ((this.period - highest.pos) / this.period) * 100;
    const down = ((this.period - lowest.pos) / this.period) * 100;
    return { up, down };
  }

  onData(bar: BarWith<"high" | "low">): { up: number; down: number } {
    return this.update(bar.high, bar.low);
  }

  static readonly doc: OperatorDoc = {
    type: "AROON",
    init: "{period: number}",
    update: "high, low",
    output: "{up, down}",
  };
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

  update(high: number, low: number): number {
    const { up, down } = this.aroon.update(high, low);
    return up - down;
  }

  onData(bar: BarWith<"high" | "low">): number {
    return this.update(bar.high, bar.low);
  }

  static readonly doc: OperatorDoc = {
    type: "AROONOSC",
    init: "{period: number}",
    update: "high, low",
    output: "number",
  };
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
  private mad: MeanAbsDeviation;

  constructor(opts: PeriodWith<"period">) {
    this.mad = new MeanAbsDeviation(opts);
  }

  update(high: number, low: number, close: number): number {
    const tp = (high + low + close) / 3;

    const { mean, mad } = this.mad.update(tp);

    if (!this.mad.buffer.full()) {
      return 0;
    }

    return mad !== 0 ? (tp - mean) / (0.015 * mad) : 0;
  }

  onData(bar: BarWith<"high" | "low" | "close">): number {
    return this.update(bar.high, bar.low, bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "CCI",
    init: "{period: number}",
    update: "high, low, close",
    output: "number",
  };
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
  private minmax: RollingMinMax;
  private sum: RollingSum;
  private preClose?: number;

  constructor(opts: PeriodWith<"period">) {
    this.minmax = new RollingMinMax(opts);
    this.sum = new RollingSum(opts);
  }

  update(close: number): number {
    if (this.preClose === undefined) {
      this.preClose = close;
      return 0;
    }

    const minmax = this.minmax.update(close);
    const sum = this.sum.update(Math.abs(close - this.preClose));

    if (!this.sum.buffer.full()) {
      return 0;
    }

    const numerator = minmax.max - minmax.min;
    return sum !== 0 ? numerator / sum : 0;
  }

  onData(bar: BarWith<"close">): number {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "VHF",
    init: "{period: number}",
    update: "close",
    output: "number",
  };
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
  private emaPlus: CoreEMA;
  private emaMinus: CoreEMA;
  private prevHigh?: number;
  private prevLow?: number;

  constructor(opts: PeriodWith<"period">) {
    this.emaPlus = new CoreEMA({ alpha: wilders_factor(opts.period) });
    this.emaMinus = new CoreEMA({ alpha: wilders_factor(opts.period) });
  }

  update(high: number, low: number): { plus: number; minus: number } {
    if (this.prevHigh === undefined || this.prevLow === undefined) {
      this.prevHigh = high;
      this.prevLow = low;
      const plus = this.emaPlus.update(0);
      const minus = this.emaMinus.update(0);
      return { plus, minus };
    }

    const upMove = high - this.prevHigh;
    const downMove = this.prevLow - low;

    let plusDM = 0;
    let minusDM = 0;

    if (upMove > 0 && upMove > downMove) {
      plusDM = upMove;
    }
    if (downMove > 0 && downMove > upMove) {
      minusDM = downMove;
    }

    this.prevHigh = high;
    this.prevLow = low;

    const plus = this.emaPlus.update(plusDM);
    const minus = this.emaMinus.update(minusDM);

    return { plus, minus };
  }

  onData(bar: BarWith<"high" | "low">): { plus: number; minus: number } {
    return this.update(bar.high, bar.low);
  }

  static readonly doc: OperatorDoc = {
    type: "DM",
    init: "{period: number}",
    update: "high, low",
    output: "{plus, minus}",
  };
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

  update(
    high: number,
    low: number,
    close: number
  ): { plus: number; minus: number } {
    const dmValue = this.dm.update(high, low);
    const atrValue = this.atr.update(high, low, close);

    if (atrValue === 0) {
      return { plus: 0, minus: 0 };
    }

    return {
      plus: (dmValue.plus / atrValue) * 100,
      minus: (dmValue.minus / atrValue) * 100,
    };
  }

  onData(bar: BarWith<"high" | "low" | "close">): {
    plus: number;
    minus: number;
  } {
    return this.update(bar.high, bar.low, bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "DI",
    init: "{period: number}",
    update: "high, low, close",
    output: "{plus, minus}",
  };
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

  update(high: number, low: number, close: number): number {
    const diValue = this.di.update(high, low, close);
    const sum = diValue.plus + diValue.minus;

    if (sum === 0) {
      return 0;
    }

    const diff = Math.abs(diValue.plus - diValue.minus);
    return (diff / sum) * 100;
  }

  onData(bar: BarWith<"high" | "low" | "close">): number {
    return this.update(bar.high, bar.low, bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "DX",
    init: "{period: number}",
    update: "high, low, close",
    output: "number",
  };
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
  private ema: CoreEMA;

  constructor(opts: PeriodWith<"period">) {
    this.dx = new DX(opts);
    this.ema = new CoreEMA({ alpha: wilders_factor(opts.period) });
  }

  update(high: number, low: number, close: number): number {
    const dxValue = this.dx.update(high, low, close);
    return this.ema.update(dxValue);
  }

  onData(bar: BarWith<"high" | "low" | "close">): number {
    return this.update(bar.high, bar.low, bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "ADX",
    init: "{period: number}",
    update: "high, low, close",
    output: "number",
  };
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

  update(high: number, low: number, close: number): number {
    const adxValue = this.adx.update(high, low, close);
    this.buffer.push(adxValue);

    if (!this.buffer.full()) {
      return adxValue;
    }

    const oldAdx = this.buffer.front()!;
    return (adxValue + oldAdx) / 2;
  }

  onData(bar: BarWith<"high" | "low" | "close">): number {
    return this.update(bar.high, bar.low, bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "ADXR",
    init: "{period: number}",
    update: "high, low, close",
    output: "number",
  };
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
  private prevPrevHigh?: number | undefined;
  private prevPrevLow?: number | undefined;
  private afIncrement: number;

  constructor(
    opts: { acceleration?: number; maximum?: number } = {
      acceleration: 0.02,
      maximum: 0.2,
    }
  ) {
    this.af = opts?.acceleration ?? 0.02;
    this.afIncrement = opts?.acceleration ?? 0.02;
    this.maxAf = opts?.maximum ?? 0.2;
  }

  update(high: number, low: number): number {
    if (this.sar === undefined) {
      this.sar = low;
      this.ep = high;
      this.prevHigh = high;
      this.prevLow = low;
      return this.sar;
    }

    const prevSar = this.sar;

    if (this.isLong) {
      this.sar = prevSar + this.af * (this.ep! - prevSar);

      if (low < this.sar) {
        this.isLong = false;
        this.sar = Math.max(this.ep!, high);
        this.ep = low;
        this.af = this.afIncrement;
      } else {
        if (high > this.ep!) {
          this.ep = high;
          this.af = Math.min(this.af + this.afIncrement, this.maxAf);
        }

        const minLow =
          this.prevPrevLow !== undefined
            ? Math.min(this.prevLow!, this.prevPrevLow)
            : this.prevLow!;

        this.sar = Math.min(this.sar, minLow);
      }
    } else {
      this.sar = prevSar + this.af * (this.ep! - prevSar);

      if (high > this.sar) {
        this.isLong = true;
        this.sar = Math.min(this.ep!, low);
        this.ep = high;
        this.af = this.afIncrement;
      } else {
        if (low < this.ep!) {
          this.ep = low;
          this.af = Math.min(this.af + this.afIncrement, this.maxAf);
        }

        const maxHigh =
          this.prevPrevHigh !== undefined
            ? Math.max(this.prevHigh!, this.prevPrevHigh)
            : this.prevHigh!;

        this.sar = Math.max(this.sar, maxHigh);
      }
    }

    this.prevPrevHigh = this.prevHigh;
    this.prevPrevLow = this.prevLow;
    this.prevHigh = high;
    this.prevLow = low;

    return this.sar;
  }

  onData(bar: BarWith<"high" | "low">): number {
    return this.update(bar.high, bar.low);
  }

  static readonly doc: OperatorDoc = {
    type: "SAR",
    init: "{acceleration?, maximum?}",
    update: "high, low",
    output: "number",
  };
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
  private vm_minus_sum: RollingSum;
  private vm_plus_sum: RollingSum;
  private tr_sum: RollingSum;

  constructor(opts: PeriodWith<"period">) {
    this.vm_minus_sum = new RollingSum(opts);
    this.vm_plus_sum = new RollingSum(opts);
    this.tr_sum = new RollingSum(opts);
  }

  update(
    high: number,
    low: number,
    close: number
  ): { vi_plus: number; vi_minus: number } {
    if (this.prevLow === undefined) {
      this.prevHigh = high;
      this.prevLow = low;
      this.preClose = close;
      return { vi_plus: 0, vi_minus: 0 };
    }

    const vm_plus = Math.abs(high - this.prevLow);
    const vm_minus = Math.abs(low - this.prevHigh!);
    const tr = Math.max(
      high - low,
      Math.abs(high - this.preClose!),
      Math.abs(low - this.preClose!)
    );

    const tr_sum = this.tr_sum.update(tr);
    if (tr_sum === 0) {
      return { vi_plus: 0, vi_minus: 0 };
    }

    const vm_plus_sum = this.vm_plus_sum.update(vm_plus);
    const vm_minus_sum = this.vm_minus_sum.update(vm_minus);

    return {
      vi_plus: vm_plus_sum / tr_sum,
      vi_minus: vm_minus_sum / tr_sum,
    };
  }

  onData(bar: BarWith<"high" | "low" | "close">): {
    vi_plus: number;
    vi_minus: number;
  } {
    return this.update(bar.high, bar.low, bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "VI",
    init: "{period: number}",
    update: "high, low, close",
    output: "{vi_plus, vi_minus}",
  };
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

  constructor(
    opts: {
      tenkan_period?: number;
      kijun_period?: number;
      senkou_b_period?: number;
      displacement?: number;
    } = {
      tenkan_period: 9,
      kijun_period: 26,
      senkou_b_period: 52,
      displacement: 26,
    }
  ) {
    const tenkanPeriod = opts?.tenkan_period ?? 9;
    const kijunPeriod = opts?.kijun_period ?? 26;
    const senkouPeriod = opts?.senkou_b_period ?? 52;
    const displacement = opts?.displacement ?? 26;

    this.tenkanChannel = new PriceChannel({ period: tenkanPeriod });
    this.kijunChannel = new PriceChannel({ period: kijunPeriod });
    this.senkouChannel = new PriceChannel({ period: senkouPeriod });
    this.chikouBuffer = new CircularBuffer(displacement);
  }

  update(
    high: number,
    low: number,
    close: number
  ): {
    tenkan: number;
    kijun: number;
    senkou_a: number;
    senkou_b: number;
    chikou: number;
  } {
    const tenkanHL = this.tenkanChannel.update(high, low);
    const kijunHL = this.kijunChannel.update(high, low);
    const senkouHL = this.senkouChannel.update(high, low);
    this.chikouBuffer.push(close);

    const tenkan = (tenkanHL.upper + tenkanHL.lower) / 2;
    const kijun = (kijunHL.upper + kijunHL.lower) / 2;
    const senkou_b = (senkouHL.upper + senkouHL.lower) / 2;
    const senkou_a = (tenkan + kijun) / 2;
    const chikou = this.chikouBuffer.full()
      ? this.chikouBuffer.front()!
      : close;

    return { tenkan, kijun, senkou_a, senkou_b, chikou };
  }

  onData(bar: BarWith<"high" | "low" | "close">): {
    tenkan: number;
    kijun: number;
    senkou_a: number;
    senkou_b: number;
    chikou: number;
  } {
    return this.update(bar.high, bar.low, bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "ICHIMOKU",
    init: "{tenkan_period?, kijun_period?, senkou_b_period?, displacement?}",
    update: "high, low, close",
    output: "{tenkan, kijun, senkou_a, senkou_b, chikou}",
  };
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
