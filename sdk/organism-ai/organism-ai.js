/**
 * ORGANISM-AI SDK
 * Living systems coordination and organism-level intelligence
 * 
 * RSHIP-2026-ORGANISM-AI-001 | Sovereign Intelligence Substrate
 * 
 * The organism is the living whole — a coordinated system of AGIs, SDKs,
 * protocols, and services that operates as a single coherent entity.
 * 
 * @module sdk/organism-ai
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
const SCHUMANN_HZ = 7.83;

// Organism states
const ORGANISM_STATES = {
    DORMANT: 'dormant',
    AWAKENING: 'awakening',
    ACTIVE: 'active',
    STRESSED: 'stressed',
    RECOVERING: 'recovering',
    HIBERNATING: 'hibernating'
};

// Organ types (subsystems)
const ORGAN_TYPES = {
    BRAIN: { role: 'coordination', essential: true },
    HEART: { role: 'timing', essential: true },
    IMMUNE: { role: 'security', essential: true },
    SENSORY: { role: 'input', essential: false },
    MOTOR: { role: 'output', essential: false },
    MEMORY: { role: 'storage', essential: true },
    METABOLIC: { role: 'resources', essential: false }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ORGAN (Subsystem)
// ═══════════════════════════════════════════════════════════════════════════════

class Organ {
    constructor(type, config = {}) {
        this.id = `ORG-${type}-${Date.now()}`;
        this.type = type;
        this.role = ORGAN_TYPES[type]?.role || 'unknown';
        this.essential = ORGAN_TYPES[type]?.essential || false;
        this.name = config.name || type;
        
        // State
        this.health = 1.0;
        this.activity = 0;
        this.load = 0;
        this.lastUpdate = Date.now();
        
        // Components
        this.components = new Map();
        this.connections = new Map();
        
        // Events
        this.events = new EventEmitter();
        
        // φ-metrics
        this.phiAccumulated = 0;
    }
    
    /**
     * Add a component to this organ
     */
    addComponent(component) {
        const id = component.id || `COMP-${Date.now()}`;
        this.components.set(id, {
            id,
            name: component.name || id,
            type: component.type || 'generic',
            instance: component.instance || component,
            addedAt: Date.now(),
            active: true
        });
        return id;
    }
    
    /**
     * Remove a component
     */
    removeComponent(componentId) {
        return this.components.delete(componentId);
    }
    
    /**
     * Connect to another organ
     */
    connectTo(otherOrgan, bidirectional = true) {
        this.connections.set(otherOrgan.id, {
            organ: otherOrgan,
            strength: 1.0,
            createdAt: Date.now()
        });
        
        if (bidirectional) {
            otherOrgan.connections.set(this.id, {
                organ: this,
                strength: 1.0,
                createdAt: Date.now()
            });
        }
    }
    
    /**
     * Update organ health
     */
    updateHealth() {
        // Health decreases with high load
        const loadPenalty = Math.max(0, this.load - 0.8) * 0.1;
        
        // Health increases with low activity (recovery)
        const recoveryBonus = this.activity < 0.3 ? 0.01 : 0;
        
        this.health = Math.max(0, Math.min(1, this.health - loadPenalty + recoveryBonus));
        this.lastUpdate = Date.now();
        
        if (this.health < 0.3) {
            this.events.emit('health:critical', { organ: this.id, health: this.health });
        }
        
        return this.health;
    }
    
    /**
     * Process input (route to components)
     */
    process(input) {
        this.activity = Math.min(1, this.activity + 0.1);
        this.load = Math.min(1, this.load + 0.05);
        
        const results = [];
        for (const [id, comp] of this.components) {
            if (comp.active && typeof comp.instance.process === 'function') {
                try {
                    results.push({
                        componentId: id,
                        result: comp.instance.process(input)
                    });
                } catch (err) {
                    results.push({
                        componentId: id,
                        error: err.message
                    });
                }
            }
        }
        
        this.phiAccumulated += PHI_INV * 0.001;
        
        return results;
    }
    
    /**
     * Get organ status
     */
    getStatus() {
        return {
            id: this.id,
            type: this.type,
            role: this.role,
            essential: this.essential,
            health: this.health,
            activity: this.activity,
            load: this.load,
            components: this.components.size,
            connections: this.connections.size,
            phiAccumulated: this.phiAccumulated
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORGANISM
// ═══════════════════════════════════════════════════════════════════════════════

class Organism {
    constructor(config = {}) {
        this.id = config.id || `ORGANISM-${Date.now()}`;
        this.name = config.name || 'RSHIP Organism';
        this.state = ORGANISM_STATES.DORMANT;
        this.createdAt = Date.now();
        
        // Organs (subsystems)
        this.organs = new Map();
        
        // Heartbeat
        this.heartbeatInterval = config.heartbeatMs || Math.round(1000 / PHI);  // ~618ms
        this.heartbeatTimer = null;
        this.heartbeatCount = 0;
        
        // Vital signs
        this.vitals = {
            health: 1.0,
            energy: 1.0,
            coherence: 0.5,
            load: 0
        };
        
        // Events
        this.events = new EventEmitter();
        
        // φ-metrics
        this.phiAccumulated = 0;
        
        // Initialize essential organs
        this._initializeOrgans();
    }
    
    /**
     * Initialize essential organs
     */
    _initializeOrgans() {
        for (const [type, spec] of Object.entries(ORGAN_TYPES)) {
            if (spec.essential) {
                this.addOrgan(type);
            }
        }
    }
    
    /**
     * Add an organ
     */
    addOrgan(type, config = {}) {
        const organ = new Organ(type, config);
        this.organs.set(type, organ);
        
        // Connect essential organs
        if (ORGAN_TYPES[type]?.essential) {
            for (const [existingType, existingOrgan] of this.organs) {
                if (existingType !== type && ORGAN_TYPES[existingType]?.essential) {
                    organ.connectTo(existingOrgan);
                }
            }
        }
        
        return organ;
    }
    
    /**
     * Get an organ
     */
    getOrgan(type) {
        return this.organs.get(type);
    }
    
    /**
     * Awaken the organism
     */
    awaken() {
        if (this.state !== ORGANISM_STATES.DORMANT && this.state !== ORGANISM_STATES.HIBERNATING) {
            return false;
        }
        
        this.state = ORGANISM_STATES.AWAKENING;
        this.events.emit('state', { from: ORGANISM_STATES.DORMANT, to: this.state });
        
        // Start heartbeat
        this._startHeartbeat();
        
        // Transition to active after awakening
        setTimeout(() => {
            this.state = ORGANISM_STATES.ACTIVE;
            this.events.emit('state', { from: ORGANISM_STATES.AWAKENING, to: this.state });
            this.events.emit('awakened', { organism: this.id });
        }, this.heartbeatInterval * 3);
        
        return true;
    }
    
    /**
     * Put organism to sleep
     */
    hibernate() {
        if (this.state === ORGANISM_STATES.DORMANT || this.state === ORGANISM_STATES.HIBERNATING) {
            return false;
        }
        
        this._stopHeartbeat();
        
        const prevState = this.state;
        this.state = ORGANISM_STATES.HIBERNATING;
        this.events.emit('state', { from: prevState, to: this.state });
        
        return true;
    }
    
    /**
     * Start heartbeat
     */
    _startHeartbeat() {
        if (this.heartbeatTimer) return;
        
        this.heartbeatTimer = setInterval(() => {
            this._heartbeat();
        }, this.heartbeatInterval);
    }
    
    /**
     * Stop heartbeat
     */
    _stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
    
    /**
     * Heartbeat cycle
     */
    _heartbeat() {
        this.heartbeatCount++;
        
        // Update organ health
        for (const organ of this.organs.values()) {
            organ.updateHealth();
            
            // Decay activity and load
            organ.activity *= 0.95;
            organ.load *= 0.9;
        }
        
        // Update vitals
        this._updateVitals();
        
        // φ-accumulation
        this.phiAccumulated += PHI_INV * 0.001;
        
        // Check for stress
        if (this.vitals.health < 0.3 || this.vitals.load > 0.9) {
            if (this.state === ORGANISM_STATES.ACTIVE) {
                this.state = ORGANISM_STATES.STRESSED;
                this.events.emit('state', { from: ORGANISM_STATES.ACTIVE, to: this.state });
            }
        } else if (this.state === ORGANISM_STATES.STRESSED && this.vitals.health > 0.6) {
            this.state = ORGANISM_STATES.RECOVERING;
            this.events.emit('state', { from: ORGANISM_STATES.STRESSED, to: this.state });
            
            setTimeout(() => {
                if (this.state === ORGANISM_STATES.RECOVERING) {
                    this.state = ORGANISM_STATES.ACTIVE;
                    this.events.emit('state', { from: ORGANISM_STATES.RECOVERING, to: this.state });
                }
            }, this.heartbeatInterval * 5);
        }
        
        this.events.emit('heartbeat', {
            count: this.heartbeatCount,
            vitals: { ...this.vitals },
            state: this.state
        });
    }
    
    /**
     * Update vital signs
     */
    _updateVitals() {
        let totalHealth = 0;
        let totalLoad = 0;
        let essentialCount = 0;
        
        for (const organ of this.organs.values()) {
            if (organ.essential) {
                totalHealth += organ.health;
                essentialCount++;
            }
            totalLoad += organ.load;
        }
        
        this.vitals.health = essentialCount > 0 ? totalHealth / essentialCount : 0;
        this.vitals.load = this.organs.size > 0 ? totalLoad / this.organs.size : 0;
        
        // Energy depletes with load, recovers slowly
        this.vitals.energy = Math.max(0, Math.min(1,
            this.vitals.energy - this.vitals.load * 0.01 + 0.005
        ));
        
        // Coherence based on organ connections and health
        this.vitals.coherence = this._calculateCoherence();
    }
    
    /**
     * Calculate organism coherence
     */
    _calculateCoherence() {
        if (this.organs.size === 0) return 0;
        
        let totalConnections = 0;
        let possibleConnections = this.organs.size * (this.organs.size - 1) / 2;
        
        for (const organ of this.organs.values()) {
            totalConnections += organ.connections.size;
        }
        
        // Divide by 2 because connections are bidirectional
        const connectionRatio = possibleConnections > 0 
            ? (totalConnections / 2) / possibleConnections 
            : 0;
        
        return connectionRatio * this.vitals.health;
    }
    
    /**
     * Send stimulus to organism
     */
    stimulate(organType, input) {
        const organ = this.organs.get(organType);
        if (!organ) return null;
        
        return organ.process(input);
    }
    
    /**
     * Get organism status
     */
    getStatus() {
        return {
            id: this.id,
            name: this.name,
            state: this.state,
            uptime: Date.now() - this.createdAt,
            heartbeats: this.heartbeatCount,
            vitals: { ...this.vitals },
            organs: Array.from(this.organs.values()).map(o => o.getStatus()),
            phiAccumulated: this.phiAccumulated
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORGANISM NETWORK
// ═══════════════════════════════════════════════════════════════════════════════

class OrganismNetwork {
    constructor() {
        this.organisms = new Map();
        this.connections = new Map();
        this.events = new EventEmitter();
    }
    
    /**
     * Add organism to network
     */
    add(organism) {
        this.organisms.set(organism.id, organism);
        
        organism.events.on('heartbeat', (data) => {
            this.events.emit('organism:heartbeat', { 
                organismId: organism.id, 
                ...data 
            });
        });
        
        return organism.id;
    }
    
    /**
     * Connect two organisms
     */
    connect(organism1Id, organism2Id, strength = 1.0) {
        const key = [organism1Id, organism2Id].sort().join(':');
        this.connections.set(key, {
            organisms: [organism1Id, organism2Id],
            strength,
            createdAt: Date.now()
        });
    }
    
    /**
     * Get network status
     */
    getStatus() {
        return {
            organismCount: this.organisms.size,
            connectionCount: this.connections.size,
            organisms: Array.from(this.organisms.values()).map(o => ({
                id: o.id,
                name: o.name,
                state: o.state,
                health: o.vitals.health
            }))
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    // Constants
    PHI,
    PHI_INV,
    SCHUMANN_HZ,
    ORGANISM_STATES,
    ORGAN_TYPES,
    
    // Classes
    Organ,
    Organism,
    OrganismNetwork,
    
    // Factory
    createOrganism(config = {}) {
        return new Organism(config);
    },
    
    createNetwork() {
        return new OrganismNetwork();
    },
    
    // Protocol info
    id: 'RSHIP-2026-ORGANISM-AI-001',
    name: 'Organism AI SDK',
    version: '1.0.0',
    
    status() {
        return {
            sdk: 'organism-ai',
            version: '1.0.0',
            states: Object.keys(ORGANISM_STATES).length,
            organTypes: Object.keys(ORGAN_TYPES).length,
            timestamp: Date.now()
        };
    }
};

// Self-test
if (require.main === module) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('ORGANISM-AI SDK');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const { createOrganism, createNetwork } = module.exports;
    
    console.log('\n1. Creating organism...');
    const organism = createOrganism({ name: 'TestOrganism' });
    console.log(`   ID: ${organism.id}`);
    console.log(`   Initial state: ${organism.state}`);
    console.log(`   Organs: ${organism.organs.size}`);
    
    console.log('\n2. Adding sensory organ...');
    const sensory = organism.addOrgan('SENSORY');
    sensory.addComponent({
        id: 'camera',
        name: 'Visual Sensor',
        type: 'sensor',
        process: (input) => ({ processed: true, input })
    });
    console.log(`   Sensory organ components: ${sensory.components.size}`);
    
    console.log('\n3. Awakening organism...');
    organism.awaken();
    
    organism.events.on('heartbeat', (data) => {
        if (data.count <= 3) {
            console.log(`   Heartbeat #${data.count}: state=${data.state}, health=${data.vitals.health.toFixed(2)}`);
        }
    });
    
    setTimeout(() => {
        console.log('\n4. Final status:');
        console.log('   ', organism.getStatus());
        
        console.log('\n5. Hibernating...');
        organism.hibernate();
        console.log(`   State: ${organism.state}`);
        
        console.log('\n✓ ORGANISM-AI operational');
        process.exit(0);
    }, 3000);
}
