/**
 * MEDINA-FIELD SDK
 * Medina Field mathematics and φ-topology primitives
 * 
 * RSHIP-2026-MEDINA-FIELD-001 | Sovereign Intelligence Substrate
 * 
 * Named after the mathematical structure underlying RSHIP intelligence.
 * Implements φ-based field dynamics, resonance, and coherence.
 * 
 * @module sdk/medina-field
 * @version 1.0.0
 * @license RSHIP-SOVEREIGN
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;
const PHI_SQ = PHI * PHI;
const PHI_CUBE = PHI * PHI * PHI;
const SCHUMANN_HZ = 7.83;

// φ-ladder
const PHI_LADDER = [
    PHI_CUBE * PHI,  // φ⁴
    PHI_CUBE,        // φ³
    PHI_SQ,          // φ²
    PHI,             // φ¹
    1.0,             // φ⁰
    PHI_INV,         // φ⁻¹
    PHI_INV * PHI_INV  // φ⁻²
];

// ═══════════════════════════════════════════════════════════════════════════════
// MEDINA FIELD POINT
// ═══════════════════════════════════════════════════════════════════════════════

class FieldPoint {
    constructor(coords = { x: 0, y: 0, z: 0, phi: 1 }) {
        this.x = coords.x;
        this.y = coords.y;
        this.z = coords.z;
        this.phi = coords.phi || 1;  // φ-dimension
        
        // Field properties
        this.potential = 0;
        this.gradient = { x: 0, y: 0, z: 0, phi: 0 };
        this.coherence = 1.0;
    }
    
    /**
     * Distance to another point
     */
    distanceTo(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const dz = other.z - this.z;
        const dphi = (other.phi - this.phi) * PHI;  // φ-weighted
        
        return Math.sqrt(dx*dx + dy*dy + dz*dz + dphi*dphi);
    }
    
    /**
     * φ-distance (golden ratio weighted)
     */
    phiDistanceTo(other) {
        const spatial = Math.sqrt(
            Math.pow(other.x - this.x, 2) +
            Math.pow(other.y - this.y, 2) +
            Math.pow(other.z - this.z, 2)
        );
        const phiDist = Math.abs(other.phi - this.phi);
        
        return spatial * Math.pow(PHI, phiDist);
    }
    
    /**
     * Interpolate to another point
     */
    interpolateTo(other, t) {
        return new FieldPoint({
            x: this.x + (other.x - this.x) * t,
            y: this.y + (other.y - this.y) * t,
            z: this.z + (other.z - this.z) * t,
            phi: this.phi + (other.phi - this.phi) * t
        });
    }
    
    /**
     * φ-interpolate (golden ratio easing)
     */
    phiInterpolateTo(other, t) {
        // Use φ-based easing
        const eased = 1 - Math.pow(1 - t, PHI);
        return this.interpolateTo(other, eased);
    }
    
    /**
     * To array
     */
    toArray() {
        return [this.x, this.y, this.z, this.phi];
    }
    
    /**
     * From array
     */
    static fromArray(arr) {
        return new FieldPoint({
            x: arr[0] || 0,
            y: arr[1] || 0,
            z: arr[2] || 0,
            phi: arr[3] || 1
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEDINA FIELD
// ═══════════════════════════════════════════════════════════════════════════════

class MedinaField {
    constructor(config = {}) {
        this.resolution = config.resolution || 32;
        this.dimensions = config.dimensions || 3;
        this.phiLevels = config.phiLevels || 7;
        
        // Field data
        this.field = this._initializeField();
        this.sources = [];
        this.sinks = [];
        
        // Dynamics
        this.time = 0;
        this.frequency = config.frequency || PHI;
        this.damping = config.damping || 0.01;
        
        // φ-accumulation
        this.phiAccumulated = 0;
    }
    
    /**
     * Initialize field
     */
    _initializeField() {
        const field = [];
        const n = this.resolution;
        
        for (let i = 0; i < n; i++) {
            field[i] = [];
            for (let j = 0; j < n; j++) {
                if (this.dimensions >= 3) {
                    field[i][j] = [];
                    for (let k = 0; k < n; k++) {
                        field[i][j][k] = {
                            potential: 0,
                            vector: { x: 0, y: 0, z: 0 },
                            density: 1.0
                        };
                    }
                } else {
                    field[i][j] = {
                        potential: 0,
                        vector: { x: 0, y: 0 },
                        density: 1.0
                    };
                }
            }
        }
        
        return field;
    }
    
    /**
     * Add a source to the field
     */
    addSource(position, strength) {
        this.sources.push({
            position: position instanceof FieldPoint ? position : new FieldPoint(position),
            strength,
            createdAt: this.time
        });
        this._updateField();
    }
    
    /**
     * Add a sink to the field
     */
    addSink(position, strength) {
        this.sinks.push({
            position: position instanceof FieldPoint ? position : new FieldPoint(position),
            strength,
            createdAt: this.time
        });
        this._updateField();
    }
    
    /**
     * Update field based on sources and sinks
     */
    _updateField() {
        const n = this.resolution;
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (this.dimensions >= 3) {
                    for (let k = 0; k < n; k++) {
                        const point = new FieldPoint({
                            x: i / n,
                            y: j / n,
                            z: k / n
                        });
                        this.field[i][j][k] = this._calculateFieldAt(point);
                    }
                } else {
                    const point = new FieldPoint({ x: i / n, y: j / n });
                    this.field[i][j] = this._calculateFieldAt(point);
                }
            }
        }
    }
    
    /**
     * Calculate field value at a point
     */
    _calculateFieldAt(point) {
        let potential = 0;
        let vector = { x: 0, y: 0, z: 0 };
        
        // Sources contribute positive potential
        for (const source of this.sources) {
            const dist = point.phiDistanceTo(source.position);
            if (dist > 0.001) {
                const contribution = source.strength / (dist * dist);
                potential += contribution;
                
                // Vector points away from source
                const dx = point.x - source.position.x;
                const dy = point.y - source.position.y;
                const dz = point.z - source.position.z;
                const mag = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
                
                vector.x += (dx / mag) * contribution;
                vector.y += (dy / mag) * contribution;
                vector.z += (dz / mag) * contribution;
            }
        }
        
        // Sinks contribute negative potential
        for (const sink of this.sinks) {
            const dist = point.phiDistanceTo(sink.position);
            if (dist > 0.001) {
                const contribution = sink.strength / (dist * dist);
                potential -= contribution;
                
                // Vector points toward sink
                const dx = sink.position.x - point.x;
                const dy = sink.position.y - point.y;
                const dz = sink.position.z - point.z;
                const mag = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
                
                vector.x += (dx / mag) * contribution;
                vector.y += (dy / mag) * contribution;
                vector.z += (dz / mag) * contribution;
            }
        }
        
        return {
            potential,
            vector,
            density: 1 + potential * PHI_INV
        };
    }
    
    /**
     * Sample field at a point
     */
    sample(point) {
        const p = point instanceof FieldPoint ? point : new FieldPoint(point);
        return this._calculateFieldAt(p);
    }
    
    /**
     * Evolve field forward in time
     */
    evolve(dt = 0.01) {
        this.time += dt;
        
        // Wave equation evolution
        const n = this.resolution;
        const c = PHI;  // Wave speed
        
        // Simplified: oscillate sources
        for (const source of this.sources) {
            const age = this.time - source.createdAt;
            source.currentStrength = source.strength * Math.cos(this.frequency * 2 * Math.PI * age);
        }
        
        this._updateField();
        
        // φ-accumulation
        this.phiAccumulated += PHI_INV * dt;
        
        return this;
    }
    
    /**
     * Calculate field coherence
     */
    coherence() {
        let sum = 0;
        let count = 0;
        const n = this.resolution;
        
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (this.dimensions >= 3) {
                    for (let k = 0; k < n; k++) {
                        const cell = this.field[i][j][k];
                        sum += Math.abs(cell.potential);
                        count++;
                    }
                } else {
                    sum += Math.abs(this.field[i][j].potential);
                    count++;
                }
            }
        }
        
        return sum / count;
    }
    
    /**
     * Find φ-resonance points
     */
    findResonancePoints(threshold = 0.5) {
        const points = [];
        const n = this.resolution;
        
        for (let i = 1; i < n - 1; i++) {
            for (let j = 1; j < n - 1; j++) {
                if (this.dimensions >= 3) {
                    for (let k = 1; k < n - 1; k++) {
                        const cell = this.field[i][j][k];
                        if (Math.abs(cell.potential) > threshold) {
                            // Check if local maximum/minimum
                            const neighbors = [
                                this.field[i-1][j][k],
                                this.field[i+1][j][k],
                                this.field[i][j-1][k],
                                this.field[i][j+1][k],
                                this.field[i][j][k-1],
                                this.field[i][j][k+1]
                            ];
                            
                            const isExtremum = neighbors.every(n => 
                                Math.abs(cell.potential) >= Math.abs(n.potential)
                            );
                            
                            if (isExtremum) {
                                points.push({
                                    position: new FieldPoint({ x: i/n, y: j/n, z: k/n }),
                                    potential: cell.potential,
                                    type: cell.potential > 0 ? 'peak' : 'trough'
                                });
                            }
                        }
                    }
                }
            }
        }
        
        return points;
    }
    
    /**
     * Get field gradient at point
     */
    gradient(point) {
        const p = point instanceof FieldPoint ? point : new FieldPoint(point);
        const h = 1 / this.resolution;
        
        const fx1 = this.sample({ x: p.x + h, y: p.y, z: p.z }).potential;
        const fx0 = this.sample({ x: p.x - h, y: p.y, z: p.z }).potential;
        const fy1 = this.sample({ x: p.x, y: p.y + h, z: p.z }).potential;
        const fy0 = this.sample({ x: p.x, y: p.y - h, z: p.z }).potential;
        const fz1 = this.sample({ x: p.x, y: p.y, z: p.z + h }).potential;
        const fz0 = this.sample({ x: p.x, y: p.y, z: p.z - h }).potential;
        
        return {
            x: (fx1 - fx0) / (2 * h),
            y: (fy1 - fy0) / (2 * h),
            z: (fz1 - fz0) / (2 * h)
        };
    }
    
    /**
     * Get field state
     */
    getState() {
        return {
            resolution: this.resolution,
            dimensions: this.dimensions,
            time: this.time,
            sources: this.sources.length,
            sinks: this.sinks.length,
            coherence: this.coherence(),
            phiAccumulated: this.phiAccumulated
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PHI RESONATOR
// ═══════════════════════════════════════════════════════════════════════════════

class PhiResonator {
    constructor(frequencies = PHI_LADDER) {
        this.frequencies = frequencies;
        this.oscillators = frequencies.map((f, i) => ({
            frequency: f,
            phase: 0,
            amplitude: 1 / (i + 1),  // Higher frequencies lower amplitude
            damping: 0.01 * (i + 1)
        }));
        this.time = 0;
    }
    
    /**
     * Get current signal value
     */
    signal(t = this.time) {
        let value = 0;
        
        for (const osc of this.oscillators) {
            value += osc.amplitude * Math.sin(2 * Math.PI * osc.frequency * t + osc.phase);
        }
        
        return value / this.oscillators.length;
    }
    
    /**
     * Advance time
     */
    step(dt = 0.01) {
        this.time += dt;
        
        // Apply damping
        for (const osc of this.oscillators) {
            osc.amplitude *= Math.exp(-osc.damping * dt);
        }
        
        return this.signal();
    }
    
    /**
     * Excite resonator at frequency
     */
    excite(frequency, energy = 1.0) {
        // Find closest oscillator
        let closest = this.oscillators[0];
        let minDiff = Infinity;
        
        for (const osc of this.oscillators) {
            const diff = Math.abs(osc.frequency - frequency);
            if (diff < minDiff) {
                minDiff = diff;
                closest = osc;
            }
        }
        
        // Add energy
        closest.amplitude += energy * PHI_INV;
    }
    
    /**
     * Get spectrum
     */
    spectrum() {
        return this.oscillators.map(osc => ({
            frequency: osc.frequency,
            amplitude: osc.amplitude,
            phase: osc.phase
        }));
    }
    
    /**
     * Calculate coherence (how in-phase oscillators are)
     */
    coherence() {
        let realSum = 0;
        let imagSum = 0;
        
        for (const osc of this.oscillators) {
            realSum += osc.amplitude * Math.cos(osc.phase);
            imagSum += osc.amplitude * Math.sin(osc.phase);
        }
        
        const n = this.oscillators.length;
        return Math.sqrt(realSum*realSum + imagSum*imagSum) / n;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
    // Constants
    PHI,
    PHI_INV,
    PHI_SQ,
    PHI_CUBE,
    SCHUMANN_HZ,
    PHI_LADDER,
    
    // Classes
    FieldPoint,
    MedinaField,
    PhiResonator,
    
    // Factory functions
    createField(config = {}) {
        return new MedinaField(config);
    },
    
    createResonator(frequencies = PHI_LADDER) {
        return new PhiResonator(frequencies);
    },
    
    // Utilities
    phiPower(n) {
        return Math.pow(PHI, n);
    },
    
    fibonacciApprox(n) {
        return Math.round(Math.pow(PHI, n) / Math.sqrt(5));
    },
    
    goldenAngle() {
        return 2 * Math.PI * PHI_INV;  // ~137.5 degrees
    },
    
    // Protocol info
    id: 'RSHIP-2026-MEDINA-FIELD-001',
    name: 'Medina Field SDK',
    version: '1.0.0',
    
    status() {
        return {
            sdk: 'medina-field',
            version: '1.0.0',
            phi: PHI,
            phiLadderLevels: PHI_LADDER.length,
            timestamp: Date.now()
        };
    }
};

// Self-test
if (require.main === module) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('MEDINA-FIELD SDK');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const { createField, createResonator, PHI } = module.exports;
    
    // Test field
    console.log('\n1. Field Test:');
    const field = createField({ resolution: 16 });
    field.addSource({ x: 0.3, y: 0.3, z: 0.3 }, 1.0);
    field.addSink({ x: 0.7, y: 0.7, z: 0.7 }, 0.5);
    console.log('   State:', field.getState());
    
    const sample = field.sample({ x: 0.5, y: 0.5, z: 0.5 });
    console.log('   Sample at center:', sample);
    
    // Test resonator
    console.log('\n2. Resonator Test:');
    const resonator = createResonator();
    resonator.excite(PHI, 1.0);
    console.log('   Initial signal:', resonator.signal().toFixed(4));
    
    for (let i = 0; i < 10; i++) {
        resonator.step(0.1);
    }
    console.log('   After 10 steps:', resonator.signal().toFixed(4));
    console.log('   Coherence:', resonator.coherence().toFixed(4));
    
    console.log('\n✓ MEDINA-FIELD operational');
}
