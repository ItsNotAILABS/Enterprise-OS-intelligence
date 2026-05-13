/**
 * MEDINA CALLS SDK
 * RSHIP-2026-MEDINA-CALLS-001
 *
 * Medina Calls provides the inter-AGI communication protocol for
 * sovereign message passing with φ-authenticated channels.
 *
 * Features:
 * - φ-authenticated message channels
 * - Priority queue with golden ratio weighting
 * - Async/await message patterns
 * - Request-response and pub-sub patterns
 *
 * @module medina-calls
 * @version 1.0.0
 */

'use strict';

const crypto = require('crypto');
const { EventEmitter } = require('events');

const PHI = (1 + Math.sqrt(5)) / 2;

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE TYPES
// ═══════════════════════════════════════════════════════════════════════════

const MessageType = {
  REQUEST: 'request',
  RESPONSE: 'response',
  EVENT: 'event',
  BROADCAST: 'broadcast',
  HEARTBEAT: 'heartbeat',
  ACK: 'ack',
  ERROR: 'error'
};

const Priority = {
  CRITICAL: 4,
  HIGH: 3,
  NORMAL: 2,
  LOW: 1,
  BACKGROUND: 0
};

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class MedinaMessage {
  constructor(type, payload, options = {}) {
    this.id = options.id || crypto.randomUUID();
    this.type = type;
    this.payload = payload;
    this.sender = options.sender || 'unknown';
    this.recipient = options.recipient || '*';
    this.priority = options.priority || Priority.NORMAL;
    this.correlationId = options.correlationId || null;
    this.timestamp = Date.now();
    this.ttl = options.ttl || 30000;
    this.signature = null;
  }

  sign(secret) {
    const data = JSON.stringify({
      id: this.id,
      type: this.type,
      payload: this.payload,
      sender: this.sender,
      timestamp: this.timestamp
    });
    this.signature = crypto.createHmac('sha256', secret)
      .update(data)
      .digest('hex');
    return this;
  }

  verify(secret) {
    const expected = crypto.createHmac('sha256', secret)
      .update(JSON.stringify({
        id: this.id,
        type: this.type,
        payload: this.payload,
        sender: this.sender,
        timestamp: this.timestamp
      }))
      .digest('hex');
    return this.signature === expected;
  }

  isExpired() {
    return Date.now() - this.timestamp > this.ttl;
  }

  phiWeight() {
    const age = (Date.now() - this.timestamp) / 1000;
    const priorityWeight = Math.pow(PHI, this.priority);
    const decayFactor = Math.exp(-age / (PHI * 10));
    return priorityWeight * decayFactor;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      payload: this.payload,
      sender: this.sender,
      recipient: this.recipient,
      priority: this.priority,
      correlationId: this.correlationId,
      timestamp: this.timestamp,
      ttl: this.ttl,
      signature: this.signature
    };
  }

  static fromJSON(json) {
    const msg = new MedinaMessage(json.type, json.payload, {
      id: json.id,
      sender: json.sender,
      recipient: json.recipient,
      priority: json.priority,
      correlationId: json.correlationId,
      ttl: json.ttl
    });
    msg.timestamp = json.timestamp;
    msg.signature = json.signature;
    return msg;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIORITY QUEUE
// ═══════════════════════════════════════════════════════════════════════════

class PhiPriorityQueue {
  constructor() {
    this.heap = [];
  }

  enqueue(message) {
    this.heap.push(message);
    this._bubbleUp(this.heap.length - 1);
  }

  dequeue() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const top = this.heap[0];
    this.heap[0] = this.heap.pop();
    this._bubbleDown(0);
    return top;
  }

  peek() {
    return this.heap[0] || null;
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this._compare(this.heap[index], this.heap[parent]) <= 0) break;
      [this.heap[index], this.heap[parent]] = [this.heap[parent], this.heap[index]];
      index = parent;
    }
  }

  _bubbleDown(index) {
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let largest = index;

      if (left < this.heap.length && this._compare(this.heap[left], this.heap[largest]) > 0) {
        largest = left;
      }
      if (right < this.heap.length && this._compare(this.heap[right], this.heap[largest]) > 0) {
        largest = right;
      }

      if (largest === index) break;
      [this.heap[index], this.heap[largest]] = [this.heap[largest], this.heap[index]];
      index = largest;
    }
  }

  _compare(a, b) {
    return a.phiWeight() - b.phiWeight();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CHANNEL CLASS
// ═══════════════════════════════════════════════════════════════════════════

class MedinaChannel extends EventEmitter {
  constructor(id, options = {}) {
    super();
    this.id = id;
    this.secret = options.secret || crypto.randomBytes(32).toString('hex');
    this.queue = new PhiPriorityQueue();
    this.subscribers = new Map();
    this.pendingRequests = new Map();
    this.messageLog = [];
    this.maxLogSize = options.maxLogSize || 1000;
    this.processing = false;
  }

  send(message) {
    if (!(message instanceof MedinaMessage)) {
      message = new MedinaMessage(MessageType.EVENT, message);
    }

    message.sign(this.secret);
    this.queue.enqueue(message);
    this._logMessage(message, 'queued');

    if (!this.processing) {
      this._processQueue();
    }

    return message.id;
  }

  async request(payload, options = {}) {
    const message = new MedinaMessage(MessageType.REQUEST, payload, {
      sender: options.sender || this.id,
      recipient: options.recipient,
      priority: options.priority || Priority.NORMAL,
      ttl: options.timeout || 30000
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(message.id);
        reject(new Error(`Request ${message.id} timed out`));
      }, message.ttl);

      this.pendingRequests.set(message.id, {
        resolve: (response) => {
          clearTimeout(timeout);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: Date.now()
      });

      this.send(message);
    });
  }

  respond(correlationId, payload, options = {}) {
    const message = new MedinaMessage(MessageType.RESPONSE, payload, {
      correlationId,
      sender: options.sender || this.id,
      priority: options.priority || Priority.HIGH
    });

    return this.send(message);
  }

  subscribe(topic, handler) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic).add(handler);

    return () => {
      this.subscribers.get(topic).delete(handler);
    };
  }

  broadcast(payload, topic = '*') {
    const message = new MedinaMessage(MessageType.BROADCAST, payload, {
      sender: this.id,
      recipient: topic
    });

    return this.send(message);
  }

  async _processQueue() {
    this.processing = true;

    while (!this.queue.isEmpty()) {
      const message = this.queue.dequeue();

      if (message.isExpired()) {
        this._logMessage(message, 'expired');
        continue;
      }

      if (!message.verify(this.secret)) {
        this._logMessage(message, 'invalid_signature');
        continue;
      }

      await this._deliverMessage(message);
    }

    this.processing = false;
  }

  async _deliverMessage(message) {
    this._logMessage(message, 'delivered');

    // Handle response to pending request
    if (message.type === MessageType.RESPONSE && message.correlationId) {
      const pending = this.pendingRequests.get(message.correlationId);
      if (pending) {
        this.pendingRequests.delete(message.correlationId);
        pending.resolve(message.payload);
        return;
      }
    }

    // Deliver to subscribers
    const topic = message.recipient;
    const handlers = [];

    if (this.subscribers.has(topic)) {
      handlers.push(...this.subscribers.get(topic));
    }
    if (topic !== '*' && this.subscribers.has('*')) {
      handlers.push(...this.subscribers.get('*'));
    }

    for (const handler of handlers) {
      try {
        await handler(message);
      } catch (error) {
        this.emit('error', { message, error });
      }
    }

    this.emit('message', message);
  }

  _logMessage(message, status) {
    this.messageLog.push({
      id: message.id,
      type: message.type,
      status,
      timestamp: Date.now()
    });

    if (this.messageLog.length > this.maxLogSize) {
      this.messageLog.shift();
    }
  }

  stats() {
    const now = Date.now();
    const recentLogs = this.messageLog.filter(l => now - l.timestamp < 60000);

    return {
      channelId: this.id,
      queueSize: this.queue.size(),
      pendingRequests: this.pendingRequests.size,
      subscriberTopics: this.subscribers.size,
      totalSubscribers: Array.from(this.subscribers.values())
        .reduce((sum, set) => sum + set.size, 0),
      messagesLastMinute: recentLogs.length,
      deliveredLastMinute: recentLogs.filter(l => l.status === 'delivered').length,
      expiredLastMinute: recentLogs.filter(l => l.status === 'expired').length
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CALL ROUTER
// ═══════════════════════════════════════════════════════════════════════════

class MedinaCallRouter extends EventEmitter {
  constructor() {
    super();
    this.channels = new Map();
    this.routes = new Map();
    this.middleware = [];
  }

  createChannel(id, options = {}) {
    if (this.channels.has(id)) {
      throw new Error(`Channel ${id} already exists`);
    }

    const channel = new MedinaChannel(id, options);
    this.channels.set(id, channel);

    channel.on('message', (msg) => this._routeMessage(msg));
    channel.on('error', (err) => this.emit('error', err));

    return channel;
  }

  getChannel(id) {
    return this.channels.get(id);
  }

  removeChannel(id) {
    const channel = this.channels.get(id);
    if (channel) {
      channel.removeAllListeners();
      this.channels.delete(id);
      return true;
    }
    return false;
  }

  route(pattern, handler) {
    this.routes.set(pattern, handler);
  }

  use(middleware) {
    this.middleware.push(middleware);
  }

  async _routeMessage(message) {
    // Apply middleware
    for (const mw of this.middleware) {
      const shouldContinue = await mw(message);
      if (shouldContinue === false) return;
    }

    // Find matching route
    for (const [pattern, handler] of this.routes) {
      if (this._matchPattern(message.recipient, pattern)) {
        await handler(message);
        return;
      }
    }
  }

  _matchPattern(recipient, pattern) {
    if (pattern === '*') return true;
    if (pattern === recipient) return true;
    if (pattern.endsWith('*')) {
      return recipient.startsWith(pattern.slice(0, -1));
    }
    return false;
  }

  stats() {
    const channelStats = {};
    for (const [id, channel] of this.channels) {
      channelStats[id] = channel.stats();
    }

    return {
      channelCount: this.channels.size,
      routeCount: this.routes.size,
      middlewareCount: this.middleware.length,
      channels: channelStats
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RPC HANDLER
// ═══════════════════════════════════════════════════════════════════════════

class MedinaRPC {
  constructor(channel) {
    this.channel = channel;
    this.methods = new Map();

    this.channel.subscribe('*', async (msg) => {
      if (msg.type === MessageType.REQUEST && msg.payload.method) {
        await this._handleRPC(msg);
      }
    });
  }

  register(method, handler) {
    this.methods.set(method, handler);
  }

  async call(method, params = {}, options = {}) {
    return this.channel.request({
      method,
      params
    }, options);
  }

  async _handleRPC(message) {
    const { method, params } = message.payload;
    const handler = this.methods.get(method);

    if (!handler) {
      this.channel.respond(message.id, {
        error: `Method ${method} not found`
      });
      return;
    }

    try {
      const result = await handler(params, message);
      this.channel.respond(message.id, { result });
    } catch (error) {
      this.channel.respond(message.id, {
        error: error.message
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  MessageType,
  Priority,
  MedinaMessage,
  PhiPriorityQueue,
  MedinaChannel,
  MedinaCallRouter,
  MedinaRPC
};
