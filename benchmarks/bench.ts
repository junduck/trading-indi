import type { BarData } from "../src/types/BarData.js";
import { EMA, SMA, Variance, MinMax } from "../src/fn/Foundation.js";
import {
  VOLATILITY,
  CVI,
  MASS,
  TR,
  ATR,
  NATR,
  PriceChannel,
  BBANDS,
  KC,
  DC,
} from "../src/indicators/Volatility.js";
import {
  BOP,
  MOM,
  ROC,
  ROCR,
  RSI,
  CMO,
  WAD,
  RVI,
  TSI,
  BBPOWER,
} from "../src/indicators/Momentum.js";
import {
  AO,
  APO,
  DPO,
  Fisher,
  MACD,
  PPO,
  QSTICK,
  TRIX,
  ULTOSC,
} from "../src/indicators/Oscillators.js";
import { STOCH, STOCHRSI, WILLR } from "../src/indicators/Stochastic.js";
import {
  AROON,
  AROONOSC,
  CCI,
  VHF,
  DM,
  DI,
  DX,
  ADX,
  ADXR,
  SAR,
  VI,
  ICHIMOKU,
} from "../src/indicators/Trend.js";
import {
  AD,
  ADOSC,
  KVO,
  NVI,
  OBV,
  PVI,
  MFI,
  EMV,
  MARKETFI,
  VOSC,
  CMF,
  CHO,
  PVO,
  FI,
  VROC,
  PVT,
} from "../src/indicators/Volume.js";

function generateOHLCV(count: number): BarData[] {
  const bars: BarData[] = [];
  let price = 100;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 2;
    price = Math.max(10, price + change);

    const low = price * (1 - Math.random() * 0.02);
    const high = price * (1 + Math.random() * 0.02);
    const open = low + Math.random() * (high - low);
    const close = low + Math.random() * (high - low);
    const volume = Math.floor(1000000 + Math.random() * 5000000);

    bars.push({ open, high, low, close, volume });
  }

  return bars;
}

interface Indicator {
  name: string;
  instance: { onData: (bar: any) => any };
}

const PERIODS = {
  period: 50,
  period_short: 25,
  period_med: 50,
  period_long: 75,
  period_signal: 10,
  k_period: 50,
  k_slowing: 3,
  d_period: 3,
  long_period: 25,
  short_period: 13,
  signal_period: 13,
  tenkan_period: 9,
  kijun_period: 26,
  senkou_b_period: 52,
  displacement: 26,
};

function createIndicators(): Indicator[] {
  const indicators: Indicator[] = [];

  indicators.push({ name: "EMA", instance: new EMA(PERIODS) });
  indicators.push({ name: "SMA", instance: new SMA(PERIODS) });
  indicators.push({ name: "Variance", instance: new Variance(PERIODS) });
  indicators.push({ name: "MinMax", instance: new MinMax(PERIODS) });

  indicators.push({ name: "VOLATILITY", instance: new VOLATILITY(PERIODS) });
  indicators.push({ name: "CVI", instance: new CVI(PERIODS) });
  indicators.push({ name: "MASS", instance: new MASS(PERIODS) });
  indicators.push({ name: "TR", instance: new TR() });
  indicators.push({ name: "ATR", instance: new ATR(PERIODS) });
  indicators.push({ name: "NATR", instance: new NATR(PERIODS) });
  indicators.push({
    name: "PriceChannel",
    instance: new PriceChannel(PERIODS),
  });
  indicators.push({ name: "BBANDS", instance: new BBANDS(PERIODS) });
  indicators.push({ name: "KC", instance: new KC(PERIODS) });
  indicators.push({ name: "DC", instance: new DC(PERIODS) });

  indicators.push({ name: "BOP", instance: new BOP() });
  indicators.push({ name: "MOM", instance: new MOM(PERIODS) });
  indicators.push({ name: "ROC", instance: new ROC(PERIODS) });
  indicators.push({ name: "ROCR", instance: new ROCR(PERIODS) });
  indicators.push({ name: "RSI", instance: new RSI(PERIODS) });
  indicators.push({ name: "CMO", instance: new CMO(PERIODS) });
  indicators.push({ name: "WAD", instance: new WAD() });
  indicators.push({ name: "RVI", instance: new RVI(PERIODS) });
  indicators.push({ name: "TSI", instance: new TSI() });
  indicators.push({ name: "BBPOWER", instance: new BBPOWER(PERIODS) });

  indicators.push({ name: "AO", instance: new AO() });
  indicators.push({ name: "APO", instance: new APO(PERIODS) });
  indicators.push({ name: "DPO", instance: new DPO(PERIODS) });
  indicators.push({ name: "Fisher", instance: new Fisher(PERIODS) });
  indicators.push({ name: "MACD", instance: new MACD(PERIODS) });
  indicators.push({ name: "PPO", instance: new PPO(PERIODS) });
  indicators.push({ name: "QSTICK", instance: new QSTICK(PERIODS) });
  indicators.push({ name: "TRIX", instance: new TRIX(PERIODS) });
  indicators.push({ name: "ULTOSC", instance: new ULTOSC(PERIODS) });

  indicators.push({ name: "STOCH", instance: new STOCH(PERIODS) });
  indicators.push({ name: "STOCHRSI", instance: new STOCHRSI(PERIODS) });
  indicators.push({ name: "WILLR", instance: new WILLR(PERIODS) });

  indicators.push({ name: "AROON", instance: new AROON(PERIODS) });
  indicators.push({ name: "AROONOSC", instance: new AROONOSC(PERIODS) });
  indicators.push({ name: "CCI", instance: new CCI(PERIODS) });
  indicators.push({ name: "VHF", instance: new VHF(PERIODS) });
  indicators.push({ name: "DM", instance: new DM(PERIODS) });
  indicators.push({ name: "DI", instance: new DI(PERIODS) });
  indicators.push({ name: "DX", instance: new DX(PERIODS) });
  indicators.push({ name: "ADX", instance: new ADX(PERIODS) });
  indicators.push({ name: "ADXR", instance: new ADXR(PERIODS) });
  indicators.push({ name: "SAR", instance: new SAR() });
  indicators.push({ name: "VI", instance: new VI(PERIODS) });
  indicators.push({ name: "ICHIMOKU", instance: new ICHIMOKU() });

  indicators.push({ name: "AD", instance: new AD() });
  indicators.push({ name: "ADOSC", instance: new ADOSC(PERIODS) });
  indicators.push({ name: "KVO", instance: new KVO(PERIODS) });
  indicators.push({ name: "NVI", instance: new NVI() });
  indicators.push({ name: "OBV", instance: new OBV() });
  indicators.push({ name: "PVI", instance: new PVI() });
  indicators.push({ name: "MFI", instance: new MFI(PERIODS) });
  indicators.push({ name: "EMV", instance: new EMV() });
  indicators.push({ name: "MARKETFI", instance: new MARKETFI() });
  indicators.push({ name: "VOSC", instance: new VOSC(PERIODS) });
  indicators.push({ name: "CMF", instance: new CMF(PERIODS) });
  indicators.push({ name: "CHO", instance: new CHO(PERIODS) });
  indicators.push({ name: "PVO", instance: new PVO(PERIODS) });
  indicators.push({ name: "FI", instance: new FI(PERIODS) });
  indicators.push({ name: "VROC", instance: new VROC(PERIODS) });
  indicators.push({ name: "PVT", instance: new PVT() });

  return indicators;
}

function runBenchmark() {
  const barCount = 100000;
  console.log(`Generating ${barCount} OHLCV bars...`);
  const bars = generateOHLCV(barCount);

  console.log("Creating all indicators...");
  const indicators = createIndicators();
  console.log(`Total indicators: ${indicators.length}\n`);

  console.log("Running benchmark...");
  const start = performance.now();

  for (const bar of bars) {
    for (const indicator of indicators) {
      indicator.instance.onData(bar);
    }
  }

  const end = performance.now();
  const elapsed = end - start;
  const totalCalls = bars.length * indicators.length;

  console.log("\nBenchmark Results:");
  console.log("=".repeat(50));
  console.log(`Bars processed: ${bars.length.toLocaleString()}`);
  console.log(`Indicators tested: ${indicators.length}`);
  console.log(`Total onData() calls: ${totalCalls.toLocaleString()}`);
  console.log(`Total time: ${elapsed.toFixed(2)}ms`);
  console.log(
    `Average per call: ${(elapsed / totalCalls).toFixed(6)}ms (${(
      (totalCalls / elapsed) *
      1000
    ).toFixed(0)} ops/sec)`
  );
  console.log(
    `Average per bar (all indicators): ${(elapsed / bars.length).toFixed(4)}ms`
  );
  console.log("=".repeat(50));

  console.log("\nIndicator List:");
  indicators.forEach((ind, idx) => {
    console.log(`  ${(idx + 1).toString().padStart(2)}. ${ind.name}`);
  });
}

runBenchmark();
