/**
 * Memory comparison: bars array vs streaming mode.
 * Run with: NODE_OPTIONS="--expose-gc" pnpm exec tsx benchmarks/memory-comparison.ts
 */
import type { BarData } from "../src/types/BarData.js";
import { EMA, SMA } from "../src/classes/Foundation.js";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function gc() {
  if (global.gc) global.gc();
}

function generateBar(price: number): BarData {
  const low = price * (1 - Math.random() * 0.02);
  const high = price * (1 + Math.random() * 0.02);
  const open = low + Math.random() * (high - low);
  const close = low + Math.random() * (high - low);
  const volume = Math.floor(1000000 + Math.random() * 5000000);
  return { open, high, low, close, volume };
}

console.log("Memory Comparison: Bars Array vs Streaming");
console.log("=".repeat(70));

console.log("\nScenario 1: Generate all bars upfront (array in memory)");
const bars1: BarData[] = [];
let price1 = 100;
for (let i = 0; i < 100000; i++) {
  const change = (Math.random() - 0.5) * 2;
  price1 = Math.max(10, price1 + change);
  bars1.push(generateBar(price1));
}

const ema1 = new EMA({ period: 50 });
const sma1 = new SMA({ period: 50 });

gc();
const before1 = process.memoryUsage();

for (const bar of bars1) {
  ema1.onData(bar.close);
  sma1.onData(bar.close);
}

gc();
const after1 = process.memoryUsage();

console.log(`Bars array size: ${formatBytes(JSON.stringify(bars1).length)}`);
console.log(`Heap before processing: ${formatBytes(before1.heapUsed)}`);
console.log(`Heap after processing: ${formatBytes(after1.heapUsed)}`);
console.log(`Growth: ${formatBytes(after1.heapUsed - before1.heapUsed)}`);

console.log("\nScenario 2: Stream bars (no array kept)");
gc();
const before2 = process.memoryUsage();

const ema2 = new EMA({ period: 50 });
const sma2 = new SMA({ period: 50 });

let price2 = 100;
for (let i = 0; i < 100000; i++) {
  const change = (Math.random() - 0.5) * 2;
  price2 = Math.max(10, price2 + change);
  const bar = generateBar(price2);
  ema2.onData(bar.close);
  sma2.onData(bar.close);
}

gc();
const after2 = process.memoryUsage();

console.log(`Heap before processing: ${formatBytes(before2.heapUsed)}`);
console.log(`Heap after processing: ${formatBytes(after2.heapUsed)}`);
console.log(`Growth: ${formatBytes(after2.heapUsed - before2.heapUsed)}`);

const diff =
  after1.heapUsed - before1.heapUsed - (after2.heapUsed - before2.heapUsed);
console.log(
  `Memory difference between scenarios: ${formatBytes(Math.abs(diff))}`
);
