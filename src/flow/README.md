# Flow Module - Reactive Operator Composition

The Flow module provides a declarative framework for composing trading algorithms as DAGs (Directed Acyclic Graphs). Instead of the traditional pipeline approach (`bar → [indicators] → signals`), Flow lets you express complex trading logic as reactive data flows where computation propagates automatically through the graph.

## Philosophy

Traditional trading systems chain indicators in sequence, requiring explicit control flow. Flow takes a different approach:

- **Describe the DAG, not the control flow**: Define what nodes depend on, not how to execute them
- **Synchronous execution**: All nodes execute in topological order (race-free, predictable)
- **Dynamic**: Mix stateful operators (indicators) and stateless functions (aggregators, filters) seamlessly

## Core Concepts

- **GraphExec**: Synchronous DAG that executes nodes in topological order - simple, fast, race-free
- **Operator**: Any object with `onData()` method - indicators, transformations, aggregators
- **Root**: Entry point that receives external data
- **Dependencies**: Input paths that a node depends on

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

### JSON Configuration

```typescript
import { GraphExec, OpRegistry, GraphSchema } from "@junduck/trading-indi/flow";
import { EMA, SMA } from "@junduck/trading-indi";

// Register operators
const registry = new OpRegistry()
  .register(EMA)
  .register(SMA);

// Describe the DAG
const config: GraphSchema = {
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

// Construct and execute
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

  onData(x: number): number | undefined {
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

## API Reference

### GraphExec

- `constructor(rootNode: string)` - Create graph with root node
- `add(name, operator)` - Add operator and get NodeBuilder
- `update(data)` - Execute graph synchronously, returns state object
- `validate()` - Validate DAG structure
- `static fromJSON(schema, registry)` - Construct from JSON

### OpRegistry

- `register(name, ctor)` - Register operator constructor
- `get(name)` - Get constructor by name
- `has(name)` - Check if type exists

### NodeSchema

```typescript
interface NodeSchema {
  name: string;           // Node name in graph
  type: string;           // Type name in registry
  init?: any;             // Constructor parameters
  inputSrc: string[]; // Input dependency paths
}
```

### GraphSchema

```typescript
interface GraphSchema {
  root: string;            // Root node name
  nodes: NodeSchema[];   // Operator configurations
}
```

## Benefits

1. **Declarative**: Describe what you want, not how to compute it
2. **Race-free**: Synchronous execution prevents state corruption in stateful indicators
3. **Composable**: Mix stateful indicators with stateless transformations
4. **Simple**: Returns state directly - no promises, callbacks, or complexity
5. **Portable**: Save and share graph configurations as JSON
6. **Versionable**: Track changes to trading strategies in version control
7. **Dynamic**: Load different configurations at runtime
8. **Type-safe**: Registry ensures all operators are known

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

Any operator from trading-core with an `update()` method can be added directly to `GraphExec`. The `OpAdapter` automatically wraps them to work as DAG nodes:

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

For advanced use cases, you can implement the `predSatisfied` method that `GraphExec` uses internally:

```typescript
class CrossOver {
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

## Race-Free Design

The Flow module is designed for stateful, online indicators:

### The Problem

In async JavaScript, if later events can overtake earlier ones, stateful indicators produce incorrect results:

```typescript
// BROKEN: Race condition
const ema = new EMA({ period: 10 });

priceStream.on('tick', async (price) => {
  ema.onData(price);           // Updates shared state
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

This design ensures indicators like EMA, MACD, and RSI maintain correct state even under high-frequency data streams.
