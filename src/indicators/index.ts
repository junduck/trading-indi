export * from "./MovingAvg.js";
export * from "./Volatility.js";
export * from "./Oscillators.js";
export * from "./Stochastic.js";
export * from "./Trend.js";
export * from "./Volume.js";
export * from "./Momentum.js";

// re-export SMA, EMA, EWMA from primitive (already adapted onData interface)
export { SMA, EMA, EWMA } from "../primitive/core-ops/rolling.js";
