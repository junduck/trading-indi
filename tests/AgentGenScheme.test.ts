import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { regCoreOps } from "../src/flow/RegistryUtils.js";

import {
  Graph,
  OpRegistry,
  type GraphSchema,
  validateGraphSchema,
  graphComplexity,
} from "../src/flow/index.js";

describe("Agent Generated Schema", () => {
  it("should load and validate AgentGenScheme.json", () => {
    const schemaPath = join(__dirname, "AgentGenScheme.json");
    const schemaJson = readFileSync(schemaPath, "utf-8");
    const schema: GraphSchema = JSON.parse(schemaJson);

    const registry = new OpRegistry();
    regCoreOps(registry);

    const result = validateGraphSchema(schema, registry);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);

    expect(graphComplexity(schema)).greaterThan(0);
  });

  it("should build graph from AgentGenScheme.json without errors", () => {
    const schemaPath = join(__dirname, "AgentGenScheme.json");
    const schemaJson = readFileSync(schemaPath, "utf-8");
    const schema: GraphSchema = JSON.parse(schemaJson);

    const registry = new OpRegistry();
    regCoreOps(registry);

    const graph = Graph.fromJSON(schema, registry);

    // Execute the graph
    const output = graph.update({
      open: 100,
      high: 105,
      low: 95,
      close: 102,
      volume: 1000,
    });

    // Verify Const nodes work correctly (they have missing/empty inputSrc)
    expect(output.one).toBe(1.0);
    expect(output.hundred).toBe(100.0);
    expect(output.neg_hundred).toBe(-100.0);
    expect(output.fifty).toBe(50.0);
    expect(output.scale_factor).toBe(1000.0);

    // Verify nodes that are actually computed
    expect(output.returns).toBeDefined();
    expect(output.short_vol).toBeDefined();
    expect(output.long_vol).toBeDefined();
    expect(output.vol_ratio).toBeDefined();
    expect(output.vol_shift).toBeDefined();
    expect(output.vol_shift_abs).toBeDefined();
    expect(output.vol_shift_sign).toBeDefined();
    expect(output.my_signal).toBeDefined();
  });

  it("should validate graph structure is acyclic", () => {
    const schemaPath = join(__dirname, "AgentGenScheme.json");
    const schemaJson = readFileSync(schemaPath, "utf-8");
    const schema: GraphSchema = JSON.parse(schemaJson);

    const registry = new OpRegistry();
    regCoreOps(registry);

    const graph = Graph.fromJSON(schema, registry);
    const validationResult = graph.validate();

    expect(validationResult.valid).toBe(true);
    expect(validationResult.errors).toHaveLength(0);
  });
});
