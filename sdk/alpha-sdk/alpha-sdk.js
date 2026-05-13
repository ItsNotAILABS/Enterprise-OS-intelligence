/**
 * ALPHA SDK
 * RSHIP-2026-ALPHA-SDK-001
 *
 * Alpha SDK provides the foundational primitives for RSHIP development.
 * This is the earliest-stage SDK that other SDKs build upon.
 *
 * @module alpha-sdk
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');
const crypto = require('crypto');

const PHI = (1 + Math.sqrt(5)) / 2;
const SCHUMANN_HZ = 7.83;

// ═══════════════════════════════════════════════════════════════════════════
// CORE PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════

class AlphaID {
  static generate(prefix = 'ALPHA') {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `${prefix}-${timestamp}-${random}`;
  }

  static validate(id) {
    return /^[A-Z]+-[a-z0-9]+-[a-f0-9]+$/.test(id);
  }

  static parse(id) {
    const parts = id.split('-');
    if (parts.length < 3) return null;
    return {
      prefix: parts[0],
      timestamp: parseInt(parts[1], 36),
      random: parts.slice(2).join('-')
    };
  }
}

class AlphaHash {
  static sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static md5(data) {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  static hmac(data, secret) {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  static phiHash(data) {
    // Custom hash with φ-based mixing
    const hash = this.sha256(data);
    let result = 0;
    for (let i = 0; i < hash.length; i++) {
      result += parseInt(hash[i], 16) * Math.pow(PHI, i % 8);
    }
    return result;
  }
}

class AlphaRandom {
  static int(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static float(min = 0, max = 1) {
    return Math.random() * (max - min) + min;
  }

  static bytes(length) {
    return crypto.randomBytes(length);
  }

  static choice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  static shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static gaussian(mean = 0, stdDev = 1) {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  static phi() {
    // Random value weighted by φ
    return Math.pow(Math.random(), 1 / PHI);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TIME UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

class AlphaTime {
  static now() {
    return Date.now();
  }

  static iso() {
    return new Date().toISOString();
  }

  static phiCycle(baseMs = 1000) {
    // Return current position in φ-scaled time cycle
    const now = Date.now();
    const cycle = baseMs * PHI;
    return (now % cycle) / cycle;
  }

  static schumannPhase() {
    // Phase in Schumann resonance cycle
    const periodMs = 1000 / SCHUMANN_HZ;
    const now = Date.now();
    return ((now % periodMs) / periodMs) * 2 * Math.PI;
  }

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static timeout(promise, ms, message = 'Timeout') {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(message)), ms)
      )
    ]);
  }

  static debounce(fn, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  static throttle(fn, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA STRUCTURES
// ═══════════════════════════════════════════════════════════════════════════

class AlphaQueue {
  constructor(maxSize = Infinity) {
    this.items = [];
    this.maxSize = maxSize;
  }

  enqueue(item) {
    if (this.items.length >= this.maxSize) {
      this.items.shift();
    }
    this.items.push(item);
    return this;
  }

  dequeue() {
    return this.items.shift();
  }

  peek() {
    return this.items[0];
  }

  size() {
    return this.items.length;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  clear() {
    this.items = [];
  }

  toArray() {
    return [...this.items];
  }
}

class AlphaStack {
  constructor(maxSize = Infinity) {
    this.items = [];
    this.maxSize = maxSize;
  }

  push(item) {
    if (this.items.length >= this.maxSize) {
      this.items.shift();
    }
    this.items.push(item);
    return this;
  }

  pop() {
    return this.items.pop();
  }

  peek() {
    return this.items[this.items.length - 1];
  }

  size() {
    return this.items.length;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  clear() {
    this.items = [];
  }
}

class AlphaRingBuffer {
  constructor(size) {
    this.buffer = new Array(size);
    this.size = size;
    this.head = 0;
    this.count = 0;
  }

  push(item) {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.size;
    this.count = Math.min(this.count + 1, this.size);
    return this;
  }

  get(index) {
    if (index >= this.count) return undefined;
    const actualIndex = (this.head - this.count + index + this.size) % this.size;
    return this.buffer[actualIndex];
  }

  latest() {
    if (this.count === 0) return undefined;
    return this.buffer[(this.head - 1 + this.size) % this.size];
  }

  toArray() {
    const result = [];
    for (let i = 0; i < this.count; i++) {
      result.push(this.get(i));
    }
    return result;
  }

  isFull() {
    return this.count === this.size;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MATH UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

class AlphaMath {
  static PHI = PHI;
  static E = Math.E;
  static PI = Math.PI;

  static clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  static lerp(a, b, t) {
    return a + (b - a) * t;
  }

  static smoothstep(edge0, edge1, x) {
    const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  static phiLerp(a, b, t) {
    // Interpolation weighted by φ
    const phiT = Math.pow(t, 1 / PHI);
    return a + (b - a) * phiT;
  }

  static fibonacci(n) {
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
      [a, b] = [b, a + b];
    }
    return b;
  }

  static isPrime(n) {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  }

  static mean(values) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  static variance(values) {
    if (values.length === 0) return 0;
    const avg = this.mean(values);
    return this.mean(values.map(v => (v - avg) ** 2));
  }

  static stdDev(values) {
    return Math.sqrt(this.variance(values));
  }

  static normalize(values) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    if (range === 0) return values.map(() => 0.5);
    return values.map(v => (v - min) / range);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BASE EMITTER
// ═══════════════════════════════════════════════════════════════════════════

class AlphaEmitter extends EventEmitter {
  constructor(options = {}) {
    super();
    this.id = AlphaID.generate('EMIT');
    this.created = Date.now();
    this.eventCount = 0;
    this.maxListeners = options.maxListeners || 100;
    this.setMaxListeners(this.maxListeners);
  }

  emit(event, ...args) {
    this.eventCount++;
    return super.emit(event, ...args);
  }

  once(event, listener) {
    return super.once(event, listener);
  }

  asyncOnce(event, timeout = 30000) {
    return AlphaTime.timeout(
      new Promise(resolve => this.once(event, resolve)),
      timeout,
      `Timeout waiting for event: ${event}`
    );
  }

  pipe(targetEmitter, events = []) {
    for (const event of events) {
      this.on(event, (...args) => targetEmitter.emit(event, ...args));
    }
    return this;
  }

  status() {
    return {
      id: this.id,
      eventCount: this.eventCount,
      listenerCount: this.eventNames().reduce((sum, e) => sum + this.listenerCount(e), 0),
      uptime: Date.now() - this.created
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ALPHA CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

class AlphaContext {
  constructor(parent = null) {
    this.id = AlphaID.generate('CTX');
    this.parent = parent;
    this.data = new Map();
    this.created = Date.now();
  }

  set(key, value) {
    this.data.set(key, value);
    return this;
  }

  get(key) {
    if (this.data.has(key)) {
      return this.data.get(key);
    }
    if (this.parent) {
      return this.parent.get(key);
    }
    return undefined;
  }

  has(key) {
    return this.data.has(key) || (this.parent && this.parent.has(key));
  }

  delete(key) {
    return this.data.delete(key);
  }

  child() {
    return new AlphaContext(this);
  }

  merge(other) {
    for (const [key, value] of other.data) {
      this.data.set(key, value);
    }
    return this;
  }

  toObject() {
    const result = this.parent ? this.parent.toObject() : {};
    for (const [key, value] of this.data) {
      result[key] = value;
    }
    return result;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  SCHUMANN_HZ,
  AlphaID,
  AlphaHash,
  AlphaRandom,
  AlphaTime,
  AlphaQueue,
  AlphaStack,
  AlphaRingBuffer,
  AlphaMath,
  AlphaEmitter,
  AlphaContext
};
