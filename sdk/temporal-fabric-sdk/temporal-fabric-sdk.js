/**
 * TEMPORAL FABRIC SDK
 * RSHIP-2026-TEMPORAL-FABRIC-001
 *
 * Time-series orchestration and temporal reasoning for AGI systems.
 * Implements temporal weaving, causality tracking, and time-aware
 * decision making with φ-weighted temporal harmonics.
 *
 * @module temporal-fabric-sdk
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');
const crypto = require('crypto');

const PHI = (1 + Math.sqrt(5)) / 2;
const SCHUMANN_HZ = 7.83;

// ═══════════════════════════════════════════════════════════════════════════
// TEMPORAL TYPES
// ═══════════════════════════════════════════════════════════════════════════

const TemporalGranularity = {
  PLANCK: 'planck',
  MICROSECOND: 'microsecond',
  MILLISECOND: 'millisecond',
  SECOND: 'second',
  MINUTE: 'minute',
  HOUR: 'hour',
  DAY: 'day',
  EPOCH: 'epoch'
};

const CausalityType = {
  PRECEDES: 'precedes',
  FOLLOWS: 'follows',
  CONCURRENT: 'concurrent',
  INDEPENDENT: 'independent'
};

// ═══════════════════════════════════════════════════════════════════════════
// TEMPORAL POINT
// ═══════════════════════════════════════════════════════════════════════════

class TemporalPoint {
  constructor(timestamp = Date.now(), granularity = TemporalGranularity.MILLISECOND) {
    this.timestamp = timestamp;
    this.granularity = granularity;
    this.vectorClock = new Map();
    this.lamportClock = 0;
    this.metadata = {};
  }

  incrementLamport() {
    this.lamportClock++;
    return this.lamportClock;
  }

  updateVectorClock(nodeId, timestamp) {
    const current = this.vectorClock.get(nodeId) || 0;
    this.vectorClock.set(nodeId, Math.max(current, timestamp));
  }

  merge(other) {
    this.lamportClock = Math.max(this.lamportClock, other.lamportClock) + 1;
    for (const [nodeId, ts] of other.vectorClock) {
      this.updateVectorClock(nodeId, ts);
    }
  }

  happensBefore(other) {
    if (this.lamportClock >= other.lamportClock) return false;

    for (const [nodeId, ts] of this.vectorClock) {
      const otherTs = other.vectorClock.get(nodeId) || 0;
      if (ts > otherTs) return false;
    }
    return true;
  }

  isConcurrent(other) {
    return !this.happensBefore(other) && !other.happensBefore(this);
  }

  distanceTo(other) {
    return Math.abs(this.timestamp - other.timestamp);
  }

  phiDistance(other) {
    const raw = this.distanceTo(other);
    return raw * Math.pow(PHI, -Math.log(raw + 1));
  }

  toJSON() {
    return {
      timestamp: this.timestamp,
      granularity: this.granularity,
      lamportClock: this.lamportClock,
      vectorClock: Object.fromEntries(this.vectorClock),
      metadata: this.metadata
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPORAL INTERVAL
// ═══════════════════════════════════════════════════════════════════════════

class TemporalInterval {
  constructor(start, end) {
    this.start = start instanceof TemporalPoint ? start : new TemporalPoint(start);
    this.end = end instanceof TemporalPoint ? end : new TemporalPoint(end);
  }

  duration() {
    return this.end.timestamp - this.start.timestamp;
  }

  contains(point) {
    const ts = point instanceof TemporalPoint ? point.timestamp : point;
    return ts >= this.start.timestamp && ts <= this.end.timestamp;
  }

  overlaps(other) {
    return !(this.end.timestamp < other.start.timestamp ||
             other.end.timestamp < this.start.timestamp);
  }

  intersection(other) {
    if (!this.overlaps(other)) return null;

    const start = Math.max(this.start.timestamp, other.start.timestamp);
    const end = Math.min(this.end.timestamp, other.end.timestamp);
    return new TemporalInterval(start, end);
  }

  union(other) {
    const start = Math.min(this.start.timestamp, other.start.timestamp);
    const end = Math.max(this.end.timestamp, other.end.timestamp);
    return new TemporalInterval(start, end);
  }

  split(count) {
    const duration = this.duration();
    const segmentDuration = duration / count;
    const segments = [];

    for (let i = 0; i < count; i++) {
      const start = this.start.timestamp + i * segmentDuration;
      const end = start + segmentDuration;
      segments.push(new TemporalInterval(start, end));
    }

    return segments;
  }

  phiSplit() {
    const duration = this.duration();
    const splitPoint = this.start.timestamp + duration / PHI;
    return [
      new TemporalInterval(this.start.timestamp, splitPoint),
      new TemporalInterval(splitPoint, this.end.timestamp)
    ];
  }

  toJSON() {
    return {
      start: this.start.toJSON(),
      end: this.end.toJSON(),
      duration: this.duration()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPORAL EVENT
// ═══════════════════════════════════════════════════════════════════════════

class TemporalEvent {
  constructor(id, type, payload, timestamp = Date.now()) {
    this.id = id;
    this.type = type;
    this.payload = payload;
    this.point = new TemporalPoint(timestamp);
    this.causes = [];
    this.effects = [];
    this.weight = 1.0;
  }

  addCause(event) {
    this.causes.push(event.id);
    event.effects.push(this.id);
    this.point.merge(event.point);
  }

  causalRelation(other) {
    if (this.point.happensBefore(other.point)) {
      return CausalityType.PRECEDES;
    }
    if (other.point.happensBefore(this.point)) {
      return CausalityType.FOLLOWS;
    }
    if (this.point.isConcurrent(other.point)) {
      return CausalityType.CONCURRENT;
    }
    return CausalityType.INDEPENDENT;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      payload: this.payload,
      point: this.point.toJSON(),
      causes: this.causes,
      effects: this.effects,
      weight: this.weight
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPORAL STREAM
// ═══════════════════════════════════════════════════════════════════════════

class TemporalStream extends EventEmitter {
  constructor(id, options = {}) {
    super();
    this.id = id;
    this.events = [];
    this.windowSize = options.windowSize || 1000;
    this.maxEvents = options.maxEvents || 10000;
    this.aggregations = new Map();
  }

  push(event) {
    if (!(event instanceof TemporalEvent)) {
      event = new TemporalEvent(
        crypto.randomUUID(),
        event.type || 'data',
        event,
        Date.now()
      );
    }

    this.events.push(event);

    // Maintain window
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    this.emit('event', event);
    this._updateAggregations(event);

    return event;
  }

  window(interval) {
    return this.events.filter(e => interval.contains(e.point));
  }

  windowLast(duration) {
    const now = Date.now();
    const interval = new TemporalInterval(now - duration, now);
    return this.window(interval);
  }

  aggregate(name, fn) {
    this.aggregations.set(name, { fn, value: null });
  }

  _updateAggregations(event) {
    for (const [name, agg] of this.aggregations) {
      agg.value = agg.fn(this.events, event, agg.value);
    }
  }

  getAggregation(name) {
    const agg = this.aggregations.get(name);
    return agg ? agg.value : null;
  }

  rate(duration = 1000) {
    const recent = this.windowLast(duration);
    return (recent.length / duration) * 1000;
  }

  movingAverage(field, window = 10) {
    const recent = this.events.slice(-window);
    if (recent.length === 0) return 0;

    const sum = recent.reduce((acc, e) => acc + (e.payload[field] || 0), 0);
    return sum / recent.length;
  }

  phiWeightedAverage(field, window = 10) {
    const recent = this.events.slice(-window);
    if (recent.length === 0) return 0;

    let weightedSum = 0;
    let totalWeight = 0;

    recent.forEach((e, i) => {
      const weight = Math.pow(PHI, i - recent.length + 1);
      weightedSum += (e.payload[field] || 0) * weight;
      totalWeight += weight;
    });

    return weightedSum / totalWeight;
  }

  findCausalChain(startId, maxDepth = 10) {
    const chain = [];
    const visited = new Set();
    const queue = [{ id: startId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (visited.has(id) || depth > maxDepth) continue;

      visited.add(id);
      const event = this.events.find(e => e.id === id);
      if (!event) continue;

      chain.push(event);

      for (const effectId of event.effects) {
        queue.push({ id: effectId, depth: depth + 1 });
      }
    }

    return chain;
  }

  toJSON() {
    return {
      id: this.id,
      eventCount: this.events.length,
      windowSize: this.windowSize,
      aggregations: Object.fromEntries(
        Array.from(this.aggregations.entries())
          .map(([k, v]) => [k, v.value])
      )
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPORAL WEAVER
// ═══════════════════════════════════════════════════════════════════════════

class TemporalWeaver extends EventEmitter {
  constructor(options = {}) {
    super();
    this.streams = new Map();
    this.correlations = new Map();
    this.patterns = [];
    this.running = false;
  }

  createStream(id, options = {}) {
    const stream = new TemporalStream(id, options);
    this.streams.set(id, stream);

    stream.on('event', (event) => {
      this._checkCorrelations(id, event);
    });

    this.emit('stream-created', { id });
    return stream;
  }

  getStream(id) {
    return this.streams.get(id) || null;
  }

  correlate(streamId1, streamId2, correlationFn, windowMs = 1000) {
    const key = `${streamId1}:${streamId2}`;
    this.correlations.set(key, { streamId1, streamId2, correlationFn, windowMs });
  }

  _checkCorrelations(triggerStreamId, event) {
    for (const [key, corr] of this.correlations) {
      if (corr.streamId1 !== triggerStreamId && corr.streamId2 !== triggerStreamId) continue;

      const stream1 = this.streams.get(corr.streamId1);
      const stream2 = this.streams.get(corr.streamId2);
      if (!stream1 || !stream2) continue;

      const events1 = stream1.windowLast(corr.windowMs);
      const events2 = stream2.windowLast(corr.windowMs);

      const result = corr.correlationFn(events1, events2, event);
      if (result) {
        this.emit('correlation', { key, result, trigger: event });
      }
    }
  }

  registerPattern(name, detector) {
    this.patterns.push({ name, detector });
  }

  detectPatterns(streamId, interval) {
    const stream = this.streams.get(streamId);
    if (!stream) return [];

    const events = stream.window(interval);
    const detected = [];

    for (const pattern of this.patterns) {
      const matches = pattern.detector(events);
      if (matches && matches.length > 0) {
        detected.push({ name: pattern.name, matches });
      }
    }

    return detected;
  }

  status() {
    const streamStats = {};
    for (const [id, stream] of this.streams) {
      streamStats[id] = stream.toJSON();
    }

    return {
      running: this.running,
      streamCount: this.streams.size,
      correlationCount: this.correlations.size,
      patternCount: this.patterns.length,
      streams: streamStats
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPORAL FABRIC SDK
// ═══════════════════════════════════════════════════════════════════════════

class TemporalFabricSDK extends EventEmitter {
  constructor(config = {}) {
    super();
    this.id = 'RSHIP-2026-TEMPORAL-FABRIC-001';
    this.name = 'TemporalFabricSDK';
    this.version = '1.0.0';
    this.config = config;
    this.weaver = new TemporalWeaver(config);
    this.state = 'initialized';

    // Forward events
    this.weaver.on('stream-created', (e) => this.emit('stream-created', e));
    this.weaver.on('correlation', (e) => this.emit('correlation', e));
  }

  async start() {
    this.weaver.running = true;
    this.state = 'running';
    this.emit('started');
  }

  async stop() {
    this.weaver.running = false;
    this.state = 'stopped';
    this.emit('stopped');
  }

  createStream(id, options = {}) {
    return this.weaver.createStream(id, options);
  }

  getStream(id) {
    return this.weaver.getStream(id);
  }

  correlate(streamId1, streamId2, fn, windowMs) {
    return this.weaver.correlate(streamId1, streamId2, fn, windowMs);
  }

  registerPattern(name, detector) {
    return this.weaver.registerPattern(name, detector);
  }

  status() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      state: this.state,
      weaver: this.weaver.status()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  SCHUMANN_HZ,
  TemporalGranularity,
  CausalityType,
  TemporalPoint,
  TemporalInterval,
  TemporalEvent,
  TemporalStream,
  TemporalWeaver,
  TemporalFabricSDK
};
