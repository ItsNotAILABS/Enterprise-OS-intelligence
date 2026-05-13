/**
 * RSHIP-CORE SDK
 * The foundational runtime for all RSHIP intelligence systems
 * 
 * RSHIP-2026-CORE-001 | Sovereign Intelligence Substrate
 * 
 * Provides:
 * - Entity registration and lifecycle management
 * - φ-based timing and synchronization
 * - Protocol composition and orchestration
 * - Event bus and message passing
 * - Health monitoring and diagnostics
 * 
 * @module sdk/rship-core
 * @version 1.0.0
 * @license RSHIP-SOVEREIGN
 */

'use strict';

const EventEmitter = require('events');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;
const PHI_SQ = PHI * PHI;
const SCHUMANN_HZ = 7.83;

// φ-ladder frequencies
const PHI_FREQUENCIES = {
    PHI_4: PHI * PHI * PHI * PHI,  // ~6.85 Hz
    PHI_3: PHI * PHI * PHI,        // ~4.24 Hz  
    PHI_2: PHI * PHI,              // ~2.62 Hz
    PHI_1: PHI,                    // ~1.62 Hz
    PHI_0: 1.0,
    PHI_NEG1: PHI_INV,             // ~0.618 Hz
    PHI_NEG2: PHI_INV * PHI_INV    // ~0.382 Hz
};

// Entity tiers
const ENTITY_TIERS = {
    SUBSTRATE: 0,    // Foundation (PHANTEX)
    CORE: 1,         // Infrastructure (this SDK)
    DOMAIN: 2,       // Domain-specific AGIs
    CONSUMER: 3,     // User-facing applications
    META: 4          // Meta-coordination
};

// ═══════════════════════════════════════════════════════════════════════════════
// ENTITY REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

class EntityRegistry {
    constructor() {
        this.entities = new Map();
        this.byTier = new Map();
        this.byType = new Map();
        this.dependencies = new Map();
        this.events = new EventEmitter();
        
        // Initialize tier maps
        for (const tier of Object.values(ENTITY_TIERS)) {
            this.byTier.set(tier, new Set());
        }
    }
    
    /**
     * Register a new entity
     */
    register(entity) {
        const id = entity.id || this._generateId(entity.name);
        
        const record = {
            id,
            name: entity.name,
            type: entity.type || 'SDK',
            tier: entity.tier || ENTITY_TIERS.DOMAIN,
            version: entity.version || '1.0.0',
            capabilities: entity.capabilities || [],
            protocols: entity.protocols || [],
            status: 'registered',
            registeredAt: Date.now(),
            instance: entity.instance || null,
            metadata: entity.metadata || {},
            phiAccumulated: 0
        };
        
        this.entities.set(id, record);
        this.byTier.get(record.tier)?.add(id);
        
        if (!this.byType.has(record.type)) {
            this.byType.set(record.type, new Set());
        }
        this.byType.get(record.type).add(id);
        
        this.events.emit('entity:registered', record);
        
        return id;
    }
    
    /**
     * Get entity by ID
     */
    get(id) {
        return this.entities.get(id);
    }
    
    /**
     * Get all entities of a type
     */
    getByType(type) {
        const ids = this.byType.get(type);
        if (!ids) return [];
        return Array.from(ids).map(id => this.entities.get(id));
    }
    
    /**
     * Get all entities in a tier
     */
    getByTier(tier) {
        const ids = this.byTier.get(tier);
        if (!ids) return [];
        return Array.from(ids).map(id => this.entities.get(id));
    }
    
    /**
     * Register dependency between entities
     */
    addDependency(entityId, dependsOnId) {
        if (!this.dependencies.has(entityId)) {
            this.dependencies.set(entityId, new Set());
        }
        this.dependencies.get(entityId).add(dependsOnId);
        
        this.events.emit('dependency:added', { entityId, dependsOnId });
    }
    
    /**
     * Get dependencies of an entity
     */
    getDependencies(entityId) {
        const deps = this.dependencies.get(entityId);
        if (!deps) return [];
        return Array.from(deps).map(id => this.entities.get(id)).filter(Boolean);
    }
    
    /**
     * Get dependents of an entity
     */
    getDependents(entityId) {
        const dependents = [];
        for (const [id, deps] of this.dependencies) {
            if (deps.has(entityId)) {
                const entity = this.entities.get(id);
                if (entity) dependents.push(entity);
            }
        }
        return dependents;
    }
    
    /**
     * Update entity status
     */
    setStatus(entityId, status) {
        const entity = this.entities.get(entityId);
        if (!entity) return false;
        
        entity.status = status;
        entity.updatedAt = Date.now();
        
        this.events.emit('entity:status', { entityId, status });
        return true;
    }
    
    /**
     * Accumulate φ for entity
     */
    accumulatePhi(entityId, amount) {
        const entity = this.entities.get(entityId);
        if (!entity) return 0;
        
        entity.phiAccumulated += amount;
        return entity.phiAccumulated;
    }
    
    /**
     * Get registry statistics
     */
    getStats() {
        const stats = {
            total: this.entities.size,
            byTier: {},
            byType: {},
            byStatus: {}
        };
        
        for (const [tier, ids] of this.byTier) {
            const tierName = Object.keys(ENTITY_TIERS).find(k => ENTITY_TIERS[k] === tier);
            stats.byTier[tierName] = ids.size;
        }
        
        for (const [type, ids] of this.byType) {
            stats.byType[type] = ids.size;
        }
        
        for (const entity of this.entities.values()) {
            stats.byStatus[entity.status] = (stats.byStatus[entity.status] || 0) + 1;
        }
        
        return stats;
    }
    
    _generateId(name) {
        const year = new Date().getFullYear();
        const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
        const cleanName = (name || 'ENTITY').toUpperCase().replace(/[^A-Z0-9]/g, '');
        return `RSHIP-${year}-${cleanName.substring(0, 8)}-${suffix}`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHI CLOCK
// ═══════════════════════════════════════════════════════════════════════════════

class PhiClock {
    constructor(baseFrequency = 1.0) {
        this.baseFrequency = baseFrequency;
        this.startTime = Date.now();
        this.tickCount = 0;
        this.subscribers = new Map();
        this.running = false;
        this.intervalId = null;
    }
    
    /**
     * Start the clock
     */
    start() {
        if (this.running) return;
        
        this.running = true;
        this.startTime = Date.now();
        
        const periodMs = 1000 / this.baseFrequency;
        this.intervalId = setInterval(() => this._tick(), periodMs);
    }
    
    /**
     * Stop the clock
     */
    stop() {
        if (!this.running) return;
        
        this.running = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    /**
     * Subscribe to ticks at a specific φ-frequency
     */
    subscribe(id, frequency, callback) {
        const divider = Math.round(this.baseFrequency / frequency);
        
        this.subscribers.set(id, {
            frequency,
            divider,
            callback,
            lastTick: 0
        });
        
        return () => this.subscribers.delete(id);
    }
    
    /**
     * Get current phase
     */
    getPhase() {
        const elapsed = Date.now() - this.startTime;
        return (elapsed * this.baseFrequency / 1000) % 1;
    }
    
    /**
     * Get current time in φ-units
     */
    getPhiTime() {
        const elapsed = Date.now() - this.startTime;
        return elapsed * PHI_INV / 1000;
    }
    
    _tick() {
        this.tickCount++;
        
        for (const [id, sub] of this.subscribers) {
            if (this.tickCount % sub.divider === 0) {
                try {
                    sub.callback({
                        tick: this.tickCount,
                        time: Date.now(),
                        phase: this.getPhase(),
                        phiTime: this.getPhiTime()
                    });
                } catch (err) {
                    console.error(`PhiClock subscriber ${id} error:`, err);
                }
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT BUS
// ═══════════════════════════════════════════════════════════════════════════════

class RSHIPEventBus {
    constructor() {
        this.emitter = new EventEmitter();
        this.emitter.setMaxListeners(100);
        this.history = [];
        this.maxHistory = 1000;
        this.filters = new Map();
    }
    
    /**
     * Emit an event
     */
    emit(event, data = {}) {
        const envelope = {
            id: crypto.randomBytes(8).toString('hex'),
            event,
            data,
            timestamp: Date.now(),
            source: data._source || 'unknown'
        };
        
        // Store in history
        this.history.push(envelope);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        
        // Apply filters
        for (const [filterId, filter] of this.filters) {
            if (!filter(envelope)) {
                return envelope.id; // Filtered out
            }
        }
        
        this.emitter.emit(event, envelope);
        this.emitter.emit('*', envelope); // Wildcard
        
        return envelope.id;
    }
    
    /**
     * Subscribe to events
     */
    on(event, callback) {
        this.emitter.on(event, callback);
        return () => this.emitter.off(event, callback);
    }
    
    /**
     * Subscribe to events (once)
     */
    once(event, callback) {
        this.emitter.once(event, callback);
    }
    
    /**
     * Add event filter
     */
    addFilter(id, filterFn) {
        this.filters.set(id, filterFn);
        return () => this.filters.delete(id);
    }
    
    /**
     * Get event history
     */
    getHistory(filter = {}) {
        let results = this.history;
        
        if (filter.event) {
            results = results.filter(e => e.event === filter.event);
        }
        if (filter.since) {
            results = results.filter(e => e.timestamp >= filter.since);
        }
        if (filter.limit) {
            results = results.slice(-filter.limit);
        }
        
        return results;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROTOCOL REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

class ProtocolRegistry {
    constructor() {
        this.protocols = new Map();
        this.instances = new Map();
    }
    
    /**
     * Register a protocol
     */
    register(protocol) {
        const id = protocol.id || `PROTO-${this.protocols.size + 1}`;
        
        this.protocols.set(id, {
            id,
            name: protocol.name,
            version: protocol.version || '1.0.0',
            module: protocol.module || protocol,
            capabilities: protocol.capabilities || [],
            registeredAt: Date.now()
        });
        
        return id;
    }
    
    /**
     * Get protocol by ID
     */
    get(id) {
        return this.protocols.get(id);
    }
    
    /**
     * Instantiate a protocol
     */
    instantiate(id, config = {}) {
        const protocol = this.protocols.get(id);
        if (!protocol) return null;
        
        const instanceId = `${id}-${Date.now()}`;
        const instance = {
            instanceId,
            protocolId: id,
            config,
            createdAt: Date.now(),
            status: 'active',
            module: protocol.module
        };
        
        this.instances.set(instanceId, instance);
        return instance;
    }
    
    /**
     * List all protocols
     */
    list() {
        return Array.from(this.protocols.values());
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH MONITOR
// ═══════════════════════════════════════════════════════════════════════════════

class HealthMonitor {
    constructor(registry, eventBus) {
        this.registry = registry;
        this.eventBus = eventBus;
        this.checks = new Map();
        this.results = new Map();
        this.intervalId = null;
    }
    
    /**
     * Register a health check
     */
    registerCheck(id, checkFn, intervalMs = 30000) {
        this.checks.set(id, {
            fn: checkFn,
            interval: intervalMs,
            lastRun: 0
        });
    }
    
    /**
     * Run all health checks
     */
    async runChecks() {
        const results = {};
        
        for (const [id, check] of this.checks) {
            try {
                const start = Date.now();
                const result = await check.fn();
                const duration = Date.now() - start;
                
                results[id] = {
                    status: result.status || 'ok',
                    message: result.message,
                    duration,
                    timestamp: Date.now()
                };
            } catch (err) {
                results[id] = {
                    status: 'error',
                    message: err.message,
                    timestamp: Date.now()
                };
            }
            
            this.results.set(id, results[id]);
        }
        
        this.eventBus.emit('health:check', { results });
        
        return results;
    }
    
    /**
     * Get overall health status
     */
    getStatus() {
        const results = Object.fromEntries(this.results);
        const statuses = Object.values(results).map(r => r.status);
        
        let overall = 'healthy';
        if (statuses.includes('error')) overall = 'unhealthy';
        else if (statuses.includes('warning')) overall = 'degraded';
        
        return {
            status: overall,
            checks: results,
            timestamp: Date.now()
        };
    }
    
    /**
     * Start periodic health checks
     */
    start(intervalMs = 30000) {
        this.intervalId = setInterval(() => this.runChecks(), intervalMs);
    }
    
    /**
     * Stop health checks
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RSHIP RUNTIME
// ═══════════════════════════════════════════════════════════════════════════════

class RSHIPRuntime {
    constructor(config = {}) {
        this.config = {
            name: config.name || 'RSHIP-Runtime',
            version: config.version || '1.0.0',
            phiFrequency: config.phiFrequency || PHI,
            ...config
        };
        
        // Core components
        this.registry = new EntityRegistry();
        this.eventBus = new RSHIPEventBus();
        this.protocols = new ProtocolRegistry();
        this.clock = new PhiClock(this.config.phiFrequency);
        this.health = new HealthMonitor(this.registry, this.eventBus);
        
        // State
        this.startTime = null;
        this.running = false;
        this.phiAccumulated = 0;
        
        // Register self
        this.id = this.registry.register({
            name: 'RSHIP-CORE',
            type: 'RUNTIME',
            tier: ENTITY_TIERS.CORE,
            version: this.config.version,
            capabilities: ['entity-management', 'event-bus', 'phi-clock', 'health-monitoring']
        });
        
        // Setup core health checks
        this._setupHealthChecks();
    }
    
    /**
     * Start the runtime
     */
    start() {
        if (this.running) return;
        
        this.running = true;
        this.startTime = Date.now();
        
        // Start clock
        this.clock.start();
        
        // Start health monitoring
        this.health.start();
        
        // φ-accumulation
        this.clock.subscribe('phi-accumulation', PHI_INV, (tick) => {
            this.phiAccumulated += PHI_INV;
            this.registry.accumulatePhi(this.id, PHI_INV);
        });
        
        this.registry.setStatus(this.id, 'active');
        this.eventBus.emit('runtime:started', { id: this.id });
        
        return this;
    }
    
    /**
     * Stop the runtime
     */
    stop() {
        if (!this.running) return;
        
        this.running = false;
        this.clock.stop();
        this.health.stop();
        
        this.registry.setStatus(this.id, 'stopped');
        this.eventBus.emit('runtime:stopped', { id: this.id });
        
        return this;
    }
    
    /**
     * Register an entity
     */
    registerEntity(entity) {
        return this.registry.register(entity);
    }
    
    /**
     * Register a protocol
     */
    registerProtocol(protocol) {
        return this.protocols.register(protocol);
    }
    
    /**
     * Get runtime status
     */
    status() {
        return {
            id: this.id,
            name: this.config.name,
            version: this.config.version,
            running: this.running,
            uptime: this.running ? Date.now() - this.startTime : 0,
            phiAccumulated: this.phiAccumulated,
            entities: this.registry.getStats(),
            protocols: this.protocols.list().length,
            health: this.health.getStatus()
        };
    }
    
    _setupHealthChecks() {
        this.health.registerCheck('registry', async () => ({
            status: 'ok',
            message: `${this.registry.entities.size} entities registered`
        }));
        
        this.health.registerCheck('clock', async () => ({
            status: this.clock.running ? 'ok' : 'warning',
            message: `Tick count: ${this.clock.tickCount}`
        }));
        
        this.health.registerCheck('memory', async () => {
            const used = process.memoryUsage?.() || {};
            return {
                status: 'ok',
                message: `Heap: ${Math.round((used.heapUsed || 0) / 1024 / 1024)}MB`
            };
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    // Constants
    PHI,
    PHI_INV,
    PHI_SQ,
    SCHUMANN_HZ,
    PHI_FREQUENCIES,
    ENTITY_TIERS,
    
    // Classes
    EntityRegistry,
    PhiClock,
    RSHIPEventBus,
    ProtocolRegistry,
    HealthMonitor,
    RSHIPRuntime,
    
    // Factory
    createRuntime(config = {}) {
        return new RSHIPRuntime(config);
    },
    
    // Utilities
    generateEntityId(name) {
        const year = new Date().getFullYear();
        const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
        const cleanName = (name || 'ENTITY').toUpperCase().replace(/[^A-Z0-9]/g, '');
        return `RSHIP-${year}-${cleanName.substring(0, 8)}-${suffix}`;
    },
    
    // Protocol info
    id: 'RSHIP-2026-CORE-001',
    name: 'RSHIP Core Runtime',
    version: '1.0.0',
    
    // Status
    status() {
        return {
            sdk: 'rship-core',
            version: '1.0.0',
            phi: PHI,
            schumann: SCHUMANN_HZ,
            tiers: Object.keys(ENTITY_TIERS).length,
            timestamp: Date.now()
        };
    }
};

// Self-test if run directly
if (require.main === module) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('RSHIP-CORE SDK');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const { createRuntime } = module.exports;
    const runtime = createRuntime({ name: 'Test Runtime' });
    
    console.log('\n1. Starting runtime...');
    runtime.start();
    console.log(`   Runtime ID: ${runtime.id}`);
    console.log(`   Status: ${runtime.status().running ? 'RUNNING' : 'STOPPED'}`);
    
    console.log('\n2. Registering test entities...');
    const entity1 = runtime.registerEntity({
        name: 'TestAGI',
        type: 'AGI',
        tier: 2,
        capabilities: ['reasoning', 'learning']
    });
    const entity2 = runtime.registerEntity({
        name: 'TestSDK',
        type: 'SDK',
        tier: 1
    });
    console.log(`   Registered: ${entity1}`);
    console.log(`   Registered: ${entity2}`);
    
    console.log('\n3. Registry stats:', runtime.registry.getStats());
    
    console.log('\n4. Clock info:');
    console.log(`   Phase: ${runtime.clock.getPhase().toFixed(4)}`);
    console.log(`   φ-Time: ${runtime.clock.getPhiTime().toFixed(4)}`);
    
    setTimeout(() => {
        console.log('\n5. Stopping runtime...');
        runtime.stop();
        console.log('   Status:', runtime.status());
        console.log('\n✓ RSHIP-CORE operational');
    }, 2000);
}
