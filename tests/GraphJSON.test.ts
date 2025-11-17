import { describe, expect, it } from "vitest";
import { Graph, OpRegistry, type GraphSchema } from "../src/flow/index.js";
import { EMA } from "../src/fn/Foundation.js";
import type { OperatorDoc } from "../src/types/OpDoc.js";

describe("Graph JSON Serialization", () => {
  it("should construct graph from JSON descriptor", async () => {
    const registry = new OpRegistry().register(EMA);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        {
          name: "ema",
          type: "EMA",
          init: { period: 2 },
          onDataSource: ["tick"],
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
    const registry = new OpRegistry().register(EMA);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        {
          name: "fast",
          type: "EMA",
          init: { period: 2 },
          onDataSource: ["tick"],
        },
        {
          name: "slow",
          type: "EMA",
          init: { period: 3 },
          onDataSource: ["tick"],
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
    const registry = new OpRegistry().register(EMA);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        {
          name: "ema",
          type: "EMA",
          init: { period: 2 },
          onDataSource: ["tick.price"],
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
      static readonly doc: OperatorDoc = {
        type: "Subtract",
        onDataParam: "a: number, b: number",
        output: "number",
      };

      onData(a: number, b: number): number {
        return a - b;
      }
    }

    const registry = new OpRegistry()
      .register(EMA)
      .register(Subtract);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        {
          name: "fast",
          type: "EMA",
          init: { period: 2 },
          onDataSource: ["tick"],
        },
        {
          name: "slow",
          type: "EMA",
          init: { period: 3 },
          onDataSource: ["tick"],
        },
        {
          name: "diff",
          type: "Subtract",
          onDataSource: ["fast", "slow"],
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

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        {
          name: "ema",
          type: "UnknownIndicator",
          init: { period: 2 },
          onDataSource: ["tick"],
        },
      ],
    };

    expect(() => {
      Graph.fromJSON(descriptor, registry);
    }).toThrow("Unknown type 'UnknownIndicator' for node 'ema'");
  });

  it("should handle nodes without init params", async () => {
    class Identity {
      static readonly doc: OperatorDoc = {
        type: "Identity",
        onDataParam: "x: number",
        output: "number",
      };

      onData(x: number): number {
        return x;
      }
    }

    const registry = new OpRegistry().register(Identity);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        {
          name: "identity",
          type: "Identity",
          onDataSource: ["tick"],
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
      static readonly doc: OperatorDoc = {
        type: "Multiply",
        onDataParam: "a: number, b: number",
        output: "number",
      };

      onData(a: number, b: number): number {
        return a * b;
      }
    }

    class Subtract {
      static readonly doc: OperatorDoc = {
        type: "Subtract",
        onDataParam: "a: number, b: number",
        output: "number",
      };

      onData(a: number, b: number): number {
        return a - b;
      }
    }

    const registry = new OpRegistry()
      .register(EMA)
      .register(Multiply)
      .register(Subtract);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        {
          name: "fast",
          type: "EMA",
          init: { period: 2 },
          onDataSource: ["tick"],
        },
        {
          name: "slow",
          type: "EMA",
          init: { period: 3 },
          onDataSource: ["tick"],
        },
        {
          name: "diff",
          type: "Subtract",
          onDataSource: ["fast", "slow"],
        },
        {
          name: "signal",
          type: "Multiply",
          onDataSource: ["diff", "fast"],
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
