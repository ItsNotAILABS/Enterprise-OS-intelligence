/**
 * EdgeSensor — Peripheral Signal Sensing
 *
 * Theory: COHORS MENTIS (Paper IX) — COGNOVEX units read from the field
 * continuously, even when no user is present. EdgeSensor is the interface
 * through which an organism reads its environment.
 *
 * @medina/organism-runtime-sdk — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

const SENSOR_TYPES = ['temperature', 'network', 'resource', 'signal', 'custom'];

export class EdgeSensor {
  constructor() {
    this._sensors = new Map();        // sensorId → config
    this._readings = new Map();       // sensorId → latest reading
    this._thresholds = new Map();     // sensorId → [{ threshold, callback }]
    this._calibrations = new Map();   // sensorId → calibration offset
    this._readingCount = 0;
  }

  // ── Registration ──────────────────────────────────────────────────────────

  registerSensor(sensorId, type, config = {}) {
    if (!SENSOR_TYPES.includes(type)) throw new Error(`Unknown sensor type: ${type}`);
    this._sensors.set(sensorId, {
      type,
      unit: config.unit ?? '',
      readFn: config.readFn ?? (() => null),
      description: config.description ?? sensorId,
    });
    this._calibrations.set(sensorId, 0);
    return this;
  }

  // ── Reading ───────────────────────────────────────────────────────────────

  read(sensorId) {
    const sensor = this._sensors.get(sensorId);
    if (!sensor) throw new Error(`Sensor not found: ${sensorId}`);

    this._readingCount++;
    const rawValue = sensor.readFn();
    const calibration = this._calibrations.get(sensorId) ?? 0;
    const value = rawValue !== null ? rawValue + calibration : null;

    const reading = {
      sensorId,
      type: sensor.type,
      value,
      unit: sensor.unit,
      timestamp: new Date().toISOString(),
      readingId: `rdg-${this._readingCount}`,
    };

    this._readings.set(sensorId, reading);

    // Check thresholds
    const thresholds = this._thresholds.get(sensorId) ?? [];
    for (const { threshold, callback } of thresholds) {
      if (value !== null && value >= threshold) {
        try { callback({ ...reading, threshold }); } catch (_) {}
      }
    }

    return reading;
  }

  readAll() {
    return [...this._sensors.keys()].map((id) => this.read(id));
  }

  // ── Thresholds ────────────────────────────────────────────────────────────

  onThreshold(sensorId, threshold, callback) {
    const existing = this._thresholds.get(sensorId) ?? [];
    existing.push({ threshold, callback });
    this._thresholds.set(sensorId, existing);
    return this;
  }

  // ── Calibration ───────────────────────────────────────────────────────────

  calibrate(sensorId, calibrationData) {
    if (calibrationData.reset) {
      this._calibrations.set(sensorId, 0);
    } else if (calibrationData.baseline !== undefined) {
      this._calibrations.set(sensorId, calibrationData.baseline);
    }
    return this;
  }

  // ── Observability ─────────────────────────────────────────────────────────

  getLatestReading(sensorId) {
    return this._readings.get(sensorId) ?? null;
  }

  listSensors() {
    return [...this._sensors.entries()].map(([id, s]) => ({
      sensorId: id,
      type: s.type,
      unit: s.unit,
      calibration: this._calibrations.get(id),
      lastReading: this._readings.get(id) ?? null,
    }));
  }
}

export default EdgeSensor;
