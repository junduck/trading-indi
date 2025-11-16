import { describe, expect, it } from "vitest";
import { Graph, makeOp } from "../src/flow/Graph.js";
import { EMA, SMA } from "../src/classes/Foundation.js";

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

      await g.onData(100);
      await g.onData(200);

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

      await g.onData(100);
      await g.onData(200);
      await g.onData(300);

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

    await g.onData(100);
    await g.onData(200);

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

    await g.onData({ price: 100, volume: 1000 });
    await g.onData({ price: 200, volume: 2000 });

    expect(outputs.length).toBe(2);
    expect(outputs[0].tick.price).toBe(100);
    expect(outputs[0].ema).toBeCloseTo(100);
    expect(outputs[1].ema).toBeCloseTo(166.67, 1);
  });

  it.concurrent("should handle multiple dependencies", async () => {
    const outputs: any[] = [];
    const sumNode = {
      onData: (a: number, b: number) => a + b,
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

    await g.onData(100);
    await g.onData(200);

    expect(outputs.length).toBe(2);
    expect(outputs[1].sum).toBeCloseTo(outputs[1].ema1 + outputs[1].ema2, 1);
  });

  it.concurrent(
    "should handle nodes added in reverse topological order",
    async () => {
      const outputs: any[] = [];
      const sumNode = {
        onData: (a: number, b: number) => a + b,
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

      await g.onData(100);
      await g.onData(200);

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

      g.add("final", { onData: (a: number, b: number) => a * b })
        .depends("diff", "fast")
        .add("diff", { onData: (a: number, b: number) => a - b })
        .depends("fast", "slow")
        .add("slow", new EMA({ period: 3 }))
        .depends("tick")
        .add("fast", new EMA({ period: 2 }))
        .depends("tick")
        .output((output) => {
          outputs.push(output);
        });

      await g.onData(100);
      await g.onData(200);
      await g.onData(300);

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

        onData(value: number): number[] | undefined {
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
        onData: (arr: number[]) => arr.reduce((sum, v) => sum + v, 0),
      };

      const g = new Graph("tick");

      g.add("batch", new BatchAggregator())
        .depends("tick")
        .add("sum", sumArray)
        .depends("batch")
        .output((output) => {
          outputs.push(output);
        });

      await g.onData(1);
      await g.onData(2);
      await g.onData(3);
      await g.onData(4);
      await g.onData(5);

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

    await g.onData(100);
    await g.onData(200);

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

    await g.onData(100);
    await g.onData(200);

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

    await g.onData(100);

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

    await g.onData(100);

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

    await g.onData(100);
    await g.onData(200);

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
      onData(value: number): number | undefined {
        this.count++;
        return this.count === 2 ? value : undefined;
      }
    }

    g.on("maybe", (nodeName) => {
      updates.push(nodeName);
    });

    g.add("maybe", new MaybeNode()).depends("tick");

    await g.onData(100);
    await g.onData(200);
    await g.onData(300);

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

    await g.onData(100);

    expect(emaUpdates).toEqual([100]);
    expect(smaUpdates).toEqual([100]);
  });

  it.skip(
    "should execute independent async nodes concurrently",
    async () => {
      const outputs: any[] = [];
      const executionOrder: string[] = [];

      class AsyncNode {
        constructor(private name: string, private delay: number) {}

        async onData(value: number): Promise<number> {
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
        .add("sum", { onData: (a: number, b: number) => a + b })
        .depends("slow", "fast")
        .output((output) => {
          outputs.push(output);
        });

      const start = Date.now();
      await g.onData(10);
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
    }
  );
});
