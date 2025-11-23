import { describe, expect, it } from "vitest";
import {
  OpRegistry,
  type GraphSchema,
  validateGraphSchema,
  formatValidationError,
} from "../src/flow/index.js";

class Op {
  static readonly doc = {
    type: "Op",
    onDataParam: "x: any",
    output: "any",
  };
}

describe("Topological Validation", () => {
  const registry = new OpRegistry().register(Op);

  describe("Cycle Detection", () => {
    it("should detect simple cycle with detailed path", () => {
      const schema: GraphSchema = {
        root: "tick",
        nodes: [
          { name: "a", type: "Op", inputSrc: ["b"] },
          { name: "b", type: "Op", inputSrc: ["c"] },
          { name: "c", type: "Op", inputSrc: ["a"] },
        ],
      };

      const result = validateGraphSchema(schema, registry);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);

      // Should detect cycle (may also detect unreachable if cycle is disconnected from root)
      const cycleError = result.errors.find((e) => e.type === "cycle");
      expect(cycleError).toBeDefined();

      if (cycleError?.type === "cycle") {
        // Cycle path should contain a, b, c
        const cyclePath = cycleError.nodes;
        expect(cyclePath).toContain("a");
        expect(cyclePath).toContain("b");
        expect(cyclePath).toContain("c");
        expect(cyclePath.length).toBeGreaterThan(2);

        // Should form a cycle (first and last are connected)
        const formatted = formatValidationError(cycleError);
        expect(formatted).toContain("→");
        expect(formatted).toContain("cycle");
      }
    });

    it("should detect self-loop", () => {
      const schema: GraphSchema = {
        root: "tick",
        nodes: [{ name: "a", type: "Op", inputSrc: ["a"] }],
      };

      const result = validateGraphSchema(schema, registry);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);

      // Should detect cycle (may also detect unreachable)
      const cycleError = result.errors.find((e) => e.type === "cycle");
      expect(cycleError).toBeDefined();

      if (cycleError?.type === "cycle") {
        expect(cycleError.nodes).toContain("a");
      }
    });

    it("should detect cycle involving root node", () => {
      const schema: GraphSchema = {
        root: "a",
        nodes: [
          { name: "a", type: "Op", inputSrc: ["b"] },
          { name: "b", type: "Op", inputSrc: ["a"] },
        ],
      };

      const result = validateGraphSchema(schema, registry);

      expect(result.valid).toBe(false);
      expect(result.errors[0]?.type).toBe("cycle");
    });
  });

  describe("Unreachable Node Detection", () => {
    it("should detect unreachable nodes in disconnected graph", () => {
      const schema: GraphSchema = {
        root: "tick",
        nodes: [
          { name: "a", type: "Op", inputSrc: ["tick"] },
          { name: "b", type: "Op", inputSrc: ["tick"] },
          { name: "isolated", type: "Op", inputSrc: ["missing"] },
        ],
      };

      const result = validateGraphSchema(schema, registry);

      expect(result.valid).toBe(false);
      // Should report unknown dependency first (prevents topology check)
      expect(result.errors[0]?.type).toBe("unreachable");
    });

    it("should report unreachable nodes when dependencies form separate component", () => {
      const schema: GraphSchema = {
        root: "tick",
        nodes: [
          { name: "a", type: "Op", inputSrc: ["tick"] },
          { name: "b", type: "Op", inputSrc: ["a"] },
          // These form a separate component
          { name: "x", type: "Op", inputSrc: ["y"] },
          { name: "y", type: "Op", inputSrc: ["z"] },
          { name: "z", type: "Op", inputSrc: ["x"] },
        ],
      };

      const result = validateGraphSchema(schema, registry);

      expect(result.valid).toBe(false);
      // Cycle in x-y-z prevents them from being processed
      expect(result.errors[0]?.type).toBe("cycle");
    });
  });

  describe("Structured Error Format for LLM", () => {
    it("should provide actionable error format", () => {
      const schema: GraphSchema = {
        root: "tick",
        nodes: [
          { name: "a", type: "Op", inputSrc: ["b"] },
          { name: "b", type: "Op", inputSrc: ["a"] },
        ],
      };

      const result = validateGraphSchema(schema, registry);

      expect(result.valid).toBe(false);

      // Error should be structured for programmatic consumption
      const error = result.errors[0];
      expect(error).toHaveProperty("type");

      // Should format nicely for LLM feedback
      const formatted = formatValidationError(error!);
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe("string");
    });

    it("should differentiate between error types clearly", () => {
      const schemas = [
        // Structure error
        { root: "", nodes: [] },
        // Unknown type
        {
          root: "tick",
          nodes: [{ name: "a", type: "Unknown", inputSrc: ["tick"] }],
        },
        // Unknown dependency
        {
          root: "tick",
          nodes: [{ name: "a", type: "Op", inputSrc: ["missing"] }],
        },
      ];

      const results = schemas.map((s) =>
        validateGraphSchema(s as any, registry)
      );

      expect(results[0]!.errors[0]?.type).toBe("structure");
      expect(results[1]!.errors[0]?.type).toBe("unknown_type");
      expect(results[2]!.errors[0]?.type).toBe("unreachable");

      // Each should have different formatted messages
      const formatted = results.map((r) =>
        r.errors[0] ? formatValidationError(r.errors[0]) : ""
      );
      expect(formatted[0]).not.toBe(formatted[1]);
      expect(formatted[1]).not.toBe(formatted[2]);
    });
  });

  describe("Complex Scenarios", () => {
    it("should validate complex valid DAG", () => {
      const schema: GraphSchema = {
        root: "tick",
        nodes: [
          { name: "a", type: "Op", inputSrc: ["tick"] },
          { name: "b", type: "Op", inputSrc: ["tick"] },
          { name: "c", type: "Op", inputSrc: ["a", "b"] },
          { name: "d", type: "Op", inputSrc: ["c"] },
          { name: "e", type: "Op", inputSrc: ["b", "d"] },
        ],
      };

      const result = validateGraphSchema(schema, registry);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect cycle in complex graph", () => {
      const schema: GraphSchema = {
        root: "tick",
        nodes: [
          { name: "a", type: "Op", inputSrc: ["tick"] },
          { name: "b", type: "Op", inputSrc: ["a"] },
          { name: "c", type: "Op", inputSrc: ["b"] },
          { name: "d", type: "Op", inputSrc: ["c"] },
          { name: "e", type: "Op", inputSrc: ["d", "b"] },
          // Create cycle: e -> a creates e -> d -> c -> b -> a -> (tick) but also e -> b
          // Let's make a real cycle:
          { name: "f", type: "Op", inputSrc: ["e", "c"] },
        ],
      };

      // Add actual cycle
      schema.nodes[1]!.inputSrc = ["f"]; // b depends on f, creating cycle

      const result = validateGraphSchema(schema, registry);

      expect(result.valid).toBe(false);
      expect(result.errors[0]?.type).toBe("cycle");
    });
  });
});
