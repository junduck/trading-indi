import { CircularBuffer } from "@junduck/trading-core";
import type { OperatorDoc } from "../types/OpDoc.js";

export class Lag<T = any> {
  private buffer: CircularBuffer<T>;

  constructor(opts: { period: number }) {
    this.buffer = new CircularBuffer<T>(opts.period + 1);
  }

  update(value: T): T | undefined {
    this.buffer.push_back(value);
    if (this.buffer.full()) {
      return this.buffer.front();
    } else {
      return undefined;
    }
  }

  static readonly doc: OperatorDoc = {
    type: "Lag",
    desc: "Value delayed by a fixed number of updates",
    init: "{period: number}",
    input: "x",
    output: "lagged_x",
  };
}

export class LagTime<T = any> {
  private buffer: Array<{ timestamp: Date; value: T }> = [];
  private dTms: number;

  constructor(opts: { lag_time_ms: number }) {
    this.dTms = opts.lag_time_ms;
  }

  update(timestamp: Date, value: T): T | undefined {
    this.buffer.push({ timestamp, value });

    // Remove old entries (strictly older than cutoff)
    const cutoffTime = timestamp.getTime() - this.dTms;
    while (
      this.buffer.length > 0 &&
      this.buffer[0]!.timestamp.getTime() < cutoffTime
    ) {
      this.buffer.shift();
    }

    // Return the oldest entry within the lag time window (first timestamp >= cutoff)
    if (this.buffer.length > 0) {
      return this.buffer[0]!.value;
    } else {
      return undefined;
    }
  }

  static readonly doc: OperatorDoc = {
    type: "LagTime",
    desc: "Approximate time-based lag: returns oldest sample >= cutoff time",
    init: "{lag_time_ms: number}",
    input: "timestamp, x",
    output: "lagged_x",
  };
}
