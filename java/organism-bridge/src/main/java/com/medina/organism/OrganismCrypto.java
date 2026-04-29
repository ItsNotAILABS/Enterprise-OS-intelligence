package com.medina.organism;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Arrays;
import java.util.Base64;

/**
 * OrganismCrypto — Sovereign Encryption Engine (Java)
 *
 * Production-grade cryptographic primitives for the organism enterprise bridge.
 *
 * <ul>
 *   <li>AES-256-GCM authenticated encryption / decryption</li>
 *   <li>ECDSA (P-256) digital signatures</li>
 *   <li>SHA-256 hashing</li>
 *   <li>PBKDF2-SHA256 key derivation</li>
 *   <li>Secure random key and nonce generation</li>
 *   <li>Organism wire message sealing / opening</li>
 * </ul>
 *
 * <p>Uses only the Java standard library (JCA/JCE). No third-party crypto
 * dependencies required.</p>
 *
 * <p>Ring: Sovereign Ring | Java Enterprise Bridge</p>
 */
public final class OrganismCrypto {

    // ── Constants ─────────────────────────────────────────────────────────────

    public static final int AES_KEY_BITS  = 256;
    public static final int AES_KEY_BYTES = 32;
    public static final int GCM_NONCE_BYTES = 12;
    public static final int GCM_TAG_BITS  = 128;
    private static final String AES_GCM   = "AES/GCM/NoPadding";
    private static final String AES_ALG   = "AES";
    private static final String ECDSA_ALG = "SHA256withECDSA";
    private static final String EC_CURVE  = "EC";

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Base64.Encoder B64_ENC = Base64.getEncoder();
    private static final Base64.Decoder B64_DEC = Base64.getDecoder();

    private OrganismCrypto() {}

    // ── Errors ────────────────────────────────────────────────────────────────

    public static class CryptoException extends RuntimeException {
        public CryptoException(String msg) { super(msg); }
        public CryptoException(String msg, Throwable cause) { super(msg, cause); }
    }

    // ── EncryptedPayload ──────────────────────────────────────────────────────

    /**
     * Immutable result of AES-256-GCM encryption.
     * Both fields are standard Base64-encoded strings.
     */
    public record EncryptedPayload(String nonce, String ciphertext) {
        /** Convenience JSON-like representation. */
        public String toJson() {
            return String.format("{\"nonce\":\"%s\",\"ciphertext\":\"%s\"}", nonce, ciphertext);
        }
    }

    // ── AES-256-GCM ───────────────────────────────────────────────────────────

    /**
     * Generate a cryptographically-secure AES-256 key.
     */
    public static SecretKey generateAESKey() {
        try {
            KeyGenerator kg = KeyGenerator.getInstance(AES_ALG);
            kg.init(AES_KEY_BITS, SECURE_RANDOM);
            return kg.generateKey();
        } catch (NoSuchAlgorithmException e) {
            throw new CryptoException("AES-256 not available", e);
        }
    }

    /**
     * Wrap a raw 32-byte key as a SecretKey.
     */
    public static SecretKey aesKeyFromBytes(byte[] raw) {
        if (raw.length != AES_KEY_BYTES) {
            throw new CryptoException("Key must be " + AES_KEY_BYTES + " bytes, got " + raw.length);
        }
        return new SecretKeySpec(raw, AES_ALG);
    }

    /**
     * Encrypt plaintext with AES-256-GCM.
     * A random 12-byte nonce is generated automatically.
     * The ciphertext includes the 16-byte GCM authentication tag.
     */
    public static EncryptedPayload encrypt(SecretKey key, byte[] plaintext) {
        try {
            byte[] nonce = new byte[GCM_NONCE_BYTES];
            SECURE_RANDOM.nextBytes(nonce);

            Cipher cipher = Cipher.getInstance(AES_GCM);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, nonce));
            byte[] ciphertext = cipher.doFinal(plaintext);

            return new EncryptedPayload(
                B64_ENC.encodeToString(nonce),
                B64_ENC.encodeToString(ciphertext)
            );
        } catch (Exception e) {
            throw new CryptoException("Encryption failed", e);
        }
    }

    /**
     * Encrypt a UTF-8 string with AES-256-GCM.
     */
    public static EncryptedPayload encryptString(SecretKey key, String plaintext) {
        return encrypt(key, plaintext.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Decrypt an EncryptedPayload with AES-256-GCM.
     * Throws CryptoException if the key is wrong or the payload was tampered.
     */
    public static byte[] decrypt(SecretKey key, EncryptedPayload payload) {
        try {
            byte[] nonce = B64_DEC.decode(payload.nonce());
            byte[] ct    = B64_DEC.decode(payload.ciphertext());

            if (nonce.length != GCM_NONCE_BYTES) {
                throw new CryptoException("Nonce must be " + GCM_NONCE_BYTES + " bytes");
            }

            Cipher cipher = Cipher.getInstance(AES_GCM);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, nonce));
            return cipher.doFinal(ct);
        } catch (CryptoException e) {
            throw e;
        } catch (Exception e) {
            throw new CryptoException("Decryption failed — authentication tag mismatch or wrong key", e);
        }
    }

    /**
     * Decrypt and return as UTF-8 string.
     */
    public static String decryptString(SecretKey key, EncryptedPayload payload) {
        return new String(decrypt(key, payload), StandardCharsets.UTF_8);
    }

    // ── ECDSA (P-256) signatures ───────────────────────────────────────────────

    /**
     * Generate a fresh ECDSA keypair on the NIST P-256 curve.
     */
    public static KeyPair generateECKeyPair() {
        try {
            KeyPairGenerator kpg = KeyPairGenerator.getInstance(EC_CURVE);
            kpg.initialize(256, SECURE_RANDOM);
            return kpg.generateKeyPair();
        } catch (Exception e) {
            throw new CryptoException("ECDSA keypair generation failed", e);
        }
    }

    /**
     * Sign a message with an ECDSA private key.
     * Returns the DER-encoded signature bytes.
     */
    public static byte[] sign(PrivateKey privateKey, byte[] message) {
        try {
            Signature sig = Signature.getInstance(ECDSA_ALG);
            sig.initSign(privateKey, SECURE_RANDOM);
            sig.update(message);
            return sig.sign();
        } catch (Exception e) {
            throw new CryptoException("Signing failed", e);
        }
    }

    /**
     * Verify an ECDSA signature.
     */
    public static boolean verify(PublicKey publicKey, byte[] message, byte[] signature) {
        try {
            Signature sig = Signature.getInstance(ECDSA_ALG);
            sig.initVerify(publicKey);
            sig.update(message);
            return sig.verify(signature);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Encode a public key to Base64 (X.509 SubjectPublicKeyInfo format).
     */
    public static String publicKeyToBase64(PublicKey key) {
        return B64_ENC.encodeToString(key.getEncoded());
    }

    /**
     * Encode a signature to hex.
     */
    public static String signatureToHex(byte[] sig) {
        StringBuilder sb = new StringBuilder();
        for (byte b : sig) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    // ── SHA-256 hashing ───────────────────────────────────────────────────────

    /**
     * Compute SHA-256 and return as hex string.
     */
    public static String sha256Hex(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(data);
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new CryptoException("SHA-256 not available", e);
        }
    }

    /**
     * Compute SHA-256 of a UTF-8 string and return as hex.
     */
    public static String sha256Hex(String data) {
        return sha256Hex(data.getBytes(StandardCharsets.UTF_8));
    }

    // ── PBKDF2 key derivation ─────────────────────────────────────────────────

    /**
     * Derive a 32-byte AES key from a password using PBKDF2-SHA256.
     *
     * @param password   UTF-8 password
     * @param salt       Random salt (16+ bytes recommended)
     * @param iterations PBKDF2 iteration count (100_000+ recommended for production)
     * @return Raw 32-byte derived key
     */
    public static byte[] deriveKey(String password, byte[] salt, int iterations) {
        try {
            javax.crypto.SecretKeyFactory skf =
                javax.crypto.SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            javax.crypto.spec.PBEKeySpec spec =
                new javax.crypto.spec.PBEKeySpec(
                    password.toCharArray(), salt, iterations, AES_KEY_BITS);
            byte[] raw = skf.generateSecret(spec).getEncoded();
            spec.clearPassword();
            return raw;
        } catch (Exception e) {
            throw new CryptoException("PBKDF2 key derivation failed", e);
        }
    }

    // ── Organism wire message ─────────────────────────────────────────────────

    /**
     * Organism wire message envelope (encrypted + signed).
     */
    public record OrganismWireMessage(
        String id,
        String senderId,
        String recipientId,
        String payloadType,
        String nonce,
        String ciphertext,
        String signature,
        String pubKey,
        long   timestamp,
        long   beat,
        String ring
    ) {
        /** Bytes over which the signature is computed. */
        public byte[] signingBytes() {
            return (id + senderId + recipientId + payloadType + ciphertext)
                .getBytes(StandardCharsets.UTF_8);
        }

        /** Verify the embedded ECDSA signature. */
        public boolean verifySignature() {
            try {
                byte[] pubBytes = B64_DEC.decode(pubKey);
                KeyFactory kf = KeyFactory.getInstance(EC_CURVE);
                PublicKey pub = kf.generatePublic(new X509EncodedKeySpec(pubBytes));
                byte[] sig    = B64_DEC.decode(signature);
                return OrganismCrypto.verify(pub, signingBytes(), sig);
            } catch (Exception e) {
                return false;
            }
        }
    }

    /**
     * OrganismSeal seals and opens wire messages for one node.
     */
    public static final class OrganismSeal {
        private final String    nodeId;
        private final String    ring;
        private final SecretKey aesKey;
        private final KeyPair   ecKeyPair;
        private long            beat = 0;

        public OrganismSeal(String nodeId, String ring, SecretKey aesKey) {
            this.nodeId   = nodeId;
            this.ring     = ring;
            this.aesKey   = aesKey;
            this.ecKeyPair = generateECKeyPair();
        }

        /** Advance the beat counter (call every 873 ms). */
        public void tick() { beat++; }

        /** Encrypt and sign a payload. */
        public OrganismWireMessage seal(
            byte[] plaintext,
            String payloadType,
            String recipientId
        ) {
            String id = java.util.UUID.randomUUID().toString();
            EncryptedPayload enc = encrypt(aesKey, plaintext);
            long ts = System.currentTimeMillis();

            byte[] toSign = (id + nodeId + recipientId + payloadType + enc.ciphertext())
                .getBytes(StandardCharsets.UTF_8);
            byte[] sig = sign(ecKeyPair.getPrivate(), toSign);

            return new OrganismWireMessage(
                id, nodeId, recipientId, payloadType,
                enc.nonce(), enc.ciphertext(),
                B64_ENC.encodeToString(sig),
                publicKeyToBase64(ecKeyPair.getPublic()),
                ts, beat, ring
            );
        }

        /** Verify signature and decrypt a received wire message. */
        public byte[] open(OrganismWireMessage msg) {
            if (!msg.verifySignature()) {
                throw new CryptoException("Wire message signature verification failed");
            }
            return decrypt(aesKey, new EncryptedPayload(msg.nonce(), msg.ciphertext()));
        }

        public long beat() { return beat; }
        public String nodeId() { return nodeId; }
    }
}
