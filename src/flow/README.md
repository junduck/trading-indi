# Flow Module - Reactive Operator Composition

The Flow module provides a declarative framework for composing trading algorithms as DAGs (Directed Acyclic Graphs). Instead of the traditional pipeline approach (`bar → [indicators] → signals`), Flow lets you express complex trading logic as reactive data flows where computation propagates automatically through the graph.

## Philosophy

Traditional trading systems chain indicators in sequence, requiring explicit control flow. Flow takes a different approach:

- **Describe the DAG, not the control flow**: Define what nodes depend on, not how to execute them
- **Synchronous execution**: All nodes execute in topological order (race-free, predictable)
- **Dynamic**: Mix stateful operators (indicators) and stateless functions (aggregators, filters) seamlessly
- **Type-safe**: Runtime validation with Zod schemas ensures correctness

## Core Concepts

- **GraphExec**: Synchronous DAG that executes nodes in topological order - simple, fast, race-free
- **Operator**: Any object with `update()` method - indicators, transformations, aggregators
- **OpAdapter**: Wraps operators for use in DAG nodes with efficient path parsing
- **Root**: Entry point that receives external data
- **Dependencies**: Input paths that a node depends on
- **FlowGraph/FlowNode**: Type-safe schema definitions with Zod validation

## Basic Usage

### GraphExec

```typescript
import { GraphExec } from "@junduck/trading-indi/flow";
import { EMA } from "@junduck/trading-indi";

const graph = new GraphExec("tick");

graph
  .add("fast", new EMA({ period: 12 }))
  .depends("tick")
  .add("slow", new EMA({ period: 26 }))
  .depends("tick");

// Execute synchronously, get all node states
const state = graph.update(100);
console.log(state.fast, state.slow);
```

### JSON Configuration with Validation

```typescript
import { GraphExec, OpRegistry, FlowGraphSchema } from "@junduck/trading-indi/flow";
import { EMA, SMA } from "@junduck/trading-indi";

// Register operators
const registry = new OpRegistry()
  .register(EMA)
  .register(SMA);

// Describe the DAG
const config = {
  root: "tick",
  nodes: [
    {
      name: "ema",
      type: "EMA",
      init: { period: 20 },
      inputSrc: ["tick.price"]
    },
    {
      name: "sma",
      type: "SMA",
      init: { period: 20 },
      inputSrc: ["tick.price"]
    }
  ]
};

// Validate and construct
const graph = GraphExec.fromJSON(config, registry);
const state = graph.update({ price: 100, volume: 1000 });
console.log(state.ema, state.sma);
```

## Features

### Property Access

Access nested properties using dot notation:

```json
{
  "name": "ema",
  "type": "EMA",
  "init": { "period": 20 },
  "inputSrc": ["tick.price"]
}
```

### Multiple Dependencies

Operators can depend on multiple upstream nodes:

```json
{
  "name": "diff",
  "type": "Subtract",
  "inputSrc": ["fast", "slow"]
}
```

### Dynamic Execution

Operators that return `undefined` don't propagate to downstream nodes, enabling aggregators and filters:

```typescript
// Aggregator that only emits every N values
class EveryN {
  private count = 0;
  constructor(private n: number) {}

  update(x: number): number | undefined {
    this.count++;
    return this.count % this.n === 0 ? x : undefined;
  }
}
```

### Observing State

Read the returned state object from `GraphExec`:

```typescript
const state = graph.update(tick);
console.log("Fast EMA:", state.fast);
console.log("Slow EMA:", state.slow);
```

### Graph Validation

Validate your graph structure before execution:

```typescript
import { validateFlowGraph, formatFlowValidationError } from "@junduck/trading-indi/flow";

const result = validateFlowGraph(config, registry);
if (!result.valid) {
  const errors = result.errors.map(err => formatFlowValidationError(err)).join("; ");
  throw new Error(`Invalid graph: ${errors}`);
}
```

### Graph Analysis

Analyze graph complexity and compare different versions:

```typescript
import { calculateFlowGraphComplexity, compareFlowGraphs } from "@junduck/trading-indi/flow";

const complexity = calculateFlowGraphComplexity(config);
console.log(`Nodes: ${complexity.nodeCount}, Edges: ${complexity.edgeCount}, Max Depth: ${complexity.maxDepth}`);

const diffs = compareFlowGraphs(oldConfig, newConfig);
console.log("Changes:", diffs);
```

## API Reference

### GraphExec

- `constructor(rootNode: string)` - Create graph with root node
- `add(name, operator)` - Add operator and get NodeBuilder
- `add(name, dagNode)` - Add pre-wrapped DAG node
- `update(data)` - Execute graph synchronously, returns state object
- `validate()` - Validate DAG structure
- `static fromJSON(schema, registry)` - Construct from JSON with validation

### OpRegistry

- `register(ctor, group?)` - Register operator constructor with optional group
- `get(name)` - Get constructor by name
- `has(name)` - Check if type exists
- `getContext(name)` - Get operator documentation for AI agents
- `getAllContexts()` - Get all operator documentation grouped

### FlowNode & FlowGraph

```typescript
interface FlowNode {
  name: string;           // Node name in graph
  type: string;           // Type name in registry
  init?: any;             // Constructor parameters
  inputSrc?: string[] | string; // Input dependency paths
}

interface FlowGraph {
  root: string;            // Root node name
  nodes: FlowNode[];     // Operator configurations
}
```

### Validation

```typescript
interface FlowGraphValidationResult {
  valid: boolean;
  errors: FlowGraphError[];
}

type FlowGraphError =
  | { type: "structure"; path: string; message: string }
  | { type: "unknown_type"; node: string; opType: string }
  | { type: "cycle"; nodes: string[] }
  | { type: "unreachable"; nodes: string[] }
```

## Benefits

1. **Declarative**: Describe what you want, not how to compute it
2. **Race-free**: Synchronous execution prevents state corruption in stateful indicators
3. **Composable**: Mix stateful indicators with stateless transformations
4. **Type-safe**: Runtime validation with Zod schemas ensures correctness
5. **Validated**: Comprehensive validation catches errors before execution
6. **Analyzable**: Built-in complexity analysis and diffing capabilities
7. **Portable**: Save and share graph configurations as JSON
8. **Versionable**: Track changes to trading strategies in version control
9. **Dynamic**: Load different configurations at runtime
10. **AI-Ready**: Operator context documentation for AI agent integration

## Example: MACD Strategy

```json
{
  "root": "tick",
  "nodes": [
    {
      "name": "fast",
      "type": "EMA",
      "init": { "period": 12 },
      "inputSrc": ["tick.price"]
    },
    {
      "name": "slow",
      "type": "EMA",
      "init": { "period": 26 },
      "inputSrc": ["tick.price"]
    },
    {
      "name": "macd",
      "type": "Subtract",
      "inputSrc": ["fast", "slow"]
    },
    {
      "name": "signal",
      "type": "EMA",
      "init": { "period": 9 },
      "inputSrc": ["macd"]
    }
  ]
}
```

## Custom Operators

### Using trading-core Operators

Any operator with an `update()` method can be added directly to `GraphExec`. The `OpAdapter` automatically wraps them to work as DAG nodes:

```typescript
import { EMA, SMA } from "@junduck/trading-indi";

const graph = new GraphExec("tick");

// Any operator with .update() method works directly
graph
  .add("ema", new EMA({ period: 12 }))
  .depends("tick")
  .add("sma", new SMA({ period: 20 }))
  .depends("tick");
```

The `update()` method must return the latest state from the operator.

### Custom DAG Nodes

For advanced use cases, you can implement the `DagNode` interface directly:

```typescript
import type { DagNode } from "@junduck/trading-indi/flow";

class CrossOver implements DagNode {
  readonly __isDagNode = true;
  readonly inputPath = ["a", "b"];
  
  private prev?: { a: number; b: number };

  predSatisfied(inputs: { a: number; b: number }): "up" | "down" | undefined {
    if (!this.prev) {
      this.prev = inputs;
      return undefined;
    }

    const result =
      this.prev.a <= this.prev.b && inputs.a > inputs.b ? "up" :
      this.prev.a >= this.prev.b && inputs.a < inputs.b ? "down" :
      undefined;

    this.prev = inputs;
    return result;
  }
}

// Register for JSON usage
registry.register(CrossOver);
```

Then use it in your DAG:

```json
{
  "name": "signal",
  "type": "CrossOver",
  "inputSrc": ["fast", "slow"]
}
```

### Operator Documentation

For AI agent integration, operators should include static documentation:

```typescript
class MyOperator {
  static doc = {
    type: "MyOperator",
    description: "Custom operator for specific calculations",
    inputs: [{ name: "value", type: "number", description: "Input value" }],
    outputs: [{ name: "result", type: "number", description: "Calculated result" }],
    params: [{ name: "multiplier", type: "number", default: 1, description: "Value multiplier" }]
  };

  constructor(opts: { multiplier?: number }) {
    // initialization
  }

  update(value: number): number {
    return value * (this.multiplier || 1);
  }
}
```

## Race-Free Design

The Flow module is designed for stateful, online indicators:

### The Problem

In async JavaScript, if later events can overtake earlier ones, stateful indicators produce incorrect results:

```typescript
// BROKEN: Race condition
const ema = new EMA({ period: 10 });

priceStream.on('tick', async (price) => {
  ema.update(price);           // Updates shared state
  await sendToAnalytics(price); // Suspends here
  // Next tick can overtake and corrupt EMA state
});
```

### The Solution

`GraphExec` executes all computation **synchronously** in topological order:

```typescript
const state = graph.update(100);  // All nodes execute, returns state
const state2 = graph.update(50);  // Executes after 100
```

**Guarantees:**

- Node state updates are atomic (no interleaving)
- Events process in arrival order
- No locks or queues needed
- Optimized path parsing for nested property access

This design ensures indicators like EMA, MACD, and RSI maintain correct state even under high-frequency data streams.
