import type { BarWith } from "../types/BarData.js";
import type { PeriodWith } from "../types/PeriodOptions.js";
import {
  Kahan
  CircularBuffer,
  EMA as CoreEMA,
  RollingSum,
} from "@junduck/trading-core";
import { type OperatorDoc } from "../types/OpDoc.js";

/**
 * Accumulation/Distribution - stateful indicator.
 * Cumulative measure of money flow based on close location value.
 */
export class AD {
  private ad: Kahan = new Kahan();

  update(high: number, low: number, close: number, volume: number): number {
    const clv =
      high !== low
        ? ((close - low - (high - close)) / (high - low)) * volume
        : 0;
    this.ad.accum(clv);
    return this.ad.val;
  }

  onData(bar: BarWith<"high" | "low" | "close" | "volume">): number {
    return this.update(bar.high, bar.low, bar.close, bar.volume);
  }

  static readonly doc: OperatorDoc = {
    type: "AD",
    update: "high, low, close, volume",
    output: "number",
  };
}

/**
 * Creates AD closure for functional usage.
 * @returns Function that processes bar data and returns AD
 */
export function useAD(): (
  bar: BarWith<"high" | "low" | "close" | "volume">
) => number {
  const instance = new AD();
  return (bar) => instance.onData(bar);
}

/**
 * Accumulation/Distribution Oscillator - stateful indicator.
 * Measures difference between short and long EMAs of AD values.
 */
export class ADOSC {
  private ad = new AD();
  private emsFast: CoreEMA;
  private emsSlow: CoreEMA;

  constructor(opts: PeriodWith<"period_fast" | "period_slow">) {
    this.emsFast = new CoreEMA({ period: opts.period_fast });
    this.emsSlow = new CoreEMA({ period: opts.period_slow });
  }

  update(high: number, low: number, close: number, volume: number): number {
    const adVal = this.ad.update(high, low, close, volume);
    return this.emsFast.update(adVal) - this.emsSlow.update(adVal);
  }

  onData(bar: BarWith<"high" | "low" | "close" | "volume">): number {
    return this.update(bar.high, bar.low, bar.close, bar.volume);
  }

  static readonly doc: OperatorDoc = {
    type: "ADOSC",
    init: "{period_fast, period_slow}",
    update: "high, low, close, volume",
    output: "number",
  };
}

/**
 * Creates ADOSC closure for functional usage.
 * @param opts Period configuration (period_fast, period_slow)
 * @returns Function that processes bar data and returns ADOSC
 */
export function useADOSC(
  opts: PeriodWith<"period_fast" | "period_slow">
): (bar: BarWith<"high" | "low" | "close" | "volume">) => number {
  const instance = new ADOSC(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Klinger Volume Oscillator - stateful indicator.
 * Combines price movement trends with volume to detect money flow.
 */
export class KVO {
  private fastEMA: CoreEMA;
  private slowEMA: CoreEMA;
  private prevHLC?: number;
  private trend: number = 1;
  private cm: number = 0;

  constructor(opts: PeriodWith<"period_fast" | "period_slow">) {
    this.fastEMA = new CoreEMA({ period: opts.period_fast });
    this.slowEMA = new CoreEMA({ period: opts.period_slow });
  }

  update(high: number, low: number, close: number, volume: number): number {
    const hlc = high + low + close;
    const dm = high - low;

    if (this.prevHLC !== undefined) {
      if (hlc > this.prevHLC) {
        const prevTrend = this.trend;
        this.trend = 1;
        this.cm = prevTrend !== this.trend ? dm : this.cm + dm;
      } else if (hlc < this.prevHLC) {
        const prevTrend = this.trend;
        this.trend = -1;
        this.cm = prevTrend !== this.trend ? dm : this.cm + dm;
      } else {
        this.cm += dm;
      }
    } else {
      this.cm = dm;
    }

    this.prevHLC = hlc;

    const vf =
      this.cm > 0 ? 100 * volume * this.trend * Math.abs((2 * dm) / this.cm - 1) : 0;

    const fastVF = this.fastEMA.update(vf);
    const slowVF = this.slowEMA.update(vf);

    return fastVF - slowVF;
  }

  onData(bar: BarWith<"high" | "low" | "close" | "volume">): number {
    return this.update(bar.high, bar.low, bar.close, bar.volume);
  }

  static readonly doc: OperatorDoc = {
    type: "KVO",
    init: "{period_fast, period_slow}",
    update: "high, low, close, volume",
    output: "number",
  };
}

/**
 * Creates KVO closure for functional usage.
 * @param opts Period configuration (period_fast defaults to 34, period_slow to 55)
 * @returns Function that processes bar data and returns KVO
 */
export function useKVO(
  opts: PeriodWith<"period_fast" | "period_slow">
): (bar: BarWith<"high" | "low" | "close" | "volume">) => number {
  const instance = new KVO(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Negative Volume Index - stateful indicator.
 * Tracks price changes on decreasing volume days.
 */
export class NVI {
  private nvi: number = 1000;
  private prevVolume?: number;
  private prevClose?: number;

  update(close: number, volume: number): number {
    if (this.prevVolume === undefined) {
      this.prevVolume = volume;
      this.prevClose = close;
      return this.nvi;
    }

    if (volume < this.prevVolume && this.prevClose !== 0) {
      const roc = (close - this.prevClose!) / this.prevClose!;
      this.nvi += this.nvi * roc;
    }

    this.prevVolume = volume;
    this.prevClose = close;
    return this.nvi;
  }

  onData(bar: BarWith<"close" | "volume">): number {
    return this.update(bar.close, bar.volume);
  }

  static readonly doc: OperatorDoc = {
    type: "NVI",
    update: "close, volume",
    output: "number",
  };
}

/**
 * Creates NVI closure for functional usage.
 * @returns Function that processes bar data and returns NVI
 */
export function useNVI(): (bar: BarWith<"close" | "volume">) => number {
  const instance = new NVI();
  return (bar) => instance.onData(bar);
}

/**
 * On Balance Volume - stateful indicator.
 * Cumulative volume indicator based on price direction.
 */
export class OBV {
  private obv: number = 0;
  private prevClose?: number;

  update(close: number, volume: number): number {
    if (this.prevClose === undefined) {
      this.prevClose = close;
      return this.obv;
    }

    if (close > this.prevClose) {
      this.obv += volume;
    } else if (close < this.prevClose) {
      this.obv -= volume;
    }

    this.prevClose = close;
    return this.obv;
  }

  onData(bar: BarWith<"close" | "volume">): number {
    return this.update(bar.close, bar.volume);
  }

  static readonly doc: OperatorDoc = {
    type: "OBV",
    update: "close, volume",
    output: "number",
  };
}

/**
 * Creates OBV closure for functional usage.
 * @returns Function that processes bar data and returns OBV
 */
export function useOBV(): (bar: BarWith<"close" | "volume">) => number {
  const instance = new OBV();
  return (bar) => instance.onData(bar);
}

/**
 * Positive Volume Index - stateful indicator.
 * Tracks price changes on increasing volume days.
 */
export class PVI {
  private pvi: number = 1000;
  private prevVolume?: number;
  private prevClose?: number;

  update(close: number, volume: number): number {
    if (this.prevVolume === undefined) {
      this.prevVolume = volume;
      this.prevClose = close;
      return this.pvi;
    }

    if (volume > this.prevVolume && this.prevClose !== 0) {
      const roc = (close - this.prevClose!) / this.prevClose!;
      this.pvi += this.pvi * roc;
    }

    this.prevVolume = volume;
    this.prevClose = close;
    return this.pvi;
  }

  onData(bar: BarWith<"close" | "volume">): number {
    return this.update(bar.close, bar.volume);
  }

  static readonly doc: OperatorDoc = {
    type: "PVI",
    update: "close, volume",
    output: "number",
  };
}

/**
 * Creates PVI closure for functional usage.
 * @returns Function that processes bar data and returns PVI
 */
export function usePVI(): (bar: BarWith<"close" | "volume">) => number {
  const instance = new PVI();
  return (bar) => instance.onData(bar);
}

/**
 * Money Flow Index - stateful indicator.
 * Volume-weighted momentum indicator using typical price.
 */
export class MFI {
  private buffer: CircularBuffer<number>;
  private prevTypical?: number;
  private posFlow: number = 0;
  private negFlow: number = 0;

  constructor(opts: PeriodWith<"period">) {
    this.buffer = new CircularBuffer(opts.period);
  }

  update(high: number, low: number, close: number, volume: number): number {
    const typical = (high + low + close) / 3;
    let moneyFlow = typical * volume;

    if (this.prevTypical === undefined) {
      this.prevTypical = typical;
      this.buffer.push(moneyFlow);
      return 50;
    }

    this.prevTypical = typical;

    if (typical >= this.prevTypical) {
      this.posFlow += moneyFlow;
    } else {
      this.negFlow += moneyFlow;
    }

    if (this.buffer.full()) {
      const expiredMoneyFlow = this.buffer.front()!;
      if (expiredMoneyFlow >= 0) {
        this.posFlow -= expiredMoneyFlow;
      } else {
        this.negFlow += expiredMoneyFlow;
      }
    }

    if (typical >= this.prevTypical) {
      this.buffer.push(moneyFlow);
    } else {
      this.buffer.push(-moneyFlow);
    }

    if (!this.buffer.full()) {
      return 50;
    }

    const mfr = this.posFlow / this.negFlow;
    return 100 - 100 / (1 + mfr);
  }

  onData(bar: BarWith<"high" | "low" | "close" | "volume">): number {
    return this.update(bar.high, bar.low, bar.close, bar.volume);
  }

  static readonly doc: OperatorDoc = {
    type: "MFI",
    init: "{period: number}",
    update: "high, low, close, volume",
    output: "number",
  };
}

/**
 * Creates MFI closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns MFI
 */
export function useMFI(
  opts: PeriodWith<"period">
): (bar: BarWith<"high" | "low" | "close" | "volume">) => number {
  const instance = new MFI(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Ease of Movement - stateful indicator.
 * Relates price change to volume for trend strength analysis.
 */
export class EMV {
  private prevMid?: number;

  update(high: number, low: number, volume: number): number {
    const mid = (high + low) / 2;
    if (this.prevMid === undefined) {
      this.prevMid = mid;
      return 0;
    }

    const distance = mid - this.prevMid;
    this.prevMid = mid;

    const boxRatio = volume / 100000000 / (high - low);
    return boxRatio !== 0 ? distance / boxRatio : 0;
  }

  onData(bar: BarWith<"high" | "low" | "volume">): number {
    return this.update(bar.high, bar.low, bar.volume);
  }

  static readonly doc: OperatorDoc = {
    type: "EMV",
    update: "high, low, volume",
    output: "number",
  };
}

/**
 * Creates EMV closure for functional usage.
 * @returns Function that processes bar data and returns EMV
 */
export function useEMV(): (bar: BarWith<"high" | "low" | "volume">) => number {
  const instance = new EMV();
  return (bar) => instance.onData(bar);
}

/**
 * Market Facilitation Index - stateless indicator.
 * Measures price movement efficiency per volume unit.
 */
export class MarketFI {
  update(high: number, low: number, volume: number): number {
    return volume !== 0 ? (high - low) / volume : 0;
  }

  onData(bar: BarWith<"high" | "low" | "volume">): number {
    return this.update(bar.high, bar.low, bar.volume);
  }

  static readonly doc: OperatorDoc = {
    type: "MarketFI",
    desc: "Market Facilitation Index", // Agent: mistakes for Market Finance Index
    update: "high, low, volume",
    output: "number",
  };
}

/**
 * Creates MarketFI closure for functional usage.
 * @returns Function that processes bar data and returns MarketFI
 */
export function useMarketFI(): (
  bar: BarWith<"high" | "low" | "volume">
) => number {
  const instance = new MarketFI();
  return (bar) => instance.onData(bar);
}

/**
 * Volume Oscillator - stateful indicator.
 * Percentage difference between two volume EMAs.
 */
export class VOSC {
  private emsFast: CoreEMA;
  private emsSlow: CoreEMA;

  constructor(opts: PeriodWith<"period_fast" | "period_slow">) {
    this.emsFast = new CoreEMA({ period: opts.period_fast });
    this.emsSlow = new CoreEMA({ period: opts.period_slow });
  }

  update(volume: number): number {
    const emsFastVal = this.emsFast.update(volume);
    const emsSlowVal = this.emsSlow.update(volume);
    return emsSlowVal !== 0 ? ((emsFastVal - emsSlowVal) / emsSlowVal) * 100 : 0;
  }

  onData(bar: BarWith<"volume">): number {
    return this.update(bar.volume);
  }

  static readonly doc: OperatorDoc = {
    type: "VOSC",
    init: "{period_fast, period_slow}",
    update: "volume",
    output: "number",
  };
}

/**
 * Creates VOSC closure for functional usage.
 * @param opts Period configuration (period_fast, period_slow)
 * @returns Function that processes volume and returns VOSC
 */
export function useVOSC(
  opts: PeriodWith<"period_fast" | "period_slow">
): (bar: BarWith<"volume">) => number {
  const instance = new VOSC(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Chaikin Money Flow - volume-weighted accumulation/distribution.
 * Measures buying/selling pressure over a period.
 */
export class CMF {
  private mfvSum: RollingSum;
  private volSum: RollingSum;

  constructor(opts: PeriodWith<"period">) {
    this.mfvSum = new RollingSum(opts);
    this.volSum = new RollingSum(opts);
  }

  update(high: number, low: number, close: number, volume: number): number {
    const clv =
      high !== low ? (close - low - (high - close)) / (high - low) : 0;
    const mfv = clv * volume;

    const mfvSum = this.mfvSum.update(mfv);
    const volSum = this.volSum.update(volume);

    return volSum !== 0 ? mfvSum / volSum : 0;
  }

  onData(bar: BarWith<"high" | "low" | "close" | "volume">): number {
    return this.update(bar.high, bar.low, bar.close, bar.volume);
  }

  static readonly doc: OperatorDoc = {
    type: "CMF",
    init: "{period: number}",
    update: "high, low, close, volume",
    output: "number",
  };
}

/**
 * Creates CMF closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns CMF
 */
export function useCMF(
  opts: PeriodWith<"period">
): (bar: BarWith<"high" | "low" | "close" | "volume">) => number {
  const instance = new CMF(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Chaikin Oscillator - momentum of accumulation/distribution.
 * Difference between short and long EMAs of A/D line.
 */
export class CHO {
  private ad: AD;
  private emsFast: CoreEMA;
  private emsSlow: CoreEMA;

  constructor(opts: PeriodWith<"period_fast" | "period_slow">) {
    this.ad = new AD();
    this.emsFast = new CoreEMA({ period: opts.period_fast });
    this.emsSlow = new CoreEMA({ period: opts.period_slow });
  }

  update(high: number, low: number, close: number, volume: number): number {
    const adValue = this.ad.update(high, low, close, volume);
    return this.emsFast.update(adValue) - this.emsSlow.update(adValue);
  }

  onData(bar: BarWith<"high" | "low" | "close" | "volume">): number {
    return this.update(bar.high, bar.low, bar.close, bar.volume);
  }

  static readonly doc: OperatorDoc = {
    type: "CHO",
    init: "{period_fast, period_slow}",
    update: "high, low, close, volume",
    output: "number",
  };
}

/**
 * Creates CHO closure for functional usage.
 * @param opts Short and long period configuration
 * @returns Function that processes bar data and returns Chaikin Oscillator
 */
export function useCHO(
  opts: PeriodWith<"period_fast" | "period_slow">
): (bar: BarWith<"high" | "low" | "close" | "volume">) => number {
  const instance = new CHO(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Percentage Volume Oscillator - volume momentum indicator.
 * Percentage difference between short and long volume EMAs.
 */
export class PVO {
  private emsFast: CoreEMA;
  private emsSlow: CoreEMA;
  private emaSignal: CoreEMA;

  constructor(
    opts: PeriodWith<"period_fast" | "period_slow"> & {
      period_signal?: number;
    }
  ) {
    this.emsFast = new CoreEMA({ period: opts.period_fast });
    this.emsSlow = new CoreEMA({ period: opts.period_slow });
    this.emaSignal = new CoreEMA({ period: opts.period_signal ?? 9 });
  }

  update(volume: number): { pvo: number; signal: number; histogram: number } {
    const emsFastVal = this.emsFast.update(volume);
    const emsSlowVal = this.emsSlow.update(volume);
    const pvo =
      emsSlowVal !== 0 ? ((emsFastVal - emsSlowVal) / emsSlowVal) * 100 : 0;
    const signal = this.emaSignal.update(pvo);
    const histogram = pvo - signal;

    return { pvo, signal, histogram };
  }

  onData(bar: BarWith<"volume">): {
    pvo: number;
    signal: number;
    histogram: number;
  } {
    return this.update(bar.volume);
  }

  static readonly doc: OperatorDoc = {
    type: "PVO",
    init: "{period_fast, period_slow, period_signal?}",
    update: "volume",
    output: "{pvo, signal, histogram}",
  };
}

/**
 * Creates PVO closure for functional usage.
 * @param opts Short, long, and signal period configuration
 * @returns Function that processes bar data and returns PVO
 */
export function usePVO(
  opts: PeriodWith<"period_fast" | "period_slow"> & { period_signal?: number }
): (bar: BarWith<"volume">) => {
  pvo: number;
  signal: number;
  histogram: number;
} {
  const instance = new PVO(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Elder's Force Index - measures power behind price movements.
 * Combines price change with volume.
 */
export class FI {
  private ema: CoreEMA;
  private prevClose?: number;

  constructor(opts: PeriodWith<"period">) {
    this.ema = new CoreEMA({ period: opts.period });
  }

  update(close: number, volume: number): number {
    if (this.prevClose === undefined) {
      this.prevClose = close;
      return this.ema.update(0);
    }

    const force = (close - this.prevClose) * volume;
    this.prevClose = close;
    return this.ema.update(force);
  }

  onData(bar: BarWith<"close" | "volume">): number {
    return this.update(bar.close, bar.volume);
  }

  static readonly doc: OperatorDoc = {
    type: "FI",
    init: "{period: number}",
    update: "close, volume",
    output: "number",
  };
}

/**
 * Creates FI closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns Force Index
 */
export function useFI(
  opts: PeriodWith<"period">
): (bar: BarWith<"close" | "volume">) => number {
  const instance = new FI(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Volume Rate of Change - measures volume momentum.
 * Percentage change in volume over period.
 */
export class VROC {
  private buffer: CircularBuffer<number>;

  constructor(opts: PeriodWith<"period">) {
    this.buffer = new CircularBuffer(opts.period + 1);
  }

  update(volume: number): number {
    this.buffer.push(volume);

    if (!this.buffer.full()) {
      return 0;
    }

    const oldVolume = this.buffer.front()!;
    return oldVolume !== 0 ? ((volume - oldVolume) / oldVolume) * 100 : 0;
  }

  onData(bar: BarWith<"volume">): number {
    return this.update(bar.volume);
  }

  static readonly doc: OperatorDoc = {
    type: "VROC",
    init: "{period: number}",
    update: "volume",
    output: "number",
  };
}

/**
 * Creates VROC closure for functional usage.
 * @param opts Period configuration
 * @returns Function that processes bar data and returns VROC
 */
export function useVROC(
  opts: PeriodWith<"period">
): (bar: BarWith<"volume">) => number {
  const instance = new VROC(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Price Volume Trend - cumulative volume based on price changes.
 * Similar to OBV but uses percentage price change.
 */
export class PVT {
  private pvt: Kahan = new Kahan();
  private prevClose?: number;

  update(close: number, volume: number): number {
    if (this.prevClose === undefined || this.prevClose === 0) {
      this.prevClose = close;
      return this.pvt.val;
    }

    const priceChange = (close - this.prevClose) / this.prevClose;
    this.pvt.accum(priceChange * volume);
    this.prevClose = close;

    return this.pvt.val;
  }

  onData(bar: BarWith<"close" | "volume">): number {
    return this.update(bar.close, bar.volume);
  }

  static readonly doc: OperatorDoc = {
    type: "PVT",
    update: "close, volume",
    output: "number",
  };
}

/**
 * Creates PVT closure for functional usage.
 * @returns Function that processes bar data and returns PVT
 */
export function usePVT(): (bar: BarWith<"close" | "volume">) => number {
  const instance = new PVT();
  return (bar) => instance.onData(bar);
}
