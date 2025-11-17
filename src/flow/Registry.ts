import type { OperatorDoc } from "../types/OpDoc.js";

/**
 * Operator context for AI agents - serialized doc as JSON.
 */
export type OpContext = OperatorDoc;

/**
 * Type registry for graph serialization.
 * Maps type names to constructor functions.
 */
export class OpRegistry {
  private types = new Map<string, new (opts: any) => any>();

  /**
   * Register a type with its constructor.
   * Type name is extracted from ctor.doc.type.
   * @param ctor Constructor function with static doc property
   */
  register(ctor: new (opts: any) => any): this {
    const doc = (ctor as any).doc as OperatorDoc | undefined;
    if (!doc?.type) {
      throw new Error("Constructor must have static doc.type property");
    }
    this.types.set(doc.type, ctor);
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

  /**
   * Generate OpContext from registered type's static doc.
   * @param name Type name
   * @returns OpContext JSON or undefined if not found or no doc
   */
  getContext(name: string): OpContext | undefined {
    const ctor = this.types.get(name);
    if (!ctor) return undefined;
    return (ctor as any).doc;
  }

  /**
   * Generate all OpContexts for registered types.
   * @returns Array of OpContext JSON objects
   */
  getAllContexts(): OpContext[] {
    const contexts: OpContext[] = [];
    for (const ctor of this.types.values()) {
      const doc = (ctor as any).doc;
      if (doc) contexts.push(doc);
    }
    return contexts;
  }
}
