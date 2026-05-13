/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║             M E D I N A   H E A R T B E A T   M O D U L E                   ║
 * ║                     Sovereign Pulse at F(7)=13 Hz                           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * medina_heartbeat_mod.js
 * 
 * Continuous pulse generation and synchronization for sovereign operation
 */

'use strict';

const { EventEmitter } = require('events');
const { getFloat, getNat, phiHash, emaUpdate } = require('./math_database_mod');

const PHI = getFloat('PHI');
const F7 = getNat('F7');   // 13
const F11 = getNat('F11'); // 89

class MedinaHeartbeat extends EventEmitter {
  constructor() {
    super();
    this.name = 'MEDINA-HEARTBEAT';
    this.frequency = F7; // 13 Hz
    this.period = 1000 / this.frequency; // ~77ms
    this.beatCount = 0;
    this.started = null;
    this.intervalId = null;
    this.subscribers = new Map();
    this.emaLatency = 0;
    this.health = { beats: 0, missed: 0, jitter: 0 };
  }

  start() {
    if (this.intervalId) return false;
    
    this.started = Date.now();
    let lastBeat = this.started;
    
    this.intervalId = setInterval(() => {
      const now = Date.now();
      const actualPeriod = now - lastBeat;
      lastBeat = now;
      
      this.beatCount++;
      this.health.beats++;
      
      // Track jitter
      const jitter = Math.abs(actualPeriod - this.period);
      this.health.jitter = emaUpdate(this.health.jitter, jitter, PHI);
      
      const pulse = {
        beat: this.beatCount,
        timestamp: now,
        uptime: now - this.started,
        hash: phiHash(this.beatCount),
        jitter
      };
      
      this.emit('pulse', pulse);
      this.notifySubscribers(pulse);
    }, this.period);
    
    this.emit('started', { frequency: this.frequency, period: this.period });
    return true;
  }

  stop() {
    if (!this.intervalId) return false;
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.emit('stopped', { totalBeats: this.beatCount, uptime: Date.now() - this.started });
    return true;
  }

  subscribe(id, callback) {
    this.subscribers.set(id, callback);
    return id;
  }

  unsubscribe(id) {
    return this.subscribers.delete(id);
  }

  notifySubscribers(pulse) {
    for (const [id, callback] of this.subscribers) {
      try {
        callback(pulse);
      } catch (err) {
        this.emit('subscriber-error', { id, error: err.message });
      }
    }
  }

  status() {
    return {
      name: this.name,
      running: !!this.intervalId,
      frequency: this.frequency,
      beatCount: this.beatCount,
      uptime: this.started ? Date.now() - this.started : 0,
      subscriberCount: this.subscribers.size,
      health: this.health
    };
  }
}

module.exports = { MedinaHeartbeat };

if (require.main === module) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  MEDINA HEARTBEAT - Sovereign Pulse at F(7)=13 Hz');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const heartbeat = new MedinaHeartbeat();
  
  heartbeat.subscribe('demo', (pulse) => {
    if (pulse.beat % 13 === 0) {
      console.log(`💓 Pulse #${pulse.beat} | Jitter: ${pulse.jitter.toFixed(2)}ms`);
    }
  });
  
  console.log('Starting heartbeat...');
  heartbeat.start();
  
  setTimeout(() => {
    heartbeat.stop();
    console.log('\n📊 Final Status:', heartbeat.status());
    console.log('\n✅ MEDINA HEARTBEAT operational!\n');
    process.exit(0);
  }, 1000);
}
