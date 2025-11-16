/**
 * Benchmark: Event Listener Overhead
 *
 * Measures the overhead of using .on() event listeners.
 * Common use cases:
 * - Debugging: Monitor 1-2 specific nodes
 * - Risk control: Early signal detection before graph completes
 */

import { Graph } from "../src/flow/index.js";
import { EMA } from "../src/classes/Foundation.js";

class Add {
  constructor(private value: number) {}
  onData(x: number): number {
    return x + this.value;
  }
}

function buildGraph(): Graph {
  const graph = new Graph("tick");

  // Build simple graph with 30 nodes
  for (let i = 0; i < 10; i++) {
    graph.add(`ema_${i}`, new EMA({ period: 5 + i })).depends("tick");
  }

  for (let i = 0; i < 10; i++) {
    graph.add(`add1_${i}`, new Add(i * 10)).depends(`ema_${i}`);
  }

  for (let i = 0; i < 10; i++) {
    graph.add(`add2_${i}`, new Add(i * 5)).depends(`add1_${i}`);
  }

  return graph;
}

async function benchmark(
  name: string,
  setupListeners: (g: Graph) => void,
  iterations: number = 10000
): Promise<{ name: string; avgTime: number; throughput: number }> {
  const graph = buildGraph();
  setupListeners(graph);

  // Warmup
  for (let i = 0; i < 100; i++) {
    await graph.onData(100);
  }

  // Benchmark
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    await graph.onData(100 + Math.random() * 10);
  }
  const elapsed = Date.now() - start;

  return {
    name,
    avgTime: elapsed / iterations,
    throughput: iterations / (elapsed / 1000),
  };
}

async function runBenchmark() {
  console.log("=".repeat(70));
  console.log("Event Listener Overhead Benchmark");
  console.log("=".repeat(70));
  console.log("");
  console.log("Graph: 30 nodes (10 EMAs + 20 trivial Add operations)");
  console.log("Iterations: 10,000 per scenario");
  console.log("=".repeat(70));
  console.log("");

  const scenarios = [
    {
      name: "No listeners (baseline)",
      setup: (_g: Graph) => {},
    },
    {
      name: "1 listener on 1 node",
      setup: (g: Graph) => {
        let count = 0;
        g.on("ema_0", () => {
          count++;
        });
      },
    },
    {
      name: "3 listeners on 1 node",
      setup: (g: Graph) => {
        let count1 = 0,
          count2 = 0,
          count3 = 0;
        g.on("ema_0", () => {
          count1++;
        });
        g.on("ema_0", () => {
          count2++;
        });
        g.on("ema_0", () => {
          count3++;
        });
      },
    },
    {
      name: "1 listener on 3 nodes",
      setup: (g: Graph) => {
        let count = 0;
        g.on("ema_0", () => {
          count++;
        });
        g.on("ema_1", () => {
          count++;
        });
        g.on("ema_2", () => {
          count++;
        });
      },
    },
    {
      name: "Async listener on 1 node",
      setup: (g: Graph) => {
        g.on("ema_0", async () => {
          await Promise.resolve(); // Simulate async work
        });
      },
    },
    {
      name: "Listener with computation",
      setup: (g: Graph) => {
        let sum = 0;
        g.on("ema_0", (_name, result) => {
          sum += result; // Some trivial computation
        });
      },
    },
  ];

  const results = [];

  for (const scenario of scenarios) {
    const result = await benchmark(scenario.name, scenario.setup);
    results.push(result);
    console.log(`${scenario.name.padEnd(30)} | ${result.avgTime.toFixed(4)}ms`);
  }

  console.log("");
  console.log("=".repeat(70));
  console.log("Overhead Analysis");
  console.log("=".repeat(70));
  console.log("");

  const baseline = results[0]!;

  for (let i = 1; i < results.length; i++) {
    const result = results[i]!;
    const overhead = result.avgTime - baseline.avgTime;
    const overheadPct = ((overhead / baseline.avgTime) * 100).toFixed(1);

    console.log(`${result.name}:`);
    console.log(`  Baseline:     ${baseline.avgTime.toFixed(4)}ms`);
    console.log(`  With listener: ${result.avgTime.toFixed(4)}ms`);
    console.log(`  Overhead:      ${overhead.toFixed(4)}ms (${overheadPct}%)`);
    console.log("");
  }
}

runBenchmark().catch(console.error);
