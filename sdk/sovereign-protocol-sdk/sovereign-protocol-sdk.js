/**
 * SOVEREIGN PROTOCOL SDK
 * RSHIP-2026-SOVEREIGN-PROTOCOL-001
 *
 * Sovereign Protocol SDK provides protocol definition and execution
 * frameworks for AGI coordination. Implements φ-weighted consensus,
 * state machines, and protocol composition.
 *
 * @module sovereign-protocol-sdk
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');
const crypto = require('crypto');

const PHI = (1 + Math.sqrt(5)) / 2;

// ═══════════════════════════════════════════════════════════════════════════
// PROTOCOL STATE
// ═══════════════════════════════════════════════════════════════════════════

const ProtocolState = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SUSPENDED: 'suspended'
};

// ═══════════════════════════════════════════════════════════════════════════
// PROTOCOL MESSAGE
// ═══════════════════════════════════════════════════════════════════════════

class ProtocolMessage {
  constructor(type, payload, options = {}) {
    this.id = crypto.randomUUID();
    this.type = type;
    this.payload = payload;
    this.sender = options.sender;
    this.recipient = options.recipient;
    this.protocolId = options.protocolId;
    this.sequence = options.sequence || 0;
    this.timestamp = Date.now();
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

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      payload: this.payload,
      sender: this.sender,
      recipient: this.recipient,
      protocolId: this.protocolId,
      sequence: this.sequence,
      timestamp: this.timestamp,
      signature: this.signature
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE MACHINE
// ═══════════════════════════════════════════════════════════════════════════

class ProtocolStateMachine {
  constructor(initialState) {
    this.currentState = initialState;
    this.transitions = new Map();
    this.guards = new Map();
    this.actions = new Map();
    this.history = [];
  }

  addTransition(from, event, to, options = {}) {
    const key = `${from}:${event}`;
    this.transitions.set(key, {
      from,
      event,
      to,
      guard: options.guard,
      action: options.action
    });
    return this;
  }

  addGuard(name, fn) {
    this.guards.set(name, fn);
    return this;
  }

  addAction(name, fn) {
    this.actions.set(name, fn);
    return this;
  }

  can(event, context = {}) {
    const key = `${this.currentState}:${event}`;
    const transition = this.transitions.get(key);

    if (!transition) return false;

    if (transition.guard) {
      const guardFn = this.guards.get(transition.guard);
      if (guardFn && !guardFn(context)) return false;
    }

    return true;
  }

  async trigger(event, context = {}) {
    if (!this.can(event, context)) {
      return { success: false, reason: 'Transition not allowed' };
    }

    const key = `${this.currentState}:${event}`;
    const transition = this.transitions.get(key);
    const previousState = this.currentState;

    // Execute action if present
    if (transition.action) {
      const actionFn = this.actions.get(transition.action);
      if (actionFn) {
        await actionFn(context);
      }
    }

    this.currentState = transition.to;
    this.history.push({
      from: previousState,
      event,
      to: this.currentState,
      timestamp: Date.now()
    });

    return {
      success: true,
      from: previousState,
      to: this.currentState
    };
  }

  getState() {
    return this.currentState;
  }

  getHistory() {
    return [...this.history];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROTOCOL DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

class ProtocolDefinition {
  constructor(id, name, options = {}) {
    this.id = id;
    this.name = name;
    this.version = options.version || '1.0.0';
    this.description = options.description || '';
    this.participants = options.participants || [];
    this.states = options.states || [];
    this.transitions = options.transitions || [];
    this.messages = options.messages || [];
    this.invariants = options.invariants || [];
    this.metadata = options.metadata || {};
    this.created = Date.now();
  }

  addParticipant(role, options = {}) {
    this.participants.push({
      role,
      minCount: options.minCount || 1,
      maxCount: options.maxCount || Infinity,
      capabilities: options.capabilities || []
    });
    return this;
  }

  addState(name, options = {}) {
    this.states.push({
      name,
      initial: options.initial || false,
      final: options.final || false,
      timeout: options.timeout
    });
    return this;
  }

  addTransition(from, to, trigger, options = {}) {
    this.transitions.push({
      from,
      to,
      trigger,
      guard: options.guard,
      action: options.action
    });
    return this;
  }

  addMessage(name, schema) {
    this.messages.push({ name, schema });
    return this;
  }

  addInvariant(name, condition) {
    this.invariants.push({ name, condition });
    return this;
  }

  validate() {
    const errors = [];

    // Check for initial state
    const hasInitial = this.states.some(s => s.initial);
    if (!hasInitial) {
      errors.push('No initial state defined');
    }

    // Check transitions reference valid states
    for (const t of this.transitions) {
      if (!this.states.find(s => s.name === t.from)) {
        errors.push(`Transition references unknown state: ${t.from}`);
      }
      if (!this.states.find(s => s.name === t.to)) {
        errors.push(`Transition references unknown state: ${t.to}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  toStateMachine() {
    const initial = this.states.find(s => s.initial);
    const sm = new ProtocolStateMachine(initial ? initial.name : null);

    for (const t of this.transitions) {
      sm.addTransition(t.from, t.trigger, t.to, {
        guard: t.guard,
        action: t.action
      });
    }

    return sm;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      description: this.description,
      participants: this.participants,
      states: this.states,
      transitions: this.transitions,
      messages: this.messages,
      invariants: this.invariants,
      metadata: this.metadata,
      created: this.created
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROTOCOL INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

class ProtocolInstance extends EventEmitter {
  constructor(definition, options = {}) {
    super();
    this.id = crypto.randomUUID();
    this.definition = definition;
    this.state = ProtocolState.DRAFT;
    this.stateMachine = definition.toStateMachine();
    this.participants = new Map();
    this.messageLog = [];
    this.context = options.context || {};
    this.created = Date.now();
    this.started = null;
    this.completed = null;
  }

  join(participantId, role) {
    const roleSpec = this.definition.participants.find(p => p.role === role);
    if (!roleSpec) {
      return { success: false, reason: `Unknown role: ${role}` };
    }

    const currentCount = Array.from(this.participants.values())
      .filter(p => p.role === role).length;

    if (currentCount >= roleSpec.maxCount) {
      return { success: false, reason: 'Role capacity exceeded' };
    }

    this.participants.set(participantId, {
      role,
      joined: Date.now(),
      active: true
    });

    this.emit('participant-joined', { participantId, role });
    return { success: true };
  }

  leave(participantId) {
    const participant = this.participants.get(participantId);
    if (!participant) return false;

    participant.active = false;
    this.emit('participant-left', { participantId });
    return true;
  }

  start() {
    if (this.state !== ProtocolState.DRAFT) {
      return { success: false, reason: 'Protocol already started' };
    }

    // Check minimum participants
    for (const spec of this.definition.participants) {
      const count = Array.from(this.participants.values())
        .filter(p => p.role === spec.role && p.active).length;

      if (count < spec.minCount) {
        return { success: false, reason: `Insufficient ${spec.role} participants` };
      }
    }

    this.state = ProtocolState.ACTIVE;
    this.started = Date.now();
    this.emit('started');
    return { success: true };
  }

  async sendMessage(message) {
    if (this.state !== ProtocolState.ACTIVE && this.state !== ProtocolState.EXECUTING) {
      return { success: false, reason: 'Protocol not active' };
    }

    // Validate sender is participant
    if (!this.participants.has(message.sender)) {
      return { success: false, reason: 'Sender not a participant' };
    }

    message.protocolId = this.id;
    message.sequence = this.messageLog.length;

    this.messageLog.push(message);
    this.emit('message', message);

    // Check if message triggers transition
    const result = await this.stateMachine.trigger(message.type, {
      message,
      context: this.context
    });

    if (result.success) {
      this.emit('state-change', {
        from: result.from,
        to: result.to,
        trigger: message.type
      });

      // Check if final state
      const currentState = this.definition.states.find(
        s => s.name === this.stateMachine.getState()
      );

      if (currentState && currentState.final) {
        this.complete();
      }
    }

    return { success: true, transition: result };
  }

  complete() {
    this.state = ProtocolState.COMPLETED;
    this.completed = Date.now();
    this.emit('completed');
  }

  fail(reason) {
    this.state = ProtocolState.FAILED;
    this.completed = Date.now();
    this.emit('failed', { reason });
  }

  status() {
    return {
      id: this.id,
      definitionId: this.definition.id,
      state: this.state,
      currentState: this.stateMachine.getState(),
      participantCount: this.participants.size,
      messageCount: this.messageLog.length,
      started: this.started,
      completed: this.completed
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROTOCOL REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

class ProtocolRegistry extends EventEmitter {
  constructor() {
    super();
    this.definitions = new Map();
    this.instances = new Map();
  }

  register(definition) {
    const validation = definition.validate();
    if (!validation.valid) {
      throw new Error(`Invalid protocol: ${validation.errors.join(', ')}`);
    }

    this.definitions.set(definition.id, definition);
    this.emit('registered', { id: definition.id });
    return definition;
  }

  get(id) {
    return this.definitions.get(id) || null;
  }

  createInstance(definitionId, options = {}) {
    const definition = this.definitions.get(definitionId);
    if (!definition) {
      throw new Error(`Protocol not found: ${definitionId}`);
    }

    const instance = new ProtocolInstance(definition, options);
    this.instances.set(instance.id, instance);
    this.emit('instance-created', { instanceId: instance.id, definitionId });
    return instance;
  }

  getInstance(id) {
    return this.instances.get(id) || null;
  }

  status() {
    return {
      definitions: this.definitions.size,
      activeInstances: Array.from(this.instances.values())
        .filter(i => i.state === ProtocolState.ACTIVE).length,
      totalInstances: this.instances.size
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  ProtocolState,
  ProtocolMessage,
  ProtocolStateMachine,
  ProtocolDefinition,
  ProtocolInstance,
  ProtocolRegistry
};
