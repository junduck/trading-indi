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
  memoryFootprint?: number;
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

function analyzeMemory() {
  console.log("Memory Analysis for trading-indi");
  console.log("=".repeat(50));

  // Get initial memory
  const initialMemory = process.memoryUsage();
  console.log("Initial memory usage:");
  console.log(`  RSS: ${formatBytes(initialMemory.rss)}`);
  console.log(`  Heap Used: ${formatBytes(initialMemory.heapUsed)}`);
  console.log(`  Heap Total: ${formatBytes(initialMemory.heapTotal)}`);

  // Create indicators
  console.log("\nCreating all indicators...");
  const indicators = createIndicators();
  const afterCreationMemory = process.memoryUsage();

  console.log(`Memory after creating ${indicators.length} indicators:`);
  console.log(
    `  RSS: ${formatBytes(afterCreationMemory.rss)} (+${formatBytes(
      afterCreationMemory.rss - initialMemory.rss
    )})`
  );
  console.log(
    `  Heap Used: ${formatBytes(afterCreationMemory.heapUsed)} (+${formatBytes(
      afterCreationMemory.heapUsed - initialMemory.heapUsed
    )})`
  );
  console.log(
    `  Memory per indicator: ${formatBytes(
      (afterCreationMemory.heapUsed - initialMemory.heapUsed) /
        indicators.length
    )}`
  );

  // Process data
  console.log("\nProcessing 100,000 bars...");
  const bars = generateOHLCV(100000);

  const start = performance.now();
  for (const bar of bars) {
    for (const indicator of indicators) {
      indicator.instance.onData(bar);
    }
  }
  const end = performance.now();

  const afterProcessingMemory = process.memoryUsage();
  console.log(`Memory after processing 100,000 bars:`);
  console.log(
    `  RSS: ${formatBytes(afterProcessingMemory.rss)} (+${formatBytes(
      afterProcessingMemory.rss - afterCreationMemory.rss
    )})`
  );
  console.log(
    `  Heap Used: ${formatBytes(
      afterProcessingMemory.heapUsed
    )} (+${formatBytes(
      afterProcessingMemory.heapUsed - afterCreationMemory.heapUsed
    )})`
  );

  // Performance analysis
  console.log("\nPerformance Analysis:");
  console.log("=".repeat(50));
  console.log(`Processing time: ${(end - start).toFixed(2)}ms`);
  console.log(
    `Bars per second: ${(bars.length / ((end - start) / 1000)).toFixed(0)}`
  );
  console.log(
    `Indicators per second: ${(
      (bars.length * indicators.length) /
      ((end - start) / 1000)
    ).toFixed(0)}`
  );
  console.log(
    `Time per bar (all indicators): ${((end - start) / bars.length).toFixed(
      4
    )}ms`
  );
  console.log(
    `Time per indicator call: ${(
      (end - start) /
      (bars.length * indicators.length)
    ).toFixed(6)}ms`
  );

  // Real-time trading suitability analysis
  console.log("\nReal-time Trading Suitability Analysis:");
  console.log("=".repeat(50));

  const timePerBarMs = (end - start) / bars.length;
  const indicatorsPerCall = Math.floor(100 / timePerBarMs); // How many indicators can run in 100ms
  const maxBarsPerSecond = Math.floor(1000 / timePerBarMs);

  console.log(
    `Time to process one bar with all indicators: ${timePerBarMs.toFixed(4)}ms`
  );
  console.log(`Maximum bars per second possible: ${maxBarsPerSecond}`);
  console.log(`Can process ${indicatorsPerCall} indicators in 100ms window`);

  // Memory efficiency analysis
  console.log("\nMemory Efficiency Analysis:");
  console.log("=".repeat(50));
  const memoryPerIndicator =
    (afterCreationMemory.heapUsed - initialMemory.heapUsed) / indicators.length;
  const memoryGrowthPerBar =
    (afterProcessingMemory.heapUsed - afterCreationMemory.heapUsed) /
    bars.length;

  console.log(`Memory per indicator: ${formatBytes(memoryPerIndicator)}`);
  console.log(`Memory growth per bar: ${formatBytes(memoryGrowthPerBar)}`);
}

analyzeMemory();
