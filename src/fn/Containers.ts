/**
 * Fixed-size circular buffer with Boost-like interface.
 * Automatically overwrites oldest elements when full.
 * @template T The type of elements stored in the buffer
 */
export class CircularBuffer<T> {
  private size_: number;
  private readonly cap_: number;

  private buffer: T[];
  private head: number;

  /**
   * Creates a circular buffer with fixed capacity.
   * @param capacity Maximum number of elements
   */
  constructor(capacity: number) {
    this.size_ = 0;
    this.cap_ = capacity;
    this.buffer = new Array(this.cap_);
    this.head = 0;
  }

  /**
   * Adds element to back. Overwrites oldest if full.
   * @param item Element to add
   */
  push_back(item: T): void {
    const tail = (this.head + this.size_) % this.cap_;
    this.buffer[tail] = item;

    if (this.size_ < this.cap_) {
      this.size_++;
    } else {
      this.head = (this.head + 1) % this.cap_;
    }
  }

  /** Alias for push_back() */
  push(item: T): void {
    this.push_back(item);
  }

  /**
   * Removes and returns front element.
   * @returns Front element or undefined if empty
   */
  pop_front(): T | undefined {
    if (this.empty()) {
      return undefined;
    }

    const item = this.buffer[this.head];
    this.head = (this.head + 1) % this.cap_;
    this.size_--;

    return item;
  }

  /** Alias for pop_front() */
  pop(): T | undefined {
    return this.pop_front();
  }

  /** Removes all elements */
  clear(): void {
    this.size_ = 0;
    this.head = 0;
  }

  /** Alias for front() */
  peek(): T | undefined {
    return this.front();
  }

  /**
   * Accesses element at index.
   * @param index Position from front (0 = front, size-1 = back)
   * @returns Element or undefined if out of bounds
   */
  at(index: number): T | undefined {
    if (index < 0 || index >= this.size_) {
      return undefined;
    }
    const physicalIndex = (this.head + index) % this.cap_;
    return this.buffer[physicalIndex];
  }

  /** Alias for at() */
  get(index: number): T | undefined {
    return this.at(index);
  }

  /**
   * Gets front element without removing.
   * @returns Front element or undefined if empty
   */
  front(): T | undefined {
    if (this.empty()) {
      return undefined;
    }
    return this.buffer[this.head];
  }

  /**
   * Gets back element without removing.
   * @returns Back element or undefined if empty
   */
  back(): T | undefined {
    if (this.empty()) {
      return undefined;
    }
    const tail = (this.head + this.size_ - 1) % this.cap_;
    return this.buffer[tail];
  }

  /** Returns current number of elements */
  size(): number {
    return this.size_;
  }

  /** Returns maximum capacity */
  capacity(): number {
    return this.cap_;
  }

  /** Checks if buffer is full */
  full(): boolean {
    return this.size_ === this.cap_;
  }

  /** Checks if buffer is empty */
  empty(): boolean {
    return this.size_ === 0;
  }

  /** Iterator support for for...of loops */
  *[Symbol.iterator](): Iterator<T> {
    for (let i = 0; i < this.size_; i++) {
      yield this.at(i)!;
    }
  }

  /**
   * Converts buffer to array.
   * @returns Array containing all elements in order
   */
  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.size_; i++) {
      result.push(this.at(i)!);
    }
    return result;
  }
}

/**
 * Double-ended queue with fixed capacity.
 * Optimized for balanced push/pop operations using circular buffer.
 * @template T The type of elements stored in the deque
 */
export class Deque<T> {
  private size_: number;
  private readonly cap_: number;
  private buffer: (T | undefined)[];
  private head: number;
  private tail: number;

  /**
   * Creates a deque with fixed capacity.
   * @param capacity Maximum number of elements
   */
  constructor(capacity: number) {
    this.size_ = 0;
    this.cap_ = capacity;
    this.buffer = new Array(this.cap_);
    this.head = 0;
    this.tail = 0;
  }

  /**
   * Adds element to front.
   * @param item Element to add
   * @returns true if successful, false if full
   */
  push_front(item: T): boolean {
    if (this.full()) {
      return false;
    }
    this.head = (this.head - 1 + this.cap_) % this.cap_;
    this.buffer[this.head] = item;
    this.size_++;
    return true;
  }

  /**
   * Adds element to back.
   * @param item Element to add
   * @returns true if successful, false if full
   */
  push_back(item: T): boolean {
    if (this.full()) {
      return false;
    }
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.cap_;
    this.size_++;
    return true;
  }

  /**
   * Removes and returns front element.
   * @returns Front element or undefined if empty
   */
  pop_front(): T | undefined {
    if (this.empty()) {
      return undefined;
    }
    const item = this.buffer[this.head];
    this.buffer[this.head] = undefined;
    this.head = (this.head + 1) % this.cap_;
    this.size_--;
    return item;
  }

  /**
   * Removes and returns back element.
   * @returns Back element or undefined if empty
   */
  pop_back(): T | undefined {
    if (this.empty()) {
      return undefined;
    }
    this.tail = (this.tail - 1 + this.cap_) % this.cap_;
    const item = this.buffer[this.tail];
    this.buffer[this.tail] = undefined;
    this.size_--;
    return item;
  }

  /**
   * Gets front element without removing.
   * @returns Front element or undefined if empty
   */
  front(): T | undefined {
    if (this.empty()) {
      return undefined;
    }
    return this.buffer[this.head];
  }

  /**
   * Gets back element without removing.
   * @returns Back element or undefined if empty
   */
  back(): T | undefined {
    if (this.empty()) {
      return undefined;
    }
    const backIndex = (this.tail - 1 + this.cap_) % this.cap_;
    return this.buffer[backIndex];
  }

  /**
   * Accesses element at index.
   * @param index Position from front (0 = front, size-1 = back)
   * @returns Element or undefined if out of bounds
   */
  at(index: number): T | undefined {
    if (index < 0 || index >= this.size_) {
      return undefined;
    }
    const physicalIndex = (this.head + index) % this.cap_;
    return this.buffer[physicalIndex];
  }

  /** Removes all elements */
  clear(): void {
    while (!this.empty()) {
      this.pop_front();
    }
    this.head = 0;
    this.tail = 0;
  }

  /** Returns current number of elements */
  size(): number {
    return this.size_;
  }

  /** Returns maximum capacity */
  capacity(): number {
    return this.cap_;
  }

  /** Checks if deque is full */
  full(): boolean {
    return this.size_ === this.cap_;
  }

  /** Checks if deque is empty */
  empty(): boolean {
    return this.size_ === 0;
  }

  /** Iterator support for for...of loops */
  *[Symbol.iterator](): Iterator<T> {
    for (let i = 0; i < this.size_; i++) {
      yield this.at(i)!;
    }
  }

  /**
   * Converts deque to array.
   * @returns Array containing all elements in order
   */
  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.size_; i++) {
      result.push(this.at(i)!);
    }
    return result;
  }
}
