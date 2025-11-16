/**
 * Benchmark: DAG Execution Overhead
 *
 * This benchmark measures the OVERHEAD of the Graph execution engine,
 * NOT the performance of individual indicators.
 *
 * Uses trivial operations (Add, Multiply, Subtract, Divide) to isolate
 * the cost of:
 * - Topological sorting
 * - Dependency resolution
 * - State management
 * - Async coordination
 * - Node execution scheduling
 *
 * Real indicator performance depends on the complexity of the indicators used.
 */

import { Graph } from "../src/flow/index.js";
import { EMA, SMA } from "../src/classes/Foundation.js";

// Trivial computation nodes
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

class Subtract {
  onData(a: number, b: number): number {
    return a - b;
  }
}

class Divide {
  onData(a: number, b: number): number {
    return b === 0 ? 0 : a / b;
  }
}

// Build graph with ~50 nodes
function buildGraph(): Graph {
  const graph = new Graph("tick");

  // Layer 1: 10 EMAs with different periods
  for (let i = 0; i < 10; i++) {
    graph.add(`ema_${i}`, new EMA({ period: 5 + i * 2 })).depends("tick");
  }

  // Layer 2: 10 SMAs with different periods
  for (let i = 0; i < 10; i++) {
    graph.add(`sma_${i}`, new SMA({ period: 5 + i * 2 })).depends("tick");
  }

  // Layer 3: 10 Add nodes depending on EMAs
  for (let i = 0; i < 10; i++) {
    graph.add(`add_${i}`, new Add(i * 10)).depends(`ema_${i}`);
  }

  // Layer 4: 10 Multiply nodes depending on SMAs
  for (let i = 0; i < 10; i++) {
    graph.add(`mul_${i}`, new Multiply(1 + i * 0.1)).depends(`sma_${i}`);
  }

  // Layer 5: 5 Subtract nodes combining Add and Multiply results
  for (let i = 0; i < 5; i++) {
    graph
      .add(`sub_${i}`, new Subtract())
      .depends(`add_${i * 2}`, `mul_${i * 2}`);
  }

  // Layer 6: 5 Divide nodes combining different Subtract results
  for (let i = 0; i < 4; i++) {
    graph.add(`div_${i}`, new Divide()).depends(`sub_${i}`, `sub_${i + 1}`);
  }

  return graph;
}

// Memory utilities
function getMemoryUsage(): {
  heapUsed: number;
  heapTotal: number;
  external: number;
} {
  const mem = process.memoryUsage();
  return {
    heapUsed: mem.heapUsed / 1024 / 1024,
    heapTotal: mem.heapTotal / 1024 / 1024,
    external: mem.external / 1024 / 1024,
  };
}

function formatMemory(mb: number): string {
  return `${mb.toFixed(2)} MB`;
}

async function runBenchmark() {
  console.log("=".repeat(60));
  console.log("DAG Execution Overhead Benchmark");
  console.log("=".repeat(60));
  console.log("");
  console.log("NOTE: This measures Graph execution overhead only.");
  console.log("      Trivial nodes used to isolate DAG machinery cost.");
  console.log("      Real performance depends on indicator complexity.");
  console.log("");

  // Force GC if available
  if (global.gc) {
    global.gc();
  }

  const memBefore = getMemoryUsage();
  console.log("\nMemory before graph creation:");
  console.log(`  Heap Used:  ${formatMemory(memBefore.heapUsed)}`);
  console.log(`  Heap Total: ${formatMemory(memBefore.heapTotal)}`);
  console.log(`  External:   ${formatMemory(memBefore.external)}`);

  // Build graph
  const buildStart = Date.now();
  const graph = buildGraph();
  const buildTime = Date.now() - buildStart;

  const nodeCount = 10 + 10 + 10 + 10 + 5 + 4; // 49 nodes

  console.log(`\nGraph built in ${buildTime}ms`);
  console.log(`Node count: ${nodeCount}`);

  const memAfterBuild = getMemoryUsage();
  console.log("\nMemory after graph creation:");
  console.log(`  Heap Used:  ${formatMemory(memAfterBuild.heapUsed)}`);
  console.log(`  Heap Total: ${formatMemory(memAfterBuild.heapTotal)}`);
  console.log(`  External:   ${formatMemory(memAfterBuild.external)}`);
  console.log(
    `  Delta:      ${formatMemory(memAfterBuild.heapUsed - memBefore.heapUsed)}`
  );

  // Warmup
  console.log("\nWarming up (100 iterations)...");
  for (let i = 0; i < 100; i++) {
    await graph.onData(100 + Math.random() * 10);
  }

  // Benchmark execution
  const iterations = 10000;
  console.log(`\nBenchmarking execution (${iterations} iterations)...`);

  const times: number[] = [];
  const execStart = Date.now();

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await graph.onData(100 + Math.random() * 10);
    times.push(performance.now() - start);
  }

  const execEnd = Date.now();
  const totalTime = execEnd - execStart;

  // Calculate statistics
  times.sort((a, b) => a - b);
  const min = times[0]!;
  const max = times[times.length - 1]!;
  const mean = times.reduce((a, b) => a + b, 0) / times.length;
  const p50 = times[Math.floor(times.length * 0.5)]!;
  const p90 = times[Math.floor(times.length * 0.9)]!;
  const p99 = times[Math.floor(times.length * 0.99)]!;

  console.log("\nExecution Statistics:");
  console.log(`  Total time:     ${totalTime}ms`);
  console.log(`  Iterations:     ${iterations}`);
  console.log(
    `  Throughput:     ${(iterations / (totalTime / 1000)).toFixed(2)} ops/sec`
  );
  console.log("\nLatency per iteration:");
  console.log(`  Min:            ${min.toFixed(3)}ms`);
  console.log(`  Mean:           ${mean.toFixed(3)}ms`);
  console.log(`  Median (p50):   ${p50.toFixed(3)}ms`);
  console.log(`  p90:            ${p90.toFixed(3)}ms`);
  console.log(`  p99:            ${p99.toFixed(3)}ms`);
  console.log(`  Max:            ${max.toFixed(3)}ms`);

  const memAfterExec = getMemoryUsage();
  console.log("\nMemory after execution:");
  console.log(`  Heap Used:  ${formatMemory(memAfterExec.heapUsed)}`);
  console.log(`  Heap Total: ${formatMemory(memAfterExec.heapTotal)}`);
  console.log(`  External:   ${formatMemory(memAfterExec.external)}`);
  console.log(
    `  Delta from build: ${formatMemory(
      memAfterExec.heapUsed - memAfterBuild.heapUsed
    )}`
  );

  // Per-node statistics
  const nodesPerIteration = nodeCount;
  const totalNodes = iterations * nodesPerIteration;
  const nodesPerSecond = totalNodes / (totalTime / 1000);

  console.log("\nPer-Node Statistics:");
  console.log(`  Nodes per iteration: ${nodesPerIteration}`);
  console.log(`  Total nodes executed: ${totalNodes}`);
  console.log(`  Node throughput: ${nodesPerSecond.toFixed(0)} nodes/sec`);
  console.log(
    `  Avg time per node: ${(mean / nodesPerIteration).toFixed(6)}ms`
  );

  console.log("\n" + "=".repeat(60));
}

runBenchmark().catch(console.error);
