import { describe, expect, it } from "vitest";
import { Graph, OpRegistry, type GraphDescriptor } from "../src/flow/index.js";
import { EMA } from "../src/fn/Foundation.js";

describe("Graph JSON Serialization", () => {
  it("should construct graph from JSON descriptor", async () => {
    const registry = new OpRegistry().register("EMA", EMA);

    const descriptor: GraphDescriptor = {
      root: "tick",
      nodes: [
        {
          name: "ema",
          type: "EMA",
          init: { period: 2 },
          input: ["tick"],
        },
      ],
    };

    const outputs: any[] = [];
    const g = Graph.fromJSON(descriptor, registry);

    g.output((output) => {
      outputs.push(output);
    });

    await g.onData(100);
    await g.onData(200);

    expect(outputs.length).toBe(2);
    expect(outputs[0].tick).toBe(100);
    expect(outputs[0].ema).toBeCloseTo(100);
    expect(outputs[1].tick).toBe(200);
    expect(outputs[1].ema).toBeCloseTo(166.67, 1);
  });

  it("should handle multiple nodes and dependencies", async () => {
    const registry = new OpRegistry().register("EMA", EMA);

    const descriptor: GraphDescriptor = {
      root: "tick",
      nodes: [
        {
          name: "fast",
          type: "EMA",
          init: { period: 2 },
          input: ["tick"],
        },
        {
          name: "slow",
          type: "EMA",
          init: { period: 3 },
          input: ["tick"],
        },
      ],
    };

    const outputs: any[] = [];
    const g = Graph.fromJSON(descriptor, registry);

    g.output((output) => {
      outputs.push(output);
    });

    await g.onData(100);
    await g.onData(200);
    await g.onData(300);

    expect(outputs.length).toBe(3);
    expect(outputs[0].fast).toBeCloseTo(100);
    expect(outputs[1].fast).toBeCloseTo(166.67, 1);
    expect(outputs[2].fast).toBeCloseTo(255.56, 1);
  });

  it("should support property access in input paths", async () => {
    const registry = new OpRegistry().register("EMA", EMA);

    const descriptor: GraphDescriptor = {
      root: "tick",
      nodes: [
        {
          name: "ema",
          type: "EMA",
          init: { period: 2 },
          input: ["tick.price"],
        },
      ],
    };

    const outputs: any[] = [];
    const g = Graph.fromJSON(descriptor, registry);

    g.output((output) => {
      outputs.push(output);
    });

    await g.onData({ price: 100, volume: 1000 });
    await g.onData({ price: 200, volume: 2000 });

    expect(outputs.length).toBe(2);
    expect(outputs[0].tick.price).toBe(100);
    expect(outputs[0].ema).toBeCloseTo(100);
    expect(outputs[1].ema).toBeCloseTo(166.67, 1);
  });

  it("should handle nodes with multiple dependencies", async () => {
    class Subtract {
      onData(a: number, b: number): number {
        return a - b;
      }
    }

    const registry = new OpRegistry()
      .register("EMA", EMA)
      .register("Subtract", Subtract);

    const descriptor: GraphDescriptor = {
      root: "tick",
      nodes: [
        {
          name: "fast",
          type: "EMA",
          init: { period: 2 },
          input: ["tick"],
        },
        {
          name: "slow",
          type: "EMA",
          init: { period: 3 },
          input: ["tick"],
        },
        {
          name: "diff",
          type: "Subtract",
          input: ["fast", "slow"],
        },
      ],
    };

    const outputs: any[] = [];
    const g = Graph.fromJSON(descriptor, registry);

    g.output((output) => {
      outputs.push(output);
    });

    await g.onData(100);
    await g.onData(200);
    await g.onData(300);

    expect(outputs.length).toBe(3);
    expect(outputs[2].diff).toBeCloseTo(outputs[2].fast - outputs[2].slow, 1);
  });

  it("should throw error for unknown type", () => {
    const registry = new OpRegistry();

    const descriptor: GraphDescriptor = {
      root: "tick",
      nodes: [
        {
          name: "ema",
          type: "UnknownIndicator",
          init: { period: 2 },
          input: ["tick"],
        },
      ],
    };

    expect(() => {
      Graph.fromJSON(descriptor, registry);
    }).toThrow("Unknown type 'UnknownIndicator' for node 'ema'");
  });

  it("should handle nodes without init params", async () => {
    class Identity {
      onData(x: number): number {
        return x;
      }
    }

    const registry = new OpRegistry().register("Identity", Identity);

    const descriptor: GraphDescriptor = {
      root: "tick",
      nodes: [
        {
          name: "identity",
          type: "Identity",
          input: ["tick"],
        },
      ],
    };

    const outputs: any[] = [];
    const g = Graph.fromJSON(descriptor, registry);

    g.output((output) => {
      outputs.push(output);
    });

    await g.onData(42);

    expect(outputs.length).toBe(1);
    expect(outputs[0].identity).toBe(42);
  });

  it("should work with complex graph structures", async () => {
    class Multiply {
      onData(a: number, b: number): number {
        return a * b;
      }
    }

    class Subtract {
      onData(a: number, b: number): number {
        return a - b;
      }
    }

    const registry = new OpRegistry()
      .register("EMA", EMA)
      .register("Multiply", Multiply)
      .register("Subtract", Subtract);

    const descriptor: GraphDescriptor = {
      root: "tick",
      nodes: [
        {
          name: "fast",
          type: "EMA",
          init: { period: 2 },
          input: ["tick"],
        },
        {
          name: "slow",
          type: "EMA",
          init: { period: 3 },
          input: ["tick"],
        },
        {
          name: "diff",
          type: "Subtract",
          input: ["fast", "slow"],
        },
        {
          name: "signal",
          type: "Multiply",
          input: ["diff", "fast"],
        },
      ],
    };

    const outputs: any[] = [];
    const g = Graph.fromJSON(descriptor, registry);

    g.output((output) => {
      outputs.push(output);
    });

    await g.onData(100);
    await g.onData(200);
    await g.onData(300);

    expect(outputs.length).toBe(3);
    expect(outputs[2].fast).toBeGreaterThan(outputs[2].slow);
    expect(outputs[2].diff).toBeCloseTo(outputs[2].fast - outputs[2].slow, 1);
    expect(outputs[2].signal).toBeCloseTo(outputs[2].diff * outputs[2].fast, 1);
  });
});
