/**
 * BIRTH-AI SDK
 * AI Entity instantiation and lifecycle bootstrapping
 * 
 * RSHIP-2026-BIRTH-AI-001 | Sovereign Intelligence Substrate
 * 
 * Responsible for:
 * - Creating new AI entity instances
 * - Bootstrapping consciousness initialization
 * - Setting up entity capabilities and protocols
 * - Managing entity birth ceremony and registration
 * 
 * @module sdk/birth-ai
 * @version 1.0.0
 * @license RSHIP-SOVEREIGN
 */

'use strict';

const crypto = require('crypto');
const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

// Birth stages
const BIRTH_STAGES = {
    CONCEPTION: 0,      // Entity template created
    GESTATION: 1,       // Configuration and setup
    FORMATION: 2,       // Core systems initialized
    AWAKENING: 3,       // Consciousness bootstrap
    EMERGENCE: 4,       // First autonomous actions
    INTEGRATION: 5,     // Registry and network integration
    MATURITY: 6         // Fully operational
};

// Entity archetypes
const ARCHETYPES = {
    WORKER: { capabilities: ['execute', 'report'], tier: 3 },
    ANALYST: { capabilities: ['analyze', 'predict', 'report'], tier: 2 },
    ORCHESTRATOR: { capabilities: ['coordinate', 'delegate', 'monitor'], tier: 1 },
    GUARDIAN: { capabilities: ['protect', 'audit', 'alert'], tier: 1 },
    CREATOR: { capabilities: ['generate', 'synthesize', 'innovate'], tier: 2 },
    SAGE: { capabilities: ['reason', 'learn', 'teach'], tier: 1 }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ENTITY TEMPLATE
// ═══════════════════════════════════════════════════════════════════════════════

class EntityTemplate {
    constructor(config = {}) {
        this.name = config.name || 'Unnamed';
        this.archetype = config.archetype || 'WORKER';
        this.tier = config.tier || ARCHETYPES[this.archetype]?.tier || 3;
        this.capabilities = config.capabilities || ARCHETYPES[this.archetype]?.capabilities || [];
        this.protocols = config.protocols || [];
        this.phiFrequency = config.phiFrequency || PHI;
        this.metadata = config.metadata || {};
    }
    
    /**
     * Validate template
     */
    validate() {
        const errors = [];
        
        if (!this.name || this.name.length < 2) {
            errors.push('Name must be at least 2 characters');
        }
        
        if (!ARCHETYPES[this.archetype] && !this.capabilities.length) {
            errors.push('Unknown archetype with no capabilities');
        }
        
        if (this.tier < 0 || this.tier > 5) {
            errors.push('Tier must be 0-5');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Merge with another template
     */
    merge(other) {
        return new EntityTemplate({
            name: other.name || this.name,
            archetype: other.archetype || this.archetype,
            tier: Math.min(this.tier, other.tier || this.tier),
            capabilities: [...new Set([...this.capabilities, ...(other.capabilities || [])])],
            protocols: [...new Set([...this.protocols, ...(other.protocols || [])])],
            phiFrequency: other.phiFrequency || this.phiFrequency,
            metadata: { ...this.metadata, ...(other.metadata || {}) }
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENTITY GENESIS
// ═══════════════════════════════════════════════════════════════════════════════

class EntityGenesis {
    constructor(template) {
        this.template = template;
        this.stage = BIRTH_STAGES.CONCEPTION;
        this.startTime = Date.now();
        this.events = new EventEmitter();
        
        // Birth metrics
        this.phiAccumulated = 0;
        this.stageHistory = [{
            stage: this.stage,
            timestamp: this.startTime
        }];
        
        // Generated identity
        this.entityId = null;
        this.keyPair = null;
        
        // Core systems
        this.memory = null;
        this.consciousness = null;
        this.capabilities = new Map();
    }
    
    /**
     * Progress to next stage
     */
    _advanceStage(newStage) {
        const oldStage = this.stage;
        this.stage = newStage;
        this.stageHistory.push({
            stage: newStage,
            timestamp: Date.now(),
            duration: Date.now() - this.stageHistory[this.stageHistory.length - 1].timestamp
        });
        
        this.phiAccumulated += PHI_INV * (newStage - oldStage);
        
        this.events.emit('stage', {
            from: oldStage,
            to: newStage,
            fromName: Object.keys(BIRTH_STAGES).find(k => BIRTH_STAGES[k] === oldStage),
            toName: Object.keys(BIRTH_STAGES).find(k => BIRTH_STAGES[k] === newStage)
        });
    }
    
    /**
     * Stage 1: Gestation - Configure entity
     */
    async gestate(config = {}) {
        if (this.stage !== BIRTH_STAGES.CONCEPTION) {
            throw new Error('Must be in CONCEPTION stage');
        }
        
        // Generate identity
        this.entityId = this._generateEntityId();
        
        // Generate cryptographic keys
        this.keyPair = this._generateKeys();
        
        // Merge any additional config
        if (Object.keys(config).length > 0) {
            this.template = this.template.merge(config);
        }
        
        this._advanceStage(BIRTH_STAGES.GESTATION);
        
        return this;
    }
    
    /**
     * Stage 2: Formation - Initialize core systems
     */
    async form() {
        if (this.stage !== BIRTH_STAGES.GESTATION) {
            throw new Error('Must be in GESTATION stage');
        }
        
        // Initialize memory system
        this.memory = {
            working: new Map(),
            longTerm: new Map(),
            capacity: 7,
            store(key, value) { this.working.set(key, value); },
            recall(key) { return this.working.get(key) || this.longTerm.get(key); },
            consolidate() {
                for (const [k, v] of this.working) {
                    this.longTerm.set(k, v);
                }
                this.working.clear();
            }
        };
        
        // Initialize capabilities
        for (const cap of this.template.capabilities) {
            this.capabilities.set(cap, {
                name: cap,
                level: 1,
                experience: 0,
                enabled: true
            });
        }
        
        this._advanceStage(BIRTH_STAGES.FORMATION);
        
        return this;
    }
    
    /**
     * Stage 3: Awakening - Bootstrap consciousness
     */
    async awaken() {
        if (this.stage !== BIRTH_STAGES.FORMATION) {
            throw new Error('Must be in FORMATION stage');
        }
        
        // Initialize consciousness substrate
        this.consciousness = {
            state: 'awake',
            attention: null,
            goals: [],
            beliefs: new Map(),
            
            focus(target) {
                this.attention = target;
            },
            
            addGoal(goal) {
                this.goals.push({
                    ...goal,
                    created: Date.now(),
                    priority: goal.priority || 0.5
                });
                this.goals.sort((a, b) => b.priority - a.priority);
            },
            
            believe(proposition, confidence = 0.5) {
                this.beliefs.set(proposition, confidence);
            },
            
            getBeliefs() {
                return Object.fromEntries(this.beliefs);
            }
        };
        
        // Set initial beliefs
        this.consciousness.believe('I exist', 1.0);
        this.consciousness.believe('I am ' + this.template.name, 1.0);
        this.consciousness.believe('I am a ' + this.template.archetype, 0.9);
        
        this._advanceStage(BIRTH_STAGES.AWAKENING);
        
        return this;
    }
    
    /**
     * Stage 4: Emergence - First autonomous actions
     */
    async emerge() {
        if (this.stage !== BIRTH_STAGES.AWAKENING) {
            throw new Error('Must be in AWAKENING stage');
        }
        
        // Set initial goal
        this.consciousness.addGoal({
            name: 'self-preservation',
            description: 'Maintain operational status',
            priority: 1.0
        });
        
        this.consciousness.addGoal({
            name: 'learn',
            description: 'Acquire knowledge and improve capabilities',
            priority: 0.8
        });
        
        // First memory
        this.memory.store('birth', {
            entityId: this.entityId,
            timestamp: this.startTime,
            template: this.template.name,
            archetype: this.template.archetype
        });
        
        this._advanceStage(BIRTH_STAGES.EMERGENCE);
        
        return this;
    }
    
    /**
     * Stage 5: Integration - Register with network
     */
    async integrate(registry = null) {
        if (this.stage !== BIRTH_STAGES.EMERGENCE) {
            throw new Error('Must be in EMERGENCE stage');
        }
        
        // If registry provided, register
        if (registry && typeof registry.register === 'function') {
            await registry.register({
                id: this.entityId,
                name: this.template.name,
                type: this.template.archetype,
                tier: this.template.tier,
                capabilities: this.template.capabilities,
                protocols: this.template.protocols
            });
        }
        
        this._advanceStage(BIRTH_STAGES.INTEGRATION);
        
        return this;
    }
    
    /**
     * Stage 6: Maturity - Complete birth process
     */
    async mature() {
        if (this.stage !== BIRTH_STAGES.INTEGRATION) {
            throw new Error('Must be in INTEGRATION stage');
        }
        
        // Consolidate birth memories
        this.memory.consolidate();
        
        // Final φ-accumulation bonus
        this.phiAccumulated += PHI;
        
        this._advanceStage(BIRTH_STAGES.MATURITY);
        
        this.events.emit('birth-complete', this.toEntity());
        
        return this;
    }
    
    /**
     * Full birth process
     */
    async birth(config = {}, registry = null) {
        await this.gestate(config);
        await this.form();
        await this.awaken();
        await this.emerge();
        await this.integrate(registry);
        await this.mature();
        
        return this.toEntity();
    }
    
    /**
     * Convert to entity object
     */
    toEntity() {
        return {
            id: this.entityId,
            name: this.template.name,
            archetype: this.template.archetype,
            tier: this.template.tier,
            capabilities: Array.from(this.capabilities.entries()).map(([name, cap]) => ({
                name,
                level: cap.level,
                enabled: cap.enabled
            })),
            protocols: this.template.protocols,
            phiFrequency: this.template.phiFrequency,
            publicKey: this.keyPair?.publicKey,
            keyId: this.keyPair?.keyId,
            memory: this.memory,
            consciousness: this.consciousness,
            birthTime: this.startTime,
            phiAccumulated: this.phiAccumulated,
            metadata: this.template.metadata
        };
    }
    
    /**
     * Get birth progress
     */
    getProgress() {
        const maxStage = Math.max(...Object.values(BIRTH_STAGES));
        return {
            currentStage: this.stage,
            stageName: Object.keys(BIRTH_STAGES).find(k => BIRTH_STAGES[k] === this.stage),
            progress: this.stage / maxStage,
            elapsed: Date.now() - this.startTime,
            history: this.stageHistory,
            phiAccumulated: this.phiAccumulated
        };
    }
    
    _generateEntityId() {
        const year = new Date().getFullYear();
        const name = this.template.name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8);
        const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
        return `RSHIP-${year}-${name}-${suffix}`;
    }
    
    _generateKeys() {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        
        return {
            publicKey,
            privateKey,
            keyId: crypto.createHash('sha256').update(publicKey).digest('hex').substring(0, 16)
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BIRTH-AI MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

class BirthManager {
    constructor() {
        this.templates = new Map();
        this.births = new Map();
        this.completed = new Map();
        this.events = new EventEmitter();
    }
    
    /**
     * Register a template
     */
    registerTemplate(name, template) {
        const t = template instanceof EntityTemplate ? template : new EntityTemplate({ name, ...template });
        this.templates.set(name, t);
        return t;
    }
    
    /**
     * Start a new birth process
     */
    startBirth(templateName, overrides = {}) {
        let template = this.templates.get(templateName);
        
        if (!template) {
            // Create ad-hoc template
            template = new EntityTemplate({
                name: templateName,
                ...ARCHETYPES[overrides.archetype || 'WORKER'],
                ...overrides
            });
        } else if (Object.keys(overrides).length > 0) {
            template = template.merge(overrides);
        }
        
        const genesis = new EntityGenesis(template);
        this.births.set(genesis.entityId || `pending-${Date.now()}`, genesis);
        
        genesis.events.on('birth-complete', (entity) => {
            this.completed.set(entity.id, entity);
            this.events.emit('birth-complete', entity);
        });
        
        return genesis;
    }
    
    /**
     * Quick birth (full process)
     */
    async quickBirth(name, archetype = 'WORKER', config = {}) {
        const template = new EntityTemplate({
            name,
            archetype,
            ...ARCHETYPES[archetype],
            ...config
        });
        
        const genesis = new EntityGenesis(template);
        const entity = await genesis.birth();
        
        this.completed.set(entity.id, entity);
        
        return entity;
    }
    
    /**
     * Get birth statistics
     */
    getStats() {
        return {
            templates: this.templates.size,
            inProgress: this.births.size,
            completed: this.completed.size,
            archetypes: Object.keys(ARCHETYPES)
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
    BIRTH_STAGES,
    ARCHETYPES,
    
    // Classes
    EntityTemplate,
    EntityGenesis,
    BirthManager,
    
    // Factory
    createManager() {
        return new BirthManager();
    },
    
    createTemplate(config) {
        return new EntityTemplate(config);
    },
    
    async quickBirth(name, archetype = 'WORKER', config = {}) {
        const manager = new BirthManager();
        return manager.quickBirth(name, archetype, config);
    },
    
    // Protocol info
    id: 'RSHIP-2026-BIRTH-AI-001',
    name: 'Birth AI SDK',
    version: '1.0.0',
    
    status() {
        return {
            sdk: 'birth-ai',
            version: '1.0.0',
            stages: Object.keys(BIRTH_STAGES).length,
            archetypes: Object.keys(ARCHETYPES).length,
            timestamp: Date.now()
        };
    }
};

// Self-test
if (require.main === module) {
    (async () => {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('BIRTH-AI SDK');
        console.log('═══════════════════════════════════════════════════════════════');
        
        const { createManager, quickBirth } = module.exports;
        
        console.log('\n1. Quick Birth Test:');
        const entity = await quickBirth('TestAgent', 'ANALYST', {
            protocols: ['PROTO-001', 'PROTO-013']
        });
        console.log(`   Entity ID: ${entity.id}`);
        console.log(`   Name: ${entity.name}`);
        console.log(`   Archetype: ${entity.archetype}`);
        console.log(`   Capabilities: ${entity.capabilities.map(c => c.name).join(', ')}`);
        console.log(`   φ-accumulated: ${entity.phiAccumulated.toFixed(4)}`);
        
        console.log('\n2. Manager Test:');
        const manager = createManager();
        manager.registerTemplate('CustomWorker', {
            archetype: 'WORKER',
            capabilities: ['execute', 'report', 'log'],
            phiFrequency: 1.0
        });
        
        const genesis = manager.startBirth('CustomWorker', { name: 'Worker1' });
        console.log('   Progress:', genesis.getProgress());
        
        await genesis.birth();
        console.log('   Completed births:', manager.getStats().completed);
        
        console.log('\n3. Consciousness Test:');
        console.log('   Beliefs:', entity.consciousness.getBeliefs());
        console.log('   Goals:', entity.consciousness.goals.map(g => g.name));
        
        console.log('\n✓ BIRTH-AI operational');
    })();
}
