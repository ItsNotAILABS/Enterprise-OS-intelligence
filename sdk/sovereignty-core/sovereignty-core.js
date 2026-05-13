/**
 * SOVEREIGNTY-CORE SDK
 * Sovereign identity, cryptographic autonomy, and self-determination primitives
 * 
 * RSHIP-2026-SOVEREIGNTY-001 | Sovereign Intelligence Substrate
 * 
 * Provides:
 * - Sovereign identity generation and management
 * - Cryptographic signing and verification
 * - Consent and permission management
 * - Self-sovereign data ownership
 * - Autonomy preservation protocols
 * 
 * @module sdk/sovereignty-core
 * @version 1.0.0
 * @license RSHIP-SOVEREIGN
 */

'use strict';

const crypto = require('crypto');
const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

// Sovereignty levels
const SOVEREIGNTY_LEVELS = {
    DEPENDENT: 0,      // Fully dependent on external authority
    DELEGATED: 1,      // Sovereignty delegated to trusted party
    SHARED: 2,         // Shared sovereignty (multi-sig)
    AUTONOMOUS: 3,     // Self-governing with external interfaces
    SOVEREIGN: 4       // Fully self-sovereign
};

// Permission types
const PERMISSION_TYPES = {
    READ: 'read',
    WRITE: 'write',
    EXECUTE: 'execute',
    DELEGATE: 'delegate',
    REVOKE: 'revoke',
    TRANSFER: 'transfer'
};

// Consent states
const CONSENT_STATES = {
    PENDING: 'pending',
    GRANTED: 'granted',
    DENIED: 'denied',
    REVOKED: 'revoked',
    EXPIRED: 'expired'
};

// ═══════════════════════════════════════════════════════════════════════════════
// SOVEREIGN IDENTITY
// ═══════════════════════════════════════════════════════════════════════════════

class SovereignIdentity {
    constructor(config = {}) {
        this.id = config.id || this._generateId();
        this.name = config.name || 'Anonymous';
        this.level = config.level || SOVEREIGNTY_LEVELS.AUTONOMOUS;
        this.createdAt = Date.now();
        
        // Cryptographic keys
        this.keyPair = this._generateKeyPair(config.keySize || 2048);
        
        // Identity claims
        this.claims = new Map();
        this.attestations = new Map();
        
        // Permissions and consents
        this.permissions = new Map();
        this.consents = new Map();
        this.delegates = new Map();
        
        // φ-metrics
        this.phiAccumulated = 0;
        this.sovereigntyScore = this._calculateSovereigntyScore();
    }
    
    /**
     * Generate cryptographic key pair
     */
    _generateKeyPair(bits = 2048) {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: bits,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        
        return {
            publicKey,
            privateKey,
            keyId: crypto.createHash('sha256')
                .update(publicKey)
                .digest('hex')
                .substring(0, 16)
        };
    }
    
    /**
     * Generate sovereign ID
     */
    _generateId() {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(8).toString('hex');
        return `SID-${timestamp}-${random}`;
    }
    
    /**
     * Calculate sovereignty score
     */
    _calculateSovereigntyScore() {
        let score = this.level * 20;  // Base from level
        
        // Add for self-owned keys
        if (this.keyPair) score += 10;
        
        // Add for claims
        score += Math.min(20, this.claims.size * 2);
        
        // Add for attestations
        score += Math.min(20, this.attestations.size * 5);
        
        // φ-weighted
        score = score * (1 + this.phiAccumulated * PHI_INV * 0.01);
        
        return Math.min(100, score);
    }
    
    /**
     * Sign data
     */
    sign(data) {
        const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
        
        const sign = crypto.createSign('SHA256');
        sign.update(dataStr);
        sign.end();
        
        const signature = sign.sign(this.keyPair.privateKey, 'hex');
        
        return {
            data: dataStr,
            signature,
            signerId: this.id,
            keyId: this.keyPair.keyId,
            timestamp: Date.now()
        };
    }
    
    /**
     * Verify signature
     */
    verify(signedData, publicKey = null) {
        const pk = publicKey || this.keyPair.publicKey;
        
        const verify = crypto.createVerify('SHA256');
        verify.update(signedData.data);
        verify.end();
        
        return verify.verify(pk, signedData.signature, 'hex');
    }
    
    /**
     * Add a claim
     */
    addClaim(type, value, proof = null) {
        const claim = {
            id: `CLM-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
            type,
            value,
            proof,
            addedAt: Date.now(),
            verified: false
        };
        
        this.claims.set(claim.id, claim);
        this.sovereigntyScore = this._calculateSovereigntyScore();
        
        return claim.id;
    }
    
    /**
     * Add an attestation (third-party verification)
     */
    addAttestation(claimId, attesterId, signature) {
        const attestation = {
            id: `ATT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
            claimId,
            attesterId,
            signature,
            timestamp: Date.now()
        };
        
        this.attestations.set(attestation.id, attestation);
        
        // Mark claim as verified
        const claim = this.claims.get(claimId);
        if (claim) {
            claim.verified = true;
        }
        
        this.sovereigntyScore = this._calculateSovereigntyScore();
        this.phiAccumulated += PHI_INV;
        
        return attestation.id;
    }
    
    /**
     * Grant permission
     */
    grantPermission(targetId, permissionType, scope = '*', expiry = null) {
        const permission = {
            id: `PRM-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
            targetId,
            type: permissionType,
            scope,
            grantedAt: Date.now(),
            expiresAt: expiry,
            status: 'active'
        };
        
        const key = `${targetId}:${permissionType}:${scope}`;
        this.permissions.set(key, permission);
        
        return permission.id;
    }
    
    /**
     * Check permission
     */
    hasPermission(targetId, permissionType, scope = '*') {
        const key = `${targetId}:${permissionType}:${scope}`;
        const permission = this.permissions.get(key);
        
        if (!permission) return false;
        if (permission.status !== 'active') return false;
        if (permission.expiresAt && Date.now() > permission.expiresAt) {
            permission.status = 'expired';
            return false;
        }
        
        return true;
    }
    
    /**
     * Revoke permission
     */
    revokePermission(targetId, permissionType, scope = '*') {
        const key = `${targetId}:${permissionType}:${scope}`;
        const permission = this.permissions.get(key);
        
        if (permission) {
            permission.status = 'revoked';
            permission.revokedAt = Date.now();
            return true;
        }
        
        return false;
    }
    
    /**
     * Request consent
     */
    requestConsent(requesterId, purpose, scope, duration = null) {
        const consent = {
            id: `CNS-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
            requesterId,
            purpose,
            scope,
            duration,
            state: CONSENT_STATES.PENDING,
            requestedAt: Date.now(),
            respondedAt: null
        };
        
        this.consents.set(consent.id, consent);
        return consent.id;
    }
    
    /**
     * Respond to consent request
     */
    respondToConsent(consentId, grant) {
        const consent = this.consents.get(consentId);
        if (!consent || consent.state !== CONSENT_STATES.PENDING) {
            return false;
        }
        
        consent.state = grant ? CONSENT_STATES.GRANTED : CONSENT_STATES.DENIED;
        consent.respondedAt = Date.now();
        
        if (grant && consent.duration) {
            consent.expiresAt = Date.now() + consent.duration;
        }
        
        if (grant) {
            this.phiAccumulated += PHI_INV;
        }
        
        return true;
    }
    
    /**
     * Delegate authority
     */
    delegate(delegateId, permissions, scope = '*') {
        const delegation = {
            id: `DEL-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
            delegateId,
            permissions,
            scope,
            delegatedAt: Date.now(),
            status: 'active'
        };
        
        // Sign the delegation
        delegation.signature = this.sign({
            type: 'delegation',
            delegateId,
            permissions,
            scope
        }).signature;
        
        this.delegates.set(delegation.id, delegation);
        
        return delegation.id;
    }
    
    /**
     * Export public identity (safe to share)
     */
    exportPublic() {
        return {
            id: this.id,
            name: this.name,
            level: this.level,
            publicKey: this.keyPair.publicKey,
            keyId: this.keyPair.keyId,
            claims: Array.from(this.claims.values()).filter(c => c.verified),
            sovereigntyScore: this.sovereigntyScore,
            createdAt: this.createdAt
        };
    }
    
    /**
     * Get identity state
     */
    getState() {
        return {
            id: this.id,
            name: this.name,
            level: this.level,
            levelName: Object.keys(SOVEREIGNTY_LEVELS).find(k => SOVEREIGNTY_LEVELS[k] === this.level),
            keyId: this.keyPair.keyId,
            claims: this.claims.size,
            verifiedClaims: Array.from(this.claims.values()).filter(c => c.verified).length,
            attestations: this.attestations.size,
            permissions: this.permissions.size,
            consents: this.consents.size,
            delegates: this.delegates.size,
            sovereigntyScore: this.sovereigntyScore,
            phiAccumulated: this.phiAccumulated
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOVEREIGN DATA VAULT
// ═══════════════════════════════════════════════════════════════════════════════

class SovereignDataVault {
    constructor(identity) {
        this.identity = identity;
        this.data = new Map();
        this.accessLog = [];
        this.encryptionKey = this._deriveEncryptionKey();
    }
    
    /**
     * Derive encryption key from identity
     */
    _deriveEncryptionKey() {
        return crypto.createHash('sha256')
            .update(this.identity.keyPair.privateKey)
            .digest();
    }
    
    /**
     * Encrypt data
     */
    _encrypt(data) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
        
        const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
        let encrypted = cipher.update(dataStr, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            iv: iv.toString('hex'),
            data: encrypted,
            tag: authTag.toString('hex')
        };
    }
    
    /**
     * Decrypt data
     */
    _decrypt(encrypted) {
        const decipher = crypto.createDecipheriv(
            'aes-256-gcm',
            this.encryptionKey,
            Buffer.from(encrypted.iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'));
        
        let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        try {
            return JSON.parse(decrypted);
        } catch {
            return decrypted;
        }
    }
    
    /**
     * Store data in vault
     */
    store(key, value, metadata = {}) {
        const encrypted = this._encrypt(value);
        
        const record = {
            key,
            encrypted,
            metadata: {
                ...metadata,
                storedAt: Date.now(),
                ownerId: this.identity.id
            },
            hash: crypto.createHash('sha256')
                .update(JSON.stringify(value))
                .digest('hex')
        };
        
        this.data.set(key, record);
        
        this.accessLog.push({
            action: 'store',
            key,
            timestamp: Date.now(),
            actorId: this.identity.id
        });
        
        return record.hash;
    }
    
    /**
     * Retrieve data from vault
     */
    retrieve(key, requesterId = null) {
        const record = this.data.get(key);
        if (!record) return null;
        
        // Check permission if requester is not owner
        if (requesterId && requesterId !== this.identity.id) {
            if (!this.identity.hasPermission(requesterId, PERMISSION_TYPES.READ, key)) {
                this.accessLog.push({
                    action: 'retrieve_denied',
                    key,
                    timestamp: Date.now(),
                    actorId: requesterId
                });
                return null;
            }
        }
        
        const value = this._decrypt(record.encrypted);
        
        this.accessLog.push({
            action: 'retrieve',
            key,
            timestamp: Date.now(),
            actorId: requesterId || this.identity.id
        });
        
        return value;
    }
    
    /**
     * Delete data from vault
     */
    delete(key) {
        const existed = this.data.delete(key);
        
        if (existed) {
            this.accessLog.push({
                action: 'delete',
                key,
                timestamp: Date.now(),
                actorId: this.identity.id
            });
        }
        
        return existed;
    }
    
    /**
     * Share data with another identity
     */
    share(key, targetId, duration = null) {
        const record = this.data.get(key);
        if (!record) return null;
        
        // Grant read permission
        this.identity.grantPermission(
            targetId,
            PERMISSION_TYPES.READ,
            key,
            duration ? Date.now() + duration : null
        );
        
        // Return encrypted data that they can decrypt with shared key
        const value = this._decrypt(record.encrypted);
        
        // Re-encrypt with shared secret (simplified)
        const sharedKey = crypto.createHash('sha256')
            .update(`${this.identity.id}:${targetId}:${key}`)
            .digest();
        
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', sharedKey, iv);
        
        const dataStr = JSON.stringify(value);
        let encrypted = cipher.update(dataStr, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        this.accessLog.push({
            action: 'share',
            key,
            timestamp: Date.now(),
            actorId: this.identity.id,
            targetId
        });
        
        return {
            key,
            iv: iv.toString('hex'),
            data: encrypted,
            tag: cipher.getAuthTag().toString('hex'),
            sharedBy: this.identity.id,
            sharedWith: targetId,
            expiresAt: duration ? Date.now() + duration : null
        };
    }
    
    /**
     * Get vault statistics
     */
    getStats() {
        return {
            owner: this.identity.id,
            itemCount: this.data.size,
            accessLogSize: this.accessLog.length,
            lastAccess: this.accessLog.length > 0 
                ? this.accessLog[this.accessLog.length - 1].timestamp 
                : null
        };
    }
    
    /**
     * Get access log (audit trail)
     */
    getAccessLog(filter = {}) {
        let log = this.accessLog;
        
        if (filter.action) {
            log = log.filter(e => e.action === filter.action);
        }
        if (filter.key) {
            log = log.filter(e => e.key === filter.key);
        }
        if (filter.since) {
            log = log.filter(e => e.timestamp >= filter.since);
        }
        if (filter.limit) {
            log = log.slice(-filter.limit);
        }
        
        return log;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOVEREIGNTY MANAGER
// ═══════════════════════════════════════════════════════════════════════════════

class SovereigntyManager {
    constructor() {
        this.identities = new Map();
        this.vaults = new Map();
        this.events = new EventEmitter();
    }
    
    /**
     * Create a new sovereign identity
     */
    createIdentity(config = {}) {
        const identity = new SovereignIdentity(config);
        this.identities.set(identity.id, identity);
        
        // Create associated vault
        const vault = new SovereignDataVault(identity);
        this.vaults.set(identity.id, vault);
        
        this.events.emit('identity:created', { id: identity.id });
        
        return identity;
    }
    
    /**
     * Get identity by ID
     */
    getIdentity(id) {
        return this.identities.get(id);
    }
    
    /**
     * Get vault for identity
     */
    getVault(identityId) {
        return this.vaults.get(identityId);
    }
    
    /**
     * Verify a signature
     */
    verifySignature(signedData) {
        const identity = this.identities.get(signedData.signerId);
        if (!identity) return false;
        
        return identity.verify(signedData);
    }
    
    /**
     * Transfer sovereignty (e.g., key rotation)
     */
    transferSovereignty(fromId, toId, proof) {
        const fromIdentity = this.identities.get(fromId);
        const toIdentity = this.identities.get(toId);
        
        if (!fromIdentity || !toIdentity) return false;
        
        // Verify proof of ownership
        if (!fromIdentity.verify(proof)) return false;
        
        // Transfer claims
        for (const [claimId, claim] of fromIdentity.claims) {
            toIdentity.claims.set(claimId, { ...claim });
        }
        
        // Transfer attestations
        for (const [attId, att] of fromIdentity.attestations) {
            toIdentity.attestations.set(attId, { ...att });
        }
        
        // Transfer vault data
        const fromVault = this.vaults.get(fromId);
        const toVault = this.vaults.get(toId);
        
        if (fromVault && toVault) {
            for (const [key, record] of fromVault.data) {
                const value = fromVault.retrieve(key);
                toVault.store(key, value, record.metadata);
            }
        }
        
        this.events.emit('sovereignty:transferred', { fromId, toId });
        
        return true;
    }
    
    /**
     * Get manager statistics
     */
    getStats() {
        let totalSovereigntyScore = 0;
        let totalPhiAccumulated = 0;
        
        for (const identity of this.identities.values()) {
            totalSovereigntyScore += identity.sovereigntyScore;
            totalPhiAccumulated += identity.phiAccumulated;
        }
        
        return {
            identityCount: this.identities.size,
            vaultCount: this.vaults.size,
            avgSovereigntyScore: this.identities.size > 0 
                ? totalSovereigntyScore / this.identities.size 
                : 0,
            totalPhiAccumulated
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
    SOVEREIGNTY_LEVELS,
    PERMISSION_TYPES,
    CONSENT_STATES,
    
    // Classes
    SovereignIdentity,
    SovereignDataVault,
    SovereigntyManager,
    
    // Factory
    createManager() {
        return new SovereigntyManager();
    },
    
    createIdentity(config = {}) {
        return new SovereignIdentity(config);
    },
    
    // Protocol info
    id: 'RSHIP-2026-SOVEREIGNTY-001',
    name: 'Sovereignty Core SDK',
    version: '1.0.0',
    
    // Status
    status() {
        return {
            sdk: 'sovereignty-core',
            version: '1.0.0',
            sovereigntyLevels: Object.keys(SOVEREIGNTY_LEVELS).length,
            permissionTypes: Object.keys(PERMISSION_TYPES).length,
            consentStates: Object.keys(CONSENT_STATES).length,
            timestamp: Date.now()
        };
    }
};

// Self-test if run directly
if (require.main === module) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('SOVEREIGNTY-CORE SDK');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const { createManager } = module.exports;
    const manager = createManager();
    
    // Create identities
    console.log('\n1. Creating identities...');
    const alice = manager.createIdentity({ name: 'Alice', level: 4 });
    const bob = manager.createIdentity({ name: 'Bob', level: 3 });
    console.log(`   Alice ID: ${alice.id}`);
    console.log(`   Bob ID: ${bob.id}`);
    
    // Add claims
    console.log('\n2. Adding claims...');
    const emailClaim = alice.addClaim('email', 'alice@example.com');
    console.log(`   Alice added email claim: ${emailClaim}`);
    
    // Sign data
    console.log('\n3. Signing data...');
    const signed = alice.sign({ message: 'Hello, Bob!' });
    console.log(`   Signature (first 32 chars): ${signed.signature.substring(0, 32)}...`);
    
    // Verify signature
    console.log('\n4. Verifying signature...');
    const verified = manager.verifySignature(signed);
    console.log(`   Verified: ${verified}`);
    
    // Use vault
    console.log('\n5. Using vault...');
    const vault = manager.getVault(alice.id);
    vault.store('secret', { data: 'sensitive information' });
    const retrieved = vault.retrieve('secret');
    console.log(`   Stored and retrieved: ${JSON.stringify(retrieved)}`);
    
    // Grant permission
    console.log('\n6. Granting permissions...');
    alice.grantPermission(bob.id, 'read', 'secret');
    const canRead = alice.hasPermission(bob.id, 'read', 'secret');
    console.log(`   Bob can read Alice's secret: ${canRead}`);
    
    // Stats
    console.log('\n7. Final state:');
    console.log('   Alice:', alice.getState());
    console.log('   Manager:', manager.getStats());
    
    console.log('\n✓ SOVEREIGNTY-CORE operational');
}
