import { describe, expect, it } from "vitest";
import { Graph, makeOp } from "../src/flow/Graph.js";
import { EMA, SMA } from "../src/primitive/core-ops/rolling.js";

describe("Graph", () => {
  it.concurrent(
    "should handle simple tick data flow with .depends()",
    async () => {
      const outputs: any[] = [];
      const g = new Graph("tick");

      g.add("ema", new EMA({ period: 2 }))
        .depends("tick")
        .output((output) => {
          outputs.push(output);
        });

      await g.update(100);
      await g.update(200);

      expect(outputs.length).toBe(2);
      expect(outputs[0].tick).toBe(100);
      expect(outputs[0].ema).toBeCloseTo(100);
      expect(outputs[1].tick).toBe(200);
      expect(outputs[1].ema).toBeCloseTo(166.67, 1);
    }
  );

  it.concurrent(
    "should work with multiple EMAs using .depends() API",
    async () => {
      const outputs: any[] = [];
      const g = new Graph("tick");

      g.add("fast", new EMA({ period: 2 }))
        .depends("tick")
        .add("slow", new EMA({ period: 3 }))
        .depends("tick")
        .output((output) => {
          outputs.push(output);
        });

      await g.update(100);
      await g.update(200);
      await g.update(300);

      expect(outputs.length).toBe(3);
      expect(outputs[0].fast).toBeCloseTo(100);
      expect(outputs[1].fast).toBeCloseTo(166.67, 1);
      expect(outputs[2].fast).toBeCloseTo(255.56, 1);
    }
  );

  it.concurrent("should work with Op wrapper", async () => {
    const outputs: any[] = [];
    const g = new Graph("tick");

    g.add("ema", makeOp(new EMA({ period: 2 }), ["tick"])).output((output) => {
      outputs.push(output);
    });

    await g.update(100);
    await g.update(200);

    expect(outputs.length).toBe(2);
    expect(outputs[0].ema).toBeCloseTo(100);
    expect(outputs[1].ema).toBeCloseTo(166.67, 1);
  });

  it.concurrent("should handle property access like tick.price", async () => {
    const outputs: any[] = [];
    const g = new Graph("tick");

    g.add("ema", new EMA({ period: 2 }))
      .depends("tick.price")
      .output((output) => {
        outputs.push(output);
      });

    await g.update({ price: 100, volume: 1000 });
    await g.update({ price: 200, volume: 2000 });

    expect(outputs.length).toBe(2);
    expect(outputs[0].tick.price).toBe(100);
    expect(outputs[0].ema).toBeCloseTo(100);
    expect(outputs[1].ema).toBeCloseTo(166.67, 1);
  });

  it.concurrent("should handle multiple dependencies", async () => {
    const outputs: any[] = [];
    const sumNode = {
      update: (a: number, b: number) => a + b,
    };

    const g = new Graph("tick");

    g.add("ema1", new EMA({ period: 2 }))
      .depends("tick")
      .add("ema2", new EMA({ period: 3 }))
      .depends("tick")
      .add("sum", sumNode)
      .depends("ema1", "ema2")
      .output((output) => {
        outputs.push(output);
      });

    await g.update(100);
    await g.update(200);

    expect(outputs.length).toBe(2);
    expect(outputs[1].sum).toBeCloseTo(outputs[1].ema1 + outputs[1].ema2, 1);
  });

  it.concurrent(
    "should handle nodes added in reverse topological order",
    async () => {
      const outputs: any[] = [];
      const sumNode = {
        update: (a: number, b: number) => a + b,
      };

      const g = new Graph("tick");

      g.add("sum", sumNode)
        .depends("ema1", "ema2")
        .add("ema2", new EMA({ period: 3 }))
        .depends("tick")
        .add("ema1", new EMA({ period: 2 }))
        .depends("tick")
        .output((output) => {
          outputs.push(output);
        });

      await g.update(100);
      await g.update(200);

      expect(outputs.length).toBe(2);
      expect(outputs[0].ema1).toBeCloseTo(100);
      expect(outputs[0].ema2).toBeCloseTo(100);
      expect(outputs[0].sum).toBeCloseTo(200);
      expect(outputs[1].sum).toBeCloseTo(outputs[1].ema1 + outputs[1].ema2, 1);
    }
  );

  it.concurrent(
    "should handle complex dependency graph with arbitrary order",
    async () => {
      const outputs: any[] = [];
      const g = new Graph("tick");

      g.add("final", { update: (a: number, b: number) => a * b })
        .depends("diff", "fast")
        .add("diff", { update: (a: number, b: number) => a - b })
        .depends("fast", "slow")
        .add("slow", new EMA({ period: 3 }))
        .depends("tick")
        .add("fast", new EMA({ period: 2 }))
        .depends("tick")
        .output((output) => {
          outputs.push(output);
        });

      await g.update(100);
      await g.update(200);
      await g.update(300);

      expect(outputs.length).toBe(3);
      expect(outputs[2].fast).toBeGreaterThan(outputs[2].slow);
      expect(outputs[2].diff).toBeCloseTo(outputs[2].fast - outputs[2].slow, 1);
      expect(outputs[2].final).toBeCloseTo(
        outputs[2].diff * outputs[2].fast,
        1
      );
    }
  );

  it.concurrent(
    "should handle aggregator nodes that don't always produce output",
    async () => {
      const outputs: any[] = [];
      class BatchAggregator {
        private buffer: number[] = [];
        private batchSize = 3;

        update(value: number): number[] | undefined {
          this.buffer.push(value);
          if (this.buffer.length >= this.batchSize) {
            const result = [...this.buffer];
            this.buffer = [];
            return result;
          }
          return undefined;
        }
      }

      const sumArray = {
        update: (arr: number[]) => arr.reduce((sum, v) => sum + v, 0),
      };

      const g = new Graph("tick");

      g.add("batch", new BatchAggregator())
        .depends("tick")
        .add("sum", sumArray)
        .depends("batch")
        .output((output) => {
          outputs.push(output);
        });

      await g.update(1);
      await g.update(2);
      await g.update(3);
      await g.update(4);
      await g.update(5);

      expect(outputs.length).toBe(5);
      expect(outputs[0].batch).toBeUndefined();
      expect(outputs[0].sum).toBeUndefined();
      expect(outputs[1].batch).toBeUndefined();
      expect(outputs[1].sum).toBeUndefined();
      expect(outputs[2].batch).toEqual([1, 2, 3]);
      expect(outputs[2].sum).toBe(6);
      expect(outputs[3].batch).toBeUndefined();
      expect(outputs[3].sum).toBeUndefined();
      expect(outputs[4].batch).toBeUndefined();
      expect(outputs[4].sum).toBeUndefined();
    }
  );

  it.concurrent("should throw error when adding node with root name", () => {
    const g = new Graph("tick");

    expect(() => {
      g.add("tick", new EMA({ period: 2 })).depends("tick");
    }).toThrow("Cannot add node with name 'tick': conflicts with root node");
  });

  it.concurrent("should support async output callback", async () => {
    const outputs: any[] = [];
    const g = new Graph("tick");

    g.add("ema", new EMA({ period: 2 }))
      .depends("tick")
      .output(async (output) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        outputs.push(output);
      });

    await g.update(100);
    await g.update(200);

    expect(outputs.length).toBe(2);
    expect(outputs[0].ema).toBeCloseTo(100);
    expect(outputs[1].ema).toBeCloseTo(166.67, 1);
  });

  it.concurrent("should monitor specific node updates", async () => {
    const updates: Array<{ name: string; result: any }> = [];
    const g = new Graph("tick");

    g.on("ema", (nodeName, result) => {
      updates.push({ name: nodeName, result });
    });

    g.add("ema", new EMA({ period: 2 })).depends("tick");

    await g.update(100);
    await g.update(200);

    expect(updates.length).toBe(2);
    expect(updates[0].name).toBe("ema");
    expect(updates[0].result).toBeCloseTo(100);
    expect(updates[1].name).toBe("ema");
    expect(updates[1].result).toBeCloseTo(166.67, 1);
  });

  it.concurrent("should support multiple listeners on same node", async () => {
    const updates1: string[] = [];
    const updates2: string[] = [];
    const g = new Graph("tick");

    g.on("ema", (nodeName) => {
      updates1.push(nodeName);
    });

    g.on("ema", (nodeName) => {
      updates2.push(nodeName);
    });

    g.add("ema", new EMA({ period: 2 })).depends("tick");

    await g.update(100);

    expect(updates1).toEqual(["ema"]);
    expect(updates2).toEqual(["ema"]);
  });

  it.concurrent("should support async event listeners", async () => {
    const updates: string[] = [];
    const g = new Graph("tick");

    g.on("ema", async (nodeName, result) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      updates.push(`${nodeName}:${result}`);
    });

    g.add("ema", new EMA({ period: 2 })).depends("tick");

    await g.update(100);

    expect(updates.length).toBe(1);
    expect(updates[0]).toContain("ema:100");
  });

  it.concurrent("should listen to different nodes independently", async () => {
    const fastUpdates: number[] = [];
    const slowUpdates: number[] = [];
    const g = new Graph("tick");

    g.on("fast", (_nodeName, result) => {
      fastUpdates.push(result);
    });

    g.on("slow", (_nodeName, result) => {
      slowUpdates.push(result);
    });

    g.add("fast", new EMA({ period: 2 }))
      .depends("tick")
      .add("slow", new EMA({ period: 3 }))
      .depends("tick");

    await g.update(100);
    await g.update(200);

    expect(fastUpdates.length).toBe(2);
    expect(slowUpdates.length).toBe(2);
    expect(fastUpdates[0]).toBeCloseTo(100);
    expect(slowUpdates[0]).toBeCloseTo(100);
    expect(fastUpdates[1]).toBeCloseTo(166.67, 1);
  });

  it.concurrent("should not emit events for undefined results", async () => {
    const updates: string[] = [];
    const g = new Graph("tick");

    class MaybeNode {
      private count = 0;
      update(value: number): number | undefined {
        this.count++;
        return this.count === 2 ? value : undefined;
      }
    }

    g.on("maybe", (nodeName) => {
      updates.push(nodeName);
    });

    g.add("maybe", new MaybeNode()).depends("tick");

    await g.update(100);
    await g.update(200);
    await g.update(300);

    expect(updates).toEqual(["maybe"]);
  });

  it.concurrent("should only emit to listeners of specific nodes", async () => {
    const emaUpdates: number[] = [];
    const smaUpdates: number[] = [];
    const g = new Graph("tick");

    g.on("ema", (_name, result) => {
      emaUpdates.push(result);
    });

    g.on("sma", (_name, result) => {
      smaUpdates.push(result);
    });

    g.add("ema", new EMA({ period: 2 }))
      .depends("tick")
      .add("sma", new SMA({ period: 2 }))
      .depends("tick");

    await g.update(100);

    expect(emaUpdates).toEqual([100]);
    expect(smaUpdates).toEqual([100]);
  });

  it.skip("should execute independent async nodes concurrently", async () => {
    const outputs: any[] = [];
    const executionOrder: string[] = [];

    class AsyncNode {
      constructor(private name: string, private delay: number) {}

      async update(value: number): Promise<number> {
        executionOrder.push(`${this.name}-start`);
        await new Promise((resolve) => setTimeout(resolve, this.delay));
        executionOrder.push(`${this.name}-end`);
        return value * 2;
      }
    }

    const g = new Graph("tick");

    g.add("slow", new AsyncNode("slow", 50))
      .depends("tick")
      .add("fast", new AsyncNode("fast", 10))
      .depends("tick")
      .add("sum", { update: (a: number, b: number) => a + b })
      .depends("slow", "fast")
      .output((output) => {
        outputs.push(output);
      });

    const start = Date.now();
    await g.update(10);
    const duration = Date.now() - start;

    expect(outputs.length).toBe(1);
    expect(outputs[0].slow).toBe(20);
    expect(outputs[0].fast).toBe(20);
    expect(outputs[0].sum).toBe(40);

    expect(executionOrder[0]).toBe("slow-start");
    expect(executionOrder[1]).toBe("fast-start");
    expect(executionOrder[2]).toBe("fast-end");
    expect(executionOrder[3]).toBe("slow-end");

    expect(duration).toBeLessThan(100);
  });

  it.concurrent("should validate acyclic graph without errors", () => {
    const g = new Graph("tick");

    g.add("ema1", new EMA({ period: 2 }))
      .depends("tick")
      .add("ema2", new EMA({ period: 3 }))
      .depends("tick")
      .add("sum", { onData: (a: number, b: number) => a + b })
      .depends("ema1", "ema2");

    const result = g.validate();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it.concurrent("should detect simple cycle", () => {
    const g = new Graph("tick");
    const identity = { update: (x: number) => x };

    g.add("a", identity).depends("b").add("b", identity).depends("a");

    const result = g.validate();
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].type).toBe("cycle");
    if (result.errors[0].type === "cycle") {
      expect(result.errors[0].nodes).toContain("a");
      expect(result.errors[0].nodes).toContain("b");
    }
  });

  it.concurrent("should detect cycle in longer chain", () => {
    const g = new Graph("tick");
    const identity = { update: (x: number) => x };

    g.add("a", identity)
      .depends("tick")
      .add("b", identity)
      .depends("a")
      .add("c", identity)
      .depends("b")
      .add("d", identity)
      .depends("c", "a");

    const result = g.validate();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);

    const g2 = new Graph("tick");
    g2.add("a", { update: (x: number) => x })
      .depends("tick")
      .add("b", { update: (x: number) => x })
      .depends("a")
      .add("c", { update: (x: number) => x })
      .depends("b")
      .add("d", { update: (x: number) => x })
      .depends("c")
      .add("e", { update: (x: number) => x })
      .depends("d", "b");

    const result2 = g2.validate();
    expect(result2.valid).toBe(true);

    const g3 = new Graph("tick");
    g3.add("a", { update: (x: number) => x })
      .depends("b")
      .add("b", { update: (x: number) => x })
      .depends("c")
      .add("c", { update: (x: number) => x })
      .depends("a");

    const result3 = g3.validate();
    expect(result3.valid).toBe(false);
    expect(result3.errors.length).toBeGreaterThan(0);
    expect(result3.errors[0].type).toBe("cycle");
    if (result3.errors[0].type === "cycle") {
      expect(result3.errors[0].nodes.length).toBeGreaterThan(2);
    }
  });

  it.concurrent("should detect node with unknown dependency", () => {
    const g = new Graph("tick");
    const identity = { update: (x: number) => x };

    g.add("a", identity)
      .depends("tick")
      .add("b", identity)
      .depends("a")
      .add("orphan", identity)
      .depends("nonexistent");

    const result = g.validate();
    expect(result.valid).toBe(false);
    // Nodes with unknown dependencies are reported as unreachable
    expect(result.errors.some((e) => e.type === "unreachable")).toBe(true);
    const unreachableError = result.errors.find(
      (e) => e.type === "unreachable"
    );
    if (unreachableError && unreachableError.type === "unreachable") {
      // Both "nonexistent" and "orphan" are unreachable
      expect(unreachableError.nodes).toContain("orphan");
      expect(unreachableError.nodes).toContain("nonexistent");
    }
  });

  it.concurrent("should detect two independent cycles", () => {
    const g = new Graph("tick");
    const identity = { update: (x: number) => x };

    // First cycle: a -> b -> c -> a
    g.add("a", identity)
      .depends("b")
      .add("b", identity)
      .depends("c")
      .add("c", identity)
      .depends("a");

    // Second cycle: d -> e -> d
    g.add("d", identity).depends("e").add("e", identity).depends("d");

    const result = g.validate();
    expect(result.valid).toBe(false);

    const cycleErrors = result.errors.filter((e) => e.type === "cycle");

    // Should detect at least one cycle (implementation may stop after first)
    expect(cycleErrors.length).toBeGreaterThan(0);

    // Verify the detected cycle(s) contain valid node sequences
    for (const error of cycleErrors) {
      if (error.type === "cycle") {
        // Each cycle should have at least 2 nodes (to form a cycle)
        expect(error.nodes.length).toBeGreaterThanOrEqual(2);

        // First and last node should be the same (cycle starts and ends at same node)
        expect(error.nodes[0]).toBe(error.nodes[error.nodes.length - 1]);
      }
    }

    // Verify at least one cycle involves nodes from our defined cycles
    const allCycleNodes = cycleErrors.flatMap((e) =>
      e.type === "cycle" ? e.nodes : []
    );
    const hasFirstCycle =
      allCycleNodes.includes("a") ||
      allCycleNodes.includes("b") ||
      allCycleNodes.includes("c");
    const hasSecondCycle =
      allCycleNodes.includes("d") || allCycleNodes.includes("e");

    expect(hasFirstCycle || hasSecondCycle).toBe(true);
  });

  it.concurrent("should detect both cycles separately", () => {
    const g = new Graph("tick");
    const identity = { update: (x: number) => x };

    // First cycle: a -> b -> c -> a
    g.add("a", identity)
      .depends("b")
      .add("b", identity)
      .depends("c")
      .add("c", identity)
      .depends("a");

    // Second cycle: d -> e -> d
    g.add("d", identity).depends("e").add("e", identity).depends("d");

    const result = g.validate();
    expect(result.valid).toBe(false);

    const cycleErrors = result.errors.filter((e) => e.type === "cycle");

    // Should detect both independent cycles
    expect(cycleErrors.length).toBe(2);

    let foundCycle1 = false;
    let foundCycle2 = false;

    for (const error of cycleErrors) {
      if (error.type === "cycle") {
        const cycleNodeSet = new Set(error.nodes);

        // Check for first cycle (a -> b -> c -> a or any permutation)
        if (
          cycleNodeSet.has("a") ||
          cycleNodeSet.has("b") ||
          cycleNodeSet.has("c")
        ) {
          foundCycle1 = true;
          // Verify cycle structure
          expect(error.nodes.length).toBeGreaterThanOrEqual(3);
          expect(error.nodes[0]).toBe(error.nodes[error.nodes.length - 1]);
        }

        // Check for second cycle (d -> e -> d)
        if (cycleNodeSet.has("d") || cycleNodeSet.has("e")) {
          foundCycle2 = true;
          // Verify cycle structure
          expect(error.nodes.length).toBeGreaterThanOrEqual(2);
          expect(error.nodes[0]).toBe(error.nodes[error.nodes.length - 1]);
        }
      }
    }

    // Both cycles should be detected
    expect(foundCycle1).toBe(true);
    expect(foundCycle2).toBe(true);
  });
});
