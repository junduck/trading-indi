import type { OpRegistry } from "./Registry.js";
import type { GraphSchema } from "./Schema.js";
import {
  normalizeUpdateSource,
  validateGraphSchema,
  formatValidationError,
} from "./Schema.js";
import type { TopoError } from "./validate.js";
import { validateAdjList } from "./validate.js";
import { OpAdapter, type DagNode, type Op } from "./utils.js";

class NodeBuilder {
  constructor(private graph: Graph, private name: string, private op: Op) {}

  depends(...inputPaths: string[]): Graph {
    const node = new OpAdapter(this.op, inputPaths);
    return this.graph.addNode(this.name, node);
  }
}

export interface GraphValidationResult {
  valid: boolean;
  errors: TopoError[];
}

/**
 * DAG-based computation graph.
 * Nodes execute synchronously in topological order.
 */
export class Graph {
  private readonly rootNode: string;
  private readonly rootIndex = 0;

  // Index based adjlist

  // name -> i
  private readonly nodeIndex: Map<string, number> = new Map();
  // i -> name
  private readonly nodeNames: string[] = [];
  // i -> instance
  private readonly nodes: (DagNode | null)[] = [];
  // i -> pred[] -> j
  private readonly predecessors: number[][] = [];
  // j -> succ[] -> i
  private readonly successors: number[][] = [];

  private size = 1; // Root takes index 0

  /**
   * Create a new Graph with a root node.
   * @param rootNode Name of the root node that receives external data
   */
  constructor(rootNode: string) {
    this.rootNode = rootNode;
    this.nodeIndex.set(rootNode, this.rootIndex);
    this.nodeNames[this.rootIndex] = rootNode;
    this.nodes[this.rootIndex] = null; // Root has no DagNode
    this.predecessors[this.rootIndex] = [];
    this.successors[this.rootIndex] = [];
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
      const sources = normalizeUpdateSource(nodeDesc.inputSrc);
      const node = new OpAdapter(instance, sources);
      graph.addNode(nodeDesc.name, node);
    }

    return graph;
  }

  /** Add a computation node to the graph. */
  add(name: string, node: DagNode): this;
  add(name: string, op: Op): NodeBuilder;
  add(name: string, nodeOrOp: DagNode | Op): this | NodeBuilder {
    if ((nodeOrOp as any).__isDagNode) {
      return this.addNode(name, nodeOrOp as DagNode);
    }
    return new NodeBuilder(this, name, nodeOrOp as Op);
  }

  /** Adds a new name, creates empty adjlist for the name */
  private addName(name: string): number {
    const idx = this.size++;

    this.nodeIndex.set(name, idx);

    this.nodeNames.push(name);
    this.predecessors.push([]);
    this.successors.push([]);
    this.nodes.push(null); // avoid sparse

    return idx;
  }

  /** @internal */
  addNode(name: string, node: DagNode): this {
    if (node === null) {
      throw new Error(
        `Cannot add node with name '${name}': node is null instance`
      );
    }
    if (name === this.rootNode) {
      throw new Error(
        `Cannot add node with name '${name}': conflicts with root node`
      );
    }

    // Check if this node was forward-referenced
    let nodeIdx = this.nodeIndex.get(name);
    if (nodeIdx === undefined) {
      nodeIdx = this.addName(name);
    } else if (this.nodes[nodeIdx] !== null) {
      throw new Error(
        `Cannot add node with name '${name}': node already exists`
      );
    }
    // Set node instance
    this.nodes[nodeIdx] = node;

    const preds = this.predecessors[nodeIdx]!;

    if (node.inputPath.length === 0) {
      // Nodes with no inputs (e.g., Const) depend on root to trigger execution
      preds.push(this.rootIndex);
      this.successors[this.rootIndex]!.push(nodeIdx);
    } else {
      for (const path of node.inputPath) {
        if (!path) continue;
        const predName = path.split(".")[0]!;
        let predIdx = this.nodeIndex.get(predName);

        // Allow forward references - only create adjlist for forward ref
        if (predIdx === undefined) {
          predIdx = this.addName(predName);
          // Node will be undefined until actually added
        }

        if (!preds.includes(predIdx)) {
          preds.push(predIdx);
          this.successors[predIdx]!.push(nodeIdx);
        }
      }
    }

    return this;
  }

  /** Validate that the graph is acyclic (DAG) and all nodes are reachable. */
  validate(): GraphValidationResult {
    // Convert index-based adjacency to string-based for validation
    const succMap = new Map<string, string[]>();
    for (let i = 0; i < this.successors.length; i++) {
      const succs = this.successors[i];
      if (succs) {
        const nodeName = this.nodeNames[i]!;
        succMap.set(
          nodeName,
          succs.map((idx) => this.nodeNames[idx]!)
        );
      }
    }

    const errors = validateAdjList(this.rootNode, succMap);
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /** Execute the graph with new input data. */
  update(data: any): Record<string, any> {
    let state: Record<string, any> = { [this.rootNode]: data };

    // Initialize topological sort with integer indices
    const inDegree = new Int32Array(this.size);
    for (let i = 0; i < this.predecessors.length; i++) {
      inDegree[i] = this.predecessors[i]!.length;
    }

    // Pre-allocate exec queue
    const queue = new Int32Array(this.size);
    let readPtr = 0;
    let writePtr = 0;

    // Enqueue root successors
    const rootSuccessors = this.successors[this.rootIndex];
    if (rootSuccessors) {
      for (const succIdx of rootSuccessors) {
        const newDegree = --inDegree[succIdx]!;
        if (newDegree === 0) {
          queue[writePtr++] = succIdx;
        }
      }
    }

    // Execute nodes in topological order (synchronous, race-free)
    while (readPtr < writePtr) {
      const nodeIdx = queue[readPtr++]!;
      const node = this.nodes[nodeIdx]!;
      const result = node.predSatisfied(state);

      if (result === undefined) {
        continue;
      }

      const nodeName = this.nodeNames[nodeIdx]!;
      state[nodeName] = result;

      // Enqueue successors
      const nodeSuccessors = this.successors[nodeIdx];
      if (nodeSuccessors) {
        for (const succIdx of nodeSuccessors) {
          const newDegree = --inDegree[succIdx]!;
          if (newDegree === 0) {
            queue[writePtr++] = succIdx;
          }
        }
      }
    }

    return state;
  }
}
