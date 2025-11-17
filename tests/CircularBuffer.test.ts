import { describe, it, expect } from "vitest";
import { CircularBuffer } from "../src/fn/Containers.js";

describe("CircularBuffer", () => {
  it("creates buffer with correct capacity", () => {
    const buffer = new CircularBuffer<number>(10);
    expect(buffer.capacity()).toBe(10);
    expect(buffer.size()).toBe(0);
    expect(buffer.empty()).toBe(true);
    expect(buffer.full()).toBe(false);
  });

  it("pushes and accesses elements", () => {
    const buffer = new CircularBuffer<number>(10);
    buffer.push_back(100);
    buffer.push_back(200);
    buffer.push_back(300);

    expect(buffer.size()).toBe(3);
    expect(buffer.front()).toBe(100);
    expect(buffer.back()).toBe(300);
    expect(buffer.at(0)).toBe(100);
    expect(buffer.at(1)).toBe(200);
    expect(buffer.at(2)).toBe(300);
  });

  it("pops elements from front", () => {
    const buffer = new CircularBuffer<number>(10);
    buffer.push_back(100);
    buffer.push_back(200);
    buffer.push_back(300);

    expect(buffer.pop_front()).toBe(100);
    expect(buffer.size()).toBe(2);
    expect(buffer.front()).toBe(200);
    expect(buffer.pop_front()).toBe(200);
    expect(buffer.pop_front()).toBe(300);
    expect(buffer.empty()).toBe(true);
    expect(buffer.pop_front()).toBeUndefined();
  });

  it("overwrites oldest when full", () => {
    const buffer = new CircularBuffer<number>(4);
    buffer.push_back(10);
    buffer.push_back(20);
    buffer.push_back(30);
    buffer.push_back(40);

    expect(buffer.full()).toBe(true);
    expect(buffer.size()).toBe(4);

    buffer.push_back(50);
    expect(buffer.size()).toBe(4);
    expect(buffer.front()).toBe(20);
    expect(buffer.back()).toBe(50);

    buffer.push_back(60);
    expect(buffer.front()).toBe(30);
    expect(buffer.back()).toBe(60);
  });

  it("clears all elements", () => {
    const buffer = new CircularBuffer<number>(10);
    buffer.push_back(100);
    buffer.push_back(200);
    buffer.push_back(300);

    buffer.clear();
    expect(buffer.size()).toBe(0);
    expect(buffer.empty()).toBe(true);
    expect(buffer.front()).toBeUndefined();
  });

  it("handles at() with invalid indices", () => {
    const buffer = new CircularBuffer<number>(10);
    buffer.push_back(100);
    buffer.push_back(200);

    expect(buffer.at(-1)).toBeUndefined();
    expect(buffer.at(2)).toBeUndefined();
    expect(buffer.at(10)).toBeUndefined();
  });

  it("works with string type", () => {
    const buffer = new CircularBuffer<string>(4);
    buffer.push_back("a");
    buffer.push_back("b");
    buffer.push_back("c");

    expect(buffer.front()).toBe("a");
    expect(buffer.back()).toBe("c");
    expect(buffer.at(1)).toBe("b");
  });

  it("converts to array", () => {
    const buffer = new CircularBuffer<number>(10);
    buffer.push_back(10);
    buffer.push_back(20);
    buffer.push_back(30);

    const arr = buffer.toArray();
    expect(arr).toEqual([10, 20, 30]);
  });

  it("supports iteration", () => {
    const buffer = new CircularBuffer<number>(10);
    buffer.push_back(10);
    buffer.push_back(20);
    buffer.push_back(30);

    const values: number[] = [];
    for (const val of buffer) {
      values.push(val);
    }

    expect(values).toEqual([10, 20, 30]);
  });

  it("supports spread operator", () => {
    const buffer = new CircularBuffer<number>(10);
    buffer.push_back(100);
    buffer.push_back(200);
    buffer.push_back(300);

    const arr = [...buffer];
    expect(arr).toEqual([100, 200, 300]);
  });

  it("uses aliases correctly", () => {
    const buffer = new CircularBuffer<number>(10);
    buffer.push(100);
    buffer.push(200);

    expect(buffer.peek()).toBe(100);
    expect(buffer.get(0)).toBe(100);
    expect(buffer.get(1)).toBe(200);
    expect(buffer.pop()).toBe(100);
    expect(buffer.size()).toBe(1);
  });

  it("handles wraparound correctly", () => {
    const buffer = new CircularBuffer<number>(4);
    buffer.push_back(10);
    buffer.push_back(20);
    buffer.pop_front();
    buffer.pop_front();
    buffer.push_back(30);
    buffer.push_back(40);
    buffer.push_back(50);
    buffer.push_back(60);

    expect(buffer.size()).toBe(4);
    expect(buffer.at(0)).toBe(30);
    expect(buffer.at(1)).toBe(40);
    expect(buffer.at(2)).toBe(50);
    expect(buffer.at(3)).toBe(60);
  });

  it("handles empty buffer edge cases", () => {
    const buffer = new CircularBuffer<number>(10);
    expect(buffer.front()).toBeUndefined();
    expect(buffer.back()).toBeUndefined();
    expect(buffer.peek()).toBeUndefined();
    expect(buffer.pop()).toBeUndefined();
    expect(buffer.at(0)).toBeUndefined();
    expect(buffer.toArray()).toEqual([]);
  });
});
