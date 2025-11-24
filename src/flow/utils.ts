export type MaybePromise<T> = T | Promise<T>;

export interface DagNode {
  readonly __isDagNode: true;
  readonly inputPath: string[];

  predSatisfied(state: Record<string, any>): MaybePromise<any>;
}

export interface Op {
  update(...args: any[]): MaybePromise<any>;
}

/** Preprocessed path for efficient state lookup */
type ParsedPath =
  | { nested: false; key: string } // Fast path: state[key]
  | { nested: true; parts: string[] }; // Nested: state[a][b][c]

/** Wraps an operator for use in graph */
export class OpAdapter implements DagNode {
  readonly __isDagNode = true;
  readonly inputPath: string[];
  private readonly parsedPaths: ParsedPath[];

  constructor(private op: Op, inputPath: string[]) {
    this.inputPath = inputPath;
    // Preprocess paths once at construction, not in hot path
    this.parsedPaths = inputPath.map((path) => {
      if (!path || !path.includes(".")) {
        return { nested: false, key: path || "" };
      }
      return { nested: true, parts: path.split(".") };
    });
  }

  predSatisfied(state: Record<string, any>): MaybePromise<any> {
    const args = this.parsedPaths.map((parsed) => {
      if (!parsed.nested) {
        // Fast path: direct state lookup
        return state[parsed.key];
      }

      // Nested path resolution
      const { parts } = parsed;
      let value = state[parts[0]!];
      for (let i = 1; i < parts.length && value !== undefined; i++) {
        value = value[parts[i]!];
      }
      return value;
    });

    return this.op.update(...args);
  }
}
