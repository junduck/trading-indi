import type { OpRegistry } from "./Registry.js";
import type { GraphSchema } from "./Schema.js";
import {
  normalizeOnDataSource,
  validateGraphSchema,
  formatValidationError,
} from "./Schema.js";
import type { TopoError } from "./validate.js";
import { validateAdjList } from "./validate.js";

function resolvePath(state: Record<string, any>, path: string): any {
  if (!path) return undefined;

  const parts = path.split(".");
  let value = state[parts[0]!];

  for (let i = 1; i < parts.length && value !== undefined; i++) {
    value = value?.[parts[i]!];
  }

  return value;
}

/** Op node interface for DAG execution. Nodes must be synchronous. */
export interface Op {
  readonly __isDagNode: true;
  readonly inputPath: string[];

  predSatisfied(state: Record<string, any>): any;
}

class OpImpl implements Op {
  readonly __isDagNode = true;
  readonly inputPath: string[];

  constructor(private callable: any, inputPath: string[]) {
    this.inputPath = inputPath;
  }

  predSatisfied(state: Record<string, any>): any {
    const args = this.inputPath.map((path) => resolvePath(state, path));
    return this.callable.update(...args);
  }
}

/**
 * Wraps an operator for use in the graph.
 * @param callable callable instance with update method
 * @param inputPath Array of paths to extract from state as input to callable
 */
export function makeOp(callable: any, inputPath: string[]): Op {
  return new OpImpl(callable, inputPath);
}

class OpBuilder {
  constructor(
    private graph: Graph,
    private name: string,
    private callable: any
  ) {}

  depends(...inputPaths: string[]): Graph {
    const node = new OpImpl(this.callable, inputPaths);
    return this.graph.addNode(this.name, node);
  }
}

/** Graph output callback */
export type GraphOutputCallback = (output: any) => void | Promise<void>;

/** Graph update lisener callback */
export type GraphUpdateListener = (
  nodeName: string,
  result: any
) => void | Promise<void>;

export interface GraphValidationResult {
  valid: boolean;
  errors: TopoError[];
}

/**
 * DAG-based reactive computation graph.
 * Nodes execute synchronously in topological order.
 * Async listeners and output callbacks are serialized to maintain event order.
 */
export class Graph {
  private readonly rootNode: string;
  private readonly nodes: Map<string, Op> = new Map();
  private readonly predecessors: Map<string, string[]> = new Map();
  private readonly successors: Map<string, string[]> = new Map();
  private readonly updateListener: Map<string, Array<GraphUpdateListener>> =
    new Map();

  private outputCallback?: GraphOutputCallback;
  private updateListenerCount = 0;
  private notifyQueue = Promise.resolve();

  /**
   * Create a new Graph with a root node.
   * @param rootNode Name of the root node that receives external data
   */
  constructor(rootNode: string) {
    this.rootNode = rootNode;
    this.predecessors.set(rootNode, []);
    this.successors.set(rootNode, []);
  }

  /** Construct a graph from JSON descriptor. */
  static fromJSON(schema: GraphSchema, registry: OpRegistry): Graph {
    const validationResult = validateGraphSchema(schema, registry);
    if (!validationResult.valid) {
      const errorMessages = validationResult.errors
        .map((err) => formatValidationError(err))
        .join("; ");
      throw new Error(`Invalid graph schema: ${errorMessages}`);
    }

    const graph = new Graph(schema.root);

    for (const nodeDesc of schema.nodes) {
      const ctor = registry.get(nodeDesc.type)!;
      const instance = new ctor(nodeDesc.init ?? {});
      const sources = normalizeOnDataSource(nodeDesc.onDataSource);
      graph.add(nodeDesc.name, instance).depends(...sources);
    }

    return graph;
  }

  /** Add a computation node to the graph. */
  add(name: string, node: Op): this;
  add(name: string, callable: any): OpBuilder;
  add(name: string, nodeOrCallable: any): this | OpBuilder {
    if (nodeOrCallable.__isDagNode) {
      return this.addNode(name, nodeOrCallable);
    }
    return new OpBuilder(this, name, nodeOrCallable);
  }

  /** @internal */
  addNode(name: string, node: Op): this {
    if (name === this.rootNode) {
      throw new Error(
        `Cannot add node with name '${name}': conflicts with root node`
      );
    }
    this.nodes.set(name, node);

    const preds: string[] = [];

    // Nodes with no inputs (e.g., Const) depend on root to trigger execution
    if (node.inputPath.length === 0) {
      preds.push(this.rootNode);
      if (!this.successors.has(this.rootNode)) {
        this.successors.set(this.rootNode, []);
      }
      const rootSuccs = this.successors.get(this.rootNode)!;
      if (!rootSuccs.includes(name)) {
        rootSuccs.push(name);
      }
    } else {
      for (const path of node.inputPath) {
        if (!path) continue;
        const predName = path.split(".")[0]!;
        if (!preds.includes(predName)) {
          preds.push(predName);
        }

        if (!this.successors.has(predName)) {
          this.successors.set(predName, []);
        }
        const succs = this.successors.get(predName)!;
        if (!succs.includes(name)) {
          succs.push(name);
        }
      }
    }

    this.predecessors.set(name, preds);
    if (!this.successors.has(name)) {
      this.successors.set(name, []);
    }

    return this;
  }

  /** Set output callback to receive computed state. */
  output(callback: GraphOutputCallback): this {
    this.outputCallback = callback;
    return this;
  }

  /** Register event listener for specific node updates. */
  on(nodeName: string, callback: GraphUpdateListener): this {
    if (!this.updateListener.has(nodeName)) {
      this.updateListener.set(nodeName, []);
    }
    this.updateListener.get(nodeName)!.push(callback);
    this.updateListenerCount++;
    return this;
  }

  /** Validate that the graph is acyclic (DAG) and all nodes are reachable. */
  validate(): GraphValidationResult {
    const errors = validateAdjList(this.rootNode, this.successors);
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Experiment:
  /* Logic completeness: ANY
// Initialize topological sort
for (const node of nodes) {
  if (node.fireWhen === "any") {
    inDegree.set(node.name, 1);
  } else {
    inDegree.set(node.name, node.input.length);
  }
}

No extra book keeping required:
fireWhen: "any", deps: [A, B, C], initial inDegree = 1
A fires: 1 - 1 = 0  → queue ✓
B fires: 0 - 1 = -1 → skip (not 0)
C fires: -1 - 1 = -2 → skip (not 0)
   */

  /** Execute the graph with new input data. */
  async update(data: any): Promise<void> {
    let state: Record<string, any> = { [this.rootNode]: data };

    // Initialize topological sort
    const inDegree = new Map<string, number>();
    for (const [name, preds] of this.predecessors) {
      inDegree.set(name, preds.length);
    }

    let ready = new Array<string>(this.nodes.size);
    let readyCount = 0;

    // Pre-allocate emissions array for listener promises
    const emissions = new Array<Promise<void>>(this.updateListenerCount);
    let emissionCount = 0;

    // Enqueue root successors
    const rootSuccessors = this.successors.get(this.rootNode);
    if (rootSuccessors) {
      for (const succ of rootSuccessors) {
        const newDegree = inDegree.get(succ)! - 1;
        inDegree.set(succ, newDegree);
        if (newDegree === 0) {
          ready[readyCount++] = succ;
        }
      }
    }

    // Execute nodes in topological order (synchronous, race-free)
    while (readyCount > 0) {
      const batchSize = readyCount;
      readyCount = 0;

      for (let i = 0; i < batchSize; i++) {
        const nodeName = ready[i]!;
        const node = this.nodes.get(nodeName);

        if (!node) continue;

        const result = node.predSatisfied(state);

        if (result === undefined) continue;

        // Collect listener promises for later serialization
        if (this.updateListenerCount) {
          const listeners = this.updateListener.get(nodeName);
          if (listeners) {
            for (const listener of listeners) {
              const promise = listener(nodeName, result);
              if (promise instanceof Promise) {
                emissions[emissionCount++] = promise;
              }
            }
          }
        }

        state[nodeName] = result;

        // Enqueue successors
        const nodeSuccessors = this.successors.get(nodeName);
        if (nodeSuccessors) {
          for (const succ of nodeSuccessors) {
            const newDegree = inDegree.get(succ)! - 1;
            inDegree.set(succ, newDegree);
            if (newDegree === 0) {
              ready[readyCount++] = succ;
            }
          }
        }
      }
    }

    // Serialize notifications to maintain event order
    const notify = async () => {
      if (emissionCount > 0) {
        await Promise.all(emissions.slice(0, emissionCount));
      }
      if (this.outputCallback) {
        await this.outputCallback(state);
      }
    };

    this.notifyQueue = this.notifyQueue.then(notify);
    await this.notifyQueue;
  }
}
