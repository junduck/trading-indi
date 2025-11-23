import {
  CMA as CoreCMA,
  CuSkew as CoreCuSkew,
  CuKurt as CoreCuKurt,
  CuVar as CoreCuVar,
  CuStddev as CoreCuStddev,
  CuCov as CoreCuCov,
  CuCorr as CoreCuCorr,
  CuBeta as CoreCuBeta,
} from "@junduck/trading-core";

import type { OperatorDoc } from "../../types/OpDoc.js";

export class CMA extends CoreCMA {
  static readonly doc: OperatorDoc = {
    type: "CMA",
    input: "x",
    output: "number",
  };
}

export class CuVar extends CoreCuVar {
  static readonly doc: OperatorDoc = {
    type: "CuVar",
    init: "{ddof?: number}",
    input: "x",
    output: "{mean, variance}",
  };
}

export class CuStddev extends CoreCuStddev {
  static readonly doc: OperatorDoc = {
    type: "CuStddev",
    init: "{ddof?: number}",
    input: "x",
    output: "{mean, stddev}",
  };
}

export class CuSkew extends CoreCuSkew {
  static readonly doc: OperatorDoc = {
    type: "CuSkew",
    input: "x",
    output: "{mean, variance, skew}",
  };
}

export class CuKurt extends CoreCuKurt {
  static readonly doc: OperatorDoc = {
    type: "CuKurt",
    input: "x",
    output: "{mean, variance, kurt}",
  };
}

export class CuCov extends CoreCuCov {
  static readonly doc: OperatorDoc = {
    type: "CuCov",
    init: "{ddof?: number}",
    input: "x, y",
    output: "{meanX, meanY, cov}",
  };
}

export class CuCorr extends CoreCuCorr {
  static readonly doc: OperatorDoc = {
    type: "CuCorr",
    init: "{ddof?: number}",
    input: "x, y",
    output: "{meanX, meanY, cov, corr}",
  };
}

export class CuBeta extends CoreCuBeta {
  static readonly doc: OperatorDoc = {
    type: "CuBeta",
    init: "{ddof?: number}",
    input: "x, y",
    output: "{meanX, meanY, cov, beta}",
  };
}
