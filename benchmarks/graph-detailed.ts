/**
 * Detailed Graph Performance Analysis
 *
 * This benchmark instruments the Graph execution to identify bottlenecks:
 * - Map operations (get/set/has)
 * - Array operations (iteration, push)
 * - Promise.all overhead
 * - State object creation/spreading
 * - Event emission overhead
 */

import { Graph } from "../src/flow/index.js";
import { EMA, SMA } from "../src/fn/Foundation.js";
import { Variance } from "../src/fn/Stats.js";

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
 * Build a realistic trading graph with known characteristics
 */
function buildTestGraph(): Graph {
  const graph = new Graph("tick");

  // Layer 1: 10 parallel base indicators (high parallelism)
  for (let i = 0; i < 10; i++) {
    if (i < 5) {
      graph.add(`ema_${i}`, new EMA({ period: 5 + i * 2 })).depends("tick");
    } else {
      graph.add(`sma_${i}`, new SMA({ period: 5 + i * 2 })).depends("tick");
    }
  }

  // Layer 2: 10 combiners (join pairs)
  for (let i = 0; i < 5; i++) {
    graph.add(`comb_${i}`, new Combine()).depends(`ema_${i}`, `sma_${i}`);
  }

  // Layer 3: 5 spreads
  for (let i = 0; i < 4; i++) {
    graph
      .add(`spread_${i}`, new Spread())
      .depends(`comb_${i}`, `comb_${i + 1}`);
  }

  // Layer 4: variance calculations
  graph.add("var_1", new Variance({ period: 10 })).depends("tick");
  graph.add("var_2", new Variance({ period: 20 })).depends("tick");

  // Layer 5: final aggregations
  graph.add("final_1", new Combine()).depends("spread_0", "spread_1");
  graph.add("final_2", new Combine()).depends("spread_2", "spread_3");
  graph.add("decision", new Spread()).depends("final_1", "final_2");

  return graph;
}

/**
 * Simple timing wrapper for graph execution
 */
async function timeGraphExecution(graph: Graph, iterations: number) {
  const timings = {
    total: 0,
    min: Infinity,
    max: 0,
  };

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await graph.onData(100 + Math.random() * 10);
    const elapsed = performance.now() - start;

    timings.total += elapsed;
    timings.min = Math.min(timings.min, elapsed);
    timings.max = Math.max(timings.max, elapsed);
  }

  return {
    total: timings.total,
    avg: timings.total / iterations,
    min: timings.min,
    max: timings.max,
  };
}

/**
 * Test state object creation strategies
 */
async function testStateStrategies() {
  console.log("\n" + "=".repeat(60));
  console.log("Testing State Update Strategies");
  console.log("=".repeat(60));

  const iterations = 100000;

  // Strategy 1: Object spread (current implementation)
  console.log("\nStrategy 1: Object spread { ...state, key: value }");
  let state1: Record<string, any> = { root: 0 };
  const t1 = performance.now();
  for (let i = 0; i < iterations; i++) {
    state1 = { ...state1, [`node_${i % 10}`]: i };
  }
  const elapsed1 = performance.now() - t1;
  console.log(`  Time: ${elapsed1.toFixed(2)}ms`);
  console.log(
    `  Avg:  ${((elapsed1 / iterations) * 1000).toFixed(3)}μs per update`
  );

  // Strategy 2: Direct mutation
  console.log("\nStrategy 2: Direct mutation state[key] = value");
  let state2: Record<string, any> = { root: 0 };
  const t2 = performance.now();
  for (let i = 0; i < iterations; i++) {
    state2[`node_${i % 10}`] = i;
  }
  const elapsed2 = performance.now() - t2;
  console.log(`  Time: ${elapsed2.toFixed(2)}ms`);
  console.log(
    `  Avg:  ${((elapsed2 / iterations) * 1000).toFixed(3)}μs per update`
  );
  console.log(`  Speedup: ${(elapsed1 / elapsed2).toFixed(2)}x`);

  // Strategy 3: Object.assign
  console.log("\nStrategy 3: Object.assign(state, { key: value })");
  let state3: Record<string, any> = { root: 0 };
  const t3 = performance.now();
  for (let i = 0; i < iterations; i++) {
    Object.assign(state3, { [`node_${i % 10}`]: i });
  }
  const elapsed3 = performance.now() - t3;
  console.log(`  Time: ${elapsed3.toFixed(2)}ms`);
  console.log(
    `  Avg:  ${((elapsed3 / iterations) * 1000).toFixed(3)}μs per update`
  );
  console.log(`  Speedup: ${(elapsed1 / elapsed3).toFixed(2)}x`);

  // Strategy 4: Map instead of object
  console.log("\nStrategy 4: Map.set(key, value)");
  let state4 = new Map<string, any>();
  state4.set("root", 0);
  const t4 = performance.now();
  for (let i = 0; i < iterations; i++) {
    state4.set(`node_${i % 10}`, i);
  }
  const elapsed4 = performance.now() - t4;
  console.log(`  Time: ${elapsed4.toFixed(2)}ms`);
  console.log(
    `  Avg:  ${((elapsed4 / iterations) * 1000).toFixed(3)}μs per update`
  );
  console.log(`  Speedup: ${(elapsed1 / elapsed4).toFixed(2)}x`);
}

/**
 * Test array vs Map for tracking ready nodes
 */
async function testReadyQueueStrategies() {
  console.log("\n" + "=".repeat(60));
  console.log("Testing Ready Queue Strategies");
  console.log("=".repeat(60));

  const iterations = 100000;
  const nodeNames = Array.from({ length: 20 }, (_, i) => `node_${i}`);

  // Strategy 1: Array with push
  console.log("\nStrategy 1: Array with push");
  const t1 = performance.now();
  for (let i = 0; i < iterations; i++) {
    let ready: string[] = [];
    for (const name of nodeNames) {
      ready.push(name);
    }
  }
  const elapsed1 = performance.now() - t1;
  console.log(`  Time: ${elapsed1.toFixed(2)}ms`);

  // Strategy 2: Pre-allocated array
  console.log("\nStrategy 2: Pre-allocated array with index");
  const t2 = performance.now();
  for (let i = 0; i < iterations; i++) {
    let ready = new Array(nodeNames.length);
    let idx = 0;
    for (const name of nodeNames) {
      ready[idx++] = name;
    }
  }
  const elapsed2 = performance.now() - t2;
  console.log(`  Time: ${elapsed2.toFixed(2)}ms`);
  console.log(`  Speedup: ${(elapsed1 / elapsed2).toFixed(2)}x`);

  // Strategy 3: Set
  console.log("\nStrategy 3: Set with add");
  const t3 = performance.now();
  for (let i = 0; i < iterations; i++) {
    let ready = new Set<string>();
    for (const name of nodeNames) {
      ready.add(name);
    }
  }
  const elapsed3 = performance.now() - t3;
  console.log(`  Time: ${elapsed3.toFixed(2)}ms`);
  console.log(`  Speedup: ${(elapsed1 / elapsed3).toFixed(2)}x`);
}

async function runDetailedBenchmark() {
  console.log("=".repeat(60));
  console.log("Detailed Graph Performance Analysis");
  console.log("=".repeat(60));

  // Run micro-benchmarks
  await testStateStrategies();
  await testReadyQueueStrategies();

  console.log("\n" + "=".repeat(60));
  console.log("Graph Execution Benchmark");
  console.log("=".repeat(60));

  // Build test graph
  const graph = buildTestGraph();

  // Warmup
  console.log("\nWarming up (100 iterations)...");
  for (let i = 0; i < 100; i++) {
    await graph.onData(100 + Math.random() * 10);
  }

  // Main benchmark
  const iterations = 10000;
  console.log(`Running ${iterations} iterations...\n`);

  const result = await timeGraphExecution(graph, iterations);

  console.log("Execution Statistics:");
  console.log("-".repeat(60));
  console.log(`  Total time:   ${result.total.toFixed(2)}ms`);
  console.log(`  Avg time:     ${result.avg.toFixed(4)}ms per iteration`);
  console.log(`  Min time:     ${result.min.toFixed(4)}ms`);
  console.log(`  Max time:     ${result.max.toFixed(4)}ms`);
  console.log(
    `  Throughput:   ${(iterations / (result.total / 1000)).toFixed(0)} ops/sec`
  );

  console.log("\n" + "=".repeat(60));
}

runDetailedBenchmark().catch(console.error);
