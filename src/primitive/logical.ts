import { type OperatorDoc } from "../types/OpDoc.js";

// ============================================================================
// Comparison Operators
// ============================================================================

export class LT {
  update(lhs: number, rhs: number): boolean {
    return lhs < rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "LT",
    update: "lhs, rhs",
    output: "boolean",
  };
}

export class GT {
  update(lhs: number, rhs: number): boolean {
    return lhs > rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "GT",
    update: "lhs, rhs",
    output: "boolean",
  };
}

export class LTE {
  update(lhs: number, rhs: number): boolean {
    return lhs <= rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "LTE",
    update: "lhs, rhs",
    output: "boolean",
  };
}

export class GTE {
  update(lhs: number, rhs: number): boolean {
    return lhs >= rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "GTE",
    update: "lhs, rhs",
    output: "boolean",
  };
}

export class EQ {
  update(lhs: number, rhs: number): boolean {
    return lhs === rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "EQ",
    update: "lhs, rhs",
    output: "boolean",
  };
}

export class NEQ {
  update(lhs: number, rhs: number): boolean {
    return lhs !== rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "NEQ",
    update: "lhs, rhs",
    output: "boolean",
  };
}

// ============================================================================
// Range Operators
// ============================================================================

export class Between {
  update(x: number, lo: number, hi: number): boolean {
    return x >= lo && x <= hi;
  }

  static readonly doc: OperatorDoc = {
    type: "Between",
    desc: "lo <= x <= hi",
    update: "x, lo, hi",
    output: "boolean",
  };
}

export class Outside {
  update(x: number, lo: number, hi: number): boolean {
    return x < lo || x > hi;
  }

  static readonly doc: OperatorDoc = {
    type: "Outside",
    desc: "x < lo || x > hi",
    update: "x, lo, hi",
    output: "boolean",
  };
}

// ============================================================================
// Boolean Logic
// ============================================================================

export class And {
  update(lhs: boolean, rhs: boolean): boolean {
    return lhs && rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "And",
    update: "lhs, rhs",
    output: "boolean",
  };
}

export class Or {
  update(lhs: boolean, rhs: boolean): boolean {
    return lhs || rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "Or",
    update: "lhs, rhs",
    output: "boolean",
  };
}

export class Not {
  update(x: boolean): boolean {
    return !x;
  }

  static readonly doc: OperatorDoc = {
    type: "Not",
    update: "x",
    output: "boolean",
  };
}

export class Xor {
  update(lhs: boolean, rhs: boolean): boolean {
    return lhs !== rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "Xor",
    update: "lhs, rhs",
    output: "boolean",
  };
}

// ============================================================================
// N-ary Boolean Logic
// ============================================================================

export class AllOf {
  update(...inputs: boolean[]): boolean {
    for (const x of inputs) if (!x) return false;
    return true;
  }

  static readonly doc: OperatorDoc = {
    type: "AllOf",
    update: "...inputs: boolean[]",
    output: "boolean",
  };
}

export class AnyOf {
  update(...inputs: boolean[]): boolean {
    for (const x of inputs) if (x) return true;
    return false;
  }

  static readonly doc: OperatorDoc = {
    type: "AnyOf",
    update: "...inputs: boolean[]",
    output: "boolean",
  };
}

export class NoneOf {
  update(...inputs: boolean[]): boolean {
    for (const x of inputs) if (x) return false;
    return true;
  }

  static readonly doc: OperatorDoc = {
    type: "NoneOf",
    update: "...inputs: boolean[]",
    output: "boolean",
  };
}

// ============================================================================
// Numeric Predicates
// ============================================================================

export class IsNaN {
  update(x: number): boolean {
    return Number.isNaN(x);
  }

  static readonly doc: OperatorDoc = {
    type: "IsNaN",
    update: "x",
    output: "boolean",
  };
}

export class IsFinite {
  update(x: number): boolean {
    return Number.isFinite(x);
  }

  static readonly doc: OperatorDoc = {
    type: "IsFinite",
    update: "x",
    output: "boolean",
  };
}

export class IsPositive {
  update(x: number): boolean {
    return x > 0;
  }

  static readonly doc: OperatorDoc = {
    type: "IsPositive",
    update: "x",
    output: "boolean",
  };
}

export class IsNegative {
  update(x: number): boolean {
    return x < 0;
  }

  static readonly doc: OperatorDoc = {
    type: "IsNegative",
    update: "x",
    output: "boolean",
  };
}

export class IsZero {
  update(x: number): boolean {
    return x === 0;
  }

  static readonly doc: OperatorDoc = {
    type: "IsZero",
    update: "x",
    output: "boolean",
  };
}

// ============================================================================
// Consumer
// ============================================================================

export class IfThenElse {
  update<T>(cond: boolean, thenVal: T, elseVal: T): T {
    return cond ? thenVal : elseVal;
  }

  static readonly doc: OperatorDoc = {
    type: "IfThenElse",
    update: "cond, thenVal, elseVal",
    output: "thenVal | elseVal",
  };
}

export class Gate {
  update<T>(cond: boolean, val: T): T | undefined {
    return cond ? val : undefined;
  }

  static readonly doc: OperatorDoc = {
    type: "Gate",
    update: "cond, val",
    output: "val | undefined",
  };
}

export class Coalesce {
  update<T>(...inputs: (T | null)[]): T | undefined {
    for (const x of inputs) if (x != null) return x;
    return undefined;
  }

  static readonly doc: OperatorDoc = {
    type: "Coalesce",
    update: "...inputs",
    output: "first non-null",
  };
}
