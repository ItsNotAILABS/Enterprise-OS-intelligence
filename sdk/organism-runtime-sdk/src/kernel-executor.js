/**
 * KernelExecutor — Computation Kernel Loading, Scheduling, and Execution
 *
 * Theory: COHORS MENTIS (Paper IX) — COGNOVEX units run continuously,
 * accumulate beliefs, select actions on their own, and self-report without
 * being asked. The KernelExecutor is the execution substrate for cognitive kernels.
 *
 * @medina/organism-runtime-sdk — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

export class KernelExecutor {
  /**
   * @param {import('./heartbeat.js').Heartbeat} [heartbeat]
   */
  constructor(heartbeat = null) {
    this._heartbeat = heartbeat;
    this._kernels = new Map();    // kernelId → { fn, config, status, executions }
    this._scheduled = new Map();  // beatNumber → [{ kernelId, input }]

    if (this._heartbeat) {
      this._heartbeat.onBeat(({ beatNumber }) => {
        const jobs = this._scheduled.get(beatNumber);
        if (jobs) {
          for (const { kernelId, input } of jobs) {
            this.execute(kernelId, input).catch(() => {});
          }
          this._scheduled.delete(beatNumber);
        }
      });
    }
  }

  // ── Kernel management ─────────────────────────────────────────────────────

  loadKernel(kernelId, kernelFn, config = {}) {
    const cfg = {
      priority: config.priority ?? 5,
      timeout: config.timeout ?? 5000,
      resourceBudget: config.resourceBudget ?? 100,
    };
    this._kernels.set(kernelId, {
      fn: kernelFn,
      config: cfg,
      status: 'loaded',
      executions: [],
    });
    return this;
  }

  // ── Execution ─────────────────────────────────────────────────────────────

  async execute(kernelId, input = {}) {
    const kernel = this._kernels.get(kernelId);
    if (!kernel) throw new Error(`Kernel not found: ${kernelId}`);

    kernel.status = 'running';
    const executionId = `exec-${kernelId}-${Date.now()}`;
    const start = Date.now();

    try {
      const output = await Promise.race([
        Promise.resolve(kernel.fn(input)),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), kernel.config.timeout),
        ),
      ]);

      const duration = Date.now() - start;
      const result = {
        executionId,
        output,
        duration,
        resourcesUsed: Math.round(duration / 10),
        timestamp: new Date().toISOString(),
      };

      kernel.executions.push({ ...result, success: true });
      kernel.status = 'completed';
      return result;

    } catch (err) {
      kernel.status = 'failed';
      kernel.executions.push({ executionId, error: err.message, success: false });
      throw err;
    }
  }

  // ── Scheduling ────────────────────────────────────────────────────────────

  schedule(kernelId, input, beatNumber) {
    const jobs = this._scheduled.get(beatNumber) ?? [];
    jobs.push({ kernelId, input });
    this._scheduled.set(beatNumber, jobs);
    return this;
  }

  // ── Observability ─────────────────────────────────────────────────────────

  getKernelStatus(kernelId) {
    return this._kernels.get(kernelId)?.status ?? null;
  }

  listKernels() {
    return [...this._kernels.entries()].map(([kernelId, k]) => ({
      kernelId,
      status: k.status,
      config: k.config,
      executionCount: k.executions.length,
    }));
  }
}

export default KernelExecutor;
