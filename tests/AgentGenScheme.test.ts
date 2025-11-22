import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  Graph,
  OpRegistry,
  type GraphSchema,
  validateGraphSchema,
} from "../src/flow/index.js";
import { EMA } from "../src/primitive/core-ops/rolling.js";
import {
  Const,
  Sub,
  Abs,
  Div,
  Mul,
  Add,
  Clamp,
} from "../src/primitive/index.js";

describe("Agent Generated Schema", () => {
  it("should load and validate AgentGenScheme.json", () => {
    const schemaPath = join(__dirname, "AgentGenScheme.json");
    const schemaJson = readFileSync(schemaPath, "utf-8");
    const schema: GraphSchema = JSON.parse(schemaJson);

    const registry = new OpRegistry()
      .register(Const)
      .register(Sub)
      .register(Abs)
      .register(Div)
      .register(Mul)
      .register(Add)
      .register(Clamp)
      .register(EMA);

    const result = validateGraphSchema(schema, registry);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should build graph from AgentGenScheme.json without errors", async () => {
    const schemaPath = join(__dirname, "AgentGenScheme.json");
    const schemaJson = readFileSync(schemaPath, "utf-8");
    const schema: GraphSchema = JSON.parse(schemaJson);

    const registry = new OpRegistry()
      .register(Const)
      .register(Sub)
      .register(Abs)
      .register(Div)
      .register(Mul)
      .register(Add)
      .register(Clamp)
      .register(EMA);

    // This should not throw the TypeError about node.onDataSource not being iterable
    const graph = Graph.fromJSON(schema, registry);

    const outputs: any[] = [];
    graph.output((output) => {
      outputs.push(output);
    });

    // Execute the graph
    await graph.update({
      open: 100,
      high: 105,
      low: 95,
      close: 102,
      volume: 1000,
    });

    expect(outputs.length).toBe(1);

    // Verify Const nodes work correctly (they have missing/empty onDataSource)
    expect(outputs[0].const_one).toBe(1);
    expect(outputs[0].const_100).toBe(100);
    expect(outputs[0].const_neg_one).toBe(-1);
    expect(outputs[0].const_50).toBe(50);
    expect(outputs[0].const_zero).toBe(0);

    // Verify other nodes computed
    expect(outputs[0].returns).toBeDefined();
    expect(outputs[0].abs_returns).toBeDefined();
    expect(outputs[0].short_vol).toBeDefined();
    expect(outputs[0].long_vol).toBeDefined();
  });

  it("should validate graph structure is acyclic", () => {
    const schemaPath = join(__dirname, "AgentGenScheme.json");
    const schemaJson = readFileSync(schemaPath, "utf-8");
    const schema: GraphSchema = JSON.parse(schemaJson);

    const registry = new OpRegistry()
      .register(Const)
      .register(Sub)
      .register(Abs)
      .register(Div)
      .register(Mul)
      .register(Add)
      .register(Clamp)
      .register(EMA);

    const graph = Graph.fromJSON(schema, registry);
    const validationResult = graph.validate();

    expect(validationResult.valid).toBe(true);
    expect(validationResult.errors).toHaveLength(0);
  });
});
