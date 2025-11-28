// ============================================================================
// Types
// ============================================================================

export type { PeriodOptions, PeriodWith } from "./types/PeriodOptions.js";
export type { BarData, BarWith } from "./types/BarData.js";
export type { OperatorDoc } from "./types/OpDoc.js";

// ============================================================================
// Primitives - Constants
// ============================================================================

export { Const } from "./primitive/Const.js";

// ============================================================================
// Primitives - Arithmetic Operators
// ============================================================================

export {
  Add,
  Sub,
  Mul,
  Div,
  Mod,
  Pow,
  Min,
  Max,
  Negate,
  Abs,
  Sign,
  Floor,
  Ceil,
  Round,
  Sqrt,
  Log,
  Exp,
  Log1p,
  Expm1,
  Reciprocal,
  Clamp,
  Lerp,
  InvLerp,
  SumOf,
  ProdOf,
  AvgOf,
  MinOf,
  MaxOf,
  RelDist,
} from "./primitive/arithmetic.js";

// ============================================================================
// Primitives - Logical Operators
// ============================================================================

export {
  LT,
  GT,
  LTE,
  GTE,
  EQ,
  NEQ,
  Between,
  Outside,
  And,
  Or,
  Not,
  Xor,
  AllOf,
  AnyOf,
  NoneOf,
  IsNaN,
  IsFinite,
  IsPositive,
  IsNegative,
  IsZero,
  IfThenElse,
  Gate,
  Coalesce,
} from "./primitive/logical.js";

// ============================================================================
// Primitives - Rolling Window Operators
// ============================================================================

export {
  SMA,
  EMA,
  EWMA,
  RollingSum,
  RollingVar,
  RollingVarEW,
  RollingStddev,
  RollingStddevEW,
  RollingZScore,
  RollingZScoreEW,
  RollingCov,
  RollingCovEW,
  RollingCorr,
  RollingCorrEW,
  RollingBeta,
  RollingBetaEW,
  RollingMin,
  RollingMax,
  RollingMinMax,
  RollingArgMin,
  RollingArgMax,
  RollingArgMinMax,
  RollingMedian,
  RollingQuantile,
  RollingSkew,
  RollingKurt,
  MeanAbsDeviation,
  MedianAbsDeviation,
  IQR,
} from "./primitive/core-ops/rolling.js";

// ============================================================================
// Primitives - Online (Cumulative) Operators
// ============================================================================

export {
  CMA,
  CuVar,
  CuStddev,
  CuSkew,
  CuKurt,
  CuCov,
  CuCorr,
  CuBeta,
} from "./primitive/core-ops/online.js";

// ============================================================================
// Indicators - Moving Averages
// ============================================================================

export { useSMA, useEMA, useEWMA } from "./indicators/MovingAvg.js";

// ============================================================================
// Indicators - Volatility
// ============================================================================

export {
  Volatility,
  useVolatility,
  CVI,
  useCVI,
  MASS,
  useMASS,
  TR,
  useTR,
  ATR,
  useATR,
  NATR,
  useNATR,
  PriceChannel,
  usePriceChannel,
  BBANDS,
  useBBANDS,
  KC,
  useKC,
  DC,
  useDC,
} from "./indicators/Volatility.js";

// ============================================================================
// Indicators - Oscillators
// ============================================================================

export {
  AO,
  useAO,
  APO,
  useAPO,
  DPO,
  useDPO,
  Fisher,
  useFisher,
  MACD,
  useMACD,
  PPO,
  usePPO,
  QSTICK,
  useQSTICK,
  TRIX,
  useTRIX,
  ULTOSC,
  useULTOSC,
} from "./indicators/Oscillators.js";

// ============================================================================
// Indicators - Stochastic
// ============================================================================

export {
  STOCH,
  useSTOCH,
  STOCHRSI,
  useSTOCHRSI,
  WILLR,
  useWILLR,
} from "./indicators/Stochastic.js";

// ============================================================================
// Indicators - Trend
// ============================================================================

export {
  AROON,
  useAROON,
  AROONOSC,
  useAROONOSC,
  CCI,
  useCCI,
  VHF,
  useVHF,
  DM,
  useDM,
  DI,
  useDI,
  DX,
  useDX,
  ADX,
  useADX,
  ADXR,
  useADXR,
  SAR,
  useSAR,
  VI,
  useVI,
  ICHIMOKU,
  useICHIMOKU,
} from "./indicators/Trend.js";

// ============================================================================
// Indicators - Volume
// ============================================================================

export {
  AD,
  useAD,
  ADOSC,
  useADOSC,
  KVO,
  useKVO,
  NVI,
  useNVI,
  OBV,
  useOBV,
  PVI,
  usePVI,
  MFI,
  useMFI,
  EMV,
  useEMV,
  MarketFI,
  useMarketFI,
  VOSC,
  useVOSC,
  CMF,
  useCMF,
  CHO,
  useCHO,
  PVO,
  usePVO,
  FI,
  useFI,
  VROC,
  useVROC,
  PVT,
  usePVT,
} from "./indicators/Volume.js";

// ============================================================================
// Indicators - Momentum
// ============================================================================

export {
  BOP,
  useBOP,
  MOM,
  useMOM,
  ROC,
  useROC,
  ROCR,
  useROCR,
  RSI,
  useRSI,
  CMO,
  useCMO,
  WAD,
  useWAD,
  RVI,
  useRVI,
  TSI,
  useTSI,
  BBPOWER,
  useBBPOWER,
} from "./indicators/Momentum.js";

// ============================================================================
// Indicators - Aggregation
// ============================================================================

export type { OHLCVBar, OHLCVTick } from "./aggregation/index.js";
export { OHLCV, useOHLCV } from "./aggregation/index.js";

// ============================================================================
// Aggregation - Windows & Processors
// ============================================================================

export type { TumblingSpec } from "./aggregation/index.js";
export {
  TumblingWindow,
  CounterWindow,
  SessionWindow,
  OHLCVProcessor,
  StreamingAdapter,
} from "./aggregation/index.js";

// ============================================================================
// Heuristics - Single Bar Patterns
// ============================================================================

export {
  Doji,
  useDoji,
  LongLeggedDoji,
  useLongLeggedDoji,
  DragonflyDoji,
  useDragonflyDoji,
  GravestoneDoji,
  useGravestoneDoji,
  SpinningTop,
  useSpinningTop,
  MarubozuWhite,
  useMarubozuWhite,
  MarubozuBlack,
  useMarubozuBlack,
  Hammer,
  useHammer,
  InvertedHammer,
  useInvertedHammer,
  HighWave,
  useHighWave,
} from "./heuristics/pattern-single.js";

// ============================================================================
// Heuristics - Two Bar Patterns
// ============================================================================

export {
  BearishEngulfing,
  useBearishEngulfing,
  BullishHarami,
  useBullishHarami,
  BearishHarami,
  useBearishHarami,
  HaramiCross,
  useHaramiCross,
  PiercingPattern,
  usePiercingPattern,
  DarkCloudCover,
  useDarkCloudCover,
  TweezerTops,
  TweezerBottoms,
  BullishDojiStar,
  useBullishDojiStar,
  BearishDojiStar,
  useBearishDojiStar,
  InsideBar,
  useInsideBar,
  OutsideBar,
  useOutsideBar,
  RailroadTracks,
  useRailroadTracks,
  RisingWindow,
  useRisingWindow,
  FallingWindow,
  useFallingWindow,
} from "./heuristics/pattern-two.js";

// Note: TweezerTops and TweezerBottoms don't have use functions

// ============================================================================
// Heuristics - Multi Bar Patterns
// ============================================================================

export {
  EveningStar,
  useEveningStar,
  MorningDojiStar,
  useMorningDojiStar,
  EveningDojiStar,
  useEveningDojiStar,
  AbandonedBabyBullish,
  useAbandonedBabyBullish,
  AbandonedBabyBearish,
  useAbandonedBabyBearish,
  ThreeWhiteSoldiers,
  ThreeBlackCrows,
  ThreeInsideUp,
  useThreeInsideUp,
  ThreeInsideDown,
  useThreeInsideDown,
  ThreeOutsideUp,
  useThreeOutsideUp,
  ThreeOutsideDown,
  useThreeOutsideDown,
  FakeyPatternBullish,
  useFakeyPatternBullish,
  FakeyPatternBearish,
  useFakeyPatternBearish,
  RisingThreeMethods,
  useRisingThreeMethods,
  FallingThreeMethods,
  useFallingThreeMethods,
  ThreeBuddhaTop,
  InvertedThreeBuddha,
  useInvertedThreeBuddha,
} from "./heuristics/pattern-multi.js";

// Note: ThreeWhiteSoldiers, ThreeBlackCrows, and ThreeBuddhaTop don't have use functions

// ============================================================================
// Flow - GraphExec & Registry
// ============================================================================

export { GraphExec } from "./flow/GraphExec.js";
export { OpRegistry } from "./flow/Registry.js";
export type {
  FlowNode,
  FlowGraph,
  FlowGraphValidationResult,
  FlowGraphError,
  FlowGraphDiff,
  FlowGraphComplexity,
} from "./flow/schema.js";
export { FlowNodeSchema, FlowGraphSchema } from "./flow/schema.js";
export {
  calculateFlowGraphComplexity,
  compareFlowGraphs,
} from "./flow/schema-utils.js";
export {
  validateFlowGraph,
  formatFlowValidationError,
} from "./flow/validate.js";

// ============================================================================
// Namespace Exports
// ============================================================================

import * as _primitives from "./primitive/index.js";
import * as _indicators from "./indicators/index.js";
import * as _heuristics from "./heuristics/index.js";
import * as _flow from "./flow/index.js";

/**
 * Primitive operators: arithmetic, logical, rolling windows, and online statistics
 */
export const primitives = _primitives;

/**
 * Technical indicators: moving averages, volatility, oscillators, momentum, trend, volume, and stochastic
 */
export const indicators = _indicators;

/**
 * Heuristic pattern recognition: candlestick patterns (single, two-bar, and multi-bar)
 */
export const heuristics = _heuristics;

/**
 * Flow control: graph execution and operator registry
 */
export const flow = _flow;
