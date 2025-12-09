import { describe, expect, it } from "vitest";
import { Lag, LagTime } from "../src/primitive/lag.js";

describe("Lag", () => {
  it("returns value N updates ago using period", () => {
    const lag = new Lag<number>({ period: 3 });

    const vals = [1, 2, 3, 4, 5];
    const results: Array<number | undefined> = [];

    for (const v of vals) {
      results.push(lag.update(v));
    }

    // With period=3, buffer size = period+1 = 4
    // outputs: [undefined, undefined, undefined, 1, 2]
    expect(results[0]).toBeUndefined();
    expect(results[1]).toBeUndefined();
    expect(results[2]).toBeUndefined();
    expect(results[3]).toBe(1);
    expect(results[4]).toBe(2);
  });
});

describe("LagTime", () => {
  it("returns oldest sample within lag window using CircularBuffer front/pop_front", () => {
    const lagMs = 1000;
    const lt = new LagTime<number>({ lag_time_ms: lagMs });

    const t0 = Date.now();
    const samples = [
      { ts: new Date(t0), v: 10 },
      { ts: new Date(t0 + 500), v: 11 },
      { ts: new Date(t0 + 1000), v: 12 },
      { ts: new Date(t0 + 1500), v: 13 },
    ];

    const outs: Array<number | undefined> = [];
    for (const s of samples) {
      outs.push(lt.update(s.ts, s.v));
    }

    // Expected: [10,10,10,11]
    expect(outs[0]).toBe(10);
    expect(outs[1]).toBe(10);
    expect(outs[2]).toBe(10);
    expect(outs[3]).toBe(11);
  });
});
