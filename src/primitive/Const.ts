import { type OperatorDoc } from "../types/OpDoc.js";

/**
 * Stateless constant value node.
 * Returns a constant value without taking any input.
 */
export class Const {
  private readonly val: number;

  constructor(opts: { value: number }) {
    this.val = opts.value;
  }

  update(): number {
    return this.val;
  }

  static readonly doc: OperatorDoc = {
    type: "Const",
    desc: "Constant value source (no input required)",
    init: "{value: number}",
    input: "",
    output: "number",
  };
}
