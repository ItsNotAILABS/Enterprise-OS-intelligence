/**
 * INTELLIGENCE-ROUTING-SDK
 * Intelligent routing and load balancing for AI requests
 * 
 * RSHIP-2026-ROUTING-001 | Sovereign Intelligence Substrate
 * 
 * Routes intelligence requests to appropriate AGI/SDK handlers
 * based on capability matching, load, and φ-optimization.
 * 
 * @module sdk/intelligence-routing-sdk
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

// Routing strategies
const ROUTING_STRATEGIES = {
    ROUND_ROBIN: 'round-robin',
    LEAST_LOADED: 'least-loaded',
    CAPABILITY_MATCH: 'capability-match',
    PHI_WEIGHTED: 'phi-weighted',
    RANDOM: 'random',
    PRIORITY: 'priority'
};

// Request priorities
const PRIORITIES = {
    CRITICAL: 4,
    HIGH: 3,
    NORMAL: 2,
    LOW: 1,
    BACKGROUND: 0
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTE TARGET
// ═══════════════════════════════════════════════════════════════════════════════

class RouteTarget {
    constructor(config) {
        this.id = config.id || `TARGET-${Date.now()}`;
        this.name = config.name || 'Unknown';
        this.type = config.type || 'generic';
        this.capabilities = new Set(config.capabilities || []);
        this.handler = config.handler || null;
        
        // Load metrics
        this.currentLoad = 0;
        this.maxLoad = config.maxLoad || 100;
        this.activeRequests = 0;
        this.totalRequests = 0;
        this.totalLatency = 0;
        
        // Health
        this.healthy = true;
        this.lastHealthCheck = Date.now();
        this.consecutiveFailures = 0;
        
        // φ-metrics
        this.phiScore = config.phiScore || 1.0;
        this.phiAccumulated = 0;
        
        // Metadata
        this.priority = config.priority || PRIORITIES.NORMAL;
        this.weight = config.weight || 1.0;
    }
    
    /**
     * Check if target can handle capability
     */
    hasCapability(capability) {
        return this.capabilities.has(capability) || this.capabilities.has('*');
    }
    
    /**
     * Get load percentage
     */
    getLoadPercentage() {
        return this.currentLoad / this.maxLoad;
    }
    
    /**
     * Get average latency
     */
    getAverageLatency() {
        return this.totalRequests > 0 ? this.totalLatency / this.totalRequests : 0;
    }
    
    /**
     * Record request start
     */
    startRequest() {
        this.activeRequests++;
        this.currentLoad = Math.min(this.maxLoad, this.currentLoad + 1);
        this.totalRequests++;
        return Date.now();
    }
    
    /**
     * Record request end
     */
    endRequest(startTime, success = true) {
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        this.currentLoad = Math.max(0, this.currentLoad - 1);
        this.totalLatency += Date.now() - startTime;
        
        if (success) {
            this.consecutiveFailures = 0;
            this.phiAccumulated += PHI_INV * 0.01;
        } else {
            this.consecutiveFailures++;
            if (this.consecutiveFailures >= 3) {
                this.healthy = false;
            }
        }
    }
    
    /**
     * Get target score for routing
     */
    getScore(capability = null) {
        let score = this.phiScore * this.weight;
        
        // Penalty for high load
        score *= (1 - this.getLoadPercentage() * 0.5);
        
        // Penalty for unhealthy
        if (!this.healthy) score *= 0.1;
        
        // Bonus for capability match
        if (capability && this.hasCapability(capability)) {
            score *= PHI;
        }
        
        // Latency factor
        const avgLatency = this.getAverageLatency();
        if (avgLatency > 0) {
            score /= Math.log(avgLatency + 1);
        }
        
        return score;
    }
    
    /**
     * Get target status
     */
    getStatus() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            capabilities: Array.from(this.capabilities),
            healthy: this.healthy,
            loadPercent: (this.getLoadPercentage() * 100).toFixed(1) + '%',
            activeRequests: this.activeRequests,
            totalRequests: this.totalRequests,
            avgLatency: this.getAverageLatency().toFixed(2) + 'ms',
            phiScore: this.phiScore,
            phiAccumulated: this.phiAccumulated
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════════════════════

class IntelligenceRouter {
    constructor(config = {}) {
        this.id = config.id || `ROUTER-${Date.now()}`;
        this.strategy = config.strategy || ROUTING_STRATEGIES.PHI_WEIGHTED;
        
        // Targets
        this.targets = new Map();
        this.roundRobinIndex = 0;
        
        // Request tracking
        this.requestQueue = [];
        this.activeRequests = new Map();
        this.requestHistory = [];
        this.maxHistory = 1000;
        
        // Events
        this.events = new EventEmitter();
        
        // φ-metrics
        this.phiAccumulated = 0;
    }
    
    /**
     * Add a routing target
     */
    addTarget(config) {
        const target = config instanceof RouteTarget ? config : new RouteTarget(config);
        this.targets.set(target.id, target);
        this.events.emit('target:added', target.getStatus());
        return target.id;
    }
    
    /**
     * Remove a target
     */
    removeTarget(targetId) {
        const removed = this.targets.delete(targetId);
        if (removed) {
            this.events.emit('target:removed', { id: targetId });
        }
        return removed;
    }
    
    /**
     * Get target by ID
     */
    getTarget(targetId) {
        return this.targets.get(targetId);
    }
    
    /**
     * Select target for request
     */
    selectTarget(request) {
        const capability = request.capability || request.type;
        const healthyTargets = Array.from(this.targets.values()).filter(t => t.healthy);
        
        if (healthyTargets.length === 0) {
            // Fallback to unhealthy if no healthy targets
            const allTargets = Array.from(this.targets.values());
            if (allTargets.length === 0) return null;
            return allTargets[0];
        }
        
        // Filter by capability if specified
        let candidates = capability 
            ? healthyTargets.filter(t => t.hasCapability(capability))
            : healthyTargets;
        
        if (candidates.length === 0) {
            candidates = healthyTargets;  // Fallback to all healthy
        }
        
        switch (this.strategy) {
            case ROUTING_STRATEGIES.ROUND_ROBIN:
                return this._selectRoundRobin(candidates);
            
            case ROUTING_STRATEGIES.LEAST_LOADED:
                return this._selectLeastLoaded(candidates);
            
            case ROUTING_STRATEGIES.CAPABILITY_MATCH:
                return this._selectCapabilityMatch(candidates, capability);
            
            case ROUTING_STRATEGIES.PHI_WEIGHTED:
                return this._selectPhiWeighted(candidates, capability);
            
            case ROUTING_STRATEGIES.RANDOM:
                return candidates[Math.floor(Math.random() * candidates.length)];
            
            case ROUTING_STRATEGIES.PRIORITY:
                return this._selectByPriority(candidates, request.priority);
            
            default:
                return this._selectPhiWeighted(candidates, capability);
        }
    }
    
    _selectRoundRobin(targets) {
        const target = targets[this.roundRobinIndex % targets.length];
        this.roundRobinIndex++;
        return target;
    }
    
    _selectLeastLoaded(targets) {
        return targets.reduce((min, t) => 
            t.getLoadPercentage() < min.getLoadPercentage() ? t : min
        );
    }
    
    _selectCapabilityMatch(targets, capability) {
        const matching = targets.filter(t => t.hasCapability(capability));
        if (matching.length > 0) {
            return this._selectLeastLoaded(matching);
        }
        return this._selectLeastLoaded(targets);
    }
    
    _selectPhiWeighted(targets, capability) {
        // Calculate scores
        const scored = targets.map(t => ({
            target: t,
            score: t.getScore(capability)
        }));
        
        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);
        
        // Weighted random selection from top candidates
        const total = scored.slice(0, 3).reduce((s, x) => s + x.score, 0);
        let random = Math.random() * total;
        
        for (const { target, score } of scored.slice(0, 3)) {
            random -= score;
            if (random <= 0) return target;
        }
        
        return scored[0].target;
    }
    
    _selectByPriority(targets, requestPriority) {
        const prioritized = targets.filter(t => t.priority >= requestPriority);
        if (prioritized.length > 0) {
            return this._selectLeastLoaded(prioritized);
        }
        return this._selectLeastLoaded(targets);
    }
    
    /**
     * Route a request
     */
    async route(request) {
        const requestId = request.id || `REQ-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        const target = this.selectTarget(request);
        
        if (!target) {
            const error = { error: 'No available targets', requestId };
            this.events.emit('route:failed', error);
            return error;
        }
        
        // Start request tracking
        const startTime = target.startRequest();
        this.activeRequests.set(requestId, {
            requestId,
            targetId: target.id,
            startTime,
            request
        });
        
        this.events.emit('route:start', { requestId, targetId: target.id });
        
        try {
            // Execute handler if available
            let result;
            if (target.handler && typeof target.handler === 'function') {
                result = await target.handler(request);
            } else {
                result = { routed: true, targetId: target.id };
            }
            
            // Complete request
            target.endRequest(startTime, true);
            this.activeRequests.delete(requestId);
            
            // Record history
            this._recordHistory({
                requestId,
                targetId: target.id,
                startTime,
                endTime: Date.now(),
                success: true
            });
            
            this.phiAccumulated += PHI_INV * 0.001;
            this.events.emit('route:complete', { requestId, targetId: target.id, latency: Date.now() - startTime });
            
            return { requestId, targetId: target.id, result };
            
        } catch (err) {
            target.endRequest(startTime, false);
            this.activeRequests.delete(requestId);
            
            this._recordHistory({
                requestId,
                targetId: target.id,
                startTime,
                endTime: Date.now(),
                success: false,
                error: err.message
            });
            
            this.events.emit('route:error', { requestId, targetId: target.id, error: err.message });
            
            return { requestId, error: err.message };
        }
    }
    
    _recordHistory(record) {
        this.requestHistory.push(record);
        if (this.requestHistory.length > this.maxHistory) {
            this.requestHistory.shift();
        }
    }
    
    /**
     * Health check all targets
     */
    async healthCheck() {
        const results = [];
        
        for (const target of this.targets.values()) {
            const wasHealthy = target.healthy;
            
            // Simple health check (could be extended)
            target.lastHealthCheck = Date.now();
            
            // Mark healthy if no recent failures
            if (target.consecutiveFailures < 3 && !target.healthy) {
                target.healthy = true;
                target.consecutiveFailures = 0;
            }
            
            results.push({
                id: target.id,
                healthy: target.healthy,
                changed: wasHealthy !== target.healthy
            });
            
            if (wasHealthy !== target.healthy) {
                this.events.emit('target:health', { 
                    id: target.id, 
                    healthy: target.healthy 
                });
            }
        }
        
        return results;
    }
    
    /**
     * Get router statistics
     */
    getStats() {
        const targets = Array.from(this.targets.values());
        
        return {
            id: this.id,
            strategy: this.strategy,
            targetCount: targets.length,
            healthyTargets: targets.filter(t => t.healthy).length,
            activeRequests: this.activeRequests.size,
            totalRouted: this.requestHistory.length,
            successRate: this._calculateSuccessRate(),
            avgLatency: this._calculateAvgLatency(),
            phiAccumulated: this.phiAccumulated
        };
    }
    
    _calculateSuccessRate() {
        if (this.requestHistory.length === 0) return 1;
        const successes = this.requestHistory.filter(r => r.success).length;
        return successes / this.requestHistory.length;
    }
    
    _calculateAvgLatency() {
        if (this.requestHistory.length === 0) return 0;
        const totalLatency = this.requestHistory.reduce((sum, r) => sum + (r.endTime - r.startTime), 0);
        return totalLatency / this.requestHistory.length;
    }
    
    /**
     * Get all target statuses
     */
    getTargetStatuses() {
        return Array.from(this.targets.values()).map(t => t.getStatus());
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    // Constants
    PHI,
    PHI_INV,
    ROUTING_STRATEGIES,
    PRIORITIES,
    
    // Classes
    RouteTarget,
    IntelligenceRouter,
    
    // Factory
    createRouter(config = {}) {
        return new IntelligenceRouter(config);
    },
    
    createTarget(config) {
        return new RouteTarget(config);
    },
    
    // Protocol info
    id: 'RSHIP-2026-ROUTING-001',
    name: 'Intelligence Routing SDK',
    version: '1.0.0',
    
    status() {
        return {
            sdk: 'intelligence-routing-sdk',
            version: '1.0.0',
            strategies: Object.keys(ROUTING_STRATEGIES).length,
            priorities: Object.keys(PRIORITIES).length,
            timestamp: Date.now()
        };
    }
};

// Self-test
if (require.main === module) {
    (async () => {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('INTELLIGENCE-ROUTING-SDK');
        console.log('═══════════════════════════════════════════════════════════════');
        
        const { createRouter } = module.exports;
        
        console.log('\n1. Creating router...');
        const router = createRouter({ strategy: 'phi-weighted' });
        
        console.log('\n2. Adding targets...');
        router.addTarget({
            id: 'AXIOM-1',
            name: 'AXIOM Instance 1',
            type: 'AGI',
            capabilities: ['reasoning', 'analysis', 'research'],
            handler: async (req) => ({ analyzed: true, by: 'AXIOM-1' })
        });
        
        router.addTarget({
            id: 'FORTRESS-1',
            name: 'FORTRESS Instance 1',
            type: 'AGI',
            capabilities: ['security', 'audit', 'protection'],
            handler: async (req) => ({ secured: true, by: 'FORTRESS-1' })
        });
        
        router.addTarget({
            id: 'WORKER-1',
            name: 'General Worker',
            type: 'WORKER',
            capabilities: ['*'],
            handler: async (req) => ({ processed: true, by: 'WORKER-1' })
        });
        
        console.log(`   Added ${router.targets.size} targets`);
        
        console.log('\n3. Routing requests...');
        const result1 = await router.route({ type: 'reasoning', data: 'test' });
        console.log(`   Request 1 routed to: ${result1.targetId}`);
        
        const result2 = await router.route({ type: 'security', data: 'test' });
        console.log(`   Request 2 routed to: ${result2.targetId}`);
        
        const result3 = await router.route({ type: 'unknown', data: 'test' });
        console.log(`   Request 3 routed to: ${result3.targetId}`);
        
        console.log('\n4. Router stats:');
        console.log('   ', router.getStats());
        
        console.log('\n5. Target statuses:');
        for (const status of router.getTargetStatuses()) {
            console.log(`   ${status.name}: ${status.loadPercent} load, ${status.totalRequests} requests`);
        }
        
        console.log('\n✓ INTELLIGENCE-ROUTING-SDK operational');
    })();
}
