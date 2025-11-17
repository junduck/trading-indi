/**
 * AI agent friendly operator doc context
 */
export interface OperatorDoc {
  type: string; // Registry key
  desc?: string; // What it computes, undefined if trivial operators
  init?: string; // Constructor parameters, undefined if default construct
  onDataParam: string; // onData's parameters
  output: string; // What it produces
}
