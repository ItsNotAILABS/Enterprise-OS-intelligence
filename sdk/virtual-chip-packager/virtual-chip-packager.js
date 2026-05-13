/**
 * VIRTUAL CHIP PACKAGER SDK
 * RSHIP-2026-VIRTUAL-CHIP-001
 *
 * Virtual Chip Packager provides abstraction layer for packaging AGI
 * cognitive modules into deployable virtual chip units. Implements
 * φ-weighted optimization and module composition.
 *
 * @module virtual-chip-packager
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');
const crypto = require('crypto');

const PHI = (1 + Math.sqrt(5)) / 2;

// ═══════════════════════════════════════════════════════════════════════════
// CHIP TYPES
// ═══════════════════════════════════════════════════════════════════════════

const ChipType = {
  COGNITIVE: 'cognitive',
  MEMORY: 'memory',
  COMPUTE: 'compute',
  INTERFACE: 'interface',
  ROUTER: 'router'
};

const ChipState = {
  DRAFT: 'draft',
  COMPILED: 'compiled',
  OPTIMIZED: 'optimized',
  DEPLOYED: 'deployed',
  DEPRECATED: 'deprecated'
};

// ═══════════════════════════════════════════════════════════════════════════
// VIRTUAL PIN
// ═══════════════════════════════════════════════════════════════════════════

class VirtualPin {
  constructor(name, direction, dataType = 'any') {
    this.name = name;
    this.direction = direction; // 'input' | 'output' | 'bidirectional'
    this.dataType = dataType;
    this.connected = false;
    this.connection = null;
    this.buffer = null;
  }

  connect(otherPin) {
    if (this.direction === 'input' && otherPin.direction === 'output') {
      this.connection = otherPin;
      this.connected = true;
      otherPin.connected = true;
      return true;
    }
    if (this.direction === 'output' && otherPin.direction === 'input') {
      otherPin.connection = this;
      this.connected = true;
      otherPin.connected = true;
      return true;
    }
    return false;
  }

  disconnect() {
    if (this.connection) {
      this.connection.connected = false;
      this.connection.connection = null;
    }
    this.connected = false;
    this.connection = null;
  }

  write(data) {
    if (this.direction === 'input') {
      throw new Error('Cannot write to input pin');
    }
    this.buffer = data;
    return this;
  }

  read() {
    if (this.direction === 'output') {
      throw new Error('Cannot read from output pin');
    }
    if (this.connection) {
      return this.connection.buffer;
    }
    return this.buffer;
  }

  toJSON() {
    return {
      name: this.name,
      direction: this.direction,
      dataType: this.dataType,
      connected: this.connected
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VIRTUAL CHIP
// ═══════════════════════════════════════════════════════════════════════════

class VirtualChip extends EventEmitter {
  constructor(id, type, options = {}) {
    super();
    this.id = id;
    this.type = type;
    this.version = options.version || '1.0.0';
    this.state = ChipState.DRAFT;
    this.pins = new Map();
    this.modules = new Map();
    this.parameters = new Map(Object.entries(options.parameters || {}));
    this.processor = options.processor || null;
    this.metadata = options.metadata || {};
    this.created = Date.now();
    this.compiled = null;
    this.hash = null;
  }

  addPin(name, direction, dataType = 'any') {
    const pin = new VirtualPin(name, direction, dataType);
    this.pins.set(name, pin);
    return pin;
  }

  getPin(name) {
    return this.pins.get(name) || null;
  }

  addModule(name, module) {
    this.modules.set(name, module);
    return this;
  }

  setParameter(name, value) {
    this.parameters.set(name, value);
    return this;
  }

  getParameter(name) {
    return this.parameters.get(name);
  }

  setProcessor(fn) {
    this.processor = fn;
    return this;
  }

  compile() {
    if (this.state !== ChipState.DRAFT) {
      throw new Error(`Cannot compile chip in state: ${this.state}`);
    }

    // Validate pins
    const inputPins = Array.from(this.pins.values())
      .filter(p => p.direction === 'input');
    const outputPins = Array.from(this.pins.values())
      .filter(p => p.direction === 'output');

    if (inputPins.length === 0 && outputPins.length === 0) {
      throw new Error('Chip must have at least one pin');
    }

    // Generate hash
    this.hash = this._computeHash();
    this.state = ChipState.COMPILED;
    this.compiled = Date.now();
    this.emit('compiled', { id: this.id });

    return this;
  }

  optimize() {
    if (this.state !== ChipState.COMPILED) {
      throw new Error('Chip must be compiled before optimization');
    }

    // φ-weighted parameter optimization
    for (const [name, value] of this.parameters) {
      if (typeof value === 'number') {
        // Apply golden ratio scaling for optimization hints
        const optimized = value * (PHI / (PHI + 1));
        this.parameters.set(name, optimized);
      }
    }

    this.state = ChipState.OPTIMIZED;
    this.emit('optimized', { id: this.id });
    return this;
  }

  async process(inputs = {}) {
    if (this.state === ChipState.DRAFT) {
      throw new Error('Chip must be compiled before processing');
    }

    // Write to input pins
    for (const [name, value] of Object.entries(inputs)) {
      const pin = this.pins.get(name);
      if (pin && pin.direction === 'input') {
        pin.buffer = value;
      }
    }

    // Execute processor
    let outputs = {};
    if (this.processor) {
      const inputData = {};
      for (const [name, pin] of this.pins) {
        if (pin.direction === 'input') {
          inputData[name] = pin.read();
        }
      }

      outputs = await this.processor(inputData, this.parameters, this.modules);
    }

    // Write to output pins
    for (const [name, value] of Object.entries(outputs)) {
      const pin = this.pins.get(name);
      if (pin && pin.direction === 'output') {
        pin.write(value);
      }
    }

    this.emit('processed', { id: this.id, inputs, outputs });
    return outputs;
  }

  _computeHash() {
    const data = JSON.stringify({
      id: this.id,
      type: this.type,
      version: this.version,
      pins: Array.from(this.pins.keys()),
      parameters: Object.fromEntries(this.parameters),
      created: this.created
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  clone() {
    const cloned = new VirtualChip(this.id + '_clone', this.type, {
      version: this.version,
      parameters: Object.fromEntries(this.parameters),
      metadata: { ...this.metadata }
    });

    for (const [name, pin] of this.pins) {
      cloned.addPin(name, pin.direction, pin.dataType);
    }

    for (const [name, module] of this.modules) {
      cloned.addModule(name, module);
    }

    cloned.processor = this.processor;
    return cloned;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      version: this.version,
      state: this.state,
      pins: Array.from(this.pins.values()).map(p => p.toJSON()),
      parameters: Object.fromEntries(this.parameters),
      moduleCount: this.modules.size,
      hash: this.hash,
      created: this.created,
      compiled: this.compiled
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CHIP PACKAGE
// ═══════════════════════════════════════════════════════════════════════════

class ChipPackage {
  constructor(name, options = {}) {
    this.name = name;
    this.version = options.version || '1.0.0';
    this.chips = new Map();
    this.connections = [];
    this.exposedPins = new Map();
    this.metadata = options.metadata || {};
    this.compiled = false;
    this.hash = null;
  }

  addChip(chip) {
    this.chips.set(chip.id, chip);
    return this;
  }

  connect(sourceChipId, sourcePin, targetChipId, targetPin) {
    const sourceChip = this.chips.get(sourceChipId);
    const targetChip = this.chips.get(targetChipId);

    if (!sourceChip || !targetChip) {
      throw new Error('Chip not found');
    }

    const sPin = sourceChip.getPin(sourcePin);
    const tPin = targetChip.getPin(targetPin);

    if (!sPin || !tPin) {
      throw new Error('Pin not found');
    }

    if (sPin.connect(tPin)) {
      this.connections.push({
        source: { chip: sourceChipId, pin: sourcePin },
        target: { chip: targetChipId, pin: targetPin }
      });
      return true;
    }

    return false;
  }

  expose(chipId, pinName, exposedName) {
    const chip = this.chips.get(chipId);
    if (!chip) throw new Error(`Chip ${chipId} not found`);

    const pin = chip.getPin(pinName);
    if (!pin) throw new Error(`Pin ${pinName} not found`);

    this.exposedPins.set(exposedName, { chip: chipId, pin: pinName });
    return this;
  }

  compile() {
    for (const [, chip] of this.chips) {
      if (chip.state === ChipState.DRAFT) {
        chip.compile();
      }
    }

    this.hash = this._computeHash();
    this.compiled = true;
    return this;
  }

  async process(inputs = {}) {
    // Route inputs to exposed pins
    for (const [name, value] of Object.entries(inputs)) {
      const exposed = this.exposedPins.get(name);
      if (exposed) {
        const chip = this.chips.get(exposed.chip);
        const pin = chip.getPin(exposed.pin);
        if (pin && pin.direction === 'input') {
          pin.buffer = value;
        }
      }
    }

    // Process chips in dependency order (simplified: process all)
    for (const [, chip] of this.chips) {
      await chip.process({});
    }

    // Collect outputs from exposed output pins
    const outputs = {};
    for (const [name, exposed] of this.exposedPins) {
      const chip = this.chips.get(exposed.chip);
      const pin = chip.getPin(exposed.pin);
      if (pin && pin.direction === 'output') {
        outputs[name] = pin.buffer;
      }
    }

    return outputs;
  }

  _computeHash() {
    const data = JSON.stringify({
      name: this.name,
      version: this.version,
      chips: Array.from(this.chips.keys()),
      connections: this.connections
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  toJSON() {
    return {
      name: this.name,
      version: this.version,
      chipCount: this.chips.size,
      connectionCount: this.connections.length,
      exposedPins: Array.from(this.exposedPins.keys()),
      compiled: this.compiled,
      hash: this.hash
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CHIP FACTORY
// ═══════════════════════════════════════════════════════════════════════════

class ChipFactory {
  constructor() {
    this.templates = new Map();
  }

  registerTemplate(name, template) {
    this.templates.set(name, template);
  }

  create(templateName, id, options = {}) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const chip = new VirtualChip(id, template.type, {
      ...template.options,
      ...options
    });

    // Add pins from template
    for (const pin of template.pins || []) {
      chip.addPin(pin.name, pin.direction, pin.dataType);
    }

    // Set processor from template
    if (template.processor) {
      chip.setProcessor(template.processor);
    }

    return chip;
  }

  createCognitive(id, processor, options = {}) {
    const chip = new VirtualChip(id, ChipType.COGNITIVE, options);
    chip.addPin('input', 'input', 'tensor');
    chip.addPin('output', 'output', 'tensor');
    chip.setProcessor(processor);
    return chip;
  }

  createMemory(id, capacity, options = {}) {
    const chip = new VirtualChip(id, ChipType.MEMORY, options);
    chip.addPin('read', 'input', 'address');
    chip.addPin('write', 'input', 'data');
    chip.addPin('output', 'output', 'data');
    chip.setParameter('capacity', capacity);
    return chip;
  }

  createRouter(id, routes, options = {}) {
    const chip = new VirtualChip(id, ChipType.ROUTER, options);
    chip.addPin('input', 'input', 'any');

    for (const route of routes) {
      chip.addPin(route, 'output', 'any');
    }

    return chip;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  ChipType,
  ChipState,
  VirtualPin,
  VirtualChip,
  ChipPackage,
  ChipFactory
};
