import { RollingVarEW } from "@junduck/trading-core";
import type { GraphExec } from "./graph-exec.js";

export class GraphNodeTracker {
  private var: RollingVarEW;
  private nanCount: number = 0;

  constructor(opts: { period: number }) {
    this.var = new RollingVarEW(opts);
  }

  update(value: number): { mean: number; variance: number; nanCount: number } {
    if (isNaN(value)) {
      this.nanCount += 1;
      return { ...this.var.value, nanCount: this.nanCount };
    } else {
      const { mean, variance } = this.var.update(value);
      return { mean, variance, nanCount: this.nanCount };
    }
  }

  static shouldTrack(value: any): boolean {
    return typeof value === "number" && !isNaN(value);
  }

  getValue(): { mean: number; variance: number; nanCount: number } {
    return { ...this.var.value, nanCount: this.nanCount };
  }
}

/**
 * Tracks numeric values within objects/arrays recursively
 */
class NestedValueTracker {
  private trackers: Map<string, NestedValueTracker | GraphNodeTracker> =
    new Map();
  private period: number;

  constructor(period: number = 10) {
    this.period = period;
  }

  update(value: any): any {
    if (GraphNodeTracker.shouldTrack(value)) {
      // For top-level numeric values, use a special key
      if (!this.trackers.has("__value__")) {
        this.trackers.set(
          "__value__",
          new GraphNodeTracker({ period: this.period })
        );
      }
      const tracker = this.trackers.get("__value__") as GraphNodeTracker;
      return tracker.update(value);
    }

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const result: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        // Only track numeric values for object properties
        if (GraphNodeTracker.shouldTrack(val)) {
          if (!this.trackers.has(key)) {
            this.trackers.set(
              key,
              new GraphNodeTracker({ period: this.period })
            );
          }
          const tracker = this.trackers.get(key) as GraphNodeTracker;
          result[key] = tracker.update(val as number);
        } else if (
          typeof val === "object" &&
          val !== null &&
          !Array.isArray(val)
        ) {
          // Recursively handle nested objects.
          // If there is an existing scalar tracker for this key, convert it
          // into a NestedValueTracker and preserve the scalar under "__value__".
          const existing = this.trackers.get(key);
          let childTracker: NestedValueTracker;

          if (existing instanceof NestedValueTracker) {
            childTracker = existing;
          } else if (existing instanceof GraphNodeTracker) {
            childTracker = new NestedValueTracker(this.period);
            // preserve previous scalar tracker under a reserved key
            childTracker.trackers.set("__value__", existing);
            this.trackers.set(key, childTracker);
          } else {
            childTracker = new NestedValueTracker(this.period);
            this.trackers.set(key, childTracker);
          }

          result[key] = childTracker.update(val);
        }
        // Non-numeric primitives are ignored (undefined)
      }
      return result;
    }

    return undefined;
  }

  getCurrentValue(): any {
    const result: Record<string, any> = {};
    for (const [key, tracker] of this.trackers) {
      if (tracker instanceof GraphNodeTracker) {
        result[key] = tracker.getValue();
      } else if (tracker instanceof NestedValueTracker) {
        const childValue = tracker.getCurrentValue();
        if (Object.keys(childValue).length > 0) {
          result[key] = childValue;
        }
      }
    }
    return result;
  }
}

/**
 * Graph tracker that provides both original and tracked states
 */
export class GraphTracker {
  private graphExec: GraphExec;
  private rootTracker: NestedValueTracker;

  constructor(graphExec: GraphExec, period: number = 10) {
    this.graphExec = graphExec;
    this.rootTracker = new NestedValueTracker(period);
  }

  /**
   * Execute graph update and return both original and tracked states
   */
  update(data: any): {
    state: Record<string, any>;
    tracked: Record<string, any>;
  } {
    const originalState = this.graphExec.update(data);
    const trackedState = this.rootTracker.update(originalState);

    return {
      state: originalState,
      tracked: trackedState,
    };
  }

  /**
   * Get current tracked state without executing graph
   */
  getTrackedState(): Record<string, any> {
    return this.rootTracker.getCurrentValue();
  }

  /**
   * Get the underlying GraphExec instance
   */
  getGraphExec(): GraphExec {
    return this.graphExec;
  }
}
