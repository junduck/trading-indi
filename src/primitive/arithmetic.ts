import { type OperatorDoc } from "../types/OpDoc.js";

// ============================================================================
// Binary Arithmetic Operators
// ============================================================================

export class Add {
  update(lhs: number, rhs: number): number {
    return lhs + rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "Add",
    update: "lhs, rhs",
    output: "number",
  };
}

export class Sub {
  update(lhs: number, rhs: number): number {
    return lhs - rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "Sub",
    update: "lhs, rhs",
    output: "number",
  };
}

export class Mul {
  update(lhs: number, rhs: number): number {
    return lhs * rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "Mul",
    update: "lhs, rhs",
    output: "number",
  };
}

export class Div {
  update(lhs: number, rhs: number): number {
    if (rhs === 0) return lhs / Number.EPSILON;
    return lhs / rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "Div",
    desc: "Division",
    update: "lhs, rhs",
    output: "number",
  };
}

export class Mod {
  update(lhs: number, rhs: number): number {
    return lhs % rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "Mod",
    desc: "Modulo",
    update: "lhs, rhs",
    output: "number",
  };
}

export class Pow {
  update(base: number, exp: number): number {
    return base ** exp;
  }

  static readonly doc: OperatorDoc = {
    type: "Pow",
    update: "base, exp",
    output: "number",
  };
}

export class Min {
  update(lhs: number, rhs: number): number {
    return Math.min(lhs, rhs);
  }

  static readonly doc: OperatorDoc = {
    type: "Min",
    update: "lhs, rhs",
    output: "number",
  };
}

export class Max {
  update(lhs: number, rhs: number): number {
    return Math.max(lhs, rhs);
  }

  static readonly doc: OperatorDoc = {
    type: "Max",
    update: "lhs, rhs",
    output: "number",
  };
}

// ============================================================================
// Unary Math Operations
// ============================================================================

export class Negate {
  update(x: number): number {
    return -x;
  }

  static readonly doc: OperatorDoc = {
    type: "Negate",
    update: "x",
    output: "number",
  };
}

export class Abs {
  update(x: number): number {
    return Math.abs(x);
  }

  static readonly doc: OperatorDoc = {
    type: "Abs",
    update: "x",
    output: "number",
  };
}

export class Sign {
  update(x: number): number {
    return Math.sign(x);
  }

  static readonly doc: OperatorDoc = {
    type: "Sign",
    update: "x",
    output: "-1, 0, 1",
  };
}

export class Floor {
  update(x: number): number {
    return Math.floor(x);
  }

  static readonly doc: OperatorDoc = {
    type: "Floor",
    update: "x",
    output: "number",
  };
}

export class Ceil {
  update(x: number): number {
    return Math.ceil(x);
  }

  static readonly doc: OperatorDoc = {
    type: "Ceil",
    update: "x: number",
    output: "number",
  };
}

export class Round {
  update(x: number): number {
    return Math.round(x);
  }

  static readonly doc: OperatorDoc = {
    type: "Round",
    update: "x",
    output: "number",
  };
}

export class Sqrt {
  update(x: number): number {
    return Math.sqrt(x);
  }

  static readonly doc: OperatorDoc = {
    type: "Sqrt",
    update: "x",
    output: "number",
  };
}

export class Log {
  update(x: number): number {
    return Math.log(x);
  }

  static readonly doc: OperatorDoc = {
    type: "Log",
    desc: "Natural logarithm",
    update: "x",
    output: "number",
  };
}

export class Exp {
  update(x: number): number {
    return Math.exp(x);
  }

  static readonly doc: OperatorDoc = {
    type: "Exp",
    update: "x",
    output: "number",
  };
}

export class Log1p {
  update(x: number): number {
    return Math.log1p(x);
  }

  static readonly doc: OperatorDoc = {
    type: "Log1p",
    update: "x",
    output: "number",
  };
}

export class Expm1 {
  update(x: number): number {
    return Math.expm1(x);
  }

  static readonly doc: OperatorDoc = {
    type: "Expm1",
    update: "x",
    output: "number",
  };
}

export class Reciprocal {
  update(input: number): number {
    return 1 / input;
  }

  static readonly doc: OperatorDoc = {
    type: "Reciprocal",
    update: "x",
    output: "number",
  };
}

export class Clamp {
  update(x: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, x));
  }

  static readonly doc: OperatorDoc = {
    type: "Clamp",
    update: "x, min, max",
    output: "number",
  };
}

export class Lerp {
  update(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  static readonly doc: OperatorDoc = {
    type: "Lerp",
    update: "a, b, t",
    output: "number",
  };
}

export class InvLerp {
  update(a: number, b: number, v: number): number {
    return (v - a) / (b - a);
  }

  static readonly doc: OperatorDoc = {
    type: "InvLerp",
    update: "a, b, v",
    output: "number",
  };
}

// ============================================================================
// N-ary Arithmetic Operators
// ============================================================================

export class SumOf {
  update(...inputs: number[]): number {
    let sum = 0;
    for (const x of inputs) sum += x;
    return sum;
  }

  static readonly doc: OperatorDoc = {
    type: "SumOf",
    update: "...inputs: number[]",
    output: "number",
  };
}

export class ProdOf {
  update(...inputs: number[]): number {
    let prod = 1;
    for (const x of inputs) prod *= x;
    return prod;
  }

  static readonly doc: OperatorDoc = {
    type: "ProdOf",
    update: "...inputs: number[]",
    output: "number",
  };
}

export class AvgOf {
  update(...inputs: number[]): number {
    if (inputs.length === 0) return 0;
    let sum = 0;
    for (const x of inputs) sum += x;
    return sum / inputs.length;
  }

  static readonly doc: OperatorDoc = {
    type: "AvgOf",
    update: "...inputs: number[]",
    output: "number",
  };
}

export class MinOf {
  update(...inputs: number[]): number {
    return Math.min(...inputs);
  }

  static readonly doc: OperatorDoc = {
    type: "MinOf",
    update: "...inputs: number[]",
    output: "number",
  };
}

export class MaxOf {
  update(...inputs: number[]): number {
    return Math.max(...inputs);
  }

  static readonly doc: OperatorDoc = {
    type: "MaxOf",
    update: "...inputs: number[]",
    output: "number",
  };
}

// ============================================================================
// Statistical / Distance
// ============================================================================

export class RelDist {
  update(a: number, b: number): number {
    return Math.abs(a - b) / (Math.abs(b) + Number.EPSILON);
  }

  static readonly doc: OperatorDoc = {
    type: "RelDist",
    desc: "abs(a-b)/abs(b)",
    update: "a, b",
    output: "number",
  };
}
