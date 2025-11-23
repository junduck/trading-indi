import { describe, expect, it } from "vitest";
import { Graph, OpRegistry, type GraphSchema } from "../src/flow/index.js";
import { Const } from "../src/primitive/Const.js";
import { Add, Mul } from "../src/primitive/arithmetic.js";

describe("Const", () => {
  it("should return constant value without input", () => {
    const g = new Graph("tick");

    g.add("const", new Const({ value: 42 })).depends();

    const out1 = g.update(100);
    const out2 = g.update(200);

    expect(out1.const).toBe(42);
    expect(out2.const).toBe(42);
  });

  it("should work with multiple const values", () => {
    const g = new Graph("tick");

    g.add("const1", new Const({ value: 10 }))
      .depends()
      .add("const2", new Const({ value: 20 }))
      .depends();

    const out = g.update(100);

    expect(out.const1).toBe(10);
    expect(out.const2).toBe(20);
  });

  it("should work with operators that combine const values", () => {
    const sumNode = {
      update: (a: number, b: number) => a + b,
    };

    const g = new Graph("tick");

    g.add("const1", new Const({ value: 10 }))
      .depends()
      .add("const2", new Const({ value: 20 }))
      .depends()
      .add("sum", sumNode)
      .depends("const1", "const2");

    const out1 = g.update(100);
    const out2 = g.update(200);

    expect(out1.sum).toBe(30);
    expect(out2.sum).toBe(30);
  });

  it("should connect directly to root (be available when data comes)", () => {
    const g = new Graph("tick");

    g.add("const", new Const({ value: 5 }))
      .depends()
      .add("mul", { update: (tick: number, c: number) => tick * c })
      .depends("tick", "const");

    const out1 = g.update(10);
    const out2 = g.update(20);

    expect(out1.const).toBe(5);
    expect(out1.mul).toBe(50);
    expect(out2.const).toBe(5);
    expect(out2.mul).toBe(100);
  });

  it("should work with JSON schema", () => {
    const registry = new OpRegistry().register(Const);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        {
          name: "const",
          type: "Const",
          init: { value: 100 },
          inputSrc: [],
        },
      ],
    };

    const g = Graph.fromJSON(descriptor, registry);
    const out = g.update(42);

    expect(out.const).toBe(100);
  });

  it("should work in complex graphs with mixed dependencies", () => {
    const registry = new OpRegistry()
      .register(Const)
      .register(Mul)
      .register(Add);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        {
          name: "multiplier",
          type: "Const",
          init: { value: 2 },
          inputSrc: [],
        },
        {
          name: "offset",
          type: "Const",
          init: { value: 10 },
          inputSrc: [],
        },
        {
          name: "scaled",
          type: "Mul",
          inputSrc: ["tick", "multiplier"],
        },
        {
          name: "result",
          type: "Add",
          inputSrc: ["scaled", "offset"],
        },
      ],
    };

    const g = Graph.fromJSON(descriptor, registry);

    const out1 = g.update(5);
    const out2 = g.update(10);

    expect(out1.multiplier).toBe(2);
    expect(out1.offset).toBe(10);
    expect(out1.scaled).toBe(10);
    expect(out1.result).toBe(20);
    expect(out2.scaled).toBe(20);
    expect(out2.result).toBe(30);
  });

  it("should validate graph with const values correctly", () => {
    const g = new Graph("tick");

    g.add("const1", new Const({ value: 10 }))
      .depends()
      .add("const2", new Const({ value: 20 }))
      .depends()
      .add("sum", { update: (a: number, b: number) => a + b })
      .depends("const1", "const2");

    const result = g.validate();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should handle const values with decimal precision", () => {
    const g = new Graph("tick");

    g.add("pi", new Const({ value: 3.14159 })).depends();

    const out = g.update(1);

    expect(out.pi).toBeCloseTo(3.14159);
  });

  it("should allow negative constant values", () => {
    const g = new Graph("tick");

    g.add("negative", new Const({ value: -100 })).depends();

    const out = g.update(1);

    expect(out.negative).toBe(-100);
  });

  it("should allow zero as constant value", () => {
    const g = new Graph("tick");

    g.add("zero", new Const({ value: 0 })).depends();

    const out = g.update(1);

    expect(out.zero).toBe(0);
  });

  it("should work with JSON schema when inputSrc is omitted", () => {
    const registry = new OpRegistry().register(Const);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        {
          name: "const",
          type: "Const",
          init: { value: 100 },
        },
      ],
    };

    const g = Graph.fromJSON(descriptor, registry);
    const out = g.update(42);

    expect(out.const).toBe(100);
  });

  it("should work with JSON schema when inputSrc is empty string", () => {
    const registry = new OpRegistry().register(Const);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        {
          name: "const",
          type: "Const",
          init: { value: 100 },
          inputSrc: "",
        },
      ],
    } as any;

    const g = Graph.fromJSON(descriptor, registry);
    const out = g.update(42);

    expect(out.const).toBe(100);
  });
});
