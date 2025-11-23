# Flow Module - Reactive Operator Composition

The Flow module provides a declarative framework for composing trading algorithms as DAGs (Directed Acyclic Graphs). Instead of the traditional pipeline approach (`bar → [indicators] → signals`), Flow lets you express complex trading logic as reactive data flows where computation propagates automatically through the graph.

## Philosophy

Traditional trading systems chain indicators in sequence, requiring explicit control flow. Flow takes a different approach:

- **Describe the DAG, not the control flow**: Define what nodes depend on, not how to execute them
- **Synchronous execution**: All nodes execute in topological order (race-free, predictable)
- **Dynamic**: Mix stateful operators (indicators) and stateless functions (aggregators, filters) seamlessly

## Core Concepts

- **Graph**: Synchronous DAG that executes nodes in topological order - simple, fast, race-free
- **AsyncGraph**: Async DAG with event listeners for reactive monitoring
- **Operator**: Any object with `onData()` method - indicators, transformations, aggregators
- **Root**: Entry point that receives external data
- **Dependencies**: Input paths that a node depends on

## Basic Usage

### Synchronous Graph (Recommended)

```typescript
import { Graph } from "@junduck/trading-indi/flow";
import { EMA } from "@junduck/trading-indi";

const graph = new Graph("tick");

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
import { Graph, OpRegistry, GraphSchema } from "@junduck/trading-indi/flow";
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
const graph = Graph.fromJSON(config, registry);
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

### AsyncGraph for Reactive Monitoring

For reactive use cases with event listeners, use `AsyncGraph`:

```typescript
import { AsyncGraph } from "@junduck/trading-indi/flow";

const graph = new AsyncGraph("tick");

graph
  .add("ema", new EMA({ period: 12 }))
  .depends("tick")
  .on("ema", async (nodeName, result) => {
    await logToDatabase(nodeName, result);
  });

// Returns promise, listeners execute in order
await graph.update(100);
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

With synchronous `Graph`, read the returned state object:

```typescript
const state = graph.update(tick);
console.log("Fast EMA:", state.fast);
console.log("Slow EMA:", state.slow);
```

With `AsyncGraph`, use event listeners:

```typescript
asyncGraph
  .on("fast", (name, result) => console.log("Fast EMA:", result))
  .on("slow", (name, result) => console.log("Slow EMA:", result));

await asyncGraph.update(tick);
```

Events are emitted only when operators produce non-undefined results.

## API Reference

### Graph (Synchronous)

- `constructor(rootNode: string)` - Create graph with root node
- `add(name, operator)` - Add operator and get NodeBuilder
- `update(data)` - Execute graph synchronously, returns state object
- `validate()` - Validate DAG structure
- `static fromJSON(schema, registry)` - Construct from JSON

### AsyncGraph

- `constructor(rootNode: string)` - Create graph with root node
- `add(name, operator)` - Add operator and get NodeBuilder
- `on(nodeName, callback)` - Listen to specific node updates (sync or async)
- `update(data)` - Execute graph asynchronously, returns `Promise<state>`
- `validate()` - Validate DAG structure
- `static fromJSON(schema, registry)` - Construct from JSON

### OpRegistry

- `register(name, ctor)` - Register operator constructor
- `get(name)` - Get constructor by name
- `has(name)` - Check if type exists

### OpSchema

```typescript
interface OpSchema {
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
  nodes: OpSchema[];   // Operator configurations
}
```

## Benefits

1. **Declarative**: Describe what you want, not how to compute it
2. **Race-free**: Synchronous execution prevents state corruption in stateful indicators
3. **Composable**: Mix stateful indicators with stateless transformations
4. **Simple**: Synchronous `Graph` returns state directly - no promises, callbacks, or complexity
5. **Flexible**: Use `AsyncGraph` when you need event listeners or async I/O
6. **Portable**: Save and share graph configurations as JSON
7. **Versionable**: Track changes to trading strategies in version control
8. **Dynamic**: Load different configurations at runtime
9. **Type-safe**: Registry ensures all operators are known

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

Any object with an `onData()` method can be an operator:

```typescript
class CrossOver {
  private prev?: { a: number; b: number };

  onData({ a, b }: { a: number; b: number }): "up" | "down" | undefined {
    if (!this.prev) {
      this.prev = { a, b };
      return undefined;
    }

    const result =
      this.prev.a <= this.prev.b && a > b ? "up" :
      this.prev.a >= this.prev.b && a < b ? "down" :
      undefined;

    this.prev = { a, b };
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

**Important**: Operators must be synchronous. For async I/O, use `AsyncGraph` event listeners.

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

Both `Graph` and `AsyncGraph` execute all computation **synchronously** in topological order:

```typescript
// Synchronous - simple and fast
const state = graph.update(100);  // All nodes execute, returns state
const state2 = graph.update(50);  // Executes after 100

// Async - for event listeners
await asyncGraph.update(100);  // All nodes execute, then listeners run
await asyncGraph.update(50);   // Executes after 100
```

**Guarantees:**

- Node state updates are atomic (no interleaving)
- Events process in arrival order
- `AsyncGraph` serializes event listeners to maintain order
- No locks or queues needed

This design ensures indicators like EMA, MACD, and RSI maintain correct state even under high-frequency data streams.
