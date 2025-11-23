import { describe, expect, it } from "vitest";
import { Graph, OpRegistry, type GraphSchema } from "../src/flow/index.js";
import { EMA } from "../src/primitive/core-ops/rolling.js";
import type { OperatorDoc } from "../src/types/OpDoc.js";

describe("Graph JSON Serialization", () => {
  it("should construct graph from JSON descriptor", () => {
    const registry = new OpRegistry().register(EMA);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        {
          name: "ema",
          type: "EMA",
          init: { period: 2 },
          inputSrc: ["tick"],
        },
      ],
    };

    const g = Graph.fromJSON(descriptor, registry);

    const out1 = g.update(100);
    const out2 = g.update(200);

    expect(out1.tick).toBe(100);
    expect(out1.ema).toBeCloseTo(100);
    expect(out2.tick).toBe(200);
    expect(out2.ema).toBeCloseTo(166.67, 1);
  });

  it("should handle multiple nodes and dependencies", () => {
    const registry = new OpRegistry().register(EMA);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        {
          name: "fast",
          type: "EMA",
          init: { period: 2 },
          inputSrc: ["tick"],
        },
        {
          name: "slow",
          type: "EMA",
          init: { period: 3 },
          inputSrc: ["tick"],
        },
      ],
    };

    const g = Graph.fromJSON(descriptor, registry);

    const out1 = g.update(100);
    const out2 = g.update(200);
    const out3 = g.update(300);

    expect(out1.fast).toBeCloseTo(100);
    expect(out2.fast).toBeCloseTo(166.67, 1);
    expect(out3.fast).toBeCloseTo(255.56, 1);
  });

  it("should support property access in input paths", () => {
    const registry = new OpRegistry().register(EMA);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        {
          name: "ema",
          type: "EMA",
          init: { period: 2 },
          inputSrc: ["tick.price"],
        },
      ],
    };

    const g = Graph.fromJSON(descriptor, registry);

    const out1 = g.update({ price: 100, volume: 1000 });
    const out2 = g.update({ price: 200, volume: 2000 });

    expect(out1.tick.price).toBe(100);
    expect(out1.ema).toBeCloseTo(100);
    expect(out2.ema).toBeCloseTo(166.67, 1);
  });

  it("should handle nodes with multiple dependencies", () => {
    class Subtract {
      static readonly doc: OperatorDoc = {
        type: "Subtract",
        input: "a: number, b: number",
        output: "number",
      };

      update(a: number, b: number): number {
        return a - b;
      }
    }

    const registry = new OpRegistry().register(EMA).register(Subtract);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        {
          name: "fast",
          type: "EMA",
          init: { period: 2 },
          inputSrc: ["tick"],
        },
        {
          name: "slow",
          type: "EMA",
          init: { period: 3 },
          inputSrc: ["tick"],
        },
        {
          name: "diff",
          type: "Subtract",
          inputSrc: ["fast", "slow"],
        },
      ],
    };

    const g = Graph.fromJSON(descriptor, registry);

    g.update(100);
    g.update(200);
    const out3 = g.update(300);

    expect(out3.diff).toBeCloseTo(out3.fast - out3.slow, 1);
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
          inputSrc: ["tick"],
        },
      ],
    };

    expect(() => {
      Graph.fromJSON(descriptor, registry);
    }).toThrow(/Unknown type "UnknownIndicator" for node "ema"/);
  });

  it("should handle nodes without init params", () => {
    class Identity {
      static readonly doc: OperatorDoc = {
        type: "Identity",
        input: "x: number",
        output: "number",
      };

      update(x: number): number {
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
          inputSrc: ["tick"],
        },
      ],
    };

    const g = Graph.fromJSON(descriptor, registry);
    const out = g.update(42);

    expect(out.identity).toBe(42);
  });

  it("should work with complex graph structures", () => {
    class Multiply {
      static readonly doc: OperatorDoc = {
        type: "Multiply",
        input: "a: number, b: number",
        output: "number",
      };

      update(a: number, b: number): number {
        return a * b;
      }
    }

    class Subtract {
      static readonly doc: OperatorDoc = {
        type: "Subtract",
        input: "a: number, b: number",
        output: "number",
      };

      update(a: number, b: number): number {
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
          inputSrc: ["tick"],
        },
        {
          name: "slow",
          type: "EMA",
          init: { period: 3 },
          inputSrc: ["tick"],
        },
        {
          name: "diff",
          type: "Subtract",
          inputSrc: ["fast", "slow"],
        },
        {
          name: "signal",
          type: "Multiply",
          inputSrc: ["diff", "fast"],
        },
      ],
    };

    const g = Graph.fromJSON(descriptor, registry);

    g.update(100);
    g.update(200);
    const out3 = g.update(300);

    expect(out3.fast).toBeGreaterThan(out3.slow);
    expect(out3.diff).toBeCloseTo(out3.fast - out3.slow, 1);
    expect(out3.signal).toBeCloseTo(out3.diff * out3.fast, 1);
  });
});
