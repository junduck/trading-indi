/**
 * Type registry for graph serialization.
 * Maps type names to constructor functions.
 */
export class OpRegistry {
  private types = new Map<string, new (opts: any) => any>();

  /**
   * Register a type with its constructor.
   * @param name Type name used in JSON
   * @param ctor Constructor function
   */
  register(name: string, ctor: new (opts: any) => any): this {
    this.types.set(name, ctor);
    return this;
  }

  /**
   * Get constructor for a type name.
   * @param name Type name
   * @returns Constructor function
   */
  get(name: string): (new (opts: any) => any) | undefined {
    return this.types.get(name);
  }

  /**
   * Check if type is registered.
   * @param name Type name
   */
  has(name: string): boolean {
    return this.types.has(name);
  }
}

/**
 * Node descriptor for JSON serialization.
 */
export interface OpDescriptor {
  name: string;
  type: string;
  init?: any;
  input: string[];
}

/**
 * Graph descriptor for JSON serialization.
 */
export interface GraphDescriptor {
  root: string;
  nodes: OpDescriptor[];
}
