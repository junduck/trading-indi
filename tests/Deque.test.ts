import { describe, it, expect } from "vitest";
import { Deque } from "../src/fn/Containers.js";

describe("Deque", () => {
  it("creates deque with correct capacity", () => {
    const deque = new Deque<number>(10);
    expect(deque.capacity()).toBe(10);
    expect(deque.size()).toBe(0);
    expect(deque.empty()).toBe(true);
    expect(deque.full()).toBe(false);
  });

  it("throws error for invalid capacity", () => {
    expect(() => new Deque<number>(0)).toThrow(
      "Deque capacity must be positive"
    );
    expect(() => new Deque<number>(-10)).toThrow(
      "Deque capacity must be positive"
    );
  });

  it("pushes to back and front", () => {
    const deque = new Deque<number>(10);
    expect(deque.push_back(100)).toBe(true);
    expect(deque.push_back(200)).toBe(true);
    expect(deque.push_front(50)).toBe(true);

    expect(deque.size()).toBe(3);
    expect(deque.front()).toBe(50);
    expect(deque.back()).toBe(200);
    expect(deque.at(0)).toBe(50);
    expect(deque.at(1)).toBe(100);
    expect(deque.at(2)).toBe(200);
  });

  it("pops from front", () => {
    const deque = new Deque<number>(10);
    deque.push_back(100);
    deque.push_back(200);
    deque.push_back(300);

    expect(deque.pop_front()).toBe(100);
    expect(deque.size()).toBe(2);
    expect(deque.front()).toBe(200);
    expect(deque.pop_front()).toBe(200);
    expect(deque.pop_front()).toBe(300);
    expect(deque.empty()).toBe(true);
    expect(deque.pop_front()).toBeUndefined();
  });

  it("pops from back", () => {
    const deque = new Deque<number>(10);
    deque.push_back(100);
    deque.push_back(200);
    deque.push_back(300);

    expect(deque.pop_back()).toBe(300);
    expect(deque.size()).toBe(2);
    expect(deque.back()).toBe(200);
    expect(deque.pop_back()).toBe(200);
    expect(deque.pop_back()).toBe(100);
    expect(deque.empty()).toBe(true);
    expect(deque.pop_back()).toBeUndefined();
  });

  it("handles balanced push/pop operations", () => {
    const deque = new Deque<number>(4);
    deque.push_back(10);
    deque.push_back(20);
    expect(deque.pop_front()).toBe(10);
    deque.push_back(30);
    expect(deque.pop_front()).toBe(20);
    deque.push_front(5);
    deque.push_back(40);

    expect(deque.size()).toBe(3);
    expect(deque.at(0)).toBe(5);
    expect(deque.at(1)).toBe(30);
    expect(deque.at(2)).toBe(40);
  });

  it("rejects push when full", () => {
    const deque = new Deque<number>(4);
    expect(deque.push_back(10)).toBe(true);
    expect(deque.push_back(20)).toBe(true);
    expect(deque.push_back(30)).toBe(true);
    expect(deque.push_back(40)).toBe(true);

    expect(deque.full()).toBe(true);
    expect(deque.size()).toBe(4);

    expect(deque.push_back(50)).toBe(false);
    expect(deque.push_front(5)).toBe(false);
    expect(deque.size()).toBe(4);
  });

  it("clears all elements", () => {
    const deque = new Deque<number>(10);
    deque.push_back(100);
    deque.push_back(200);
    deque.push_front(50);

    deque.clear();
    expect(deque.size()).toBe(0);
    expect(deque.empty()).toBe(true);
    expect(deque.front()).toBeUndefined();
    expect(deque.back()).toBeUndefined();
  });

  it("handles at() with invalid indices", () => {
    const deque = new Deque<number>(10);
    deque.push_back(100);
    deque.push_back(200);

    expect(deque.at(-1)).toBeUndefined();
    expect(deque.at(2)).toBeUndefined();
    expect(deque.at(10)).toBeUndefined();
  });

  it("works with string type", () => {
    const deque = new Deque<string>(4);
    deque.push_back("b");
    deque.push_back("c");
    deque.push_front("a");

    expect(deque.front()).toBe("a");
    expect(deque.back()).toBe("c");
    expect(deque.at(1)).toBe("b");
  });

  it("converts to array", () => {
    const deque = new Deque<number>(10);
    deque.push_back(20);
    deque.push_back(30);
    deque.push_front(10);

    const arr = deque.toArray();
    expect(arr).toEqual([10, 20, 30]);
  });

  it("supports iteration", () => {
    const deque = new Deque<number>(10);
    deque.push_back(20);
    deque.push_back(30);
    deque.push_front(10);

    const values: number[] = [];
    for (const val of deque) {
      values.push(val);
    }

    expect(values).toEqual([10, 20, 30]);
  });

  it("supports spread operator", () => {
    const deque = new Deque<number>(10);
    deque.push_front(100);
    deque.push_back(200);
    deque.push_back(300);

    const arr = [...deque];
    expect(arr).toEqual([100, 200, 300]);
  });

  it("handles wraparound from front correctly", () => {
    const deque = new Deque<number>(4);
    deque.push_back(10);
    deque.push_back(20);
    deque.push_front(5);
    deque.push_front(2);

    expect(deque.size()).toBe(4);
    expect(deque.full()).toBe(true);
    expect(deque.at(0)).toBe(2);
    expect(deque.at(1)).toBe(5);
    expect(deque.at(2)).toBe(10);
    expect(deque.at(3)).toBe(20);
  });

  it("handles wraparound with mixed operations", () => {
    const deque = new Deque<number>(4);
    deque.push_back(10);
    deque.push_back(20);
    deque.pop_front();
    deque.push_front(5);
    deque.push_front(2);
    deque.push_back(30);

    expect(deque.size()).toBe(4);
    expect(deque.at(0)).toBe(2);
    expect(deque.at(1)).toBe(5);
    expect(deque.at(2)).toBe(20);
    expect(deque.at(3)).toBe(30);
  });

  it("handles empty deque edge cases", () => {
    const deque = new Deque<number>(10);
    expect(deque.front()).toBeUndefined();
    expect(deque.back()).toBeUndefined();
    expect(deque.pop_front()).toBeUndefined();
    expect(deque.pop_back()).toBeUndefined();
    expect(deque.at(0)).toBeUndefined();
    expect(deque.toArray()).toEqual([]);
  });

  it("handles alternating push_front and pop_back", () => {
    const deque = new Deque<number>(10);
    deque.push_front(10);
    deque.push_front(20);
    deque.push_front(30);

    expect(deque.pop_back()).toBe(10);
    expect(deque.pop_back()).toBe(20);
    expect(deque.pop_back()).toBe(30);
    expect(deque.empty()).toBe(true);
  });

  it("maintains correct state after clear", () => {
    const deque = new Deque<number>(4);
    deque.push_back(10);
    deque.push_back(20);
    deque.push_front(5);
    deque.clear();

    expect(deque.push_back(100)).toBe(true);
    expect(deque.push_front(50)).toBe(true);
    expect(deque.front()).toBe(50);
    expect(deque.back()).toBe(100);
    expect(deque.size()).toBe(2);
  });

  it("handles single element operations", () => {
    const deque = new Deque<number>(10);
    deque.push_back(100);

    expect(deque.front()).toBe(100);
    expect(deque.back()).toBe(100);
    expect(deque.size()).toBe(1);
    expect(deque.at(0)).toBe(100);

    expect(deque.pop_front()).toBe(100);
    expect(deque.empty()).toBe(true);
  });
});
