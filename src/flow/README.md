# Flow Module - Reactive Operator Composition

The Flow module provides a declarative framework for composing trading algorithms as DAGs (Directed Acyclic Graphs). Instead of the traditional pipeline approach (`bar → [indicators] → signals`), Flow lets you express complex trading logic as reactive data flows where any node can be monitored and computation propagates automatically.

## Philosophy

Traditional trading systems chain indicators in sequence, requiring explicit control flow. Flow takes a different approach:

- **Describe the DAG, not the control flow**: Define what nodes depend on, not how to execute them
- **Reactive**: Feed data once, observe any node; propagation happens automatically
- **Dynamic**: Mix stateful operators (indicators) and stateless functions (aggregators, filters) seamlessly

## Core Concepts

- **Graph**: DAG that executes nodes synchronously in topological order (race-free)
- **Operator**: Any object with synchronous `onData()` method - indicators, transformations, aggregators
- **Root**: Entry point that receives external data
- **Dependencies**: Input paths that a node depends on
- **Reactivity**: Emit node updates in real-time as data flows through
- **Serialization**: Async listeners and output callbacks execute in order to maintain event sequence

## Basic Usage

### Programmatic Construction

```typescript
import { Graph } from "@junduck/trading-indi/flow";
import { EMA } from "@junduck/trading-indi";

const graph = new Graph("tick");

graph
  .add("fast", new EMA({ period: 12 }))
  .depends("tick")
  .add("slow", new EMA({ period: 26 }))
  .depends("tick")
  .output((state) => {
    console.log(state.fast, state.slow);
  });

await graph.onData(100);
```

### JSON Configuration

```typescript
import { Graph, OpRegistry, GraphDescriptor } from "@junduck/trading-indi/flow";
import { EMA, SMA } from "@junduck/trading-indi";

// Register operators
const registry = new OpRegistry()
  .register("EMA", EMA)
  .register("SMA", SMA);

// Describe the DAG
const config: GraphDescriptor = {
  root: "tick",
  nodes: [
    {
      name: "ema",
      type: "EMA",
      init: { period: 20 },
      input: ["tick.price"]
    },
    {
      name: "sma",
      type: "SMA",
      init: { period: 20 },
      input: ["tick.price"]
    }
  ]
};

// Construct from description
const graph = Graph.fromJSON(config, registry);

graph.output(console.log);
await graph.onData({ price: 100, volume: 1000 });
```

## Features

### Property Access

Access nested properties using dot notation:

```json
{
  "name": "ema",
  "type": "EMA",
  "init": { "period": 20 },
  "input": ["tick.price"]
}
```

### Multiple Dependencies

Operators can depend on multiple upstream nodes:

```json
{
  "name": "diff",
  "type": "Subtract",
  "input": ["fast", "slow"]
}
```

### Async Listeners and Callbacks

Operators must be synchronous for race-free stateful computation. However, listeners and output callbacks can be async and are serialized to maintain event order:

```typescript
// Async output callback
graph.output(async (state) => {
  await saveToDatabase(state);
  await sendToAPI(state);
});

// Async event listener
graph.on("ema", async (nodeName, result) => {
  await logToDatabase(nodeName, result);
});
```

All async callbacks from a single `onData()` call execute in order, preventing race conditions.

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

### Reactive Monitoring

Listen to specific node updates in real-time:

```typescript
// Listen to specific node
graph.on("ema", (nodeName, result) => {
  console.log(`${nodeName} updated:`, result);
});

// Listen to multiple nodes
graph
  .on("fast", (name, result) => console.log("Fast EMA:", result))
  .on("slow", (name, result) => console.log("Slow EMA:", result));
```

Events are emitted only when operators produce non-undefined results. Listeners can be sync or async (see Async Listeners section above).

## API Reference

### Graph

- `constructor(rootNode: string)` - Create graph with root node
- `add(name, operator)` - Add operator and get OpBuilder
- `output(callback)` - Set output handler (sync or async)
- `on(nodeName, callback)` - Listen to specific node updates (sync or async)
- `onData(data)` - Execute graph with new data (returns Promise)
- `static fromJSON(descriptor, registry)` - Construct from JSON

### OpRegistry

- `register(name, ctor)` - Register operator constructor
- `get(name)` - Get constructor by name
- `has(name)` - Check if type exists

### OpDescriptor

```typescript
interface OpDescriptor {
  name: string;      // Node name in graph
  type: string;      // Type name in registry
  init?: any;        // Constructor parameters
  input: string[];   // Input dependency paths
}
```

### GraphDescriptor

```typescript
interface GraphDescriptor {
  root: string;            // Root node name
  nodes: OpDescriptor[];   // Operator configurations
}
```

## Benefits

1. **Declarative**: Describe what you want, not how to compute it
2. **Race-free**: Synchronous execution prevents state corruption in stateful indicators
3. **Composable**: Mix stateful indicators with stateless transformations
4. **Observable**: Monitor any node without modifying the graph
5. **Ordered Events**: Async callbacks are serialized to maintain event sequence
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
      "input": ["tick.price"]
    },
    {
      "name": "slow",
      "type": "EMA",
      "init": { "period": 26 },
      "input": ["tick.price"]
    },
    {
      "name": "macd",
      "type": "Subtract",
      "input": ["fast", "slow"]
    },
    {
      "name": "signal",
      "type": "EMA",
      "init": { "period": 9 },
      "input": ["macd"]
    }
  ]
}
```

## Custom Operators

Any object with a synchronous `onData()` method can be an operator. Operators must be synchronous to ensure race-free execution:

```typescript
class CrossOver {
  private prev?: { a: number; b: number };

  // Must be synchronous, not async
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

registry.register("CrossOver", CrossOver);
```

Then use it in your DAG:

```json
{
  "name": "signal",
  "type": "CrossOver",
  "input": ["fast", "slow"]
}
```

**Important**: Operators can maintain internal state but must not perform async operations. Use listeners or output callbacks for async I/O.

## Race-Free Design

The Flow module is designed for stateful, online indicators in async environments:

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

Flow executes all computation **synchronously** in a single pass, then serializes async callbacks:

```typescript
graph.onData(100);  // All nodes execute synchronously (atomic)
graph.onData(50);   // Executes after 100, guaranteed
```

**Guarantees:**

- Node state updates are atomic (no interleaving)
- Events process in arrival order
- Async listeners and output callbacks maintain order
- No locks or queues needed in your code

This design ensures indicators like EMA, MACD, and RSI maintain correct state even under high-frequency data streams.
