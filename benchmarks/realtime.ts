import type { BarData } from "../src/types/BarData.js";
import { EMA, SMA, Variance, MinMax } from "../src/classes/Foundation.js";
import { VOLATILITY, ATR, BBANDS } from "../src/indicators/Volatility.js";
import { RSI, CMO } from "../src/indicators/Momentum.js";
import { MACD } from "../src/indicators/Oscillators.js";
import { STOCH, WILLR } from "../src/indicators/Stochastic.js";
import { CCI, VHF, ADX, ICHIMOKU } from "../src/indicators/Trend.js";
import { AD, OBV, MFI, VOSC, CMF, PVO } from "../src/indicators/Volume.js";

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

// Realistic trading strategies with different indicator combinations
const tradingStrategies = [
  {
    name: "Scalping Strategy",
    description: "Fast indicators for quick trades",
    indicators: [
      { name: "EMA", instance: new EMA({ period: 10 }) },
      { name: "ATR", instance: new ATR({ period: 14 }) },
      { name: "RSI", instance: new RSI({ period: 14 }) },
      { name: "VOLATILITY", instance: new VOLATILITY({ period: 20 }) },
      { name: "OBV", instance: new OBV() },
    ],
  },
  {
    name: "Swing Trading Strategy",
    description: "Medium-term indicators",
    indicators: [
      { name: "EMA", instance: new EMA({ period: 20 }) },
      { name: "SMA", instance: new SMA({ period: 50 }) },
      {
        name: "MACD",
        instance: new MACD({
          period_short: 12,
          period_long: 26,
          period_signal: 9,
        }),
      },
      { name: "ADX", instance: new ADX({ period: 14 }) },
      { name: "BBANDS", instance: new BBANDS({ period: 20 }) },
      { name: "MFI", instance: new MFI({ period: 14 }) },
    ],
  },
  {
    name: "Trend Following Strategy",
    description: "Long-term trend indicators",
    indicators: [
      { name: "EMA", instance: new EMA({ period: 50 }) },
      { name: "SMA", instance: new SMA({ period: 200 }) },
      { name: "ADX", instance: new ADX({ period: 14 }) },
      { name: "ICHIMOKU", instance: new ICHIMOKU() },
      { name: "VHF", instance: new VHF({ period: 14 }) },
      { name: "AD", instance: new AD() },
    ],
  },
  {
    name: "Mean Reversion Strategy",
    description: "Oscillators for range-bound markets",
    indicators: [
      { name: "RSI", instance: new RSI({ period: 14 }) },
      { name: "BBANDS", instance: new BBANDS({ period: 20 }) },
      { name: "CCI", instance: new CCI({ period: 20 }) },
      {
        name: "STOCH",
        instance: new STOCH({ k_period: 14, k_slowing: 3, d_period: 3 }),
      },
      { name: "WILLR", instance: new WILLR({ period: 14 }) },
      { name: "CMO", instance: new CMO({ period: 14 }) },
    ],
  },
  {
    name: "Volume Analysis Strategy",
    description: "Volume-based indicators",
    indicators: [
      { name: "OBV", instance: new OBV() },
      { name: "AD", instance: new AD() },
      { name: "MFI", instance: new MFI({ period: 14 }) },
      {
        name: "VOSC",
        instance: new VOSC({ period_short: 12, period_long: 26 }),
      },
      { name: "CMF", instance: new CMF({ period: 20 }) },
      {
        name: "PVO",
        instance: new PVO({
          period_short: 12,
          period_long: 26,
          period_signal: 9,
        }),
      },
    ],
  },
  {
    name: "Multi-Timeframe Strategy",
    description: "Comprehensive analysis with multiple timeframes",
    indicators: [
      // Short-term
      { name: "EMA_5", instance: new EMA({ period: 5 }) },
      { name: "RSI_14", instance: new RSI({ period: 14 }) },
      { name: "ATR_14", instance: new ATR({ period: 14 }) },
      // Medium-term
      { name: "EMA_20", instance: new EMA({ period: 20 }) },
      {
        name: "MACD",
        instance: new MACD({
          period_short: 12,
          period_long: 26,
          period_signal: 9,
        }),
      },
      { name: "ADX_14", instance: new ADX({ period: 14 }) },
      // Long-term
      { name: "SMA_50", instance: new SMA({ period: 50 }) },
      { name: "BBANDS_20", instance: new BBANDS({ period: 20 }) },
      { name: "ICHIMOKU", instance: new ICHIMOKU() },
      // Volume
      { name: "OBV", instance: new OBV() },
      { name: "MFI_14", instance: new MFI({ period: 14 }) },
    ],
  },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function runRealtimeBenchmark() {
  console.log("Real-time Trading Performance Analysis");
  console.log("=".repeat(60));

  // Test different market data frequencies
  const frequencies = [
    {
      name: "Tick Data",
      barsPerSecond: 1000,
      description: "High-frequency trading",
    },
    {
      name: "1-Second Bars",
      barsPerSecond: 1,
      description: "Second-level trading",
    },
    {
      name: "1-Minute Bars",
      barsPerSecond: 1 / 60,
      description: "Minute-level trading",
    },
    {
      name: "5-Minute Bars",
      barsPerSecond: 1 / 300,
      description: "Swing trading",
    },
  ];

  for (const frequency of frequencies) {
    console.log(`\n${frequency.name} (${frequency.description}):`);
    console.log("-".repeat(40));

    for (const strategy of tradingStrategies) {
      const initialMemory = process.memoryUsage();

      // Generate test data
      const testBars = generateOHLCV(
        Math.max(1000, frequency.barsPerSecond * 60)
      ); // At least 1000 bars or 1 minute of data

      // Warm up indicators
      for (let i = 0; i < Math.min(100, testBars.length); i++) {
        for (const indicator of strategy.indicators) {
          indicator.instance.onData(testBars[i]);
        }
      }

      // Measure performance
      const start = performance.now();
      let processedBars = 0;

      for (const bar of testBars) {
        for (const indicator of strategy.indicators) {
          indicator.instance.onData(bar);
        }
        processedBars++;

        // Stop if we've processed enough for this frequency
        if (processedBars >= frequency.barsPerSecond * 10) {
          // Process 10 seconds worth
          break;
        }
      }

      const end = performance.now();
      const finalMemory = process.memoryUsage();

      const timePerBar = (end - start) / processedBars;
      const maxBarsPerSecond = 1000 / timePerBar;
      const canHandleFrequency = maxBarsPerSecond >= frequency.barsPerSecond;

      console.log(`  ${strategy.name}:`);
      console.log(`    Indicators: ${strategy.indicators.length}`);
      console.log(`    Time per bar: ${timePerBar.toFixed(4)}ms`);
      console.log(`    Max bars/sec: ${maxBarsPerSecond.toFixed(0)}`);
      console.log(`    Required: ${frequency.barsPerSecond.toFixed(3)}/sec`);
      console.log(
        `    Memory: ${formatBytes(
          finalMemory.heapUsed - initialMemory.heapUsed
        )}`
      );
      console.log(
        `    Status: ${canHandleFrequency ? "✅ FEASIBLE" : "❌ TOO SLOW"}`
      );
    }
  }

  // Memory stress test
  console.log("\nMemory Stress Test:");
  console.log("=".repeat(40));

  const stressTestIndicators: Indicator[] = [
    { name: "EMA", instance: new EMA({ period: 200 }) },
    { name: "SMA", instance: new SMA({ period: 200 }) },
    { name: "Variance", instance: new Variance({ period: 200 }) },
    { name: "RSI", instance: new RSI({ period: 14 }) },
    {
      name: "MACD",
      instance: new MACD({
        period_short: 12,
        period_long: 26,
        period_signal: 9,
      }),
    },
    { name: "BBANDS", instance: new BBANDS({ period: 20 }) },
    { name: "ICHIMOKU", instance: new ICHIMOKU() },
    { name: "ADX", instance: new ADX({ period: 14 }) },
    { name: "ATR", instance: new ATR({ period: 14 }) },
    { name: "OBV", instance: new OBV() },
  ];

  const initialMemory = process.memoryUsage();
  const bars = generateOHLCV(50000); // 50K bars

  console.log(
    `Processing 50,000 bars with ${stressTestIndicators.length} indicators...`
  );

  const start = performance.now();
  for (const bar of bars) {
    for (const indicator of stressTestIndicators) {
      indicator.instance.onData(bar);
    }
  }
  const end = performance.now();

  const finalMemory = process.memoryUsage();

  console.log(`Time: ${(end - start).toFixed(2)}ms`);
  console.log(
    `Memory growth: ${formatBytes(
      finalMemory.heapUsed - initialMemory.heapUsed
    )}`
  );
  console.log(
    `Memory per bar: ${formatBytes(
      (finalMemory.heapUsed - initialMemory.heapUsed) / bars.length
    )}`
  );
}

runRealtimeBenchmark();
