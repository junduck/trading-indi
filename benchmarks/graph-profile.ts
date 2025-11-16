/**
 * Graph Profiling Benchmark
 *
 * Designed to exercise all major code paths in Graph.ts execution for profiling.
 * Focus: identify hot paths and optimization opportunities through profiling.
 *
 * Key scenarios:
 * 1. Wide parallelism (many nodes at same level)
 * 2. Deep chain (sequential dependencies)
 * 3. Diamond pattern (join points)
 * 4. Mixed topology (realistic trading graph)
 * 5. With/without listeners
 * 6. With/without output callback
 */

import { Graph } from "../src/flow/index.js";
import { EMA, SMA, Variance } from "../src/classes/Foundation.js";

// Simple stateless operations
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

class Combine {
  onData(a: number, b: number): number {
    return (a + b) / 2;
  }
}

class Spread {
  onData(a: number, b: number): number {
    return Math.abs(a - b);
  }
}

/**
 * Scenario 1: Wide parallelism - tests concurrent execution performance
 * 1 root -> 20 parallel EMAs -> 20 parallel SMAs -> single combiner
 */
function buildWideGraph(): Graph {
  const graph = new Graph("tick");

  // Layer 1: 20 parallel EMAs
  for (let i = 0; i < 20; i++) {
    graph.add(`ema_${i}`, new EMA({ period: 5 + i })).depends("tick");
  }

  // Layer 2: 20 parallel SMAs
  for (let i = 0; i < 20; i++) {
    graph.add(`sma_${i}`, new SMA({ period: 5 + i })).depends("tick");
  }

  // Layer 3: 10 combiners (join 2 EMAs each)
  for (let i = 0; i < 10; i++) {
    graph.add(`comb_${i}`, new Combine()).depends(`ema_${i * 2}`, `ema_${i * 2 + 1}`);
  }

  return graph;
}

/**
 * Scenario 2: Deep chain - tests sequential dependency handling
 * Long chain of 50 sequential nodes
 */
function buildDeepGraph(): Graph {
  const graph = new Graph("tick");

  // Build a deep chain: tick -> node_0 -> node_1 -> ... -> node_49
  graph.add("node_0", new EMA({ period: 5 })).depends("tick");

  for (let i = 1; i < 50; i++) {
    if (i % 3 === 0) {
      graph.add(`node_${i}`, new SMA({ period: 5 })).depends(`node_${i - 1}`);
    } else if (i % 3 === 1) {
      graph.add(`node_${i}`, new Add(i)).depends(`node_${i - 1}`);
    } else {
      graph.add(`node_${i}`, new Multiply(1.01)).depends(`node_${i - 1}`);
    }
  }

  return graph;
}

/**
 * Scenario 3: Diamond pattern - tests join point efficiency
 * Multiple diamond shapes with fan-out and fan-in
 */
function buildDiamondGraph(): Graph {
  const graph = new Graph("tick");

  // Build 5 diamond layers
  for (let layer = 0; layer < 5; layer++) {
    const inputNode = layer === 0 ? "tick" : `join_${layer - 1}`;

    // Fan out: 4 parallel branches
    for (let i = 0; i < 4; i++) {
      const nodeName = `L${layer}_branch_${i}`;
      if (i % 2 === 0) {
        graph.add(nodeName, new EMA({ period: 5 + i })).depends(inputNode);
      } else {
        graph.add(nodeName, new SMA({ period: 5 + i })).depends(inputNode);
      }
    }

    // Fan in: 2 join nodes
    graph.add(`L${layer}_join_0`, new Combine())
      .depends(`L${layer}_branch_0`, `L${layer}_branch_1`);
    graph.add(`L${layer}_join_1`, new Combine())
      .depends(`L${layer}_branch_2`, `L${layer}_branch_3`);

    // Final join for this layer
    graph.add(`join_${layer}`, new Spread())
      .depends(`L${layer}_join_0`, `L${layer}_join_1`);
  }

  return graph;
}

/**
 * Scenario 4: Realistic trading graph
 * Mixed topology simulating actual trading indicators
 */
function buildRealisticGraph(): Graph {
  const graph = new Graph("tick");

  // Base indicators (parallel)
  graph.add("ema_fast", new EMA({ period: 12 })).depends("tick");
  graph.add("ema_slow", new EMA({ period: 26 })).depends("tick");
  graph.add("sma_20", new SMA({ period: 20 })).depends("tick");
  graph.add("sma_50", new SMA({ period: 50 })).depends("tick");

  // MACD line
  graph.add("macd", new Spread()).depends("ema_fast", "ema_slow");

  // Signal line (EMA of MACD)
  graph.add("signal", new EMA({ period: 9 })).depends("macd");

  // Histogram
  graph.add("histogram", new Spread()).depends("macd", "signal");

  // Bollinger Bands
  graph.add("bb_variance", new Variance({ period: 20 })).depends("tick");
  graph.add("bb_upper", new Add(2)).depends("sma_20"); // simplified
  graph.add("bb_lower", new Add(-2)).depends("sma_20"); // simplified

  // Moving average crossover signals
  graph.add("ma_cross_fast", new Spread()).depends("ema_fast", "sma_20");
  graph.add("ma_cross_slow", new Spread()).depends("ema_slow", "sma_50");

  // Composite signals
  graph.add("signal_1", new Combine()).depends("histogram", "ma_cross_fast");
  graph.add("signal_2", new Combine()).depends("ma_cross_slow", "bb_upper");

  // Final decision layer
  graph.add("decision", new Spread()).depends("signal_1", "signal_2");

  return graph;
}

/**
 * Benchmark a specific graph scenario
 */
async function benchmarkScenario(
  name: string,
  graph: Graph,
  iterations: number,
  withListeners: boolean = false,
  withOutput: boolean = false
): Promise<void> {
  console.log(`\n${name}`);
  console.log("-".repeat(60));

  if (withListeners) {
    // Add listeners to a few nodes to test listener overhead
    graph.on("ema_fast", () => {});
    graph.on("sma_20", () => {});
  }

  if (withOutput) {
    graph.output(() => {});
  }

  // Warmup
  for (let i = 0; i < 100; i++) {
    await graph.onData(100 + Math.random() * 10);
  }

  // Main benchmark
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    await graph.onData(100 + Math.random() * 10);
  }
  const elapsed = Date.now() - start;

  const avgTime = (elapsed / iterations).toFixed(4);
  const throughput = (iterations / (elapsed / 1000)).toFixed(0);

  console.log(`  Iterations:  ${iterations}`);
  console.log(`  Total time:  ${elapsed}ms`);
  console.log(`  Avg time:    ${avgTime}ms`);
  console.log(`  Throughput:  ${throughput} ops/sec`);
}

/**
 * Main profiling benchmark
 * Run with: NODE_OPTIONS="--prof" tsx benchmarks/graph-profile.ts
 * Then analyze: node --prof-process isolate-*.log > profile.txt
 */
async function runProfilingBenchmark() {
  console.log("=".repeat(60));
  console.log("Graph Profiling Benchmark");
  console.log("=".repeat(60));
  console.log("\nRun with: NODE_OPTIONS=\"--prof\" tsx benchmarks/graph-profile.ts");
  console.log("Analyze:  node --prof-process isolate-*.log > profile.txt");
  console.log("");

  // Force GC if available
  if (global.gc) {
    console.log("GC available - running initial cleanup\n");
    global.gc();
  }

  // Scenario 1: Wide parallelism
  await benchmarkScenario("Scenario 1: Wide Parallelism (40 nodes)", buildWideGraph(), 5000);

  // Scenario 2: Deep chain
  await benchmarkScenario("Scenario 2: Deep Chain (50 nodes)", buildDeepGraph(), 5000);

  // Scenario 3: Diamond pattern
  await benchmarkScenario("Scenario 3: Diamond Pattern (35 nodes)", buildDiamondGraph(), 5000);

  // Scenario 4: Realistic graph
  await benchmarkScenario("Scenario 4: Realistic Trading Graph (17 nodes)", buildRealisticGraph(), 10000);

  // Scenario 5: Realistic with listeners
  await benchmarkScenario(
    "Scenario 5: Realistic + Listeners (17 nodes)",
    buildRealisticGraph(),
    10000,
    true,
    false
  );

  // Scenario 6: Realistic with output callback
  await benchmarkScenario(
    "Scenario 6: Realistic + Output (17 nodes)",
    buildRealisticGraph(),
    10000,
    false,
    true
  );

  // Scenario 7: Stress test - wide + deep
  console.log("\n" + "=".repeat(60));
  console.log("STRESS TEST - Running extended iterations for profiling");
  console.log("=".repeat(60));

  const stressGraph = buildRealisticGraph();
  const stressIterations = 50000;

  console.log(`\nRunning ${stressIterations} iterations...`);
  const stressStart = Date.now();

  for (let i = 0; i < stressIterations; i++) {
    await stressGraph.onData(100 + Math.random() * 10);
  }

  const stressElapsed = Date.now() - stressStart;
  console.log(`  Total time:  ${stressElapsed}ms`);
  console.log(`  Avg time:    ${(stressElapsed / stressIterations).toFixed(4)}ms`);
  console.log(`  Throughput:  ${(stressIterations / (stressElapsed / 1000)).toFixed(0)} ops/sec`);

  console.log("\n" + "=".repeat(60));
  console.log("Benchmark complete - check profiling output");
  console.log("=".repeat(60));
}

runProfilingBenchmark().catch(console.error);
