import {
  SMA as CoreSMA,
  EMA as CoreEMA,
  EWMA as CoreEWMA,
  RollingSum as CoreRollingSum,
  RollingVar as CoreRollingVar,
  RollingVarEW as CoreRollingVarEW,
  RollingStddev as CoreRollingStddev,
  RollingStddevEW as CoreRollingStddevEW,
  RollingZScore as CoreRollingZScore,
  RollingZScoreEW as CoreRollingZScoreEW,
  RollingCov as CoreRollingCov,
  RollingCovEW as CoreRollingCovEW,
  RollingCorr as CoreRollingCorr,
  RollingCorrEW as CoreRollingCorrEW,
  RollingBeta as CoreRollingBeta,
  RollingBetaEW as CoreRollingBetaEW,
  RollingMin as CoreRollingMin,
  RollingMax as CoreRollingMax,
  RollingMinMax as CoreRollingMinMax,
  RollingArgMin as CoreRollingArgMin,
  RollingArgMax as CoreRollingArgMax,
  RollingArgMinMax as CoreRollingArgMinMax,
  RollingMedian as CoreRollingMedian,
  RollingQuantile as CoreRollingQuantile,
  RollingSkew as CoreRollingSkew,
  RollingKurt as CoreRollingKurt,
  MeanAbsDeviation as CoreMeanAbsDeviation,
  MedianAbsDeviation as CoreMedianAbsDeviation,
  IQR as CoreIQR,
} from "@junduck/trading-core";

import type { OperatorDoc } from "../../types/OpDoc.js";

// Rolling Averages

export class RollingSum extends CoreRollingSum {
  static readonly doc: OperatorDoc = {
    type: "RollingSum",
    init: "{period: number}",
    input: "x",
    output: "number",
  };
}

/**
 * Simple Moving Average - stateful operator.
 * Calculates arithmetic mean of close prices over period.
 */
export class SMA extends CoreSMA {
  onData(bar: { close: number }): number {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "SMA",
    init: "{period: number}",
    input: "x",
    output: "number",
  };
}

/**
 * Exponential Moving Average - stateful operator.
 * Applies exponential smoothing with alpha = 2/(period+1).
 */
export class EMA extends CoreEMA {
  onData(bar: { close: number }): number {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "EMA",
    init: "{period?: number, alpha?: number}",
    input: "x",
    output: "number",
  };
}

/**
 * Exponentially Weighted Moving Average - stateful operator.
 * Maintains sliding window with exponentially decaying weights.
 */
export class EWMA extends CoreEWMA {
  onData(bar: { close: number }): number {
    return this.update(bar.close);
  }

  static readonly doc: OperatorDoc = {
    type: "EWMA",
    desc: "Sliding window average with exponential weighting",
    init: "{period: number}",
    input: "x",
    output: "number",
  };
}

// Rolling Variance & Standard Deviation

export class RollingVar extends CoreRollingVar {
  static readonly doc: OperatorDoc = {
    type: "RollingVar",
    init: "{period: number, ddof?: number}",
    input: "x",
    output: "{mean, variance}",
  };
}

export class RollingVarEW extends CoreRollingVarEW {
  static readonly doc: OperatorDoc = {
    type: "RollingVarEW",
    init: "{period?: number, alpha?: number}",
    input: "x",
    output: "{mean, variance}",
  };
}

export class RollingStddev extends CoreRollingStddev {
  static readonly doc: OperatorDoc = {
    type: "RollingStddev",
    init: "{period: number, ddof?: number}",
    input: "x",
    output: "{mean, stddev}",
  };
}

export class RollingStddevEW extends CoreRollingStddevEW {
  static readonly doc: OperatorDoc = {
    type: "RollingStddevEW",
    init: "{period?: number, alpha?: number}",
    input: "x",
    output: "{mean, stddev}",
  };
}

export class RollingZScore extends CoreRollingZScore {
  static readonly doc: OperatorDoc = {
    type: "RollingZScore",
    init: "{period: number}",
    input: "x",
    output: "{mean, stddev, zscore}",
  };
}

export class RollingZScoreEW extends CoreRollingZScoreEW {
  static readonly doc: OperatorDoc = {
    type: "RollingZScoreEW",
    init: "{period?: number, alpha?: number}",
    input: "x",
    output: "{mean, stddev, zscore}",
  };
}

// Rolling Covariance, Correlation, Beta

export class RollingCov extends CoreRollingCov {
  static readonly doc: OperatorDoc = {
    type: "RollingCov",
    init: "{period: number, ddof?: number}",
    input: "x, y",
    output: "{meanX, meanY, cov}",
  };
}

export class RollingCovEW extends CoreRollingCovEW {
  static readonly doc: OperatorDoc = {
    type: "RollingCovEW",
    init: "{period?: number, alpha?: number}",
    input: "x, y",
    output: "{meanX, meanY, cov}",
  };
}

export class RollingCorr extends CoreRollingCorr {
  static readonly doc: OperatorDoc = {
    type: "RollingCorr",
    init: "{period: number, ddof?: number}",
    input: "x, y",
    output: "{meanX, meanY, cov, corr}",
  };
}

export class RollingCorrEW extends CoreRollingCorrEW {
  static readonly doc: OperatorDoc = {
    type: "RollingCorrEW",
    init: "{period?: number, alpha?: number}",
    input: "x, y",
    output: "{meanX, meanY, cov, corr}",
  };
}

export class RollingBeta extends CoreRollingBeta {
  static readonly doc: OperatorDoc = {
    type: "RollingBeta",
    init: "{period: number, ddof?: number}",
    input: "x, y",
    output: "{meanX, meanY, cov, beta}",
  };
}

export class RollingBetaEW extends CoreRollingBetaEW {
  static readonly doc: OperatorDoc = {
    type: "RollingBetaEW",
    init: "{period?: number, alpha?: number}",
    input: "x, y",
    output: "{meanX, meanY, cov, beta}",
  };
}

// Rolling Min/Max

export class RollingMin extends CoreRollingMin {
  static readonly doc: OperatorDoc = {
    type: "RollingMin",
    init: "{period: number}",
    input: "x",
    output: "number",
  };
}

export class RollingMax extends CoreRollingMax {
  static readonly doc: OperatorDoc = {
    type: "RollingMax",
    init: "{period: number}",
    input: "x",
    output: "number",
  };
}

export class RollingMinMax extends CoreRollingMinMax {
  static readonly doc: OperatorDoc = {
    type: "RollingMinMax",
    init: "{period: number}",
    input: "x",
    output: "{min, max}",
  };
}

export class RollingArgMin extends CoreRollingArgMin {
  static readonly doc: OperatorDoc = {
    type: "RollingArgMin",
    init: "{period: number}",
    input: "x",
    output: "{val, pos}",
  };
}

export class RollingArgMax extends CoreRollingArgMax {
  static readonly doc: OperatorDoc = {
    type: "RollingArgMax",
    init: "{period: number}",
    input: "x",
    output: "{val, pos}",
  };
}

export class RollingArgMinMax extends CoreRollingArgMinMax {
  static readonly doc: OperatorDoc = {
    type: "RollingArgMinMax",
    init: "{period: number}",
    input: "x",
    output: "{min: {val, pos}, max: {val, pos}}",
  };
}

// Rolling Higher Moments

export class RollingSkew extends CoreRollingSkew {
  static readonly doc: OperatorDoc = {
    type: "RollingSkew",
    init: "{period: number}",
    input: "x",
    output: "{mean, variance, skew}",
  };
}

export class RollingKurt extends CoreRollingKurt {
  static readonly doc: OperatorDoc = {
    type: "RollingKurt",
    init: "{period: number}",
    input: "x",
    output: "{mean, variance, kurt}",
  };
}

// Rolling Deviation Measures

export class MeanAbsDeviation extends CoreMeanAbsDeviation {
  static readonly doc: OperatorDoc = {
    type: "MeanAbsDeviation",
    init: "{period: number}",
    input: "x",
    output: "{mean, mad}",
  };
}

export class MedianAbsDeviation extends CoreMedianAbsDeviation {
  static readonly doc: OperatorDoc = {
    type: "MedianAbsDeviation",
    init: "{period: number}",
    input: "x",
    output: "{median, mad} | undefined",
  };
}

export class IQR extends CoreIQR {
  static readonly doc: OperatorDoc = {
    type: "IQR",
    desc: "Interquartile Range",
    init: "{period: number}",
    input: "x",
    output: "{q1, q3, iqr} | null",
  };
}

// Rolling Rank Statistics

export class RollingMedian extends CoreRollingMedian {
  static readonly doc: OperatorDoc = {
    type: "RollingMedian",
    init: "{period: number}",
    input: "x",
    output: "number | undefined",
  };
}

export class RollingQuantile extends CoreRollingQuantile {
  static readonly doc: OperatorDoc = {
    type: "RollingQuantile",
    init: "{period: number, quantiles: number[]}",
    input: "x",
    output: "number[] | undefined",
  };
}
