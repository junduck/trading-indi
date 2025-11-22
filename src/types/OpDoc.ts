/**
 * AI agent friendly operator doc context
 */
export interface OperatorDoc {
  type: string; // Registry key
  desc?: string; // What it computes, undefined if trivial operators, or type name self-explanatory
  init?: string; // Constructor parameters, undefined if default construct
  update: string; // update's parameters
  output: string; // What it produces
}

// Agent instruction: avoid desc field if operator is trivial, or the type name is self-explanatory, this improves multi-lingual agent CoT
