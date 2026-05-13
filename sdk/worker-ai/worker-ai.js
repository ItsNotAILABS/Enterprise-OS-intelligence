/**
 * WORKER-AI SDK
 * Generic AI worker for task execution
 * 
 * RSHIP-2026-WORKER-AI-001 | Sovereign Intelligence Substrate
 * 
 * Provides a standardized worker interface for executing tasks
 * with monitoring, queuing, and result handling.
 * 
 * @module sdk/worker-ai
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

const WORKER_STATES = {
    IDLE: 'idle',
    BUSY: 'busy',
    PAUSED: 'paused',
    ERROR: 'error',
    SHUTDOWN: 'shutdown'
};

const TASK_STATES = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};

const PRIORITIES = {
    CRITICAL: 4,
    HIGH: 3,
    NORMAL: 2,
    LOW: 1,
    BACKGROUND: 0
};

// ═══════════════════════════════════════════════════════════════════════════════
// TASK
// ═══════════════════════════════════════════════════════════════════════════════

class Task {
    constructor(config) {
        this.id = config.id || `TASK-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        this.type = config.type || 'generic';
        this.name = config.name || this.type;
        this.priority = config.priority ?? PRIORITIES.NORMAL;
        this.payload = config.payload || {};
        this.handler = config.handler || null;
        
        // State
        this.state = TASK_STATES.PENDING;
        this.progress = 0;
        this.result = null;
        this.error = null;
        
        // Timing
        this.createdAt = Date.now();
        this.startedAt = null;
        this.completedAt = null;
        this.timeout = config.timeout || 60000;
        
        // Metadata
        this.retries = 0;
        this.maxRetries = config.maxRetries || 3;
        this.tags = config.tags || [];
    }
    
    /**
     * Start task execution
     */
    start() {
        this.state = TASK_STATES.RUNNING;
        this.startedAt = Date.now();
        return this;
    }
    
    /**
     * Complete task successfully
     */
    complete(result) {
        this.state = TASK_STATES.COMPLETED;
        this.completedAt = Date.now();
        this.result = result;
        this.progress = 100;
        return this;
    }
    
    /**
     * Fail task
     */
    fail(error) {
        this.state = TASK_STATES.FAILED;
        this.completedAt = Date.now();
        this.error = error;
        return this;
    }
    
    /**
     * Cancel task
     */
    cancel() {
        if (this.state === TASK_STATES.PENDING) {
            this.state = TASK_STATES.CANCELLED;
            this.completedAt = Date.now();
        }
        return this;
    }
    
    /**
     * Update progress
     */
    setProgress(percent) {
        this.progress = Math.max(0, Math.min(100, percent));
        return this;
    }
    
    /**
     * Check if can retry
     */
    canRetry() {
        return this.retries < this.maxRetries && this.state === TASK_STATES.FAILED;
    }
    
    /**
     * Get task duration
     */
    getDuration() {
        if (!this.startedAt) return 0;
        const endTime = this.completedAt || Date.now();
        return endTime - this.startedAt;
    }
    
    /**
     * Get task status
     */
    getStatus() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            state: this.state,
            progress: this.progress,
            priority: this.priority,
            duration: this.getDuration(),
            retries: this.retries,
            hasResult: this.result !== null,
            hasError: this.error !== null
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK QUEUE
// ═══════════════════════════════════════════════════════════════════════════════

class TaskQueue {
    constructor(config = {}) {
        this.tasks = [];
        this.maxSize = config.maxSize || 1000;
        this.sortByPriority = config.sortByPriority !== false;
    }
    
    /**
     * Add task to queue
     */
    enqueue(task) {
        if (this.tasks.length >= this.maxSize) {
            return false;
        }
        
        this.tasks.push(task);
        
        if (this.sortByPriority) {
            this.tasks.sort((a, b) => b.priority - a.priority);
        }
        
        return true;
    }
    
    /**
     * Get next task from queue
     */
    dequeue() {
        return this.tasks.shift();
    }
    
    /**
     * Peek at next task without removing
     */
    peek() {
        return this.tasks[0];
    }
    
    /**
     * Remove specific task
     */
    remove(taskId) {
        const index = this.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            return this.tasks.splice(index, 1)[0];
        }
        return null;
    }
    
    /**
     * Get queue size
     */
    size() {
        return this.tasks.length;
    }
    
    /**
     * Check if queue is empty
     */
    isEmpty() {
        return this.tasks.length === 0;
    }
    
    /**
     * Clear queue
     */
    clear() {
        const cleared = this.tasks.length;
        this.tasks = [];
        return cleared;
    }
    
    /**
     * Get queue status
     */
    getStatus() {
        const byPriority = {};
        for (const task of this.tasks) {
            const p = task.priority;
            byPriority[p] = (byPriority[p] || 0) + 1;
        }
        
        return {
            size: this.tasks.length,
            maxSize: this.maxSize,
            byPriority
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORKER
// ═══════════════════════════════════════════════════════════════════════════════

class Worker {
    constructor(config = {}) {
        this.id = config.id || `WORKER-${Date.now()}`;
        this.name = config.name || 'Worker';
        this.concurrency = config.concurrency || 1;
        
        // State
        this.state = WORKER_STATES.IDLE;
        this.queue = new TaskQueue(config.queue || {});
        this.activeTasks = new Map();
        this.completedTasks = [];
        this.maxCompleted = config.maxCompleted || 100;
        
        // Handlers
        this.handlers = new Map();
        this.defaultHandler = config.defaultHandler || null;
        
        // Events
        this.events = new EventEmitter();
        
        // Metrics
        this.totalProcessed = 0;
        this.totalSucceeded = 0;
        this.totalFailed = 0;
        this.totalLatency = 0;
        this.phiAccumulated = 0;
        
        // Processing
        this.processing = false;
        this.processInterval = null;
    }
    
    /**
     * Register a task handler
     */
    registerHandler(type, handler) {
        this.handlers.set(type, handler);
        return this;
    }
    
    /**
     * Submit a task
     */
    submit(taskConfig) {
        const task = taskConfig instanceof Task ? taskConfig : new Task(taskConfig);
        
        if (!this.queue.enqueue(task)) {
            return null;
        }
        
        this.events.emit('task:submitted', task.getStatus());
        
        // Auto-start processing if idle
        if (this.state === WORKER_STATES.IDLE && !this.processing) {
            this._startProcessing();
        }
        
        return task.id;
    }
    
    /**
     * Start the worker
     */
    start() {
        if (this.state === WORKER_STATES.SHUTDOWN) {
            this.state = WORKER_STATES.IDLE;
        }
        this._startProcessing();
        return this;
    }
    
    /**
     * Pause the worker
     */
    pause() {
        this.state = WORKER_STATES.PAUSED;
        this._stopProcessing();
        return this;
    }
    
    /**
     * Resume the worker
     */
    resume() {
        if (this.state === WORKER_STATES.PAUSED) {
            this.state = WORKER_STATES.IDLE;
            this._startProcessing();
        }
        return this;
    }
    
    /**
     * Shutdown the worker
     */
    async shutdown(graceful = true) {
        this._stopProcessing();
        
        if (graceful) {
            // Wait for active tasks to complete
            while (this.activeTasks.size > 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        this.state = WORKER_STATES.SHUTDOWN;
        this.events.emit('shutdown');
        return this;
    }
    
    /**
     * Cancel a task
     */
    cancel(taskId) {
        // Check queue first
        const queuedTask = this.queue.remove(taskId);
        if (queuedTask) {
            queuedTask.cancel();
            return true;
        }
        
        // Check active tasks (can't really cancel, just mark)
        const activeTask = this.activeTasks.get(taskId);
        if (activeTask) {
            // Mark for cancellation (handler should check)
            activeTask._cancelRequested = true;
            return true;
        }
        
        return false;
    }
    
    /**
     * Get task status
     */
    getTaskStatus(taskId) {
        // Check active
        const active = this.activeTasks.get(taskId);
        if (active) return active.getStatus();
        
        // Check completed
        const completed = this.completedTasks.find(t => t.id === taskId);
        if (completed) return completed.getStatus();
        
        // Check queue
        const queued = this.queue.tasks.find(t => t.id === taskId);
        if (queued) return queued.getStatus();
        
        return null;
    }
    
    /**
     * Start processing loop
     */
    _startProcessing() {
        if (this.processing) return;
        
        this.processing = true;
        this.processInterval = setInterval(() => this._processQueue(), 100);
    }
    
    /**
     * Stop processing loop
     */
    _stopProcessing() {
        if (this.processInterval) {
            clearInterval(this.processInterval);
            this.processInterval = null;
        }
        this.processing = false;
    }
    
    /**
     * Process queue
     */
    async _processQueue() {
        if (this.state === WORKER_STATES.PAUSED || this.state === WORKER_STATES.SHUTDOWN) {
            return;
        }
        
        // Check if we can process more
        while (this.activeTasks.size < this.concurrency && !this.queue.isEmpty()) {
            const task = this.queue.dequeue();
            if (task) {
                this._executeTask(task);
            }
        }
        
        // Update state
        if (this.activeTasks.size > 0) {
            this.state = WORKER_STATES.BUSY;
        } else if (this.queue.isEmpty()) {
            this.state = WORKER_STATES.IDLE;
        }
    }
    
    /**
     * Execute a single task
     */
    async _executeTask(task) {
        task.start();
        this.activeTasks.set(task.id, task);
        
        this.events.emit('task:started', task.getStatus());
        
        try {
            // Find handler
            const handler = task.handler || this.handlers.get(task.type) || this.defaultHandler;
            
            if (!handler) {
                throw new Error(`No handler for task type: ${task.type}`);
            }
            
            // Execute with timeout
            const result = await Promise.race([
                handler(task.payload, task),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Task timeout')), task.timeout)
                )
            ]);
            
            task.complete(result);
            this.totalSucceeded++;
            this.phiAccumulated += PHI_INV * 0.01;
            
            this.events.emit('task:completed', task.getStatus());
            
        } catch (error) {
            task.fail(error.message);
            this.totalFailed++;
            
            // Retry if possible
            if (task.canRetry()) {
                task.retries++;
                task.state = TASK_STATES.PENDING;
                this.queue.enqueue(task);
                this.events.emit('task:retry', task.getStatus());
            } else {
                this.events.emit('task:failed', task.getStatus());
            }
        }
        
        // Cleanup
        this.activeTasks.delete(task.id);
        this.totalProcessed++;
        this.totalLatency += task.getDuration();
        
        // Store completed
        this.completedTasks.push(task);
        if (this.completedTasks.length > this.maxCompleted) {
            this.completedTasks.shift();
        }
    }
    
    /**
     * Get worker status
     */
    getStatus() {
        return {
            id: this.id,
            name: this.name,
            state: this.state,
            concurrency: this.concurrency,
            queueSize: this.queue.size(),
            activeTasks: this.activeTasks.size,
            totalProcessed: this.totalProcessed,
            totalSucceeded: this.totalSucceeded,
            totalFailed: this.totalFailed,
            successRate: this.totalProcessed > 0 ? this.totalSucceeded / this.totalProcessed : 0,
            avgLatency: this.totalProcessed > 0 ? this.totalLatency / this.totalProcessed : 0,
            phiAccumulated: this.phiAccumulated
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORKER POOL
// ═══════════════════════════════════════════════════════════════════════════════

class WorkerPool {
    constructor(config = {}) {
        this.id = config.id || `POOL-${Date.now()}`;
        this.size = config.size || 4;
        this.workers = [];
        this.nextWorker = 0;
        
        // Create workers
        for (let i = 0; i < this.size; i++) {
            this.workers.push(new Worker({
                id: `${this.id}-WORKER-${i}`,
                name: `Worker-${i}`,
                ...config.workerConfig
            }));
        }
    }
    
    /**
     * Start all workers
     */
    start() {
        for (const worker of this.workers) {
            worker.start();
        }
        return this;
    }
    
    /**
     * Submit task to pool
     */
    submit(taskConfig) {
        // Round-robin selection
        const worker = this.workers[this.nextWorker];
        this.nextWorker = (this.nextWorker + 1) % this.size;
        
        return worker.submit(taskConfig);
    }
    
    /**
     * Register handler on all workers
     */
    registerHandler(type, handler) {
        for (const worker of this.workers) {
            worker.registerHandler(type, handler);
        }
        return this;
    }
    
    /**
     * Shutdown all workers
     */
    async shutdown(graceful = true) {
        await Promise.all(this.workers.map(w => w.shutdown(graceful)));
        return this;
    }
    
    /**
     * Get pool status
     */
    getStatus() {
        return {
            id: this.id,
            size: this.size,
            workers: this.workers.map(w => w.getStatus())
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
    WORKER_STATES,
    TASK_STATES,
    PRIORITIES,
    
    // Classes
    Task,
    TaskQueue,
    Worker,
    WorkerPool,
    
    // Factory
    createWorker(config = {}) {
        return new Worker(config);
    },
    
    createPool(config = {}) {
        return new WorkerPool(config);
    },
    
    createTask(config) {
        return new Task(config);
    },
    
    // Protocol info
    id: 'RSHIP-2026-WORKER-AI-001',
    name: 'Worker AI SDK',
    version: '1.0.0',
    
    status() {
        return {
            sdk: 'worker-ai',
            version: '1.0.0',
            workerStates: Object.keys(WORKER_STATES).length,
            taskStates: Object.keys(TASK_STATES).length,
            priorities: Object.keys(PRIORITIES).length,
            timestamp: Date.now()
        };
    }
};

// Self-test
if (require.main === module) {
    (async () => {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('WORKER-AI SDK');
        console.log('═══════════════════════════════════════════════════════════════');
        
        const { createWorker, PRIORITIES } = module.exports;
        
        console.log('\n1. Creating worker...');
        const worker = createWorker({ name: 'TestWorker', concurrency: 2 });
        
        // Register handlers
        worker.registerHandler('compute', async (payload) => {
            console.log('   [compute] Processing:', payload);
            await new Promise(r => setTimeout(r, 100));
            return { result: payload.value * 2 };
        });
        
        worker.registerHandler('analyze', async (payload) => {
            console.log('   [analyze] Processing:', payload);
            await new Promise(r => setTimeout(r, 150));
            return { analyzed: true };
        });
        
        console.log('\n2. Starting worker...');
        worker.start();
        
        console.log('\n3. Submitting tasks...');
        const taskId1 = worker.submit({ type: 'compute', payload: { value: 5 }, priority: PRIORITIES.HIGH });
        const taskId2 = worker.submit({ type: 'compute', payload: { value: 10 } });
        const taskId3 = worker.submit({ type: 'analyze', payload: { data: 'test' } });
        
        console.log(`   Submitted: ${taskId1}, ${taskId2}, ${taskId3}`);
        
        // Wait for completion
        worker.events.on('task:completed', (status) => {
            console.log(`   Task completed: ${status.id}`);
        });
        
        await new Promise(r => setTimeout(r, 1000));
        
        console.log('\n4. Worker status:', worker.getStatus());
        
        console.log('\n5. Shutting down...');
        await worker.shutdown();
        
        console.log('\n✓ WORKER-AI operational');
    })();
}
