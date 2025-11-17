import { OpRegistry } from "./Registry.js";

import { Const } from "../primitive/Const.js";
import * as arith from "../primitive/arithmetic.js";
import * as logical from "../primitive/logical.js";

import * as fnFoundation from "../fn/Foundation.js";
import * as fnStats from "../fn/Stats.js";
import * as fnStatsDeviate from "../fn/StatsDeviation.js";

import * as indOscillators from "../indicators/Oscillators.js";
import * as indVolatility from "../indicators/Volatility.js";
import * as indMomentum from "../indicators/Momentum.js";
import * as indTrend from "../indicators/Trend.js";
import * as indStochastic from "../indicators/Stochastic.js";
import * as indAggregate from "../indicators/Aggregate.js";
import * as indVolume from "../indicators/Volume.js";

/**
 * Register all arithmetic primitives.
 */
export function regArithmeticPrimitive(reg: OpRegistry): void {
  reg
    .register(Const)
    .register(arith.Add)
    .register(arith.Sub)
    .register(arith.Mul)
    .register(arith.Div)
    .register(arith.Mod)
    .register(arith.Pow)
    .register(arith.Min)
    .register(arith.Max)
    .register(arith.Negate)
    .register(arith.Abs)
    .register(arith.Sign)
    .register(arith.Floor)
    .register(arith.Ceil)
    .register(arith.Round)
    .register(arith.Sqrt)
    .register(arith.Log)
    .register(arith.Exp)
    .register(arith.Log1p)
    .register(arith.Expm1)
    .register(arith.Reciprocal)
    .register(arith.Clamp)
    .register(arith.Lerp)
    .register(arith.SumOf)
    .register(arith.ProdOf)
    .register(arith.AvgOf)
    .register(arith.MinOf)
    .register(arith.MaxOf)
    .register(arith.RelDist);
}

/**
 * Register all logical primitives.
 */
export function regLogicalPrimitive(reg: OpRegistry): void {
  reg
    .register(logical.LT)
    .register(logical.GT)
    .register(logical.LTE)
    .register(logical.GTE)
    .register(logical.EQ)
    .register(logical.NEQ)
    .register(logical.Between)
    .register(logical.Outside)
    .register(logical.And)
    .register(logical.Or)
    .register(logical.Not)
    .register(logical.Xor)
    .register(logical.AllOf)
    .register(logical.AnyOf)
    .register(logical.NoneOf)
    .register(logical.IsNaN)
    .register(logical.IsFinite)
    .register(logical.IsPositive)
    .register(logical.IsNegative)
    .register(logical.IsZero)
    .register(logical.IfThenElse)
    .register(logical.Gate)
    .register(logical.Coalesce);
}

/**
 * Register foundation operators from src/fn/Foundation.ts.
 */
export function regFoundation(reg: OpRegistry): void {
  reg
    .register(fnFoundation.EMA)
    .register(fnFoundation.EWMA)
    .register(fnFoundation.SMA)
    .register(fnFoundation.Min)
    .register(fnFoundation.Max)
    .register(fnFoundation.Sum)
    .register(fnFoundation.MinMax);
  reg
    .register(fnStats.Variance)
    .register(fnStats.Stddev)
    .register(fnStats.ZScore)
    .register(fnStats.VarianceEW)
    .register(fnStats.ZScoreEW)
    .register(fnStats.Cov)
    .register(fnStats.Corr)
    .register(fnStats.Beta);
  reg.register(fnStatsDeviate.MeanAD);
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
    if (osc) reg.register(osc);
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
    if (vol) reg.register(vol);
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
    if (mom) reg.register(mom);
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
    if (tr) reg.register(tr);
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
    if (sto) reg.register(sto);
  });
}

/**
 * Register aggregate indicators.
 */
export function regAggregateIndicators(reg: OpRegistry): void {
  const aggregate = [indAggregate.OHLCV];

  aggregate.forEach((agg) => {
    if (agg) reg.register(agg);
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
    if (vol) reg.register(vol);
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
 * Register everything: primitives, functional basics, and all indicators.
 */
export function regAll(reg: OpRegistry): void {
  regArithmeticPrimitive(reg);
  regLogicalPrimitive(reg);
  regFoundation(reg);
  regAllIndicators(reg);
}
