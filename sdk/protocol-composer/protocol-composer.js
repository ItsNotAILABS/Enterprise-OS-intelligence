/**
 * PROTOCOL-COMPOSER SDK
 * Compose, chain, and orchestrate intelligence protocols
 * 
 * RSHIP-2026-COMPOSER-001 | Sovereign Intelligence Substrate
 * 
 * Enables dynamic composition of protocols into pipelines,
 * conditional flows, and parallel execution patterns.
 * 
 * @module sdk/protocol-composer
 * @version 1.0.0
 * @license RSHIP-SOVEREIGN
 */

'use strict';

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

// Composition patterns
const PATTERNS = {
    SEQUENCE: 'sequence',      // A → B → C
    PARALLEL: 'parallel',      // A | B | C → merge
    CONDITIONAL: 'conditional', // if(cond) A else B
    LOOP: 'loop',              // while(cond) A
    RETRY: 'retry',            // A with retry
    FALLBACK: 'fallback',      // A || B || C
    MAP: 'map',                // [A, A, A] parallel
    REDUCE: 'reduce'           // [A, A, A] sequential merge
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROTOCOL NODE
// ═══════════════════════════════════════════════════════════════════════════════

class ProtocolNode {
    constructor(protocol, config = {}) {
        this.id = config.id || `NODE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        this.protocol = protocol;
        this.name = config.name || protocol.name || 'Unknown';
        this.timeout = config.timeout || 30000;
        this.retries = config.retries || 0;
        this.transform = config.transform || null;
        this.validate = config.validate || null;
        
        // Metrics
        this.executions = 0;
        this.successes = 0;
        this.failures = 0;
        this.totalLatency = 0;
    }
    
    /**
     * Execute the protocol
     */
    async execute(input, context = {}) {
        const startTime = Date.now();
        this.executions++;
        
        try {
            // Transform input if transformer provided
            let data = this.transform ? this.transform(input) : input;
            
            // Validate input if validator provided
            if (this.validate && !this.validate(data)) {
                throw new Error(`Validation failed for node ${this.id}`);
            }
            
            // Execute with timeout
            let result;
            if (typeof this.protocol === 'function') {
                result = await Promise.race([
                    this.protocol(data, context),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), this.timeout)
                    )
                ]);
            } else if (this.protocol && typeof this.protocol.execute === 'function') {
                result = await this.protocol.execute(data, context);
            } else if (this.protocol && typeof this.protocol.process === 'function') {
                result = await this.protocol.process(data, context);
            } else {
                result = this.protocol;
            }
            
            this.successes++;
            this.totalLatency += Date.now() - startTime;
            
            return { success: true, data: result, nodeId: this.id };
            
        } catch (error) {
            this.failures++;
            this.totalLatency += Date.now() - startTime;
            
            return { success: false, error: error.message, nodeId: this.id };
        }
    }
    
    /**
     * Get node metrics
     */
    getMetrics() {
        return {
            id: this.id,
            name: this.name,
            executions: this.executions,
            successes: this.successes,
            failures: this.failures,
            successRate: this.executions > 0 ? this.successes / this.executions : 0,
            avgLatency: this.executions > 0 ? this.totalLatency / this.executions : 0
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSITION
// ═══════════════════════════════════════════════════════════════════════════════

class Composition {
    constructor(pattern, config = {}) {
        this.id = config.id || `COMP-${Date.now()}`;
        this.pattern = pattern;
        this.name = config.name || pattern;
        this.nodes = [];
        this.condition = config.condition || null;
        this.merger = config.merger || ((results) => results);
        this.maxIterations = config.maxIterations || 100;
        
        // Events
        this.events = new EventEmitter();
        
        // Metrics
        this.executions = 0;
        this.phiAccumulated = 0;
    }
    
    /**
     * Add a node to the composition
     */
    add(protocolOrNode, config = {}) {
        const node = protocolOrNode instanceof ProtocolNode 
            ? protocolOrNode 
            : new ProtocolNode(protocolOrNode, config);
        
        this.nodes.push(node);
        return this;
    }
    
    /**
     * Execute the composition
     */
    async execute(input, context = {}) {
        this.executions++;
        const startTime = Date.now();
        
        this.events.emit('start', { compositionId: this.id, pattern: this.pattern });
        
        let result;
        
        try {
            switch (this.pattern) {
                case PATTERNS.SEQUENCE:
                    result = await this._executeSequence(input, context);
                    break;
                    
                case PATTERNS.PARALLEL:
                    result = await this._executeParallel(input, context);
                    break;
                    
                case PATTERNS.CONDITIONAL:
                    result = await this._executeConditional(input, context);
                    break;
                    
                case PATTERNS.LOOP:
                    result = await this._executeLoop(input, context);
                    break;
                    
                case PATTERNS.RETRY:
                    result = await this._executeRetry(input, context);
                    break;
                    
                case PATTERNS.FALLBACK:
                    result = await this._executeFallback(input, context);
                    break;
                    
                case PATTERNS.MAP:
                    result = await this._executeMap(input, context);
                    break;
                    
                case PATTERNS.REDUCE:
                    result = await this._executeReduce(input, context);
                    break;
                    
                default:
                    result = await this._executeSequence(input, context);
            }
            
            this.phiAccumulated += PHI_INV * 0.01;
            
        } catch (error) {
            result = { success: false, error: error.message };
        }
        
        const latency = Date.now() - startTime;
        this.events.emit('complete', { 
            compositionId: this.id, 
            success: result.success !== false,
            latency 
        });
        
        return { ...result, latency, compositionId: this.id };
    }
    
    async _executeSequence(input, context) {
        let data = input;
        const results = [];
        
        for (const node of this.nodes) {
            const result = await node.execute(data, context);
            results.push(result);
            
            if (!result.success) {
                return { success: false, results, failedAt: node.id };
            }
            
            data = result.data;
        }
        
        return { success: true, data, results };
    }
    
    async _executeParallel(input, context) {
        const promises = this.nodes.map(node => node.execute(input, context));
        const results = await Promise.all(promises);
        
        const allSuccess = results.every(r => r.success);
        const merged = this.merger(results.map(r => r.data));
        
        return { success: allSuccess, data: merged, results };
    }
    
    async _executeConditional(input, context) {
        if (this.nodes.length < 2) {
            throw new Error('Conditional requires at least 2 nodes');
        }
        
        const conditionMet = this.condition ? this.condition(input, context) : true;
        const selectedNode = conditionMet ? this.nodes[0] : this.nodes[1];
        
        return selectedNode.execute(input, context);
    }
    
    async _executeLoop(input, context) {
        let data = input;
        let iterations = 0;
        const results = [];
        
        while (iterations < this.maxIterations) {
            if (this.condition && !this.condition(data, context)) {
                break;
            }
            
            for (const node of this.nodes) {
                const result = await node.execute(data, context);
                results.push(result);
                
                if (!result.success) {
                    return { success: false, results, iterations };
                }
                
                data = result.data;
            }
            
            iterations++;
        }
        
        return { success: true, data, results, iterations };
    }
    
    async _executeRetry(input, context) {
        const maxRetries = this.maxIterations;
        let lastError = null;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            for (const node of this.nodes) {
                const result = await node.execute(input, context);
                
                if (result.success) {
                    return { ...result, attempts: attempt + 1 };
                }
                
                lastError = result.error;
            }
            
            // Exponential backoff with φ
            await new Promise(resolve => 
                setTimeout(resolve, Math.pow(PHI, attempt) * 100)
            );
        }
        
        return { success: false, error: lastError, attempts: maxRetries };
    }
    
    async _executeFallback(input, context) {
        for (const node of this.nodes) {
            const result = await node.execute(input, context);
            
            if (result.success) {
                return result;
            }
        }
        
        return { success: false, error: 'All fallbacks failed' };
    }
    
    async _executeMap(input, context) {
        if (!Array.isArray(input)) {
            input = [input];
        }
        
        const node = this.nodes[0];
        if (!node) {
            return { success: true, data: input };
        }
        
        const promises = input.map(item => node.execute(item, context));
        const results = await Promise.all(promises);
        
        const allSuccess = results.every(r => r.success);
        const data = results.map(r => r.data);
        
        return { success: allSuccess, data, results };
    }
    
    async _executeReduce(input, context) {
        if (!Array.isArray(input)) {
            input = [input];
        }
        
        const node = this.nodes[0];
        if (!node) {
            return { success: true, data: input };
        }
        
        const results = [];
        let accumulated = null;
        
        for (const item of input) {
            const result = await node.execute(
                { current: item, accumulated }, 
                context
            );
            results.push(result);
            
            if (!result.success) {
                return { success: false, results, accumulated };
            }
            
            accumulated = result.data;
        }
        
        return { success: true, data: accumulated, results };
    }
    
    /**
     * Get composition metrics
     */
    getMetrics() {
        return {
            id: this.id,
            name: this.name,
            pattern: this.pattern,
            nodeCount: this.nodes.length,
            executions: this.executions,
            phiAccumulated: this.phiAccumulated,
            nodes: this.nodes.map(n => n.getMetrics())
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSER
// ═══════════════════════════════════════════════════════════════════════════════

class ProtocolComposer {
    constructor() {
        this.compositions = new Map();
        this.protocols = new Map();
        this.events = new EventEmitter();
    }
    
    /**
     * Register a protocol for use in compositions
     */
    registerProtocol(id, protocol) {
        this.protocols.set(id, protocol);
        return this;
    }
    
    /**
     * Get a registered protocol
     */
    getProtocol(id) {
        return this.protocols.get(id);
    }
    
    /**
     * Create a sequence composition
     */
    sequence(...protocols) {
        const comp = new Composition(PATTERNS.SEQUENCE);
        for (const p of protocols) {
            const protocol = typeof p === 'string' ? this.protocols.get(p) : p;
            if (protocol) comp.add(protocol);
        }
        return comp;
    }
    
    /**
     * Create a parallel composition
     */
    parallel(...protocols) {
        const comp = new Composition(PATTERNS.PARALLEL);
        for (const p of protocols) {
            const protocol = typeof p === 'string' ? this.protocols.get(p) : p;
            if (protocol) comp.add(protocol);
        }
        return comp;
    }
    
    /**
     * Create a conditional composition
     */
    conditional(condition, ifTrue, ifFalse) {
        const comp = new Composition(PATTERNS.CONDITIONAL, { condition });
        const protocolTrue = typeof ifTrue === 'string' ? this.protocols.get(ifTrue) : ifTrue;
        const protocolFalse = typeof ifFalse === 'string' ? this.protocols.get(ifFalse) : ifFalse;
        if (protocolTrue) comp.add(protocolTrue);
        if (protocolFalse) comp.add(protocolFalse);
        return comp;
    }
    
    /**
     * Create a retry composition
     */
    retry(protocol, maxRetries = 3) {
        const comp = new Composition(PATTERNS.RETRY, { maxIterations: maxRetries });
        const p = typeof protocol === 'string' ? this.protocols.get(protocol) : protocol;
        if (p) comp.add(p);
        return comp;
    }
    
    /**
     * Create a fallback composition
     */
    fallback(...protocols) {
        const comp = new Composition(PATTERNS.FALLBACK);
        for (const p of protocols) {
            const protocol = typeof p === 'string' ? this.protocols.get(p) : p;
            if (protocol) comp.add(protocol);
        }
        return comp;
    }
    
    /**
     * Create and store a named composition
     */
    compose(name, composition) {
        this.compositions.set(name, composition);
        return composition;
    }
    
    /**
     * Execute a named composition
     */
    async execute(name, input, context = {}) {
        const composition = this.compositions.get(name);
        if (!composition) {
            throw new Error(`Composition '${name}' not found`);
        }
        return composition.execute(input, context);
    }
    
    /**
     * Get composer statistics
     */
    getStats() {
        return {
            registeredProtocols: this.protocols.size,
            compositions: this.compositions.size,
            compositionMetrics: Array.from(this.compositions.entries()).map(([name, comp]) => ({
                name,
                ...comp.getMetrics()
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
    PATTERNS,
    
    // Classes
    ProtocolNode,
    Composition,
    ProtocolComposer,
    
    // Factory
    createComposer() {
        return new ProtocolComposer();
    },
    
    createNode(protocol, config) {
        return new ProtocolNode(protocol, config);
    },
    
    createComposition(pattern, config) {
        return new Composition(pattern, config);
    },
    
    // Protocol info
    id: 'RSHIP-2026-COMPOSER-001',
    name: 'Protocol Composer SDK',
    version: '1.0.0',
    
    status() {
        return {
            sdk: 'protocol-composer',
            version: '1.0.0',
            patterns: Object.keys(PATTERNS).length,
            timestamp: Date.now()
        };
    }
};

// Self-test
if (require.main === module) {
    (async () => {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('PROTOCOL-COMPOSER SDK');
        console.log('═══════════════════════════════════════════════════════════════');
        
        const { createComposer, PATTERNS } = module.exports;
        
        console.log('\n1. Creating composer...');
        const composer = createComposer();
        
        // Register some test protocols
        composer.registerProtocol('validate', async (data) => {
            console.log('   [validate] Running...');
            return { ...data, validated: true };
        });
        
        composer.registerProtocol('transform', async (data) => {
            console.log('   [transform] Running...');
            return { ...data, transformed: true, value: (data.value || 0) * 2 };
        });
        
        composer.registerProtocol('analyze', async (data) => {
            console.log('   [analyze] Running...');
            return { ...data, analyzed: true };
        });
        
        console.log('\n2. Creating sequence composition...');
        const pipeline = composer.sequence('validate', 'transform', 'analyze');
        composer.compose('main-pipeline', pipeline);
        
        console.log('\n3. Executing pipeline...');
        const result = await composer.execute('main-pipeline', { value: 10 });
        console.log('   Result:', result);
        
        console.log('\n4. Creating parallel composition...');
        const parallel = composer.parallel(
            async (d) => ({ ...d, a: 'done' }),
            async (d) => ({ ...d, b: 'done' }),
            async (d) => ({ ...d, c: 'done' })
        );
        const parallelResult = await parallel.execute({ initial: true });
        console.log('   Parallel result:', parallelResult.data);
        
        console.log('\n5. Creating retry composition...');
        let attempts = 0;
        const retry = composer.retry(async () => {
            attempts++;
            if (attempts < 3) throw new Error('Retry needed');
            return { attempts };
        }, 5);
        const retryResult = await retry.execute({});
        console.log('   Retry result:', retryResult);
        
        console.log('\n6. Stats:', composer.getStats());
        
        console.log('\n✓ PROTOCOL-COMPOSER operational');
    })();
}
