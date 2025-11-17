import { type OperatorDoc } from "../types/OpDoc.js";

// ============================================================================
// Comparison Operators
// ============================================================================

export class LT {
  onData(lhs: number, rhs: number): boolean {
    return lhs < rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "LT",
    onDataParam: "lhs, rhs",
    output: "boolean",
  };
}

export class GT {
  onData(lhs: number, rhs: number): boolean {
    return lhs > rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "GT",
    onDataParam: "lhs, rhs",
    output: "boolean",
  };
}

export class LTE {
  onData(lhs: number, rhs: number): boolean {
    return lhs <= rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "LTE",
    onDataParam: "lhs, rhs",
    output: "boolean",
  };
}

export class GTE {
  onData(lhs: number, rhs: number): boolean {
    return lhs >= rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "GTE",
    onDataParam: "lhs, rhs",
    output: "boolean",
  };
}

export class EQ {
  onData(lhs: number, rhs: number): boolean {
    return lhs === rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "EQ",
    onDataParam: "lhs, rhs",
    output: "boolean",
  };
}

export class NEQ {
  onData(lhs: number, rhs: number): boolean {
    return lhs !== rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "NEQ",
    onDataParam: "lhs, rhs",
    output: "boolean",
  };
}

// ============================================================================
// Range Operators
// ============================================================================

export class Between {
  onData(x: number, lo: number, hi: number): boolean {
    return x >= lo && x <= hi;
  }

  static readonly doc: OperatorDoc = {
    type: "Between",
    desc: "lo <= x <= hi",
    onDataParam: "x, lo, hi",
    output: "boolean",
  };
}

export class Outside {
  onData(x: number, lo: number, hi: number): boolean {
    return x < lo || x > hi;
  }

  static readonly doc: OperatorDoc = {
    type: "Outside",
    desc: "x < lo || x > hi",
    onDataParam: "x, lo, hi",
    output: "boolean",
  };
}

// ============================================================================
// Boolean Logic
// ============================================================================

export class And {
  onData(lhs: boolean, rhs: boolean): boolean {
    return lhs && rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "And",
    onDataParam: "lhs, rhs",
    output: "boolean",
  };
}

export class Or {
  onData(lhs: boolean, rhs: boolean): boolean {
    return lhs || rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "Or",
    onDataParam: "lhs, rhs",
    output: "boolean",
  };
}

export class Not {
  onData(x: boolean): boolean {
    return !x;
  }

  static readonly doc: OperatorDoc = {
    type: "Not",
    onDataParam: "x",
    output: "boolean",
  };
}

export class Xor {
  onData(lhs: boolean, rhs: boolean): boolean {
    return lhs !== rhs;
  }

  static readonly doc: OperatorDoc = {
    type: "Xor",
    onDataParam: "lhs, rhs",
    output: "boolean",
  };
}

// ============================================================================
// N-ary Boolean Logic
// ============================================================================

export class AllOf {
  onData(...inputs: boolean[]): boolean {
    for (const x of inputs) if (!x) return false;
    return true;
  }

  static readonly doc: OperatorDoc = {
    type: "AllOf",
    onDataParam: "...inputs: boolean[]",
    output: "boolean",
  };
}

export class AnyOf {
  onData(...inputs: boolean[]): boolean {
    for (const x of inputs) if (x) return true;
    return false;
  }

  static readonly doc: OperatorDoc = {
    type: "AnyOf",
    onDataParam: "...inputs: boolean[]",
    output: "boolean",
  };
}

export class NoneOf {
  onData(...inputs: boolean[]): boolean {
    for (const x of inputs) if (x) return false;
    return true;
  }

  static readonly doc: OperatorDoc = {
    type: "NoneOf",
    onDataParam: "...inputs: boolean[]",
    output: "boolean",
  };
}

// ============================================================================
// Numeric Predicates
// ============================================================================

export class IsNaN {
  onData(x: number): boolean {
    return Number.isNaN(x);
  }

  static readonly doc: OperatorDoc = {
    type: "IsNaN",
    onDataParam: "x",
    output: "boolean",
  };
}

export class IsFinite {
  onData(x: number): boolean {
    return Number.isFinite(x);
  }

  static readonly doc: OperatorDoc = {
    type: "IsFinite",
    onDataParam: "x",
    output: "boolean",
  };
}

export class IsPositive {
  onData(x: number): boolean {
    return x > 0;
  }

  static readonly doc: OperatorDoc = {
    type: "IsPositive",
    onDataParam: "x",
    output: "boolean",
  };
}

export class IsNegative {
  onData(x: number): boolean {
    return x < 0;
  }

  static readonly doc: OperatorDoc = {
    type: "IsNegative",
    onDataParam: "x",
    output: "boolean",
  };
}

export class IsZero {
  onData(x: number): boolean {
    return x === 0;
  }

  static readonly doc: OperatorDoc = {
    type: "IsZero",
    onDataParam: "x",
    output: "boolean",
  };
}

// ============================================================================
// Consumer
// ============================================================================

export class IfThenElse {
  onData<T>(cond: boolean, thenVal: T, elseVal: T): T {
    return cond ? thenVal : elseVal;
  }

  static readonly doc: OperatorDoc = {
    type: "IfThenElse",
    onDataParam: "cond, thenVal, elseVal",
    output: "thenVal | elseVal",
  };
}

export class Gate {
  onData<T>(cond: boolean, val: T): T | undefined {
    return cond ? val : undefined;
  }

  static readonly doc: OperatorDoc = {
    type: "Gate",
    onDataParam: "cond, val",
    output: "val | undefined",
  };
}

export class Coalesce {
  onData<T>(...inputs: (T | null)[]): T | undefined {
    for (const x of inputs) if (x != null) return x;
    return undefined;
  }

  static readonly doc: OperatorDoc = {
    type: "Coalesce",
    onDataParam: "...inputs",
    output: "first non-null",
  };
}
