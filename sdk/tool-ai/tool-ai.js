/**
 * TOOL-AI SDK
 * AI-powered tool execution and orchestration
 * 
 * RSHIP-2026-TOOL-AI-001 | Sovereign Intelligence Substrate
 * 
 * Provides a standardized interface for AI tools including:
 * - Tool registration and discovery
 * - Parameter validation
 * - Execution with monitoring
 * - Result caching and optimization
 * 
 * @module sdk/tool-ai
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

// Tool categories
const TOOL_CATEGORIES = {
    SEARCH: 'search',
    COMPUTE: 'compute',
    TRANSFORM: 'transform',
    ANALYZE: 'analyze',
    GENERATE: 'generate',
    COMMUNICATE: 'communicate',
    STORAGE: 'storage',
    UTILITY: 'utility'
};

// Parameter types
const PARAM_TYPES = {
    STRING: 'string',
    NUMBER: 'number',
    BOOLEAN: 'boolean',
    ARRAY: 'array',
    OBJECT: 'object',
    ANY: 'any'
};

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

class Tool {
    constructor(config) {
        this.id = config.id || `TOOL-${Date.now()}`;
        this.name = config.name || 'Unknown Tool';
        this.description = config.description || '';
        this.category = config.category || TOOL_CATEGORIES.UTILITY;
        this.version = config.version || '1.0.0';
        
        // Parameters schema
        this.parameters = config.parameters || [];
        this.requiredParams = this.parameters.filter(p => p.required).map(p => p.name);
        
        // Execution
        this.handler = config.handler || null;
        this.timeout = config.timeout || 30000;
        this.cacheable = config.cacheable || false;
        this.cacheTimeout = config.cacheTimeout || 60000;
        
        // Metadata
        this.tags = config.tags || [];
        this.examples = config.examples || [];
        
        // Metrics
        this.executions = 0;
        this.successes = 0;
        this.failures = 0;
        this.totalLatency = 0;
        this.phiAccumulated = 0;
        
        // Cache
        this.cache = new Map();
    }
    
    /**
     * Validate parameters
     */
    validateParams(params) {
        const errors = [];
        
        // Check required params
        for (const required of this.requiredParams) {
            if (params[required] === undefined) {
                errors.push(`Missing required parameter: ${required}`);
            }
        }
        
        // Type checking
        for (const paramDef of this.parameters) {
            const value = params[paramDef.name];
            if (value === undefined) continue;
            
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            if (paramDef.type !== PARAM_TYPES.ANY && actualType !== paramDef.type) {
                errors.push(`Parameter ${paramDef.name} should be ${paramDef.type}, got ${actualType}`);
            }
            
            // Range validation
            if (paramDef.min !== undefined && value < paramDef.min) {
                errors.push(`Parameter ${paramDef.name} must be >= ${paramDef.min}`);
            }
            if (paramDef.max !== undefined && value > paramDef.max) {
                errors.push(`Parameter ${paramDef.name} must be <= ${paramDef.max}`);
            }
            
            // Enum validation
            if (paramDef.enum && !paramDef.enum.includes(value)) {
                errors.push(`Parameter ${paramDef.name} must be one of: ${paramDef.enum.join(', ')}`);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Get cache key for params
     */
    _getCacheKey(params) {
        return crypto.createHash('md5')
            .update(JSON.stringify(params))
            .digest('hex');
    }
    
    /**
     * Execute the tool
     */
    async execute(params, context = {}) {
        this.executions++;
        const startTime = Date.now();
        
        // Validate
        const validation = this.validateParams(params);
        if (!validation.valid) {
            this.failures++;
            return {
                success: false,
                errors: validation.errors,
                toolId: this.id
            };
        }
        
        // Check cache
        if (this.cacheable) {
            const cacheKey = this._getCacheKey(params);
            const cached = this.cache.get(cacheKey);
            
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
                return {
                    success: true,
                    result: cached.result,
                    cached: true,
                    toolId: this.id
                };
            }
        }
        
        try {
            // Execute handler
            if (!this.handler) {
                throw new Error('No handler defined for tool');
            }
            
            const result = await Promise.race([
                this.handler(params, context),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Tool execution timeout')), this.timeout)
                )
            ]);
            
            // Cache result
            if (this.cacheable) {
                const cacheKey = this._getCacheKey(params);
                this.cache.set(cacheKey, {
                    result,
                    timestamp: Date.now()
                });
            }
            
            this.successes++;
            this.totalLatency += Date.now() - startTime;
            this.phiAccumulated += PHI_INV * 0.01;
            
            return {
                success: true,
                result,
                cached: false,
                latency: Date.now() - startTime,
                toolId: this.id
            };
            
        } catch (error) {
            this.failures++;
            this.totalLatency += Date.now() - startTime;
            
            return {
                success: false,
                error: error.message,
                latency: Date.now() - startTime,
                toolId: this.id
            };
        }
    }
    
    /**
     * Get tool specification (for AI models)
     */
    getSpec() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            category: this.category,
            parameters: this.parameters.map(p => ({
                name: p.name,
                type: p.type,
                description: p.description,
                required: p.required,
                default: p.default,
                enum: p.enum
            })),
            examples: this.examples
        };
    }
    
    /**
     * Get tool metrics
     */
    getMetrics() {
        return {
            id: this.id,
            name: this.name,
            category: this.category,
            executions: this.executions,
            successes: this.successes,
            failures: this.failures,
            successRate: this.executions > 0 ? this.successes / this.executions : 0,
            avgLatency: this.executions > 0 ? this.totalLatency / this.executions : 0,
            cacheSize: this.cache.size,
            phiAccumulated: this.phiAccumulated
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOLBOX
// ═══════════════════════════════════════════════════════════════════════════════

class Toolbox {
    constructor(config = {}) {
        this.id = config.id || `TOOLBOX-${Date.now()}`;
        this.name = config.name || 'Default Toolbox';
        this.tools = new Map();
        this.events = new EventEmitter();
        
        // Usage tracking
        this.history = [];
        this.maxHistory = config.maxHistory || 1000;
    }
    
    /**
     * Register a tool
     */
    register(toolConfig) {
        const tool = toolConfig instanceof Tool ? toolConfig : new Tool(toolConfig);
        this.tools.set(tool.id, tool);
        this.events.emit('tool:registered', tool.getSpec());
        return tool.id;
    }
    
    /**
     * Get a tool
     */
    get(toolId) {
        return this.tools.get(toolId);
    }
    
    /**
     * Find tools by category
     */
    findByCategory(category) {
        return Array.from(this.tools.values()).filter(t => t.category === category);
    }
    
    /**
     * Find tools by tag
     */
    findByTag(tag) {
        return Array.from(this.tools.values()).filter(t => t.tags.includes(tag));
    }
    
    /**
     * Search tools
     */
    search(query) {
        const queryLower = query.toLowerCase();
        return Array.from(this.tools.values()).filter(t => 
            t.name.toLowerCase().includes(queryLower) ||
            t.description.toLowerCase().includes(queryLower) ||
            t.tags.some(tag => tag.toLowerCase().includes(queryLower))
        );
    }
    
    /**
     * Execute a tool
     */
    async execute(toolId, params, context = {}) {
        const tool = this.tools.get(toolId);
        if (!tool) {
            return {
                success: false,
                error: `Tool not found: ${toolId}`
            };
        }
        
        const result = await tool.execute(params, context);
        
        // Record history
        this.history.push({
            toolId,
            params,
            result: result.success,
            timestamp: Date.now()
        });
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        
        this.events.emit('tool:executed', {
            toolId,
            success: result.success,
            latency: result.latency
        });
        
        return result;
    }
    
    /**
     * Get all tool specifications
     */
    getAllSpecs() {
        return Array.from(this.tools.values()).map(t => t.getSpec());
    }
    
    /**
     * Get toolbox statistics
     */
    getStats() {
        const tools = Array.from(this.tools.values());
        
        return {
            id: this.id,
            name: this.name,
            toolCount: tools.length,
            byCategory: tools.reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + 1;
                return acc;
            }, {}),
            totalExecutions: tools.reduce((sum, t) => sum + t.executions, 0),
            totalSuccesses: tools.reduce((sum, t) => sum + t.successes, 0),
            historySize: this.history.length
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILT-IN TOOLS
// ═══════════════════════════════════════════════════════════════════════════════

const builtInTools = {
    // Math tools
    calculate: new Tool({
        id: 'calculate',
        name: 'Calculator',
        description: 'Perform mathematical calculations',
        category: TOOL_CATEGORIES.COMPUTE,
        parameters: [
            { name: 'expression', type: PARAM_TYPES.STRING, required: true, description: 'Math expression' }
        ],
        handler: async (params) => {
            // Safe evaluation (limited)
            const expr = params.expression
                .replace(/[^0-9+\-*/().%\s]/g, '')
                .trim();
            
            if (!expr) throw new Error('Invalid expression');
            
            // Simple safe eval using Function
            const result = new Function(`return ${expr}`)();
            return { result };
        },
        cacheable: true,
        tags: ['math', 'calculate', 'compute']
    }),
    
    // String tools
    transform_text: new Tool({
        id: 'transform_text',
        name: 'Text Transformer',
        description: 'Transform text (uppercase, lowercase, etc.)',
        category: TOOL_CATEGORIES.TRANSFORM,
        parameters: [
            { name: 'text', type: PARAM_TYPES.STRING, required: true },
            { 
                name: 'operation', 
                type: PARAM_TYPES.STRING, 
                required: true,
                enum: ['uppercase', 'lowercase', 'capitalize', 'reverse', 'trim']
            }
        ],
        handler: async (params) => {
            const { text, operation } = params;
            let result;
            
            switch (operation) {
                case 'uppercase': result = text.toUpperCase(); break;
                case 'lowercase': result = text.toLowerCase(); break;
                case 'capitalize': result = text.charAt(0).toUpperCase() + text.slice(1); break;
                case 'reverse': result = text.split('').reverse().join(''); break;
                case 'trim': result = text.trim(); break;
                default: throw new Error(`Unknown operation: ${operation}`);
            }
            
            return { result, operation };
        },
        cacheable: true,
        tags: ['text', 'string', 'transform']
    }),
    
    // Timestamp tool
    timestamp: new Tool({
        id: 'timestamp',
        name: 'Timestamp',
        description: 'Get current timestamp or convert dates',
        category: TOOL_CATEGORIES.UTILITY,
        parameters: [
            { name: 'format', type: PARAM_TYPES.STRING, default: 'iso' }
        ],
        handler: async (params) => {
            const now = new Date();
            let result;
            
            switch (params.format) {
                case 'unix': result = Math.floor(now.getTime() / 1000); break;
                case 'ms': result = now.getTime(); break;
                case 'iso': 
                default: result = now.toISOString(); break;
            }
            
            return { result, format: params.format };
        },
        tags: ['time', 'date', 'timestamp']
    }),
    
    // Hash tool
    hash: new Tool({
        id: 'hash',
        name: 'Hash Generator',
        description: 'Generate hash of input',
        category: TOOL_CATEGORIES.COMPUTE,
        parameters: [
            { name: 'input', type: PARAM_TYPES.STRING, required: true },
            { name: 'algorithm', type: PARAM_TYPES.STRING, default: 'sha256', enum: ['md5', 'sha1', 'sha256', 'sha512'] }
        ],
        handler: async (params) => {
            const hash = crypto
                .createHash(params.algorithm || 'sha256')
                .update(params.input)
                .digest('hex');
            
            return { hash, algorithm: params.algorithm };
        },
        cacheable: true,
        tags: ['hash', 'crypto', 'security']
    }),
    
    // Random tool
    random: new Tool({
        id: 'random',
        name: 'Random Generator',
        description: 'Generate random values',
        category: TOOL_CATEGORIES.COMPUTE,
        parameters: [
            { name: 'type', type: PARAM_TYPES.STRING, default: 'number', enum: ['number', 'uuid', 'bytes'] },
            { name: 'min', type: PARAM_TYPES.NUMBER, default: 0 },
            { name: 'max', type: PARAM_TYPES.NUMBER, default: 100 },
            { name: 'count', type: PARAM_TYPES.NUMBER, default: 16 }
        ],
        handler: async (params) => {
            let result;
            
            switch (params.type) {
                case 'uuid':
                    result = crypto.randomUUID?.() || 
                        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                            const r = Math.random() * 16 | 0;
                            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                        });
                    break;
                case 'bytes':
                    result = crypto.randomBytes(params.count || 16).toString('hex');
                    break;
                case 'number':
                default:
                    result = Math.floor(Math.random() * (params.max - params.min + 1)) + params.min;
            }
            
            return { result, type: params.type };
        },
        tags: ['random', 'generate', 'uuid']
    })
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    // Constants
    PHI,
    PHI_INV,
    TOOL_CATEGORIES,
    PARAM_TYPES,
    
    // Classes
    Tool,
    Toolbox,
    
    // Factory
    createToolbox(config = {}) {
        const toolbox = new Toolbox(config);
        
        // Register built-in tools if requested
        if (config.includeBuiltIn !== false) {
            for (const tool of Object.values(builtInTools)) {
                toolbox.register(tool);
            }
        }
        
        return toolbox;
    },
    
    createTool(config) {
        return new Tool(config);
    },
    
    // Built-in tools
    builtInTools,
    
    // Protocol info
    id: 'RSHIP-2026-TOOL-AI-001',
    name: 'Tool AI SDK',
    version: '1.0.0',
    
    status() {
        return {
            sdk: 'tool-ai',
            version: '1.0.0',
            categories: Object.keys(TOOL_CATEGORIES).length,
            paramTypes: Object.keys(PARAM_TYPES).length,
            builtInTools: Object.keys(builtInTools).length,
            timestamp: Date.now()
        };
    }
};

// Self-test
if (require.main === module) {
    (async () => {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('TOOL-AI SDK');
        console.log('═══════════════════════════════════════════════════════════════');
        
        const { createToolbox, createTool, TOOL_CATEGORIES } = module.exports;
        
        console.log('\n1. Creating toolbox with built-in tools...');
        const toolbox = createToolbox({ name: 'TestToolbox' });
        console.log(`   Tools registered: ${toolbox.tools.size}`);
        
        console.log('\n2. Testing built-in tools...');
        
        // Calculator
        const calcResult = await toolbox.execute('calculate', { expression: '2 + 3 * 4' });
        console.log('   calculate:', calcResult.result);
        
        // Text transform
        const textResult = await toolbox.execute('transform_text', { text: 'hello', operation: 'uppercase' });
        console.log('   transform_text:', textResult.result);
        
        // Timestamp
        const timeResult = await toolbox.execute('timestamp', { format: 'iso' });
        console.log('   timestamp:', timeResult.result);
        
        // Hash
        const hashResult = await toolbox.execute('hash', { input: 'test', algorithm: 'sha256' });
        console.log('   hash:', hashResult.result.hash.substring(0, 16) + '...');
        
        // Random
        const randomResult = await toolbox.execute('random', { type: 'uuid' });
        console.log('   random uuid:', randomResult.result);
        
        console.log('\n3. Adding custom tool...');
        toolbox.register({
            id: 'custom_greet',
            name: 'Greeter',
            description: 'Generate a greeting',
            category: TOOL_CATEGORIES.GENERATE,
            parameters: [
                { name: 'name', type: 'string', required: true }
            ],
            handler: async (params) => ({ greeting: `Hello, ${params.name}!` })
        });
        
        const greetResult = await toolbox.execute('custom_greet', { name: 'World' });
        console.log('   custom_greet:', greetResult.result);
        
        console.log('\n4. Toolbox stats:', toolbox.getStats());
        
        console.log('\n✓ TOOL-AI operational');
    })();
}
