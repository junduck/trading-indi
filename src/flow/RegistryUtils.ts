import { OpRegistry } from "./Registry.js";

import { Const } from "../primitive/Const.js";
import * as arith from "../primitive/arithmetic.js";
import * as logical from "../primitive/logical.js";
import * as core_online from "../primitive/core-ops/online.js";
import * as core_rolling from "../primitive/core-ops/rolling.js";

import * as indOscillators from "../indicators/Oscillators.js";
import * as indVolatility from "../indicators/Volatility.js";
import * as indMomentum from "../indicators/Momentum.js";
import * as indTrend from "../indicators/Trend.js";
import * as indStochastic from "../indicators/Stochastic.js";
import * as indAggregate from "../indicators/Aggregate.js";
import * as indVolume from "../indicators/Volume.js";

/**
 * Register Const primitive.
 */
export function regConst(reg: OpRegistry): void {
  reg.register(Const, "const");
}

/**
 * Register all arithmetic primitives.
 */
export function regArithmeticPrimitive(reg: OpRegistry): void {
  reg
    .register(arith.Add, "arithmetic")
    .register(arith.Sub, "arithmetic")
    .register(arith.Mul, "arithmetic")
    .register(arith.Div, "arithmetic")
    .register(arith.Mod, "arithmetic")
    .register(arith.Pow, "arithmetic")
    .register(arith.Min, "arithmetic")
    .register(arith.Max, "arithmetic")
    .register(arith.Negate, "arithmetic")
    .register(arith.Abs, "arithmetic")
    .register(arith.Sign, "arithmetic")
    .register(arith.Floor, "arithmetic")
    .register(arith.Ceil, "arithmetic")
    .register(arith.Round, "arithmetic")
    .register(arith.Sqrt, "arithmetic")
    .register(arith.Log, "arithmetic")
    .register(arith.Exp, "arithmetic")
    .register(arith.Log1p, "arithmetic")
    .register(arith.Expm1, "arithmetic")
    .register(arith.Reciprocal, "arithmetic")
    .register(arith.Clamp, "arithmetic")
    .register(arith.Lerp, "arithmetic")
    .register(arith.SumOf, "arithmetic")
    .register(arith.ProdOf, "arithmetic")
    .register(arith.AvgOf, "arithmetic")
    .register(arith.MinOf, "arithmetic")
    .register(arith.MaxOf, "arithmetic")
    .register(arith.RelDist, "arithmetic");
}

/**
 * Register all logical primitives.
 */
export function regLogicalPrimitive(reg: OpRegistry): void {
  reg
    .register(logical.LT, "logical")
    .register(logical.GT, "logical")
    .register(logical.LTE, "logical")
    .register(logical.GTE, "logical")
    .register(logical.EQ, "logical")
    .register(logical.NEQ, "logical")
    .register(logical.Between, "logical")
    .register(logical.Outside, "logical")
    .register(logical.And, "logical")
    .register(logical.Or, "logical")
    .register(logical.Not, "logical")
    .register(logical.Xor, "logical")
    .register(logical.AllOf, "logical")
    .register(logical.AnyOf, "logical")
    .register(logical.NoneOf, "logical")
    .register(logical.IsNaN, "logical")
    .register(logical.IsFinite, "logical")
    .register(logical.IsPositive, "logical")
    .register(logical.IsNegative, "logical")
    .register(logical.IsZero, "logical")
    .register(logical.IfThenElse, "logical")
    .register(logical.Gate, "logical")
    .register(logical.Coalesce, "logical");
}

/**
 * Register core online operators.
 */
export function regCoreOnline(reg: OpRegistry): void {
  reg
    .register(core_online.CMA, "core.online")
    .register(core_online.CuVar, "core.online")
    .register(core_online.CuStddev, "core.online")
    .register(core_online.CuSkew, "core.online")
    .register(core_online.CuKurt, "core.online")
    .register(core_online.CuCov, "core.online")
    .register(core_online.CuCorr, "core.online")
    .register(core_online.CuBeta, "core.online");
}

/**
 * Register core rolling operators.
 */
export function regCoreRolling(reg: OpRegistry): void {
  reg
    .register(core_rolling.RollingSum, "core.rolling")
    .register(core_rolling.SMA, "core.rolling")
    .register(core_rolling.EMA, "core.rolling")
    .register(core_rolling.EWMA, "core.rolling")
    .register(core_rolling.RollingVar, "core.rolling")
    .register(core_rolling.RollingVarEW, "core.rolling")
    .register(core_rolling.RollingStddev, "core.rolling")
    .register(core_rolling.RollingStddevEW, "core.rolling")
    .register(core_rolling.RollingZScore, "core.rolling")
    .register(core_rolling.RollingZScoreEW, "core.rolling")
    .register(core_rolling.RollingCov, "core.rolling")
    .register(core_rolling.RollingCovEW, "core.rolling")
    .register(core_rolling.RollingCorr, "core.rolling")
    .register(core_rolling.RollingCorrEW, "core.rolling")
    .register(core_rolling.RollingBeta, "core.rolling")
    .register(core_rolling.RollingBetaEW, "core.rolling")
    .register(core_rolling.RollingMin, "core.rolling")
    .register(core_rolling.RollingMax, "core.rolling")
    .register(core_rolling.RollingMinMax, "core.rolling")
    .register(core_rolling.RollingArgMin, "core.rolling")
    .register(core_rolling.RollingArgMax, "core.rolling")
    .register(core_rolling.RollingArgMinMax, "core.rolling")
    .register(core_rolling.RollingSkew, "core.rolling")
    .register(core_rolling.RollingKurt, "core.rolling")
    .register(core_rolling.MeanAbsDeviation, "core.rolling")
    .register(core_rolling.MedianAbsDeviation, "core.rolling")
    .register(core_rolling.IQR, "core.rolling")
    .register(core_rolling.RollingMedian, "core.rolling")
    .register(core_rolling.RollingQuantile, "core.rolling");
}

/**
 * Register oscillator indicators.
 */
export function regOscillatorIndicators(reg: OpRegistry): void {
  const oscillators = [
    indOscillators.AO,
    indOscillators.APO,
    indOscillators.DPO,
    indOscillators.Fisher,
    indOscillators.MACD,
    indOscillators.PPO,
    indOscillators.QSTICK,
    indOscillators.TRIX,
    indOscillators.ULTOSC,
  ];

  oscillators.forEach((osc) => {
    if (osc) reg.register(osc, "ti.oscillator");
  });
}

/**
 * Register volatility indicators.
 */
export function regVolatilityIndicators(reg: OpRegistry): void {
  const volatility = [
    indVolatility.Volatility,
    indVolatility.CVI,
    indVolatility.MASS,
    indVolatility.TR,
    indVolatility.ATR,
    indVolatility.NATR,
    indVolatility.PriceChannel,
    indVolatility.BBANDS,
    indVolatility.KC,
    indVolatility.DC,
  ];

  volatility.forEach((vol) => {
    if (vol) reg.register(vol, "ti.volatility");
  });
}

/**
 * Register momentum indicators.
 */
export function regMomentumIndicators(reg: OpRegistry): void {
  const momentum = [
    indMomentum.BOP,
    indMomentum.MOM,
    indMomentum.ROC,
    indMomentum.ROCR,
    indMomentum.RSI,
    indMomentum.CMO,
    indMomentum.WAD,
    indMomentum.RVI,
    indMomentum.TSI,
    indMomentum.BBPOWER,
  ];

  momentum.forEach((mom) => {
    if (mom) reg.register(mom, "ti.momentum");
  });
}

/**
 * Register trend indicators.
 */
export function regTrendIndicators(reg: OpRegistry): void {
  const trend = [
    indTrend.AROON,
    indTrend.AROONOSC,
    indTrend.CCI,
    indTrend.VHF,
    indTrend.DM,
    indTrend.DI,
    indTrend.DX,
    indTrend.ADX,
    indTrend.ADXR,
    indTrend.SAR,
    indTrend.VI,
    indTrend.ICHIMOKU,
  ];

  trend.forEach((tr) => {
    if (tr) reg.register(tr, "ti.trend");
  });
}

/**
 * Register stochastic indicators.
 */
export function regStochasticIndicators(reg: OpRegistry): void {
  const stochastic = [
    indStochastic.STOCH,
    indStochastic.STOCHRSI,
    indStochastic.WILLR,
  ];

  stochastic.forEach((sto) => {
    if (sto) reg.register(sto, "ti.stochastic");
  });
}

/**
 * Register aggregate indicators.
 */
export function regAggregateIndicators(reg: OpRegistry): void {
  const aggregate = [indAggregate.OHLCV];

  aggregate.forEach((agg) => {
    if (agg) reg.register(agg, "ti.aggr");
  });
}

/**
 * Register volume indicators.
 */
export function regVolumeIndicators(reg: OpRegistry): void {
  const volume = [
    indVolume.AD,
    indVolume.ADOSC,
    indVolume.KVO,
    indVolume.NVI,
    indVolume.OBV,
    indVolume.PVI,
    indVolume.MFI,
    indVolume.EMV,
    indVolume.MarketFI,
    indVolume.VOSC,
    indVolume.CMF,
    indVolume.CHO,
    indVolume.PVO,
    indVolume.FI,
    indVolume.VROC,
    indVolume.PVT,
  ];

  volume.forEach((vol) => {
    if (vol) reg.register(vol, "ti.volume");
  });
}

/**
 * Register all indicator groups.
 */
export function regAllIndicators(reg: OpRegistry): void {
  regOscillatorIndicators(reg);
  regVolatilityIndicators(reg);
  regMomentumIndicators(reg);
  regTrendIndicators(reg);
  regStochasticIndicators(reg);
  regAggregateIndicators(reg);
  regVolumeIndicators(reg);
}

/**
 * Register everything: primitives, core operators, and all indicators.
 */
export function regAll(reg: OpRegistry): void {
  regConst(reg);
  regArithmeticPrimitive(reg);
  regLogicalPrimitive(reg);
  regCoreOnline(reg);
  regCoreRolling(reg);
  regAllIndicators(reg);
}

/**
 * Register primitives
 */
export function regPrimitive(reg: OpRegistry): void {
  regConst(reg);
  regArithmeticPrimitive(reg);
  regLogicalPrimitive(reg);
}

/**
 * Register primitive and core operators
 */
export function regCoreOps(reg: OpRegistry): void {
  regConst(reg);
  regArithmeticPrimitive(reg);
  regLogicalPrimitive(reg);
  regCoreOnline(reg);
  regCoreRolling(reg);
}
