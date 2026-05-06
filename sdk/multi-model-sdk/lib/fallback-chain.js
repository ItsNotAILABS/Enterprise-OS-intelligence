export class FallbackChain {
  constructor() {
    this.lastAttemptCount = 0;
  }

  execute(handlers = [], payload = {}) {
    const failures = [];
    this.lastAttemptCount = 0;

    for (const handler of handlers) {
      this.lastAttemptCount++;
      try {
        const result = handler(payload);
        if (result && result.success !== false) {
          return { success: true, attempts: this.lastAttemptCount, failures, result };
        }
      } catch (error) {
        failures.push(error.message);
      }
    }

    return { success: false, attempts: this.lastAttemptCount, failures, result: null };
  }
}

export default FallbackChain;
