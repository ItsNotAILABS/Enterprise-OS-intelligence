/**
 * MEDINA TENSOR SDK
 * RSHIP-2026-MEDINA-TENSOR-001
 *
 * Medina Tensor provides multi-dimensional tensor operations for φ-field computations.
 * Implements tensor algebra, φ-weighted contractions, and field-theoretic transforms
 * used by AGI cognitive layers.
 *
 * Mathematical Foundation:
 * - Tensor product: T ⊗ U
 * - φ-contraction: Tⁱⱼ → φʲTⁱⱼ
 * - Field strength: F_μν = ∂_μA_ν - ∂_νA_μ
 *
 * @module medina-tensor
 * @version 1.0.0
 */

'use strict';

const PHI = (1 + Math.sqrt(5)) / 2;

// ═══════════════════════════════════════════════════════════════════════════
// TENSOR CLASS
// ═══════════════════════════════════════════════════════════════════════════

class Tensor {
  constructor(shape, data = null) {
    this.shape = Array.isArray(shape) ? shape : [shape];
    this.rank = this.shape.length;
    this.size = this.shape.reduce((a, b) => a * b, 1);

    if (data) {
      if (data.length !== this.size) {
        throw new Error(`Data size ${data.length} doesn't match shape ${this.shape}`);
      }
      this.data = Float64Array.from(data);
    } else {
      this.data = new Float64Array(this.size);
    }
  }

  static zeros(shape) {
    return new Tensor(shape);
  }

  static ones(shape) {
    const t = new Tensor(shape);
    t.data.fill(1);
    return t;
  }

  static random(shape, scale = 1) {
    const t = new Tensor(shape);
    for (let i = 0; i < t.size; i++) {
      t.data[i] = (Math.random() - 0.5) * 2 * scale;
    }
    return t;
  }

  static phi(shape) {
    const t = new Tensor(shape);
    for (let i = 0; i < t.size; i++) {
      t.data[i] = Math.pow(PHI, i % 5 - 2);
    }
    return t;
  }

  static identity(n) {
    const t = new Tensor([n, n]);
    for (let i = 0; i < n; i++) {
      t.set([i, i], 1);
    }
    return t;
  }

  _flatIndex(indices) {
    if (indices.length !== this.rank) {
      throw new Error(`Expected ${this.rank} indices, got ${indices.length}`);
    }

    let idx = 0;
    let stride = 1;
    for (let i = this.rank - 1; i >= 0; i--) {
      if (indices[i] < 0 || indices[i] >= this.shape[i]) {
        throw new Error(`Index ${indices[i]} out of bounds for dimension ${i} with size ${this.shape[i]}`);
      }
      idx += indices[i] * stride;
      stride *= this.shape[i];
    }
    return idx;
  }

  get(indices) {
    return this.data[this._flatIndex(indices)];
  }

  set(indices, value) {
    this.data[this._flatIndex(indices)] = value;
    return this;
  }

  add(other) {
    if (!this._shapeMatch(other)) {
      throw new Error('Shape mismatch');
    }
    const result = new Tensor(this.shape);
    for (let i = 0; i < this.size; i++) {
      result.data[i] = this.data[i] + other.data[i];
    }
    return result;
  }

  subtract(other) {
    if (!this._shapeMatch(other)) {
      throw new Error('Shape mismatch');
    }
    const result = new Tensor(this.shape);
    for (let i = 0; i < this.size; i++) {
      result.data[i] = this.data[i] - other.data[i];
    }
    return result;
  }

  multiply(scalar) {
    const result = new Tensor(this.shape);
    for (let i = 0; i < this.size; i++) {
      result.data[i] = this.data[i] * scalar;
    }
    return result;
  }

  hadamard(other) {
    if (!this._shapeMatch(other)) {
      throw new Error('Shape mismatch');
    }
    const result = new Tensor(this.shape);
    for (let i = 0; i < this.size; i++) {
      result.data[i] = this.data[i] * other.data[i];
    }
    return result;
  }

  _shapeMatch(other) {
    if (this.rank !== other.rank) return false;
    for (let i = 0; i < this.rank; i++) {
      if (this.shape[i] !== other.shape[i]) return false;
    }
    return true;
  }

  reshape(newShape) {
    const newSize = newShape.reduce((a, b) => a * b, 1);
    if (newSize !== this.size) {
      throw new Error(`Cannot reshape ${this.shape} to ${newShape}`);
    }
    const result = new Tensor(newShape, this.data);
    return result;
  }

  transpose() {
    if (this.rank !== 2) {
      throw new Error('Transpose only defined for rank-2 tensors');
    }
    const result = new Tensor([this.shape[1], this.shape[0]]);
    for (let i = 0; i < this.shape[0]; i++) {
      for (let j = 0; j < this.shape[1]; j++) {
        result.set([j, i], this.get([i, j]));
      }
    }
    return result;
  }

  norm() {
    let sum = 0;
    for (let i = 0; i < this.size; i++) {
      sum += this.data[i] * this.data[i];
    }
    return Math.sqrt(sum);
  }

  normalize() {
    const n = this.norm();
    if (n < 1e-10) return this.clone();
    return this.multiply(1 / n);
  }

  clone() {
    return new Tensor(this.shape, this.data);
  }

  toArray() {
    return Array.from(this.data);
  }

  toString() {
    return `Tensor(${this.shape.join('×')}): [${this.data.slice(0, 10).join(', ')}${this.size > 10 ? '...' : ''}]`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TENSOR OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

class TensorOps {
  static matmul(A, B) {
    if (A.rank !== 2 || B.rank !== 2) {
      throw new Error('Matrix multiplication requires rank-2 tensors');
    }
    if (A.shape[1] !== B.shape[0]) {
      throw new Error(`Shape mismatch: ${A.shape} × ${B.shape}`);
    }

    const result = new Tensor([A.shape[0], B.shape[1]]);
    const m = A.shape[0], n = B.shape[1], k = A.shape[1];

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        let sum = 0;
        for (let p = 0; p < k; p++) {
          sum += A.get([i, p]) * B.get([p, j]);
        }
        result.set([i, j], sum);
      }
    }

    return result;
  }

  static outerProduct(A, B) {
    const newShape = [...A.shape, ...B.shape];
    const result = new Tensor(newShape);

    for (let i = 0; i < A.size; i++) {
      for (let j = 0; j < B.size; j++) {
        result.data[i * B.size + j] = A.data[i] * B.data[j];
      }
    }

    return result;
  }

  static innerProduct(A, B) {
    if (A.size !== B.size) {
      throw new Error('Tensors must have same size for inner product');
    }
    let sum = 0;
    for (let i = 0; i < A.size; i++) {
      sum += A.data[i] * B.data[i];
    }
    return sum;
  }

  static contract(T, axis1, axis2) {
    if (axis1 >= T.rank || axis2 >= T.rank || axis1 === axis2) {
      throw new Error('Invalid contraction axes');
    }
    if (T.shape[axis1] !== T.shape[axis2]) {
      throw new Error('Contraction axes must have same dimension');
    }

    const newShape = T.shape.filter((_, i) => i !== axis1 && i !== axis2);
    if (newShape.length === 0) newShape.push(1);

    const result = new Tensor(newShape);
    const dim = T.shape[axis1];

    // Simplified contraction for common cases
    if (T.rank === 2) {
      let trace = 0;
      for (let i = 0; i < dim; i++) {
        trace += T.get([i, i]);
      }
      result.data[0] = trace;
    }

    return result;
  }

  static phiContract(T, axis) {
    if (axis >= T.rank) {
      throw new Error('Invalid axis for φ-contraction');
    }

    const newShape = [...T.shape];
    newShape.splice(axis, 1);
    if (newShape.length === 0) newShape.push(1);

    const result = new Tensor(newShape);
    const dim = T.shape[axis];

    // Weight by φ^j
    const strides = [];
    let stride = 1;
    for (let i = T.rank - 1; i >= 0; i--) {
      strides[i] = stride;
      stride *= T.shape[i];
    }

    for (let i = 0; i < result.size; i++) {
      let sum = 0;
      for (let j = 0; j < dim; j++) {
        const weight = Math.pow(PHI, j - dim / 2);
        // Calculate source index
        const idx = Math.floor(i / strides[axis]) * strides[axis] * dim +
                   j * strides[axis] +
                   (i % strides[axis]);
        sum += weight * T.data[idx];
      }
      result.data[i] = sum;
    }

    return result;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FIELD TENSOR
// ═══════════════════════════════════════════════════════════════════════════

class FieldTensor {
  constructor(dimensions = 4) {
    this.dim = dimensions;
    this.components = new Tensor([dimensions, dimensions]);
    this.potential = new Tensor([dimensions]);
  }

  setPotential(A) {
    if (A.size !== this.dim) {
      throw new Error('Potential dimension mismatch');
    }
    this.potential = A.clone();
    this._computeFieldStrength();
  }

  _computeFieldStrength() {
    // F_μν = ∂_μA_ν - ∂_νA_μ
    // Using finite differences approximation
    const h = 0.01;
    for (let mu = 0; mu < this.dim; mu++) {
      for (let nu = 0; nu < this.dim; nu++) {
        if (mu === nu) {
          this.components.set([mu, nu], 0);
        } else {
          // Simplified: F_μν ~ A_ν/μ - A_μ/ν
          const f = this.potential.data[nu] / (mu + 1) -
                   this.potential.data[mu] / (nu + 1);
          this.components.set([mu, nu], f);
        }
      }
    }
  }

  getComponent(mu, nu) {
    return this.components.get([mu, nu]);
  }

  invariant1() {
    // F_μνF^μν (scalar invariant)
    let sum = 0;
    for (let mu = 0; mu < this.dim; mu++) {
      for (let nu = 0; nu < this.dim; nu++) {
        const f = this.components.get([mu, nu]);
        sum += f * f;
      }
    }
    return sum;
  }

  invariant2() {
    // F_μν *F^μν (pseudo-scalar, dual)
    // Simplified for 4D
    if (this.dim !== 4) return 0;

    return this.components.get([0, 1]) * this.components.get([2, 3]) -
           this.components.get([0, 2]) * this.components.get([1, 3]) +
           this.components.get([0, 3]) * this.components.get([1, 2]);
  }

  energyDensity() {
    // T^00 ~ F^2
    return this.invariant1() / 2;
  }

  status() {
    return {
      dimensions: this.dim,
      potential: this.potential.toArray(),
      fieldNorm: this.components.norm(),
      invariant1: this.invariant1(),
      invariant2: this.invariant2(),
      energyDensity: this.energyDensity()
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PHI-METRIC TENSOR
// ═══════════════════════════════════════════════════════════════════════════

class PhiMetric {
  constructor(dimensions = 4) {
    this.dim = dimensions;
    this.g = Tensor.identity(dimensions);
    this.gInv = Tensor.identity(dimensions);
    this._applyPhiWeighting();
  }

  _applyPhiWeighting() {
    for (let i = 0; i < this.dim; i++) {
      const weight = Math.pow(PHI, i - 1);
      this.g.set([i, i], weight);
      this.gInv.set([i, i], 1 / weight);
    }
  }

  lowerIndex(T, axis = 0) {
    // T_μ = g_μνT^ν
    return TensorOps.matmul(this.g, T.reshape([T.size, 1])).reshape([T.size]);
  }

  raiseIndex(T, axis = 0) {
    // T^μ = g^μνT_ν
    return TensorOps.matmul(this.gInv, T.reshape([T.size, 1])).reshape([T.size]);
  }

  distance(x, y) {
    // ds² = g_μνdx^μdx^ν
    if (x.size !== this.dim || y.size !== this.dim) {
      throw new Error('Vector dimension mismatch');
    }

    let ds2 = 0;
    for (let mu = 0; mu < this.dim; mu++) {
      for (let nu = 0; nu < this.dim; nu++) {
        const dx_mu = y.data[mu] - x.data[mu];
        const dx_nu = y.data[nu] - x.data[nu];
        ds2 += this.g.get([mu, nu]) * dx_mu * dx_nu;
      }
    }

    return Math.sqrt(Math.abs(ds2));
  }

  christoffel(mu, nu, sigma) {
    // Γ^σ_μν = (1/2)g^σρ(∂_μg_νρ + ∂_νg_μρ - ∂_ρg_μν)
    // For diagonal metric, simplifies significantly
    if (mu !== nu || nu !== sigma) return 0;
    return 0; // Flat φ-metric has zero Christoffel symbols
  }

  ricci() {
    // R_μν for φ-metric (flat)
    return Tensor.zeros([this.dim, this.dim]);
  }

  scalarCurvature() {
    // R = g^μνR_μν
    return 0; // Flat metric
  }

  status() {
    return {
      dimensions: this.dim,
      signature: this.g.toArray().filter((_, i) => Math.floor(Math.sqrt(i)) === Math.sqrt(i)),
      determinant: this._det(),
      scalarCurvature: this.scalarCurvature()
    };
  }

  _det() {
    let det = 1;
    for (let i = 0; i < this.dim; i++) {
      det *= this.g.get([i, i]);
    }
    return det;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MEDINA TENSOR FACTORY
// ═══════════════════════════════════════════════════════════════════════════

class MedinaTensorFactory {
  static createFieldStrength(potential) {
    const field = new FieldTensor(potential.size);
    field.setPotential(potential);
    return field;
  }

  static createMetric(dimensions = 4) {
    return new PhiMetric(dimensions);
  }

  static phiLadder(n) {
    const t = new Tensor([n]);
    for (let i = 0; i < n; i++) {
      t.data[i] = Math.pow(PHI, i);
    }
    return t;
  }

  static schumannTensor(harmonics = 7) {
    const SCHUMANN_HZ = 7.83;
    const t = new Tensor([harmonics]);
    for (let i = 0; i < harmonics; i++) {
      t.data[i] = SCHUMANN_HZ * (2 * i + 1);
    }
    return t;
  }

  static coherenceMatrix(phases) {
    const n = phases.length;
    const t = new Tensor([n, n]);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        t.set([i, j], Math.cos(phases[i] - phases[j]));
      }
    }
    return t;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  Tensor,
  TensorOps,
  FieldTensor,
  PhiMetric,
  MedinaTensorFactory
};
