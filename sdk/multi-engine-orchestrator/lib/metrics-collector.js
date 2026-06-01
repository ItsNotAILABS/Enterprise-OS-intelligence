/**
 * @medina/multi-engine-orchestrator — Metrics Collector
 *
 * Collects, aggregates, and reports metrics from all engines,
 * pools, and pipelines. Provides real-time dashboards and
 * historical trend analysis.
 *
 * @module @medina/multi-engine-orchestrator/metrics-collector
 */

import crypto from 'node:crypto';

const PHI = (1 + Math.sqrt(5)) / 2;

// ═══════════════════════════════════════════════════════════════════════════════
// METRICS COLLECTOR
// ═══════════════════════════════════════════════════════════════════════════════

export class MetricsCollector {
  constructor(config = {}) {
    this.id = crypto.randomUUID();
    this.retentionMs = config.retentionMs || 24 * 60 * 60 * 1000; // 24h
    this.bucketSizeMs = config.bucketSizeMs || 60000; // 1 min

    /** @type {Map<string, MetricSeries>} */
    this.series = new Map();
    this.counters = new Map();
    this.gauges = new Map();
  }

  /**
   * Records a metric data point.
   */
  record(name, value, tags = {}) {
    const key = this._seriesKey(name, tags);
    if (!this.series.has(key)) {
      this.series.set(key, {
        name,
        tags,
        points: [],
        createdAt: Date.now()
      });
    }

    const series = this.series.get(key);
    series.points.push({ value, timestamp: Date.now() });

    // Prune old data
    const cutoff = Date.now() - this.retentionMs;
    series.points = series.points.filter(p => p.timestamp >= cutoff);
  }

  /**
   * Increments a counter.
   */
  increment(name, delta = 1, tags = {}) {
    const key = this._seriesKey(name, tags);
    this.counters.set(key, (this.counters.get(key) || 0) + delta);
    this.record(name, this.counters.get(key), tags);
  }

  /**
   * Sets a gauge value.
   */
  gauge(name, value, tags = {}) {
    const key = this._seriesKey(name, tags);
    this.gauges.set(key, value);
    this.record(name, value, tags);
  }

  /**
   * Gets aggregated statistics for a metric.
   */
  getStats(name, tags = {}, windowMs = 300000) {
    const key = this._seriesKey(name, tags);
    const series = this.series.get(key);
    if (!series) return null;

    const cutoff = Date.now() - windowMs;
    const points = series.points.filter(p => p.timestamp >= cutoff);

    if (points.length === 0) return { count: 0 };

    const values = points.map(p => p.value);
    values.sort((a, b) => a - b);

    return {
      count: values.length,
      min: values[0],
      max: values[values.length - 1],
      mean: values.reduce((s, v) => s + v, 0) / values.length,
      median: values[Math.floor(values.length / 2)],
      p95: values[Math.floor(values.length * 0.95)],
      p99: values[Math.floor(values.length * 0.99)],
      stddev: this._stddev(values),
      window: windowMs,
    };
  }

  /**
   * Returns all current gauge values.
   */
  getGauges() {
    return Object.fromEntries(this.gauges);
  }

  /**
   * Returns all current counter values.
   */
  getCounters() {
    return Object.fromEntries(this.counters);
  }

  /**
   * Returns a summary dashboard of all metrics.
   */
  getDashboard() {
    const seriesList = [...this.series.entries()].map(([key, series]) => ({
      key,
      name: series.name,
      tags: series.tags,
      pointCount: series.points.length,
      latestValue: series.points.length > 0
        ? series.points[series.points.length - 1].value
        : null,
    }));

    return {
      collectorId: this.id,
      timestamp: Date.now(),
      series: seriesList.length,
      counters: this.counters.size,
      gauges: this.gauges.size,
      topSeries: seriesList.sort((a, b) => b.pointCount - a.pointCount).slice(0, 20),
    };
  }

  _seriesKey(name, tags) {
    const tagStr = Object.entries(tags).sort().map(([k, v]) => `${k}=${v}`).join(',');
    return `${name}{${tagStr}}`;
  }

  _stddev(values) {
    if (values.length < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}
