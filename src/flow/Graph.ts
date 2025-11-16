import type { GraphDescriptor, OpRegistry } from "./Registry.js";

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

  onData(state: Record<string, any>): any;
}

class OpImpl implements Op {
  readonly __isDagNode = true;
  readonly inputPath: string[];

  constructor(private callable: any, inputPath: string[]) {
    this.inputPath = inputPath;
  }

  onData(state: Record<string, any>): any {
    const args = this.inputPath.map((path) => resolvePath(state, path));
    return this.callable.onData(...args);
  }
}

/**
 * Wraps an operator for use in the graph.
 * @param callable callable instance with onData method
 * @param inputPath Array of paths to extract from state
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

export type GraphOutputCallback = (output: any) => void | Promise<void>;
export type GraphUpdateListener = (
  nodeName: string,
  result: any
) => void | Promise<void>;

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
  static fromJSON(descriptor: GraphDescriptor, registry: OpRegistry): Graph {
    const graph = new Graph(descriptor.root);

    for (const nodeDesc of descriptor.nodes) {
      const ctor = registry.get(nodeDesc.type);
      if (!ctor) {
        throw new Error(
          `Unknown type '${nodeDesc.type}' for node '${nodeDesc.name}'`
        );
      }

      const instance = new ctor(nodeDesc.init ?? {});
      graph.add(nodeDesc.name, instance).depends(...nodeDesc.input);
    }

    return graph;
  }

  /** Add a computation node to the graph. */
  add(name: string, node: Op): this;
  add(name: string, callable: any): OpBuilder;
  add(name: string, nodeOrCallable: any): this | OpBuilder {
    if (name === this.rootNode) {
      throw new Error(
        `Cannot add node with name '${name}': conflicts with root node`
      );
    }
    if (nodeOrCallable.__isDagNode) {
      return this.addNode(name, nodeOrCallable);
    }
    return new OpBuilder(this, name, nodeOrCallable);
  }

  /** @internal */
  addNode(name: string, node: Op): this {
    this.nodes.set(name, node);

    const preds: string[] = [];
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

  /** Execute the graph with new input data. */
  async onData(data: any): Promise<void> {
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

        const result = node.onData(state);

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
