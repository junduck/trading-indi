import type { BarData } from "../src/types/BarData.js";
import { EMA, SMA, MinMax } from "../src/fn/Foundation.js";
import { Variance } from "../src/fn/Stats.js";
import * as ti from "../src/index.js";

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

  indicators.push({ name: "VOLATILITY", instance: new ti.Volatility(PERIODS) });
  indicators.push({ name: "CVI", instance: new ti.CVI(PERIODS) });
  indicators.push({ name: "MASS", instance: new ti.MASS(PERIODS) });
  indicators.push({ name: "TR", instance: new ti.TR() });
  indicators.push({ name: "ATR", instance: new ti.ATR(PERIODS) });
  indicators.push({ name: "NATR", instance: new ti.NATR(PERIODS) });
  indicators.push({
    name: "PriceChannel",
    instance: new ti.PriceChannel(PERIODS),
  });
  indicators.push({ name: "BBANDS", instance: new ti.BBANDS(PERIODS) });
  indicators.push({ name: "KC", instance: new ti.KC(PERIODS) });
  indicators.push({ name: "DC", instance: new ti.DC(PERIODS) });

  indicators.push({ name: "BOP", instance: new ti.BOP() });
  indicators.push({ name: "MOM", instance: new ti.MOM(PERIODS) });
  indicators.push({ name: "ROC", instance: new ti.ROC(PERIODS) });
  indicators.push({ name: "ROCR", instance: new ti.ROCR(PERIODS) });
  indicators.push({ name: "RSI", instance: new ti.RSI(PERIODS) });
  indicators.push({ name: "CMO", instance: new ti.CMO(PERIODS) });
  indicators.push({ name: "WAD", instance: new ti.WAD() });
  indicators.push({ name: "RVI", instance: new ti.RVI(PERIODS) });
  indicators.push({ name: "TSI", instance: new ti.TSI() });
  indicators.push({ name: "BBPOWER", instance: new ti.BBPOWER(PERIODS) });

  indicators.push({ name: "AO", instance: new ti.AO() });
  indicators.push({ name: "APO", instance: new ti.APO(PERIODS) });
  indicators.push({ name: "DPO", instance: new ti.DPO(PERIODS) });
  indicators.push({ name: "Fisher", instance: new ti.Fisher(PERIODS) });
  indicators.push({ name: "MACD", instance: new ti.MACD(PERIODS) });
  indicators.push({ name: "PPO", instance: new ti.PPO(PERIODS) });
  indicators.push({ name: "QSTICK", instance: new ti.QSTICK(PERIODS) });
  indicators.push({ name: "TRIX", instance: new ti.TRIX(PERIODS) });
  indicators.push({ name: "ULTOSC", instance: new ti.ULTOSC(PERIODS) });

  indicators.push({ name: "STOCH", instance: new ti.STOCH(PERIODS) });
  indicators.push({ name: "STOCHRSI", instance: new ti.STOCHRSI(PERIODS) });
  indicators.push({ name: "WILLR", instance: new ti.WILLR(PERIODS) });

  indicators.push({ name: "AROON", instance: new ti.AROON(PERIODS) });
  indicators.push({ name: "AROONOSC", instance: new ti.AROONOSC(PERIODS) });
  indicators.push({ name: "CCI", instance: new ti.CCI(PERIODS) });
  indicators.push({ name: "VHF", instance: new ti.VHF(PERIODS) });
  indicators.push({ name: "DM", instance: new ti.DM(PERIODS) });
  indicators.push({ name: "DI", instance: new ti.DI(PERIODS) });
  indicators.push({ name: "DX", instance: new ti.DX(PERIODS) });
  indicators.push({ name: "ADX", instance: new ti.ADX(PERIODS) });
  indicators.push({ name: "ADXR", instance: new ti.ADXR(PERIODS) });
  indicators.push({ name: "SAR", instance: new ti.SAR() });
  indicators.push({ name: "VI", instance: new ti.VI(PERIODS) });
  indicators.push({ name: "ICHIMOKU", instance: new ti.ICHIMOKU() });

  indicators.push({ name: "AD", instance: new ti.AD() });
  indicators.push({ name: "ADOSC", instance: new ti.ADOSC(PERIODS) });
  indicators.push({ name: "KVO", instance: new ti.KVO(PERIODS) });
  indicators.push({ name: "NVI", instance: new ti.NVI() });
  indicators.push({ name: "OBV", instance: new ti.OBV() });
  indicators.push({ name: "PVI", instance: new ti.PVI() });
  indicators.push({ name: "MFI", instance: new ti.MFI(PERIODS) });
  indicators.push({ name: "EMV", instance: new ti.EMV() });
  indicators.push({ name: "MARKETFI", instance: new ti.MarketFI() });
  indicators.push({ name: "VOSC", instance: new ti.VOSC(PERIODS) });
  indicators.push({ name: "CMF", instance: new ti.CMF(PERIODS) });
  indicators.push({ name: "CHO", instance: new ti.CHO(PERIODS) });
  indicators.push({ name: "PVO", instance: new ti.PVO(PERIODS) });
  indicators.push({ name: "FI", instance: new ti.FI(PERIODS) });
  indicators.push({ name: "VROC", instance: new ti.VROC(PERIODS) });
  indicators.push({ name: "PVT", instance: new ti.PVT() });

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
