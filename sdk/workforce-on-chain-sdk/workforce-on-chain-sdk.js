/**
 * WORKFORCE ON-CHAIN SDK
 * RSHIP-2026-WORKFORCE-ONCHAIN-001
 *
 * Workforce On-Chain SDK provides blockchain-based workforce management
 * and credential verification. Implements on-chain identity, skill
 * attestations, and φ-weighted reputation scoring.
 *
 * @module workforce-on-chain-sdk
 * @version 1.0.0
 */

'use strict';

const { EventEmitter } = require('events');
const crypto = require('crypto');

const PHI = (1 + Math.sqrt(5)) / 2;

// ═══════════════════════════════════════════════════════════════════════════
// CREDENTIAL TYPES
// ═══════════════════════════════════════════════════════════════════════════

const CredentialType = {
  SKILL: 'skill',
  CERTIFICATION: 'certification',
  EDUCATION: 'education',
  EXPERIENCE: 'experience',
  ENDORSEMENT: 'endorsement'
};

const CredentialState = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REVOKED: 'revoked',
  EXPIRED: 'expired'
};

// ═══════════════════════════════════════════════════════════════════════════
// WORKER IDENTITY
// ═══════════════════════════════════════════════════════════════════════════

class WorkerIdentity {
  constructor(id, options = {}) {
    this.id = id;
    this.publicKey = options.publicKey || this._generatePublicKey();
    this.credentials = new Map();
    this.reputation = 0.5;
    this.verified = false;
    this.created = Date.now();
    this.lastActive = Date.now();
    this.metadata = options.metadata || {};
  }

  _generatePublicKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  addCredential(credential) {
    this.credentials.set(credential.id, credential);
    this._updateReputation();
    return this;
  }

  removeCredential(credentialId) {
    this.credentials.delete(credentialId);
    this._updateReputation();
    return this;
  }

  getCredentials(type = null) {
    const creds = Array.from(this.credentials.values());
    if (type === null) return creds;
    return creds.filter(c => c.type === type);
  }

  hasSkill(skillName, minLevel = 1) {
    return Array.from(this.credentials.values()).some(c =>
      c.type === CredentialType.SKILL &&
      c.name === skillName &&
      c.level >= minLevel &&
      c.state === CredentialState.VERIFIED
    );
  }

  _updateReputation() {
    const verifiedCount = Array.from(this.credentials.values())
      .filter(c => c.state === CredentialState.VERIFIED).length;

    const endorsementScore = Array.from(this.credentials.values())
      .filter(c => c.type === CredentialType.ENDORSEMENT)
      .reduce((sum, c) => sum + c.weight, 0);

    // φ-weighted reputation
    this.reputation = Math.min(1, (
      Math.log(1 + verifiedCount) / Math.log(PHI + 1) +
      endorsementScore * 0.1
    ) / 2);
  }

  sign(data) {
    return crypto.createHmac('sha256', this.publicKey)
      .update(JSON.stringify(data))
      .digest('hex');
  }

  toJSON() {
    return {
      id: this.id,
      publicKey: this.publicKey,
      credentialCount: this.credentials.size,
      reputation: this.reputation,
      verified: this.verified,
      created: this.created,
      lastActive: this.lastActive,
      metadata: this.metadata
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CREDENTIAL
// ═══════════════════════════════════════════════════════════════════════════

class Credential {
  constructor(type, name, options = {}) {
    this.id = crypto.randomUUID();
    this.type = type;
    this.name = name;
    this.issuer = options.issuer;
    this.holder = options.holder;
    this.level = options.level || 1;
    this.weight = options.weight || 1;
    this.state = CredentialState.PENDING;
    this.issuedAt = null;
    this.expiresAt = options.expiresAt;
    this.evidence = options.evidence || [];
    this.signature = null;
    this.hash = null;
  }

  issue(issuerKey) {
    this.issuedAt = Date.now();
    this.state = CredentialState.VERIFIED;
    this.hash = this._computeHash();
    this.signature = crypto.createHmac('sha256', issuerKey)
      .update(this.hash)
      .digest('hex');
    return this;
  }

  verify(issuerKey) {
    if (this.state !== CredentialState.VERIFIED) return false;
    if (this.expiresAt && Date.now() > this.expiresAt) {
      this.state = CredentialState.EXPIRED;
      return false;
    }

    const expectedSig = crypto.createHmac('sha256', issuerKey)
      .update(this.hash)
      .digest('hex');

    return this.signature === expectedSig;
  }

  revoke() {
    this.state = CredentialState.REVOKED;
    return this;
  }

  _computeHash() {
    const data = JSON.stringify({
      id: this.id,
      type: this.type,
      name: this.name,
      issuer: this.issuer,
      holder: this.holder,
      level: this.level,
      issuedAt: this.issuedAt
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      issuer: this.issuer,
      holder: this.holder,
      level: this.level,
      state: this.state,
      issuedAt: this.issuedAt,
      expiresAt: this.expiresAt,
      hash: this.hash
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CREDENTIAL ISSUER
// ═══════════════════════════════════════════════════════════════════════════

class CredentialIssuer extends EventEmitter {
  constructor(id, options = {}) {
    super();
    this.id = id;
    this.name = options.name || id;
    this.privateKey = options.privateKey || crypto.randomBytes(32).toString('hex');
    this.publicKey = crypto.createHmac('sha256', this.privateKey)
      .update(this.id)
      .digest('hex');
    this.issuedCredentials = new Map();
    this.trusted = options.trusted || false;
  }

  issue(type, name, holderId, options = {}) {
    const credential = new Credential(type, name, {
      ...options,
      issuer: this.id,
      holder: holderId
    });

    credential.issue(this.privateKey);
    this.issuedCredentials.set(credential.id, credential);
    this.emit('credential-issued', { credential, holder: holderId });

    return credential;
  }

  verify(credential) {
    return credential.verify(this.privateKey);
  }

  revoke(credentialId) {
    const credential = this.issuedCredentials.get(credentialId);
    if (!credential) return false;

    credential.revoke();
    this.emit('credential-revoked', { credentialId });
    return true;
  }

  getIssued() {
    return Array.from(this.issuedCredentials.values());
  }

  status() {
    return {
      id: this.id,
      name: this.name,
      publicKey: this.publicKey,
      issuedCount: this.issuedCredentials.size,
      trusted: this.trusted
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// WORKFORCE REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

class WorkforceRegistry extends EventEmitter {
  constructor() {
    super();
    this.workers = new Map();
    this.issuers = new Map();
    this.credentialIndex = new Map();
  }

  registerWorker(id, options = {}) {
    if (this.workers.has(id)) {
      throw new Error(`Worker ${id} already registered`);
    }

    const worker = new WorkerIdentity(id, options);
    this.workers.set(id, worker);
    this.emit('worker-registered', { id });
    return worker;
  }

  getWorker(id) {
    return this.workers.get(id) || null;
  }

  registerIssuer(id, options = {}) {
    if (this.issuers.has(id)) {
      throw new Error(`Issuer ${id} already registered`);
    }

    const issuer = new CredentialIssuer(id, options);
    this.issuers.set(id, issuer);
    this.emit('issuer-registered', { id });
    return issuer;
  }

  getIssuer(id) {
    return this.issuers.get(id) || null;
  }

  issueCredential(issuerId, workerId, type, name, options = {}) {
    const issuer = this.issuers.get(issuerId);
    const worker = this.workers.get(workerId);

    if (!issuer) throw new Error(`Issuer ${issuerId} not found`);
    if (!worker) throw new Error(`Worker ${workerId} not found`);

    const credential = issuer.issue(type, name, workerId, options);
    worker.addCredential(credential);

    // Index credential
    const key = `${type}:${name}`;
    if (!this.credentialIndex.has(key)) {
      this.credentialIndex.set(key, new Set());
    }
    this.credentialIndex.get(key).add(workerId);

    this.emit('credential-issued', { issuerId, workerId, credential });
    return credential;
  }

  findWorkersWithSkill(skillName, minLevel = 1) {
    const key = `${CredentialType.SKILL}:${skillName}`;
    const workerIds = this.credentialIndex.get(key) || new Set();

    return Array.from(workerIds)
      .map(id => this.workers.get(id))
      .filter(w => w && w.hasSkill(skillName, minLevel))
      .sort((a, b) => b.reputation - a.reputation);
  }

  findWorkersByReputation(minReputation = 0.5) {
    return Array.from(this.workers.values())
      .filter(w => w.reputation >= minReputation)
      .sort((a, b) => b.reputation - a.reputation);
  }

  verifyCredential(credentialId, issuerId) {
    const issuer = this.issuers.get(issuerId);
    if (!issuer) return { valid: false, reason: 'Issuer not found' };

    const credential = issuer.issuedCredentials.get(credentialId);
    if (!credential) return { valid: false, reason: 'Credential not found' };

    const valid = issuer.verify(credential);
    return { valid, state: credential.state };
  }

  status() {
    return {
      workerCount: this.workers.size,
      issuerCount: this.issuers.size,
      credentialTypes: this.credentialIndex.size,
      trustedIssuers: Array.from(this.issuers.values())
        .filter(i => i.trusted).length
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  PHI,
  CredentialType,
  CredentialState,
  WorkerIdentity,
  Credential,
  CredentialIssuer,
  WorkforceRegistry
};
