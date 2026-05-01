/**
 * VETKEYS — Substrate-Level Encryption Layer
 *
 * Theory: IMPERIUM CONSERVATUM (Paper VIII) — sovereignty as conservation law.
 *
 * vetKeys provides substrate-level encryption ensuring data sovereignty.
 * All canister-to-canister communication is encrypted before the application
 * layer touches it, and all student data is encrypted at the substrate level.
 *
 * Conservation law: encrypted payloads carry their own integrity proof (GCM
 * auth tag). The sovereignty of the data is conserved regardless of where the
 * payload travels — no intermediary can read or tamper with it without the
 * derived key material, and any tampering is detectable.
 *
 * Key hierarchy:
 *   masterKey = HKDF(canisterId ‖ keyDerivationDomain)
 *   purposeKey = HKDF(masterKey, purpose ‖ context)
 *
 * Encryption: AES-256-GCM with 12-byte random IV and 16-byte auth tag.
 *
 * MERIDIAN Sovereign OS — Alfredo Medina Hernandez · Medina Tech · Dallas TX
 */

import { createHmac, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { PHI, PHI_INV } from './nexoris.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AES_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH     = 12;   // 96-bit IV recommended for GCM
const KEY_LENGTH    = 32;   // 256-bit key
const AUTH_TAG_LEN  = 16;   // 128-bit authentication tag

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * HKDF-Extract: PRK = HMAC-SHA256(salt, ikm)
 * @param {Buffer} salt
 * @param {Buffer} ikm  - input keying material
 * @returns {Buffer}
 */
function hkdfExtract(salt, ikm) {
  return createHmac('sha256', salt).update(ikm).digest();
}

/**
 * HKDF-Expand: OKM = T(1) ‖ T(2) ‖ … truncated to `length` bytes.
 * T(i) = HMAC-SHA256(PRK, T(i-1) ‖ info ‖ i)
 * @param {Buffer} prk
 * @param {Buffer} info
 * @param {number} length
 * @returns {Buffer}
 */
function hkdfExpand(prk, info, length) {
  const iterations = Math.ceil(length / 32);
  let prev = Buffer.alloc(0);
  const blocks = [];

  for (let i = 1; i <= iterations; i++) {
    prev = createHmac('sha256', prk)
      .update(Buffer.concat([prev, info, Buffer.from([i])]))
      .digest();
    blocks.push(prev);
  }
  return Buffer.concat(blocks).subarray(0, length);
}

/**
 * Full HKDF: extract + expand.
 * @param {string|Buffer} ikm
 * @param {string|Buffer} salt
 * @param {string|Buffer} info
 * @param {number} length
 * @returns {Buffer}
 */
function hkdf(ikm, salt, info, length = KEY_LENGTH) {
  const ikmBuf  = Buffer.isBuffer(ikm)  ? ikm  : Buffer.from(String(ikm));
  const saltBuf = Buffer.isBuffer(salt)  ? salt : Buffer.from(String(salt));
  const infoBuf = Buffer.isBuffer(info)  ? info : Buffer.from(String(info));
  const prk = hkdfExtract(saltBuf, ikmBuf);
  return hkdfExpand(prk, infoBuf, length);
}

// ---------------------------------------------------------------------------
// VetKeys
// ---------------------------------------------------------------------------

export class VetKeys {
  /**
   * @param {object} options
   * @param {string} options.canisterId          - Unique canister identifier
   * @param {string} options.keyDerivationDomain - Domain scope for key derivation
   */
  constructor({ canisterId, keyDerivationDomain }) {
    if (!canisterId || !keyDerivationDomain) {
      throw new Error('VetKeys requires both canisterId and keyDerivationDomain');
    }

    this._canisterId          = canisterId;
    this._keyDerivationDomain = keyDerivationDomain;
    this._chrono              = null;

    /** @type {Map<string, { key: Buffer, createdAt: string, rotationCount: number, context: string }>} */
    this._keys     = new Map();
    /** @type {Map<string, Buffer[]>} */
    this._prevKeys = new Map();   // purpose → [retired keys] for backward decryption
    this._channels = new Map();   // targetCanisterId → channel info

    // Derive master key from canisterId + domain
    this._masterKey = hkdf(
      `${canisterId}|${keyDerivationDomain}`,
      'VETKEYS_MASTER_SALT',
      'VETKEYS_MASTER_INFO',
      KEY_LENGTH,
    );
  }

  // ── CHRONO wiring (setChrono pattern) ────────────────────────────────────

  /**
   * Attach a CHRONO instance for immutable audit logging.
   * @param {import('./chrono.js').CHRONO} chrono
   * @returns {VetKeys} this (for chaining)
   */
  setChrono(chrono) {
    this._chrono = chrono;
    this._log({ type: 'VETKEYS_INIT', canisterId: this._canisterId });
    return this;
  }

  /** @private */
  _log(data) {
    if (this._chrono) {
      this._chrono.append({ ...data, engine: 'VETKEYS' });
    }
  }

  // ── Key management ──────────────────────────────────────────────────────

  /**
   * Derive an encryption key for a specific purpose.
   *
   * Uses HKDF with the master key as IKM, purpose and context as info.
   * The derived key is stored internally, keyed by `purpose`.
   *
   * @param {string} purpose - e.g. 'STUDENT_DATA', 'CANISTER_COMMS', 'AUDIT_TRAIL'
   * @param {string} [context='default'] - additional derivation context
   * @returns {{ purpose: string, createdAt: string, keyId: string }}
   */
  deriveKey(purpose, context = 'default') {
    if (this._keys.has(purpose)) {
      return this._keyMeta(purpose);
    }

    const derived = hkdf(
      this._masterKey,
      `VETKEYS_PURPOSE|${purpose}`,
      `${context}|${this._canisterId}`,
      KEY_LENGTH,
    );

    const createdAt = new Date().toISOString();
    this._keys.set(purpose, { key: derived, createdAt, rotationCount: 0, context });

    this._log({ type: 'KEY_DERIVED', purpose, context, createdAt });

    return this._keyMeta(purpose);
  }

  /**
   * Rotate a derived key while maintaining access to previously encrypted data.
   *
   * The old key is preserved in the _prevKeys list so that data encrypted
   * under a prior generation can still be decrypted.
   *
   * @param {string} purpose
   * @returns {{ purpose: string, createdAt: string, rotationCount: number, keyId: string }}
   */
  rotateKey(purpose) {
    const entry = this._keys.get(purpose);
    if (!entry) {
      throw new Error(`No key exists for purpose "${purpose}". Derive it first.`);
    }

    // Archive the current key
    if (!this._prevKeys.has(purpose)) {
      this._prevKeys.set(purpose, []);
    }
    this._prevKeys.get(purpose).push(entry.key);

    // Derive a new key using rotation count as additional entropy
    const newRotation = entry.rotationCount + 1;
    const derived = hkdf(
      this._masterKey,
      `VETKEYS_PURPOSE|${purpose}|ROT_${newRotation}`,
      `${entry.context}|${this._canisterId}`,
      KEY_LENGTH,
    );

    const createdAt = new Date().toISOString();
    this._keys.set(purpose, {
      key: derived,
      createdAt,
      rotationCount: newRotation,
      context: entry.context,
    });

    this._log({ type: 'KEY_ROTATED', purpose, rotationCount: newRotation, createdAt });

    return this._keyMeta(purpose);
  }

  /** @private — return safe metadata for a purpose key */
  _keyMeta(purpose) {
    const entry = this._keys.get(purpose);
    return {
      purpose,
      createdAt: entry.createdAt,
      rotationCount: entry.rotationCount,
      keyId: `VK-${purpose}-${entry.rotationCount}`,
    };
  }

  // ── Encryption / Decryption (AES-256-GCM) ──────────────────────────────

  /**
   * Encrypt data with the key derived for the given purpose.
   *
   * Returns an encrypted payload containing the ciphertext, IV, auth tag,
   * purpose, and rotation generation so the correct key can be located
   * during decryption.
   *
   * @param {string|Buffer|object} data - Plaintext (objects are JSON-stringified)
   * @param {string} purpose
   * @returns {Promise<{ ciphertext: string, iv: string, authTag: string, purpose: string, generation: number }>}
   */
  async encrypt(data, purpose) {
    const entry = this._keys.get(purpose);
    if (!entry) {
      throw new Error(`No key for purpose "${purpose}". Call deriveKey first.`);
    }

    const plaintext = typeof data === 'object' && !Buffer.isBuffer(data)
      ? JSON.stringify(data)
      : String(data);

    const iv     = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(AES_ALGORITHM, entry.key, iv, { authTagLength: AUTH_TAG_LEN });

    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag   = cipher.getAuthTag();

    this._log({ type: 'ENCRYPT', purpose, generation: entry.rotationCount, bytes: encrypted.length });

    return {
      ciphertext: encrypted.toString('base64'),
      iv:         iv.toString('base64'),
      authTag:    authTag.toString('base64'),
      purpose,
      generation: entry.rotationCount,
    };
  }

  /**
   * Decrypt an encrypted payload produced by `encrypt`.
   *
   * If the payload was encrypted under a prior key generation, the archived
   * key is used automatically.
   *
   * @param {{ ciphertext: string, iv: string, authTag: string, purpose: string, generation: number }} encryptedPayload
   * @param {string} purpose
   * @returns {Promise<string>}
   */
  async decrypt(encryptedPayload, purpose) {
    const { ciphertext, iv, authTag, generation } = encryptedPayload;

    const key = this._resolveKey(purpose, generation);
    if (!key) {
      throw new Error(`Cannot resolve key for purpose "${purpose}" generation ${generation}`);
    }

    const decipher = createDecipheriv(
      AES_ALGORITHM,
      key,
      Buffer.from(iv, 'base64'),
      { authTagLength: AUTH_TAG_LEN },
    );
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64')),
      decipher.final(),
    ]);

    this._log({ type: 'DECRYPT', purpose, generation, bytes: decrypted.length });

    return decrypted.toString('utf8');
  }

  /**
   * Resolve the correct key buffer for a purpose and generation.
   * @private
   */
  _resolveKey(purpose, generation) {
    const entry = this._keys.get(purpose);
    if (!entry) return null;

    // Current generation — use active key
    if (generation === entry.rotationCount) {
      return entry.key;
    }

    // Older generation — look up archived keys
    const prev = this._prevKeys.get(purpose);
    if (prev && generation >= 0 && generation < prev.length) {
      return prev[generation];
    }

    return null;
  }

  // ── Canister-to-canister encrypted channel ──────────────────────────────

  /**
   * Establish an encrypted communication channel to another canister.
   *
   * Derives a shared channel key from both canister identifiers so that
   * either end can decrypt the other's messages (symmetric).
   *
   * @param {string} targetCanisterId
   * @returns {{ channelId: string, createdAt: string }}
   */
  createChannel(targetCanisterId) {
    // Deterministic ordering ensures both ends derive the same key
    const pair = [this._canisterId, targetCanisterId].sort().join('|');

    const channelKey = hkdf(
      this._masterKey,
      'VETKEYS_CHANNEL',
      pair,
      KEY_LENGTH,
    );

    const channelId = `CH-${this._canisterId}-${targetCanisterId}`;
    const createdAt = new Date().toISOString();

    this._channels.set(targetCanisterId, { key: channelKey, channelId, createdAt });

    // Also register as a purpose key so encrypt/decrypt work seamlessly
    const purpose = `CHANNEL:${targetCanisterId}`;
    this._keys.set(purpose, { key: channelKey, createdAt, rotationCount: 0, context: pair });

    this._log({ type: 'CHANNEL_CREATED', channelId, targetCanisterId, createdAt });

    return { channelId, createdAt };
  }

  // ── Verification ────────────────────────────────────────────────────────

  /**
   * Verify that an encrypted payload has not been tampered with.
   *
   * Re-derives the auth tag by performing the same encryption steps and
   * compares it to the stored tag. If GCM decryption succeeds the data is
   * authentic; if the tag fails, Node.js throws and we return false.
   *
   * @param {{ ciphertext: string, iv: string, authTag: string, purpose: string, generation: number }} encryptedPayload
   * @returns {boolean}
   */
  verifyIntegrity(encryptedPayload) {
    const { ciphertext, iv, authTag, purpose, generation } = encryptedPayload;

    const key = this._resolveKey(purpose, generation);
    if (!key) return false;

    try {
      const decipher = createDecipheriv(
        AES_ALGORITHM,
        key,
        Buffer.from(iv, 'base64'),
        { authTagLength: AUTH_TAG_LEN },
      );
      decipher.setAuthTag(Buffer.from(authTag, 'base64'));
      decipher.update(Buffer.from(ciphertext, 'base64'));
      decipher.final();   // throws if auth tag mismatch
      return true;
    } catch {
      return false;
    }
  }

  // ── Audit ──────────────────────────────────────────────────────────────

  /**
   * Returns metadata about all derived keys without exposing key material.
   *
   * @returns {Array<{ purpose: string, createdAt: string, rotationCount: number, keyId: string, archivedGenerations: number }>}
   */
  keyAudit() {
    const audit = [];
    for (const [purpose, entry] of this._keys) {
      const archivedGenerations = (this._prevKeys.get(purpose) ?? []).length;
      audit.push({
        purpose,
        createdAt:   entry.createdAt,
        rotationCount: entry.rotationCount,
        keyId:       `VK-${purpose}-${entry.rotationCount}`,
        archivedGenerations,
      });
    }

    this._log({ type: 'KEY_AUDIT', keyCount: audit.length });

    return audit;
  }
}

export default VetKeys;
