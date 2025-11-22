import { describe, expect, it } from "vitest";
import { Graph, OpRegistry, type GraphSchema } from "../src/flow/index.js";
import { Const } from "../src/primitive/Const.js";
import { Add, Mul } from "../src/primitive/arithmetic.js";

describe("Const", () => {
  it("should return constant value without input", async () => {
    const outputs: any[] = [];
    const g = new Graph("tick");

    g.add("const", new Const({ value: 42 }))
      .depends()
      .output((output) => {
        outputs.push(output);
      });

    await g.update(100);
    await g.update(200);

    expect(outputs.length).toBe(2);
    expect(outputs[0].const).toBe(42);
    expect(outputs[1].const).toBe(42);
  });

  it("should work with multiple const values", async () => {
    const outputs: any[] = [];
    const g = new Graph("tick");

    g.add("const1", new Const({ value: 10 }))
      .depends()
      .add("const2", new Const({ value: 20 }))
      .depends()
      .output((output) => {
        outputs.push(output);
      });

    await g.update(100);

    expect(outputs.length).toBe(1);
    expect(outputs[0].const1).toBe(10);
    expect(outputs[0].const2).toBe(20);
  });

  it("should work with operators that combine const values", async () => {
    const outputs: any[] = [];
    const sumNode = {
      update: (a: number, b: number) => a + b,
    };

    const g = new Graph("tick");

    g.add("const1", new Const({ value: 10 }))
      .depends()
      .add("const2", new Const({ value: 20 }))
      .depends()
      .add("sum", sumNode)
      .depends("const1", "const2")
      .output((output) => {
        outputs.push(output);
      });

    await g.update(100);
    await g.update(200);

    expect(outputs.length).toBe(2);
    expect(outputs[0].sum).toBe(30);
    expect(outputs[1].sum).toBe(30);
  });

  it("should connect directly to root (be available when data comes)", async () => {
    const outputs: any[] = [];
    const g = new Graph("tick");

    g.add("const", new Const({ value: 5 }))
      .depends()
      .add("mul", { update: (tick: number, c: number) => tick * c })
      .depends("tick", "const")
      .output((output) => {
        outputs.push(output);
      });

    await g.update(10);
    await g.update(20);

    expect(outputs.length).toBe(2);
    expect(outputs[0].const).toBe(5);
    expect(outputs[0].mul).toBe(50);
    expect(outputs[1].const).toBe(5);
    expect(outputs[1].mul).toBe(100);
  });

  it("should work with JSON schema", async () => {
    const registry = new OpRegistry().register(Const);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        {
          name: "const",
          type: "Const",
          init: { value: 100 },
          onDataSource: [],
        },
      ],
    };

    const outputs: any[] = [];
    const g = Graph.fromJSON(descriptor, registry);

    g.output((output) => {
      outputs.push(output);
    });

    await g.update(42);

    expect(outputs.length).toBe(1);
    expect(outputs[0].const).toBe(100);
  });

  it("should work in complex graphs with mixed dependencies", async () => {
    const registry = new OpRegistry().register(Const);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        {
          name: "multiplier",
          type: "Const",
          init: { value: 2 },
          onDataSource: [],
        },
        {
          name: "offset",
          type: "Const",
          init: { value: 10 },
          onDataSource: [],
        },
        {
          name: "scaled",
          type: "Mul",
          onDataSource: ["tick", "multiplier"],
        },
        {
          name: "result",
          type: "Add",
          onDataSource: ["scaled", "offset"],
        },
      ],
    };

    registry.register(Mul).register(Add);

    const outputs: any[] = [];
    const g = Graph.fromJSON(descriptor, registry);

    g.output((output) => {
      outputs.push(output);
    });

    await g.update(5);
    await g.update(10);

    expect(outputs.length).toBe(2);
    expect(outputs[0].multiplier).toBe(2);
    expect(outputs[0].offset).toBe(10);
    expect(outputs[0].scaled).toBe(10);
    expect(outputs[0].result).toBe(20);
    expect(outputs[1].scaled).toBe(20);
    expect(outputs[1].result).toBe(30);
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

  it("should handle const values with decimal precision", async () => {
    const outputs: any[] = [];
    const g = new Graph("tick");

    g.add("pi", new Const({ value: 3.14159 }))
      .depends()
      .output((output) => {
        outputs.push(output);
      });

    await g.update(1);

    expect(outputs.length).toBe(1);
    expect(outputs[0].pi).toBeCloseTo(3.14159);
  });

  it("should allow negative constant values", async () => {
    const outputs: any[] = [];
    const g = new Graph("tick");

    g.add("negative", new Const({ value: -100 }))
      .depends()
      .output((output) => {
        outputs.push(output);
      });

    await g.update(1);

    expect(outputs.length).toBe(1);
    expect(outputs[0].negative).toBe(-100);
  });

  it("should allow zero as constant value", async () => {
    const outputs: any[] = [];
    const g = new Graph("tick");

    g.add("zero", new Const({ value: 0 }))
      .depends()
      .output((output) => {
        outputs.push(output);
      });

    await g.update(1);

    expect(outputs.length).toBe(1);
    expect(outputs[0].zero).toBe(0);
  });

  it("should work with JSON schema when onDataSource is omitted", async () => {
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

    const outputs: any[] = [];
    const g = Graph.fromJSON(descriptor, registry);

    g.output((output) => {
      outputs.push(output);
    });

    await g.update(42);

    expect(outputs.length).toBe(1);
    expect(outputs[0].const).toBe(100);
  });

  it("should work with JSON schema when onDataSource is empty string", async () => {
    const registry = new OpRegistry().register(Const);

    const descriptor: GraphSchema = {
      root: "tick",
      nodes: [
        {
          name: "const",
          type: "Const",
          init: { value: 100 },
          onDataSource: "",
        },
      ],
    } as any;

    const outputs: any[] = [];
    const g = Graph.fromJSON(descriptor, registry);

    g.output((output) => {
      outputs.push(output);
    });

    await g.update(42);

    expect(outputs.length).toBe(1);
    expect(outputs[0].const).toBe(100);
  });
});
