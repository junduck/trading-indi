import { describe, expect, it } from "vitest";
import {
  OpRegistry,
  type GraphSchema,
  validateGraphSchema,
  graphComplexity,
} from "../src/flow/index.js";
import type { OperatorDoc } from "../src/types/OpDoc.js";

class EMA {
  static readonly doc: OperatorDoc = {
    type: "EMA",
    onDataParam: "x: number",
    output: "number",
  };
}

class SMA {
  static readonly doc: OperatorDoc = {
    type: "SMA",
    onDataParam: "x: number",
    output: "number",
  };
}

class Op {
  static readonly doc: OperatorDoc = {
    type: "Op",
    onDataParam: "...args: any[]",
    output: "any",
  };
}

describe("Graph Validation", () => {
  it("should validate a valid graph", () => {
    const registry = new OpRegistry()
      .register(EMA)
      .register(SMA);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        { name: "fast", type: "EMA", onDataSource: ["tick"] },
        { name: "slow", type: "SMA", onDataSource: ["tick"] },
      ],
    };

    const result = validateGraphSchema(descriptor, registry);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should detect unknown type", () => {
    const registry = new OpRegistry().register(EMA);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [{ name: "ema", type: "Unknown", onDataSource: ["tick"] }],
    };

    const result = validateGraphSchema(descriptor, registry);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Unknown type "Unknown" for node "ema"');
  });

  it("should detect missing dependency", () => {
    const registry = new OpRegistry().register(EMA);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [{ name: "ema", type: "EMA", onDataSource: ["missing"] }],
    };

    const result = validateGraphSchema(descriptor, registry);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Node "ema" references unknown dependency "missing"'
    );
  });

  it("should handle path dependencies", () => {
    const registry = new OpRegistry().register(EMA);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [{ name: "ema", type: "EMA", onDataSource: ["tick.price"] }],
    };

    const result = validateGraphSchema(descriptor, registry);
    expect(result.valid).toBe(true);
  });

  it("should detect missing dependency when root is different", () => {
    const registry = new OpRegistry().register(EMA);

    const descriptor: GraphSchema = {
      root: "price",
      nodes: [{ name: "ema", type: "EMA", onDataSource: ["tick"] }],
    };

    const result = validateGraphSchema(descriptor, registry);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Node "ema" references unknown dependency "tick"'
    );
  });

  it("should detect cycle", () => {
    const registry = new OpRegistry().register(Op);

    const descriptor: GraphSchema = {
      root: "a",
      nodes: [
        { name: "a", type: "Op", onDataSource: ["c"] },
        { name: "b", type: "Op", onDataSource: ["a"] },
        { name: "c", type: "Op", onDataSource: ["b"] },
      ],
    };

    const result = validateGraphSchema(descriptor, registry);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Graph contains a cycle");
  });

  it("should allow valid DAG", () => {
    const registry = new OpRegistry().register(Op);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        { name: "a", type: "Op", onDataSource: ["tick"] },
        { name: "b", type: "Op", onDataSource: ["a"] },
        { name: "c", type: "Op", onDataSource: ["a", "b"] },
      ],
    };

    const result = validateGraphSchema(descriptor, registry);
    expect(result.valid).toBe(true);
  });

  it("should validate when onDataSource is omitted (for Const nodes)", () => {
    const registry = new OpRegistry().register(Op);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        { name: "const", type: "Op" },
        { name: "b", type: "Op", onDataSource: ["const"] },
      ],
    };

    const result = validateGraphSchema(descriptor, registry);
    expect(result.valid).toBe(true);
  });

  it("should validate when onDataSource is empty string (for Const nodes)", () => {
    const registry = new OpRegistry().register(Op);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        { name: "const", type: "Op", onDataSource: "" },
        { name: "b", type: "Op", onDataSource: ["const"] },
      ],
    } as any;

    const result = validateGraphSchema(descriptor, registry);
    expect(result.valid).toBe(true);
  });
});

describe("Graph Complexity", () => {
  it("should calculate complexity for simple graph", () => {
    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [{ name: "ema", type: "EMA", onDataSource: ["tick"] }],
    };

    expect(graphComplexity(descriptor)).toBe(2); // 1 node + 1 edge
  });

  it("should calculate complexity for complex graph", () => {
    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        { name: "a", type: "Op", onDataSource: ["tick"] },
        { name: "b", type: "Op", onDataSource: ["tick"] },
        { name: "c", type: "Op", onDataSource: ["a", "b"] },
      ],
    };

    expect(graphComplexity(descriptor)).toBe(7); // 3 nodes + 4 edges
  });

  it("should return node count for graph with no edges", () => {
    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        { name: "a", type: "Op", onDataSource: [] },
        { name: "b", type: "Op", onDataSource: [] },
      ],
    };

    expect(graphComplexity(descriptor)).toBe(2); // 2 nodes + 0 edges
  });

  it("should handle omitted onDataSource (for Const nodes)", () => {
    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        { name: "const", type: "Op" },
        { name: "b", type: "Op", onDataSource: ["const"] },
      ],
    };

    expect(graphComplexity(descriptor)).toBe(3); // 2 nodes + 1 edge
  });

  it("should handle empty string onDataSource (for Const nodes)", () => {
    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        { name: "const", type: "Op", onDataSource: "" },
        { name: "b", type: "Op", onDataSource: ["const"] },
      ],
    } as any;

    expect(graphComplexity(descriptor)).toBe(3); // 2 nodes + 1 edge
  });
});
