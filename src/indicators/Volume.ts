import type { BarWith } from "../types/BarData.js";
import type { PeriodWith } from "../types/PeriodOptions.js";
import { CircularBuffer } from "../fn/Containers.js";
import { EMA, Sum } from "../fn/Foundation.js";

/**
 * Accumulation/Distribution - stateful indicator.
 * Cumulative measure of money flow based on close location value.
 */
export class AD {
  private ad: number = 0;

  /**
   * Process new bar data.
   * @param bar Bar data with high, low, close, volume
   * @returns Current AD value
   */
  onData(bar: BarWith<"high" | "low" | "close" | "volume">): number {
    const clv =
      bar.high !== bar.low
        ? ((bar.close - bar.low - (bar.high - bar.close)) /
            (bar.high - bar.low)) *
          bar.volume
        : 0;
    this.ad += clv;
    return this.ad;
  }
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
  private emaShort: EMA;
  private emaLong: EMA;

  constructor(opts: PeriodWith<"period_short" | "period_long">) {
    this.emaShort = new EMA({ period: opts.period_short });
    this.emaLong = new EMA({ period: opts.period_long });
  }

  /**
   * Process new bar data.
   * @param bar Bar data with high, low, close, volume
   * @returns Current ADOSC value
   */
  onData(bar: BarWith<"high" | "low" | "close" | "volume">): number {
    const adVal = this.ad.onData(bar);
    return this.emaShort.onData(adVal) - this.emaLong.onData(adVal);
  }
}

/**
 * Creates ADOSC closure for functional usage.
 * @param opts Period configuration (period_short, period_long)
 * @returns Function that processes bar data and returns ADOSC
 */
export function useADOSC(
  opts: PeriodWith<"period_short" | "period_long">
): (bar: BarWith<"high" | "low" | "close" | "volume">) => number {
  const instance = new ADOSC(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Klinger Volume Oscillator - stateful indicator.
 * Combines price movement trends with volume to detect money flow.
 */
export class KVO {
  private shortEMA: EMA;
  private longEMA: EMA;
  private prevHLC?: number;
  private trend: number = 1;
  private cm: number = 0;

  constructor(opts: PeriodWith<"period_short" | "period_long">) {
    this.shortEMA = new EMA({ period: opts.period_short });
    this.longEMA = new EMA({ period: opts.period_long });
  }

  /**
   * Process new bar data.
   * @param bar Bar data with high, low, close, volume
   * @returns Current KVO value
   */
  onData(bar: BarWith<"high" | "low" | "close" | "volume">): number {
    const hlc = bar.high + bar.low + bar.close;
    const dm = bar.high - bar.low;

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
      this.cm > 0
        ? 100 * bar.volume * this.trend * Math.abs((2 * dm) / this.cm - 1)
        : 0;

    const shortVF = this.shortEMA.onData(vf);
    const longVF = this.longEMA.onData(vf);

    return shortVF - longVF;
  }
}

/**
 * Creates KVO closure for functional usage.
 * @param opts Period configuration (period_short defaults to 34, period_long to 55)
 * @returns Function that processes bar data and returns KVO
 */
export function useKVO(
  opts: PeriodWith<"period_short" | "period_long">
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

  /**
   * Process new bar data.
   * @param bar Bar data with close, volume
   * @returns Current NVI value
   */
  onData(bar: BarWith<"close" | "volume">): number {
    if (this.prevVolume === undefined) {
      this.prevVolume = bar.volume;
      this.prevClose = bar.close;
      return this.nvi;
    }

    if (bar.volume < this.prevVolume && this.prevClose !== 0) {
      const roc = (bar.close - this.prevClose!) / this.prevClose!;
      this.nvi += this.nvi * roc;
    }

    this.prevVolume = bar.volume;
    this.prevClose = bar.close;
    return this.nvi;
  }
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

  /**
   * Process new bar data.
   * @param bar Bar data with close, volume
   * @returns Current OBV value
   */
  onData(bar: BarWith<"close" | "volume">): number {
    if (this.prevClose === undefined) {
      this.prevClose = bar.close;
      return this.obv;
    }

    if (bar.close > this.prevClose) {
      this.obv += bar.volume;
    } else if (bar.close < this.prevClose) {
      this.obv -= bar.volume;
    }

    this.prevClose = bar.close;
    return this.obv;
  }
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

  /**
   * Process new bar data.
   * @param bar Bar data with close, volume
   * @returns Current PVI value
   */
  onData(bar: BarWith<"close" | "volume">): number {
    if (this.prevVolume === undefined) {
      this.prevVolume = bar.volume;
      this.prevClose = bar.close;
      return this.pvi;
    }

    if (bar.volume > this.prevVolume && this.prevClose !== 0) {
      const roc = (bar.close - this.prevClose!) / this.prevClose!;
      this.pvi += this.pvi * roc;
    }

    this.prevVolume = bar.volume;
    this.prevClose = bar.close;
    return this.pvi;
  }
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
  private buffer: CircularBuffer<{ mf: number; positive: boolean }>;
  private prevTypical?: number;

  constructor(opts: PeriodWith<"period">) {
    this.buffer = new CircularBuffer(opts.period);
  }

  /**
   * Process new bar data.
   * @param bar Bar data with high, low, close, volume
   * @returns Current MFI value (0-100)
   */
  onData(bar: BarWith<"high" | "low" | "close" | "volume">): number {
    const typical = (bar.high + bar.low + bar.close) / 3;
    const rawMoney = typical * bar.volume;

    if (this.prevTypical === undefined) {
      this.prevTypical = typical;
      this.buffer.push({ mf: rawMoney, positive: true });
      return 50;
    }

    const positive = typical > this.prevTypical;
    this.prevTypical = typical;
    this.buffer.push({ mf: rawMoney, positive });

    if (!this.buffer.full()) {
      return 50;
    }

    let posFlow = 0;
    let negFlow = 0;
    for (const item of this.buffer) {
      if (item.positive) {
        posFlow += item.mf;
      } else {
        negFlow += item.mf;
      }
    }

    if (negFlow === 0) {
      return 100;
    }

    const mfr = posFlow / negFlow;
    return 100 - 100 / (1 + mfr);
  }
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

  /**
   * Process new bar data.
   * @param bar Bar data with high, low, volume
   * @returns Current EMV value
   */
  onData(bar: BarWith<"high" | "low" | "volume">): number {
    const mid = (bar.high + bar.low) / 2;
    if (this.prevMid === undefined) {
      this.prevMid = mid;
      return 0;
    }

    const distance = mid - this.prevMid;
    this.prevMid = mid;

    const boxRatio = bar.volume / 100000000 / (bar.high - bar.low);
    return boxRatio !== 0 ? distance / boxRatio : 0;
  }
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
  /**
   * Process new bar data.
   * @param bar Bar data with high, low, volume
   * @returns Current MarketFI value
   */
  onData(bar: BarWith<"high" | "low" | "volume">): number {
    return bar.volume !== 0 ? (bar.high - bar.low) / bar.volume : 0;
  }
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
  private emaShort: EMA;
  private emaLong: EMA;

  constructor(opts: PeriodWith<"period_short" | "period_long">) {
    this.emaShort = new EMA({ period: opts.period_short });
    this.emaLong = new EMA({ period: opts.period_long });
  }

  /**
   * Process new volume data.
   * @param bar Bar data with volume
   * @returns Current VOSC percentage value
   */
  onData(bar: BarWith<"volume">): number {
    const emaShortVal = this.emaShort.onData(bar.volume);
    const emaLongVal = this.emaLong.onData(bar.volume);
    return emaLongVal !== 0
      ? ((emaShortVal - emaLongVal) / emaLongVal) * 100
      : 0;
  }
}

/**
 * Creates VOSC closure for functional usage.
 * @param opts Period configuration (period_short, period_long)
 * @returns Function that processes volume and returns VOSC
 */
export function useVOSC(
  opts: PeriodWith<"period_short" | "period_long">
): (bar: BarWith<"volume">) => number {
  const instance = new VOSC(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Chaikin Money Flow - volume-weighted accumulation/distribution.
 * Measures buying/selling pressure over a period.
 */
export class CMF {
  private mfvSum: Sum;
  private volSum: Sum;

  constructor(opts: PeriodWith<"period">) {
    this.mfvSum = new Sum(opts);
    this.volSum = new Sum(opts);
  }

  /**
   * Process new bar data.
   * @param bar Bar with high, low, close, volume
   * @returns CMF value (-1 to +1 range)
   */
  onData(bar: BarWith<"high" | "low" | "close" | "volume">): number {
    const clv =
      bar.high !== bar.low
        ? (bar.close - bar.low - (bar.high - bar.close)) / (bar.high - bar.low)
        : 0;
    const mfv = clv * bar.volume;

    const mfvSum = this.mfvSum.onData(mfv);
    const volSum = this.volSum.onData(bar.volume);

    return volSum !== 0 ? mfvSum / volSum : 0;
  }
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
  private emaShort: EMA;
  private emaLong: EMA;

  constructor(opts: PeriodWith<"period_short" | "period_long">) {
    this.ad = new AD();
    this.emaShort = new EMA({ period: opts.period_short });
    this.emaLong = new EMA({ period: opts.period_long });
  }

  /**
   * Process new bar data.
   * @param bar Bar with high, low, close, volume
   * @returns Chaikin Oscillator value
   */
  onData(bar: BarWith<"high" | "low" | "close" | "volume">): number {
    const adValue = this.ad.onData(bar);
    return this.emaShort.onData(adValue) - this.emaLong.onData(adValue);
  }
}

/**
 * Creates CHO closure for functional usage.
 * @param opts Short and long period configuration
 * @returns Function that processes bar data and returns Chaikin Oscillator
 */
export function useCHO(
  opts: PeriodWith<"period_short" | "period_long">
): (bar: BarWith<"high" | "low" | "close" | "volume">) => number {
  const instance = new CHO(opts);
  return (bar) => instance.onData(bar);
}

/**
 * Percentage Volume Oscillator - volume momentum indicator.
 * Percentage difference between short and long volume EMAs.
 */
export class PVO {
  private emaShort: EMA;
  private emaLong: EMA;
  private emaSignal: EMA;

  constructor(
    opts: PeriodWith<"period_short" | "period_long"> & {
      period_signal?: number;
    }
  ) {
    this.emaShort = new EMA({ period: opts.period_short });
    this.emaLong = new EMA({ period: opts.period_long });
    this.emaSignal = new EMA({ period: opts.period_signal ?? 9 });
  }

  /**
   * Process new volume data.
   * @param bar Bar with volume
   * @returns Object with pvo, signal, and histogram
   */
  onData(bar: BarWith<"volume">): {
    pvo: number;
    signal: number;
    histogram: number;
  } {
    const emaShortVal = this.emaShort.onData(bar.volume);
    const emaLongVal = this.emaLong.onData(bar.volume);
    const pvo =
      emaLongVal !== 0 ? ((emaShortVal - emaLongVal) / emaLongVal) * 100 : 0;
    const signal = this.emaSignal.onData(pvo);
    const histogram = pvo - signal;

    return { pvo, signal, histogram };
  }
}

/**
 * Creates PVO closure for functional usage.
 * @param opts Short, long, and signal period configuration
 * @returns Function that processes bar data and returns PVO
 */
export function usePVO(
  opts: PeriodWith<"period_short" | "period_long"> & { period_signal?: number }
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
  private ema: EMA;
  private prevClose?: number;

  constructor(opts: PeriodWith<"period">) {
    this.ema = new EMA({ period: opts.period });
  }

  /**
   * Process new bar data.
   * @param bar Bar with close and volume
   * @returns Force Index value
   */
  onData(bar: BarWith<"close" | "volume">): number {
    if (this.prevClose === undefined) {
      this.prevClose = bar.close;
      return this.ema.onData(0);
    }

    const force = (bar.close - this.prevClose) * bar.volume;
    this.prevClose = bar.close;
    return this.ema.onData(force);
  }
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

  /**
   * Process new volume data.
   * @param bar Bar with volume
   * @returns Volume rate of change as percentage
   */
  onData(bar: BarWith<"volume">): number {
    this.buffer.push(bar.volume);

    if (!this.buffer.full()) {
      return 0;
    }

    const oldVolume = this.buffer.front()!;
    return oldVolume !== 0 ? ((bar.volume - oldVolume) / oldVolume) * 100 : 0;
  }
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
  private pvt: number = 0;
  private prevClose?: number;

  /**
   * Process new bar data.
   * @param bar Bar with close and volume
   * @returns Cumulative PVT value
   */
  onData(bar: BarWith<"close" | "volume">): number {
    if (this.prevClose === undefined || this.prevClose === 0) {
      this.prevClose = bar.close;
      return this.pvt;
    }

    const priceChange = (bar.close - this.prevClose) / this.prevClose;
    this.pvt += priceChange * bar.volume;
    this.prevClose = bar.close;

    return this.pvt;
  }
}

/**
 * Creates PVT closure for functional usage.
 * @returns Function that processes bar data and returns PVT
 */
export function usePVT(): (bar: BarWith<"close" | "volume">) => number {
  const instance = new PVT();
  return (bar) => instance.onData(bar);
}
