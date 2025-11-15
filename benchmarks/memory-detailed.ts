/**
 * Detailed memory analysis for indicators.
 * Run with: NODE_OPTIONS="--expose-gc" pnpm exec tsx benchmarks/memory-detailed.ts
 */
import type { BarData } from "../src/types/BarData.js";
import { EMA, SMA, Variance, MinMax } from "../src/classes/Foundation.js";
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function gc() {
  if (global.gc) {
    global.gc();
  }
}

function detailedMemoryAnalysis() {
  console.log("Detailed Memory Analysis");
  console.log("=".repeat(70));

  gc();
  const baseline = process.memoryUsage();
  console.log("\n1. Baseline Memory (after GC):");
  console.log(`   Heap Used: ${formatBytes(baseline.heapUsed)}`);

  console.log("\n2. Testing bars array memory...");
  const barCount = 100000;
  let bars = generateOHLCV(barCount);
  gc();
  const afterBars = process.memoryUsage();
  const barsMemory = afterBars.heapUsed - baseline.heapUsed;
  console.log(`   Created ${barCount} bars`);
  console.log(`   Heap Used: ${formatBytes(afterBars.heapUsed)}`);
  console.log(`   Bars memory: ${formatBytes(barsMemory)}`);
  console.log(`   Per bar: ${formatBytes(barsMemory / barCount)}`);

  console.log("\n3. Releasing bars array and running GC...");
  bars = null as any;
  gc();
  const afterRelease = process.memoryUsage();
  console.log(`   Heap Used: ${formatBytes(afterRelease.heapUsed)}`);
  console.log(
    `   Released: ${formatBytes(afterBars.heapUsed - afterRelease.heapUsed)}`
  );

  console.log("\n4. Creating indicators...");
  const indicators = createIndicators();
  gc();
  const afterIndicators = process.memoryUsage();
  const indicatorsMemory = afterIndicators.heapUsed - afterRelease.heapUsed;
  console.log(`   Created ${indicators.length} indicators`);
  console.log(`   Heap Used: ${formatBytes(afterIndicators.heapUsed)}`);
  console.log(`   Indicators memory: ${formatBytes(indicatorsMemory)}`);
  console.log(
    `   Per indicator: ${formatBytes(indicatorsMemory / indicators.length)}`
  );

  console.log("\n5. Processing bars (streaming mode - no bars array kept)...");
  let price = 100;
  for (let i = 0; i < barCount; i++) {
    const change = (Math.random() - 0.5) * 2;
    price = Math.max(10, price + change);

    const low = price * (1 - Math.random() * 0.02);
    const high = price * (1 + Math.random() * 0.02);
    const open = low + Math.random() * (high - low);
    const close = low + Math.random() * (high - low);
    const volume = Math.floor(1000000 + Math.random() * 5000000);

    const bar = { open, high, low, close, volume };

    for (const indicator of indicators) {
      indicator.instance.onData(bar);
    }
  }

  gc();
  const afterProcessing = process.memoryUsage();
  const processingGrowth = afterProcessing.heapUsed - afterIndicators.heapUsed;
  console.log(`   Processed ${barCount} bars in streaming mode`);
  console.log(`   Heap Used: ${formatBytes(afterProcessing.heapUsed)}`);
  console.log(`   Memory growth: ${formatBytes(processingGrowth)}`);
  console.log(`   Per bar: ${formatBytes(processingGrowth / barCount)}`);

  console.log("\n6. Testing with bars array kept in memory...");
  gc();
  const beforeBarsTest = process.memoryUsage();
  const indicators2 = createIndicators();
  const testBars = generateOHLCV(barCount);

  for (const bar of testBars) {
    for (const indicator of indicators2) {
      indicator.instance.onData(bar);
    }
  }

  gc();
  const afterBarsTest = process.memoryUsage();
  const totalWithBars = afterBarsTest.heapUsed - beforeBarsTest.heapUsed;
  console.log(`   Total memory with bars kept: ${formatBytes(totalWithBars)}`);

  console.log("\n" + "=".repeat(70));
  console.log("ANALYSIS:");
  console.log("=".repeat(70));
  console.log(`Bars array size: ${formatBytes(barsMemory)}`);
  console.log(`Indicators base memory: ${formatBytes(indicatorsMemory)}`);
  console.log(
    `Memory growth during streaming (no bars kept): ${formatBytes(
      processingGrowth
    )}`
  );
  console.log(`Memory with bars kept: ${formatBytes(totalWithBars)}`);

  if (processingGrowth < 1024 * 1024) {
    console.log("  Indicators are properly bounded and not leaking");
  } else {
    console.log("  Possible memory leaks in indicators");
    console.log(`  Expected: <1 MB, Actual: ${formatBytes(processingGrowth)}`);
  }

  const expectedWithBars = barsMemory + indicatorsMemory + 1024 * 1024;
  if (totalWithBars > expectedWithBars * 1.5) {
    console.log("\n✗ WARNING: Memory usage higher than expected");
    console.log(
      `  Expected: ~${formatBytes(expectedWithBars)}, Actual: ${formatBytes(
        totalWithBars
      )}`
    );
  }
}

detailedMemoryAnalysis();
