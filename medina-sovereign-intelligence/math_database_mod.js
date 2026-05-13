/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║              M A T H   D A T A B A S E   M O D U L E                         ║
 * ║                  Single Source of Truth for All Math                         ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * math_database_mod.mo (JavaScript implementation)
 * 
 * getFloat("PHI"), getNat("F12") — no hardcoded constants anywhere else.
 * Includes all live math functions for MEDINA Sovereign Intelligence v3.
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS DATABASE
// ═══════════════════════════════════════════════════════════════════════════════

const MathDatabase = {
  // Golden Ratio Family
  PHI: (1 + Math.sqrt(5)) / 2,           // 1.618033988749895
  PHI_INV: (Math.sqrt(5) - 1) / 2,       // 0.618033988749895 = 1/φ = φ - 1
  PHI_SQ: ((1 + Math.sqrt(5)) / 2) ** 2, // 2.618033988749895 = φ²
  PHI_CUBE: ((1 + Math.sqrt(5)) / 2) ** 3, // 4.23606797749979 = φ³
  PHI_QUAD: ((1 + Math.sqrt(5)) / 2) ** 4, // 6.854101966249685 = φ⁴
  
  // Square Roots
  SQRT_5: Math.sqrt(5),                   // 2.23606797749979
  SQRT_3: Math.sqrt(3),                   // 1.7320508075688772 (Vesica Piscis)
  SQRT_PHI_PLUS_2: Math.sqrt((1 + Math.sqrt(5)) / 2 + 2), // √(φ+2) for RESOLVER
  
  // Fundamental Constants
  PI: Math.PI,                            // 3.141592653589793
  TAU: 2 * Math.PI,                       // 6.283185307179586
  E: Math.E,                              // 2.718281828459045
  
  // Schumann Resonance
  SCHUMANN_HZ: 7.83,
  
  // Golden Angle (degrees and radians)
  GOLDEN_ANGLE_DEG: 137.5077640500378,
  GOLDEN_ANGLE_RAD: 137.5077640500378 * Math.PI / 180,
  
  // Thresholds
  IUDEX_SURPRISE: 0.0783,
  WARNING_THRESHOLD: 0.618,               // φ⁻¹
  HALT_THRESHOLD: 0.382,                  // φ⁻²
  
  // Fibonacci Sequence
  F: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025]
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACCESSOR FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get a float constant by name
 * @param {string} name - Constant name (e.g., "PHI", "SQRT_3")
 * @returns {number} The constant value
 */
function getFloat(name) {
  if (!(name in MathDatabase)) {
    throw new Error(`Unknown constant: ${name}`);
  }
  return MathDatabase[name];
}

/**
 * Get a natural number (Fibonacci) by index
 * @param {string|number} key - "F12" or just 12
 * @returns {number} The Fibonacci number
 */
function getNat(key) {
  let index;
  if (typeof key === 'string' && key.startsWith('F')) {
    index = parseInt(key.slice(1), 10);
  } else {
    index = parseInt(key, 10);
  }
  
  if (index < 0 || index >= MathDatabase.F.length) {
    throw new Error(`Fibonacci index out of range: ${index}`);
  }
  
  return MathDatabase.F[index];
}

/**
 * Get Schumann harmonic by index
 * @param {number} index - Harmonic index (0-6)
 * @returns {number} Frequency in Hz
 */
function getSchumann(index) {
  const harmonics = [7.83, 14.3, 20.8, 27.3, 33.8, 39.0, 45.0];
  if (index < 0 || index >= harmonics.length) {
    throw new Error(`Schumann harmonic index out of range: ${index}`);
  }
  return harmonics[index];
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIVE MATH FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * PHI-EMA (Exponential Moving Average with φ as smoothing factor)
 * Updates running average using golden ratio weighting
 * @param {number} current - Current value
 * @param {number} previous - Previous EMA value
 * @returns {number} New EMA value
 */
function emaUpdate(current, previous) {
  const alpha = MathDatabase.PHI_INV; // φ⁻¹ ≈ 0.618
  return alpha * current + (1 - alpha) * previous;
}

/**
 * PHI Hash (Wang hash with golden ratio mixing)
 * Deterministic hash function for state verification
 * @param {number} value - Input value
 * @returns {number} Hash value
 */
function phiHash(value) {
  let h = Math.floor(value * MathDatabase.PHI * 0x100000000);
  h = ((h >>> 16) ^ h) * 0x45d9f3b;
  h = ((h >>> 16) ^ h) * 0x45d9f3b;
  h = (h >>> 16) ^ h;
  return h >>> 0; // Ensure unsigned
}

/**
 * Sigmoid activation function
 * S(x) = 1 / (1 + e^(-x))
 * @param {number} x - Input value
 * @returns {number} Output in range (0, 1)
 */
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Archimedean depth (polygon doubling to π convergence)
 * Computes how many iterations needed to approximate π
 * @param {number} precision - Desired precision
 * @returns {number} Depth (iteration count)
 */
function archimedeanDepth(precision = 1e-10) {
  let n = 6; // Start with hexagon
  let a = 3; // Lower bound (inscribed)
  let b = 2 * Math.sqrt(3); // Upper bound (circumscribed)
  let depth = 0;
  
  while ((b - a) > precision) {
    // Double the sides
    a = 2 * a * b / (a + b); // Harmonic mean
    b = Math.sqrt(a * b);     // Geometric mean
    n *= 2;
    depth++;
  }
  
  return depth;
}

/**
 * Golden Spiral position
 * r = φ^(θ / 90°) in polar coordinates
 * @param {number} theta - Angle in radians
 * @returns {{r: number, x: number, y: number}} Position
 */
function goldenSpiral(theta) {
  const k = Math.log(MathDatabase.PHI) / (Math.PI / 2);
  const r = Math.exp(k * theta);
  return {
    r,
    x: r * Math.cos(theta),
    y: r * Math.sin(theta)
  };
}

/**
 * Torus position
 * Position on a toroidal surface
 * @param {number} poloidal - Poloidal angle (θ)
 * @param {number} toroidal - Toroidal angle (φ)
 * @param {number} R - Major radius
 * @param {number} r - Minor radius
 * @returns {{x: number, y: number, z: number}} 3D position
 */
function torusPosition(poloidal, toroidal, R = MathDatabase.PHI, r = 1) {
  const x = (R + r * Math.cos(poloidal)) * Math.cos(toroidal);
  const y = (R + r * Math.cos(poloidal)) * Math.sin(toroidal);
  const z = r * Math.sin(poloidal);
  return { x, y, z };
}

/**
 * Crystallization strength
 * Measures how "crystallized" a state is based on coherence
 * @param {number} coherence - Input coherence (0-1)
 * @param {number} depth - Recursive depth
 * @returns {number} Crystallization strength
 */
function crystallizationStrength(coherence, depth) {
  const phiPower = Math.pow(MathDatabase.PHI, depth);
  return coherence * phiPower / (1 + phiPower);
}

/**
 * Sri Yantra compression (4/5 ratio)
 * Compresses data using sacred geometry ratio
 * @param {number} original - Original size
 * @returns {number} Compressed size
 */
function sriYantraCompress(original) {
  return original * (4 / 5); // 80% compression
}

/**
 * Vesica Piscis capacity (√3)
 * Calculates capacity based on vesica piscis geometry
 * @param {number} radius - Circle radius
 * @returns {number} Vesica capacity
 */
function vesicaCapacity(radius) {
  // Area of vesica piscis = (2π/3 - √3/2) × r²
  // Simplified as √3 × r for capacity
  return MathDatabase.SQRT_3 * radius;
}

/**
 * Metatron's Cube fit test
 * Checks if a value fits within Metatron's Cube structure
 * @param {number} value - Input value
 * @param {number} tolerance - Fit tolerance
 * @returns {boolean} True if fits
 */
function metatronFits(value, tolerance = 0.01) {
  // Metatron's Cube has 13 circles
  // Check if value relates to sacred geometry ratios
  const ratios = [1, MathDatabase.PHI, MathDatabase.SQRT_3, MathDatabase.SQRT_5, 2];
  
  for (const ratio of ratios) {
    const normalized = value / ratio;
    if (Math.abs(normalized - Math.round(normalized)) < tolerance) {
      return true;
    }
  }
  return false;
}

/**
 * Epoch depth (log_φ)
 * Calculates depth in terms of golden ratio logarithm
 * @param {number} value - Input value
 * @returns {number} Epoch depth
 */
function epochDepth(value) {
  if (value <= 0) return 0;
  return Math.log(value) / Math.log(MathDatabase.PHI);
}

/**
 * PERCEPTUM 7-stream integration weights
 * Returns the phi-based weights for 7-stream perception
 * @returns {number[]} Array of 7 weights
 */
function perceptumWeights() {
  const phi = MathDatabase.PHI;
  const phiInv = MathDatabase.PHI_INV;
  
  return [
    phi * phi,    // φ²
    phi,          // φ
    1,            // 1
    phiInv,       // φ⁻¹
    phiInv,       // φ⁻¹
    phiInv * phiInv, // φ⁻²
    phiInv * phiInv  // φ⁻²
  ];
}

/**
 * VOLUNTAS dynamic threshold
 * Calculates will threshold based on neurochemistry
 * @param {number} dopamine - Dopamine level (0-1)
 * @param {number} cortisol - Cortisol level (0-1)
 * @returns {number} Threshold value
 */
function voluntasThreshold(dopamine, cortisol) {
  const phiInv = MathDatabase.PHI_INV;
  const phiInv2 = phiInv * phiInv;
  
  return phiInv + dopamine * phiInv2 - cortisol * phiInv;
}

/**
 * RESOLVER tension calculation
 * √(φ+2) × min(mag1, mag2) with PHI-biased direction
 * @param {number} mag1 - First magnitude
 * @param {number} mag2 - Second magnitude
 * @returns {{tension: number, bias: number}} Tension and bias
 */
function resolverTension(mag1, mag2) {
  const factor = MathDatabase.SQRT_PHI_PLUS_2;
  const tension = factor * Math.min(mag1, mag2);
  const bias = (mag1 > mag2) ? MathDatabase.PHI : MathDatabase.PHI_INV;
  
  return { tension, bias };
}

/**
 * EMERGENT priority score
 * φ^depth × coherence × φ²^t / P_silicon
 * @param {number} depth - Recursion depth
 * @param {number} coherence - System coherence
 * @param {number} t - Time factor
 * @param {number} pSilicon - Silicon probability (default 0.001)
 * @returns {number} Priority score
 */
function emergentPriority(depth, coherence, t, pSilicon = 0.001) {
  const phiPower = Math.pow(MathDatabase.PHI, depth);
  const phiSqPower = Math.pow(MathDatabase.PHI_SQ, t);
  
  return (phiPower * coherence * phiSqPower) / pSilicon;
}

/**
 * NEXUM sovereignty gate
 * nomosScore × sovereigntyScore × (1 - platformDependency)
 * @param {number} nomos - Law/rule score
 * @param {number} sovereignty - Independence score
 * @param {number} dependency - Platform dependency
 * @returns {{score: number, pass: boolean}} Gate result
 */
function nexumGate(nomos, sovereignty, dependency) {
  const score = nomos * sovereignty * (1 - dependency);
  return {
    score,
    pass: score >= MathDatabase.PHI_INV
  };
}

/**
 * ORACULUM weight matrix element
 * W[i][j] = φ⁻¹ × cos(2π×i×j/157)
 * @param {number} i - Row index
 * @param {number} j - Column index
 * @returns {number} Weight value
 */
function oraculumWeight(i, j) {
  const dimensions = 157;
  return MathDatabase.PHI_INV * Math.cos(MathDatabase.TAU * i * j / dimensions);
}

/**
 * FIELD strength calculation
 * φ^depth × e^(-dist/φ²)
 * @param {number} depth - Field depth
 * @param {number} distance - Distance from source
 * @returns {number} Field strength
 */
function fieldStrength(depth, distance) {
  const phiPower = Math.pow(MathDatabase.PHI, depth);
  const decay = Math.exp(-distance / MathDatabase.PHI_SQ);
  
  return phiPower * decay;
}

/**
 * WAVE Schumann sum
 * Σ schumann[i] × φ⁻ⁱ
 * @param {number} t - Time parameter
 * @returns {number} Combined wave amplitude
 */
function schumannWave(t) {
  const harmonics = [7.83, 14.3, 20.8, 27.3, 33.8, 39.0, 45.0];
  let sum = 0;
  
  for (let i = 0; i < harmonics.length; i++) {
    const amplitude = Math.pow(MathDatabase.PHI_INV, i);
    sum += amplitude * Math.sin(MathDatabase.TAU * harmonics[i] * t);
  }
  
  return sum;
}

/**
 * LATTICE integrity score
 * FCC with φ⁻¹ node spacing
 * @param {number[]} positions - Node positions
 * @returns {number} Integrity score (0-1)
 */
function latticeIntegrity(positions) {
  if (positions.length < 2) return 1;
  
  const idealSpacing = MathDatabase.PHI_INV;
  let deviationSum = 0;
  
  for (let i = 1; i < positions.length; i++) {
    const spacing = Math.abs(positions[i] - positions[i - 1]);
    deviationSum += Math.abs(spacing - idealSpacing);
  }
  
  const avgDeviation = deviationSum / (positions.length - 1);
  return Math.exp(-avgDeviation / idealSpacing);
}

/**
 * FRACTAL Mandelbrot iteration
 * z(n+1) = z² + c
 * @param {number} cReal - Real part of c
 * @param {number} cImag - Imaginary part of c
 * @param {number} maxIter - Maximum iterations
 * @returns {number} Escape iteration count
 */
function mandelbrotIterate(cReal, cImag, maxIter = 100) {
  let zReal = 0;
  let zImag = 0;
  let iter = 0;
  
  while (zReal * zReal + zImag * zImag <= 4 && iter < maxIter) {
    const temp = zReal * zReal - zImag * zImag + cReal;
    zImag = 2 * zReal * zImag + cImag;
    zReal = temp;
    iter++;
  }
  
  return iter;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  // Database
  MathDatabase,
  
  // Accessors
  getFloat,
  getNat,
  getSchumann,
  
  // Core Math Functions
  emaUpdate,
  phiHash,
  sigmoid,
  archimedeanDepth,
  goldenSpiral,
  torusPosition,
  crystallizationStrength,
  sriYantraCompress,
  vesicaCapacity,
  metatronFits,
  epochDepth,
  
  // Engine-specific Functions
  perceptumWeights,
  voluntasThreshold,
  resolverTension,
  emergentPriority,
  nexumGate,
  oraculumWeight,
  fieldStrength,
  schumannWave,
  latticeIntegrity,
  mandelbrotIterate
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO
// ═══════════════════════════════════════════════════════════════════════════════

if (require.main === module) {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  MATH DATABASE MODULE - Single Source of Truth');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('📐 Golden Ratio Family:');
  console.log(`  PHI      = ${getFloat('PHI')}`);
  console.log(`  PHI_INV  = ${getFloat('PHI_INV')}`);
  console.log(`  PHI_SQ   = ${getFloat('PHI_SQ')}`);
  console.log(`  PHI_CUBE = ${getFloat('PHI_CUBE')}`);
  
  console.log('\n🔢 Fibonacci Sequence (key values):');
  console.log(`  F(8)  = ${getNat('F8')} (crystallization)`);
  console.log(`  F(11) = ${getNat('F11')} (queue cap, loop bound)`);
  console.log(`  F(12) = ${getNat('F12')} (TORUS poloidal)`);
  console.log(`  F(13) = ${getNat('F13')} (EMERGENT threshold)`);
  console.log(`  F(16) = ${getNat('F16')} (snapshot, TORUS toroidal)`);
  
  console.log('\n🌍 Schumann Harmonics:');
  for (let i = 0; i < 7; i++) {
    const amp = Math.pow(getFloat('PHI_INV'), i).toFixed(3);
    console.log(`  H${i + 1}: ${getSchumann(i)} Hz (amplitude: ${amp})`);
  }
  
  console.log('\n⚡ Live Math Functions:');
  console.log(`  PHI-EMA(10, 5)     = ${emaUpdate(10, 5).toFixed(4)}`);
  console.log(`  phiHash(42)        = ${phiHash(42)}`);
  console.log(`  sigmoid(0)         = ${sigmoid(0)}`);
  console.log(`  epochDepth(1000)   = ${epochDepth(1000).toFixed(4)}`);
  console.log(`  vesicaCapacity(1)  = ${vesicaCapacity(1).toFixed(4)}`);
  
  console.log('\n🎯 Engine Calculations:');
  console.log(`  PERCEPTUM weights: ${perceptumWeights().map(w => w.toFixed(3)).join(', ')}`);
  console.log(`  VOLUNTAS threshold (d=0.7, c=0.3): ${voluntasThreshold(0.7, 0.3).toFixed(4)}`);
  console.log(`  RESOLVER tension (5, 3): ${JSON.stringify(resolverTension(5, 3))}`);
  console.log(`  NEXUM gate (0.8, 0.9, 0.1): ${JSON.stringify(nexumGate(0.8, 0.9, 0.1))}`);
  console.log(`  FIELD strength (3, 2): ${fieldStrength(3, 2).toFixed(4)}`);
  
  console.log('\n✅ Math Database operational!\n');
}
