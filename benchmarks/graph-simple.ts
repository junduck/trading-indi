/**
 * Simple Graph Benchmark - Quick performance check
 */

import { Graph } from "../src/flow/index.js";
import { EMA, SMA } from "../src/fn/Foundation.js";

class Add {
  constructor(private value: number) {}
  onData(x: number): number {
    return x + this.value;
  }
}

class Multiply {
  constructor(private factor: number) {}
  onData(x: number): number {
    return x * this.factor;
  }
}

function buildGraph(): Graph {
  const graph = new Graph("tick");

  // Layer 1: 10 EMAs
  for (let i = 0; i < 10; i++) {
    graph.add(`ema_${i}`, new EMA({ period: 5 + i * 2 })).depends("tick");
  }

  // Layer 2: 10 SMAs
  for (let i = 0; i < 10; i++) {
    graph.add(`sma_${i}`, new SMA({ period: 5 + i * 2 })).depends("tick");
  }

  // Layer 3: 10 Add nodes
  for (let i = 0; i < 10; i++) {
    graph.add(`add_${i}`, new Add(i * 10)).depends(`ema_${i}`);
  }

  // Layer 4: 10 Multiply nodes
  for (let i = 0; i < 10; i++) {
    graph.add(`mul_${i}`, new Multiply(1 + i * 0.1)).depends(`sma_${i}`);
  }

  return graph;
}

async function runSimpleBenchmark() {
  console.log("Graph Simple Benchmark");
  console.log("=".repeat(50));

  const graph = buildGraph();
  console.log("Graph built with 40 nodes\n");

  // Warmup
  for (let i = 0; i < 100; i++) {
    await graph.onData(100 + Math.random() * 10);
  }

  // Benchmark
  const iterations = 10000;
  const start = Date.now();

  for (let i = 0; i < iterations; i++) {
    await graph.onData(100 + Math.random() * 10);
  }

  const elapsed = Date.now() - start;
  const opsPerSec = (iterations / (elapsed / 1000)).toFixed(0);
  const avgTime = (elapsed / iterations).toFixed(3);

  console.log(`Iterations:  ${iterations}`);
  console.log(`Total time:  ${elapsed}ms`);
  console.log(`Avg time:    ${avgTime}ms per iteration`);
  console.log(`Throughput:  ${opsPerSec} ops/sec`);
  console.log("\n" + "=".repeat(50));
}

runSimpleBenchmark().catch(console.error);
