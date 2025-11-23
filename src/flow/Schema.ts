import { z } from "zod";
import { OpRegistry } from "./Registry.js";
import type { TopoError } from "./validate.js";
import { validateAdjList } from "./validate.js";

/**
 * Zod schema for operator node validation.
 */
export const OpSchemaZod = z.object({
  name: z.string().min(1, "Node name must be non-empty"),
  type: z.string().min(1, "Node type must be non-empty"),
  init: z.unknown().optional(),
  inputSrc: z.union([z.array(z.string()), z.string()]).optional(),
});

/**
 * Operator node schema for JSON serialization.
 */
export type OpSchema = z.infer<typeof OpSchemaZod>;

/**
 * Zod schema for graph validation.
 */
export const GraphSchemaZod = z.object({
  root: z.string().min(1, "Root node name must be non-empty"),
  nodes: z.array(OpSchemaZod),
});

/**
 * Graph schema for JSON serialization.
 */
export type GraphSchema = z.infer<typeof GraphSchemaZod>;

/**
 * Unified graph error types.
 */
export type GraphError =
  | { type: "structure"; path: string; message: string }
  | { type: "unknown_type"; node: string; opType: string }
  | TopoError;

/**
 * Result of graph validation.
 */
export interface GraphSchemaValidationResult {
  valid: boolean;
  errors: GraphError[];
}

/**
 * Normalize inputSrc to string array. Handles undefined, empty string, and Const nodes.
 */
export function normalizeUpdateSource(source?: string[] | string): string[] {
  if (!source || source === "") return [];
  return Array.isArray(source) ? source : [source];
}

/**
 * Build successor adjacency list from graph schema.
 * Nodes with no inputs depend on root.
 */
function buildSuccessorMap(schema: GraphSchema): Map<string, string[]> {
  const succ = new Map<string, string[]>();

  succ.set(schema.root, []);
  for (const node of schema.nodes) {
    succ.set(node.name, []);
  }

  for (const node of schema.nodes) {
    const sources = normalizeUpdateSource(node.inputSrc);
    if (sources.length === 0) {
      // Nodes with no inputs (e.g., Const) depend on root
      const rootSuccs = succ.get(schema.root)!;
      if (!rootSuccs.includes(node.name)) {
        rootSuccs.push(node.name);
      }
    } else {
      for (const depPath of sources) {
        const dep = depPath.split(".")[0]!;
        const depSuccs = succ.get(dep);
        if (depSuccs && !depSuccs.includes(node.name)) {
          depSuccs.push(node.name);
        }
      }
    }
  }

  return succ;
}

/**
 * Validate a graph schema against a registry.
 * Checks:
 * - Schema structure (via Zod)
 * - All types exist in registry
 * - Graph topology (cycles, reachability)
 * @param schema Graph schema
 * @param registry Type registry
 */
export function validateGraphSchema(
  schema: GraphSchema,
  registry: OpRegistry
): GraphSchemaValidationResult {
  const errors: GraphError[] = [];

  // Validate structure with Zod
  const parseResult = GraphSchemaZod.safeParse(schema);
  if (!parseResult.success) {
    for (const issue of parseResult.error.issues) {
      errors.push({
        type: "structure",
        path: issue.path.join("."),
        message: issue.message,
      });
    }
    return { valid: false, errors };
  }

  const validSchema = parseResult.data;

  // Check all types exist in registry
  for (const node of validSchema.nodes) {
    if (!registry.has(node.type)) {
      errors.push({
        type: "unknown_type",
        node: node.name,
        opType: node.type,
      });
    }
  }

  // Check topology (unreachable errors will catch unknown dependencies)
  if (errors.length === 0) {
    const succ = buildSuccessorMap(validSchema);
    const topoErrors = validateAdjList(validSchema.root, succ);
    errors.push(...topoErrors);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Format validation error as human-readable string.
 */
export function formatValidationError(error: GraphError): string {
  switch (error.type) {
    case "structure":
      return `${error.path}: ${error.message}`;
    case "unknown_type":
      return `Unknown type "${error.opType}" for node "${error.node}"`;
    case "cycle":
      return `Graph contains a cycle: ${error.nodes.join(" → ")}`;
    case "unreachable":
      return `Unreachable nodes from root: ${error.nodes.join(", ")}`;
  }
}

/**
 * Calculate graph complexity.
 * @param desc Graph descriptor
 * @returns Complexity score (node count + edge count)
 */
export function graphComplexity(desc: GraphSchema): number {
  const edgeCount = desc.nodes.reduce(
    (sum, node) => sum + normalizeUpdateSource(node.inputSrc).length,
    0
  );
  return desc.nodes.length + edgeCount;
}

/**
 * Type of change in graph diff.
 */
export type GraphDiffKind =
  | "root_changed"
  | "node_added"
  | "node_removed"
  | "node_type_changed"
  | "node_init_changed"
  | "node_input_changed";

/**
 * Single difference between two graph descriptors.
 */
export interface GraphDiff {
  kind: GraphDiffKind;
  node?: string;
  before?: any;
  after?: any;
}

/**
 * Compare two graph descriptors and return differences.
 * @param before Previous graph state
 * @param after Current graph state
 */
export function graphDiff(
  before: GraphSchema,
  after: GraphSchema
): GraphDiff[] {
  const diffs: GraphDiff[] = [];

  if (before.root !== after.root) {
    diffs.push({
      kind: "root_changed",
      before: before.root,
      after: after.root,
    });
  }

  const beforeNodes = new Map(before.nodes.map((n) => [n.name, n]));
  const afterNodes = new Map(after.nodes.map((n) => [n.name, n]));

  for (const [name, node] of afterNodes) {
    if (!beforeNodes.has(name)) {
      diffs.push({ kind: "node_added", node: name, after: node });
    }
  }

  for (const [name, node] of beforeNodes) {
    if (!afterNodes.has(name)) {
      diffs.push({ kind: "node_removed", node: name, before: node });
    }
  }

  for (const [name, afterNode] of afterNodes) {
    const beforeNode = beforeNodes.get(name);
    if (!beforeNode) continue;

    if (beforeNode.type !== afterNode.type) {
      diffs.push({
        kind: "node_type_changed",
        node: name,
        before: beforeNode.type,
        after: afterNode.type,
      });
    }

    if (JSON.stringify(beforeNode.init) !== JSON.stringify(afterNode.init)) {
      diffs.push({
        kind: "node_init_changed",
        node: name,
        before: beforeNode.init,
        after: afterNode.init,
      });
    }

    const beforeInputs = normalizeUpdateSource(beforeNode.inputSrc)
      .slice()
      .sort()
      .join(",");
    const afterInputs = normalizeUpdateSource(afterNode.inputSrc)
      .slice()
      .sort()
      .join(",");
    if (beforeInputs !== afterInputs) {
      diffs.push({
        kind: "node_input_changed",
        node: name,
        before: normalizeUpdateSource(beforeNode.inputSrc),
        after: normalizeUpdateSource(afterNode.inputSrc),
      });
    }
  }

  return diffs;
}
