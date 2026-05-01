/**
 * SENSUS — The Senses of the Civilization
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Latin: SENSUS (perception, feeling, sense, understanding)
 * 
 * SENSUS is the perception engine of the AI civilization. It:
 *   - Receives all inputs from the outside world
 *   - Processes signals from connected systems
 *   - Detects patterns and anomalies
 *   - Feeds processed perceptions to ANIMUS
 *
 * SENSUS runs AUTONOMOUSLY, constantly monitoring inputs.
 *
 * Theory basis:
 *   Paper XX — STIGMERGY: intelligence lives in the field between agents
 *   Paper II — CONCORDIA MACHINAE: Kuramoto synchronization
 *
 * Author: Alfredo Medina Hernandez · Medina Tech · Chaos Lab · Dallas TX
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { EventEmitter } from 'events';

// ══════════════════════════════════════════════════════════════════════════════
// SENSUS — THE SENSES
// ══════════════════════════════════════════════════════════════════════════════

export class SENSUS extends EventEmitter {
  /**
   * @param {object} options
   * @param {object} options.chrono - CHRONO instance for logging
   * @param {object} options.cerebex - CEREBEX for pattern recognition
   * @param {number} [options.senseIntervalMs=25] - How often SENSUS perceives (ms)
   */
  constructor({ chrono, cerebex, senseIntervalMs = 25 }) {
    super();
    
    /** @type {string} */
    this.name = 'SENSUS';
    
    /** @type {string} */
    this.latinMeaning = 'Perception, Feeling, The Senses';
    
    /** @type {object} */
    this._chrono = chrono;
    
    /** @type {object} */
    this._cerebex = cerebex;
    
    /** @type {number} */
    this._senseIntervalMs = senseIntervalMs;
    
    /** @type {boolean} */
    this._alive = false;
    
    /** @type {NodeJS.Timer|null} */
    this._senseLoop = null;
    
    /** @type {Map} Registered input channels */
    this._inputChannels = new Map();
    
    /** @type {Array} Perception buffer */
    this._perceptionBuffer = [];
    
    /** @type {Map} Pattern detectors */
    this._patternDetectors = new Map();
    
    /** @type {object} Sensory state */
    this._sensoryState = {
      perceptionCount: 0,
      signalCount: 0,
      anomalyCount: 0,
      lastPerception: null,
      activeChannels: 0,
    };
    
    // Register default pattern detectors
    this._registerDefaultDetectors();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Awaken SENSUS — start perceiving.
   */
  awaken() {
    if (this._alive) return { awakened: false, message: 'Already alive' };
    
    this._alive = true;
    this._log('SENSUS_AWAKENED', { senseIntervalMs: this._senseIntervalMs });
    
    // Start the autonomous perception loop
    this._senseLoop = setInterval(() => this._perceive(), this._senseIntervalMs);
    
    this.emit('awakened', { organ: 'SENSUS' });
    
    return { awakened: true, organ: 'SENSUS' };
  }

  /**
   * Put SENSUS to sleep.
   */
  sleep() {
    if (!this._alive) return { sleeping: false, message: 'Already sleeping' };
    
    this._alive = false;
    if (this._senseLoop) {
      clearInterval(this._senseLoop);
      this._senseLoop = null;
    }
    
    this._log('SENSUS_SLEEPING', { perceptionCount: this._sensoryState.perceptionCount });
    this.emit('sleeping', { organ: 'SENSUS' });
    
    return { sleeping: true, organ: 'SENSUS', totalPerceptions: this._sensoryState.perceptionCount };
  }

  /**
   * Check if SENSUS is alive.
   */
  isAlive() {
    return this._alive;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // INPUT CHANNELS
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Register an input channel.
   * 
   * @param {string} channelId - Unique channel identifier
   * @param {object} config
   * @param {string} config.type - Channel type (HTTP, WEBHOOK, STREAM, etc.)
   * @param {function} [config.processor] - Function to process raw input
   * @returns {{ registered: boolean, channelId: string }}
   */
  registerChannel(channelId, config) {
    this._inputChannels.set(channelId, {
      channelId,
      type: config.type,
      processor: config.processor || ((x) => x),
      registeredAt: new Date().toISOString(),
      signalCount: 0,
      active: true,
    });
    
    this._sensoryState.activeChannels++;
    this._log('CHANNEL_REGISTERED', { channelId, type: config.type });
    
    return { registered: true, channelId };
  }

  /**
   * Receive a signal on a channel.
   * 
   * @param {string} channelId - Channel to receive on
   * @param {any} signal - The raw signal data
   * @returns {{ received: boolean, perceptionId: string }}
   */
  receive(channelId, signal) {
    const channel = this._inputChannels.get(channelId);
    
    if (!channel) {
      // Create ad-hoc channel
      this.registerChannel(channelId, { type: 'AD_HOC' });
    }
    
    const perceptionId = `PERCEPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const perception = {
      perceptionId,
      channelId,
      rawSignal: signal,
      receivedAt: new Date().toISOString(),
      processed: false,
    };
    
    this._perceptionBuffer.push(perception);
    this._sensoryState.signalCount++;
    
    if (channel) {
      channel.signalCount++;
    }
    
    return { received: true, perceptionId };
  }

  /**
   * Register a pattern detector.
   * 
   * @param {string} patternId - Pattern identifier
   * @param {object} config
   * @param {string} config.description - What the pattern detects
   * @param {function} config.detect - Function that returns true if pattern detected
   * @param {number} [config.priority=5] - Priority (1-10)
   */
  registerPatternDetector(patternId, config) {
    this._patternDetectors.set(patternId, {
      patternId,
      description: config.description,
      detect: config.detect,
      priority: config.priority || 5,
      detectionCount: 0,
    });
    
    this._log('PATTERN_DETECTOR_REGISTERED', { patternId, description: config.description });
    
    return { registered: true, patternId };
  }

  /**
   * Get sensory state.
   */
  getSensoryState() {
    return {
      ...this._sensoryState,
      bufferLength: this._perceptionBuffer.length,
      channelCount: this._inputChannels.size,
      detectorCount: this._patternDetectors.size,
      isAlive: this._alive,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PRIVATE — AUTONOMOUS PERCEPTION LOOP
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * The core perception function — runs autonomously.
   * @private
   */
  _perceive() {
    if (!this._alive) return;
    
    this._sensoryState.perceptionCount++;
    
    // Process perception buffer
    while (this._perceptionBuffer.length > 0) {
      const perception = this._perceptionBuffer.shift();
      this._processPerception(perception);
    }
    
    // Update state
    this._sensoryState.lastPerception = new Date().toISOString();
    
    // Emit heartbeat every 400 perceptions
    if (this._sensoryState.perceptionCount % 400 === 0) {
      this.emit('heartbeat', { organ: 'SENSUS', perceptionCount: this._sensoryState.perceptionCount });
    }
  }

  /**
   * Process a single perception.
   * @private
   */
  _processPerception(perception) {
    const channel = this._inputChannels.get(perception.channelId);
    
    // Apply channel processor
    if (channel?.processor) {
      try {
        perception.processedSignal = channel.processor(perception.rawSignal);
      } catch (e) {
        perception.processedSignal = perception.rawSignal;
        perception.processingError = e.message;
      }
    } else {
      perception.processedSignal = perception.rawSignal;
    }
    
    perception.processed = true;
    perception.processedAt = new Date().toISOString();
    
    // Run pattern detection
    const detectedPatterns = [];
    for (const [patternId, detector] of this._patternDetectors) {
      try {
        if (detector.detect(perception.processedSignal)) {
          detectedPatterns.push(patternId);
          detector.detectionCount++;
          
          // Check for anomaly patterns
          if (patternId.includes('ANOMALY')) {
            this._sensoryState.anomalyCount++;
            this.emit('anomaly_detected', { perceptionId: perception.perceptionId, patternId });
          }
        }
      } catch (e) {
        // Pattern detection failed, continue
      }
    }
    
    perception.detectedPatterns = detectedPatterns;
    
    // Categorize using CEREBEX if available
    if (this._cerebex && typeof perception.processedSignal === 'string') {
      perception.categories = this._cerebex.score(perception.processedSignal).slice(0, 3);
    }
    
    // Emit perception processed
    this.emit('perception', {
      perceptionId: perception.perceptionId,
      channelId: perception.channelId,
      signal: perception.processedSignal,
      patterns: detectedPatterns,
      categories: perception.categories,
    });
    
    this._log('PERCEPTION_PROCESSED', { 
      perceptionId: perception.perceptionId, 
      channelId: perception.channelId,
      patternsDetected: detectedPatterns.length,
    });
  }

  /**
   * Register default pattern detectors.
   * @private
   */
  _registerDefaultDetectors() {
    // Error pattern
    this.registerPatternDetector('ANOMALY_ERROR', {
      description: 'Detects error signals',
      detect: (signal) => {
        const str = JSON.stringify(signal).toLowerCase();
        return str.includes('error') || str.includes('fail') || str.includes('exception');
      },
      priority: 10,
    });
    
    // Spike pattern
    this.registerPatternDetector('ANOMALY_SPIKE', {
      description: 'Detects unusual spikes in numeric values',
      detect: (signal) => {
        if (typeof signal === 'number') {
          return signal > 1000 || signal < -1000;
        }
        return false;
      },
      priority: 8,
    });
    
    // Request pattern
    this.registerPatternDetector('REQUEST', {
      description: 'Detects incoming requests',
      detect: (signal) => {
        const str = JSON.stringify(signal).toLowerCase();
        return str.includes('request') || str.includes('query') || str.includes('ask');
      },
      priority: 5,
    });
    
    // Command pattern
    this.registerPatternDetector('COMMAND', {
      description: 'Detects commands',
      detect: (signal) => {
        const str = JSON.stringify(signal).toLowerCase();
        return str.includes('command') || str.includes('execute') || str.includes('do');
      },
      priority: 7,
    });
  }

  /**
   * Log to CHRONO.
   * @private
   */
  _log(type, data) {
    if (this._chrono) {
      this._chrono.append({ type, organ: 'SENSUS', ...data, timestamp: new Date().toISOString() });
    }
  }
}
