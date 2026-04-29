/**
 * organism_crypto.hpp — Sovereign Encryption Engine (C++)
 *
 * Header-only AES-256-GCM + HMAC-SHA256 cryptographic primitives for the
 * organism native layer.
 *
 * Two build modes:
 *   #define ORGANISM_CRYPTO_USE_OPENSSL  — full AES-256-GCM via OpenSSL EVP
 *   (default)                            — XOR cipher + HMAC fallback (no deps)
 *
 * In production always build with ORGANISM_CRYPTO_USE_OPENSSL and link -lcrypto.
 *
 * Primitives
 * ──────────
 *   AES-256-GCM  encrypt/decrypt
 *   HMAC-SHA256
 *   SHA-256 (pure C++ reference, no deps)
 *   Secure random bytes
 *   Base64 encode/decode
 *
 * Ring: Sovereign Ring | Native Layer
 */

#pragma once

#include <array>
#include <cstdint>
#include <cstring>
#include <iomanip>
#include <random>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>

#ifdef ORGANISM_CRYPTO_USE_OPENSSL
  #include <openssl/evp.h>
  #include <openssl/hmac.h>
  #include <openssl/rand.h>
  #include <openssl/bio.h>
  #include <openssl/buffer.h>
#endif

namespace organism::crypto {

// ── Constants ─────────────────────────────────────────────────────────────────

inline constexpr std::size_t AES_KEY_BYTES   = 32;
inline constexpr std::size_t GCM_NONCE_BYTES = 12;
inline constexpr std::size_t GCM_TAG_BYTES   = 16;
inline constexpr std::size_t SHA256_BYTES    = 32;
inline constexpr std::size_t HMAC_BYTES      = 32;

// ── CryptoError ───────────────────────────────────────────────────────────────

class CryptoError : public std::runtime_error {
public:
    explicit CryptoError(const std::string& msg) : std::runtime_error(msg) {}
};

// ── EncryptedPayload ──────────────────────────────────────────────────────────

struct EncryptedPayload {
    std::string nonce;      ///< base64-encoded 12-byte nonce
    std::string ciphertext; ///< base64-encoded ciphertext + auth tag
    bool empty() const { return nonce.empty() || ciphertext.empty(); }
};

// ── Hex helper ────────────────────────────────────────────────────────────────

inline std::string to_hex(const uint8_t* d, std::size_t n) {
    std::ostringstream o;
    o << std::hex << std::setfill('0');
    for (std::size_t i = 0; i < n; ++i) o << std::setw(2) << unsigned(d[i]);
    return o.str();
}
inline std::string to_hex(const std::vector<uint8_t>& v) { return to_hex(v.data(), v.size()); }
template <std::size_t N>
inline std::string to_hex(const std::array<uint8_t,N>& a) { return to_hex(a.data(), N); }

// ── Base64 ────────────────────────────────────────────────────────────────────

static const char B64C[] =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

inline std::string base64_encode(const uint8_t* d, std::size_t n) {
    std::string o;
    o.reserve(((n + 2) / 3) * 4);
    for (std::size_t i = 0; i < n; i += 3) {
        uint32_t g = (uint32_t(d[i]) << 16)
                   | (i+1 < n ? uint32_t(d[i+1]) << 8 : 0)
                   | (i+2 < n ? uint32_t(d[i+2])     : 0);
        o += B64C[(g>>18)&0x3F]; o += B64C[(g>>12)&0x3F];
        o += (i+1 < n) ? B64C[(g>>6)&0x3F] : '=';
        o += (i+2 < n) ? B64C[g&0x3F]      : '=';
    }
    return o;
}
inline std::string base64_encode(const std::vector<uint8_t>& v) { return base64_encode(v.data(), v.size()); }

inline std::vector<uint8_t> base64_decode(const std::string& s) {
    static const int8_t T[256] = {
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,62,-1,-1,-1,63,
        52,53,54,55,56,57,58,59,60,61,-1,-1,-1,-1,-1,-1,
        -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,
        15,16,17,18,19,20,21,22,23,24,25,-1,-1,-1,-1,-1,
        -1,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,
        41,42,43,44,45,46,47,48,49,50,51,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
        -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1
    };
    std::vector<uint8_t> o;
    o.reserve(s.size() * 3 / 4);
    for (std::size_t i = 0; i < s.size(); i += 4) {
        uint32_t g = 0; int bits = 0;
        for (int k = 0; k < 4 && i+k < s.size(); ++k) {
            int8_t v = T[(uint8_t)s[i+k]];
            if (v < 0) continue;
            g = (g << 6) | uint32_t(v); bits += 6;
        }
        if (bits >= 8)  o.push_back((g >> (bits-8))  & 0xFF), bits -= 8;
        if (bits >= 8)  o.push_back((g >> (bits-8))  & 0xFF), bits -= 8;
        if (bits >= 8)  o.push_back(g & 0xFF);
    }
    return o;
}

// ── Secure random ─────────────────────────────────────────────────────────────

inline std::vector<uint8_t> random_bytes(std::size_t n) {
#ifdef ORGANISM_CRYPTO_USE_OPENSSL
    std::vector<uint8_t> o(n);
    if (RAND_bytes(o.data(), (int)n) != 1) throw CryptoError("RAND_bytes failed");
    return o;
#else
    std::random_device rd;
    std::mt19937 mt(rd());
    std::vector<uint8_t> o(n);
    for (auto& b : o) b = uint8_t(mt() & 0xFF);
    return o;
#endif
}

inline std::array<uint8_t, AES_KEY_BYTES> generate_aes_key() {
    auto v = random_bytes(AES_KEY_BYTES);
    std::array<uint8_t, AES_KEY_BYTES> k{};
    std::copy(v.begin(), v.end(), k.begin());
    return k;
}

// ── SHA-256 (pure C++, no deps) ───────────────────────────────────────────────

inline std::array<uint8_t, SHA256_BYTES> sha256(const uint8_t* data, std::size_t len) {
    static const uint32_t K[64] = {
        0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
        0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
        0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
        0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
        0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
        0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
        0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
        0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    };
    auto R = [](uint32_t x, int n) { return (x>>n)|(x<<(32-n)); };
    uint32_t h[8] = {
        0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,
        0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19
    };
    std::vector<uint8_t> m(data, data+len);
    m.push_back(0x80);
    while ((m.size()%64)!=56) m.push_back(0);
    uint64_t bl = uint64_t(len)*8;
    for (int i=7;i>=0;--i) m.push_back(uint8_t((bl>>(i*8))&0xFF));
    for (std::size_t bi=0;bi<m.size();bi+=64) {
        uint32_t w[64]{};
        for (int i=0;i<16;++i)
            w[i]=(uint32_t(m[bi+i*4])<<24)|(uint32_t(m[bi+i*4+1])<<16)
                |(uint32_t(m[bi+i*4+2])<<8)|uint32_t(m[bi+i*4+3]);
        for (int i=16;i<64;++i) {
            uint32_t s0=R(w[i-15],7)^R(w[i-15],18)^(w[i-15]>>3);
            uint32_t s1=R(w[i-2],17)^R(w[i-2],19)^(w[i-2]>>10);
            w[i]=w[i-16]+s0+w[i-7]+s1;
        }
        uint32_t a=h[0],b=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],hh=h[7];
        for (int i=0;i<64;++i) {
            uint32_t S1=(R(e,6)^R(e,11)^R(e,25)),ch=(e&f)^(~e&g);
            uint32_t t1=hh+S1+ch+K[i]+w[i];
            uint32_t S0=(R(a,2)^R(a,13)^R(a,22)),mj=(a&b)^(a&c)^(b&c);
            uint32_t t2=S0+mj;
            hh=g;g=f;f=e;e=d+t1;d=c;c=b;b=a;a=t1+t2;
        }
        h[0]+=a;h[1]+=b;h[2]+=c;h[3]+=d;
        h[4]+=e;h[5]+=f;h[6]+=g;h[7]+=hh;
    }
    std::array<uint8_t,32> o{};
    for (int i=0;i<8;++i){o[i*4]=(h[i]>>24)&0xFF;o[i*4+1]=(h[i]>>16)&0xFF;o[i*4+2]=(h[i]>>8)&0xFF;o[i*4+3]=h[i]&0xFF;}
    return o;
}
inline std::array<uint8_t,SHA256_BYTES> sha256(const std::vector<uint8_t>& v) { return sha256(v.data(),v.size()); }
inline std::string sha256_hex(const uint8_t* d, std::size_t n) { return to_hex(sha256(d,n)); }
inline std::string sha256_hex(const std::string& s) { return sha256_hex((const uint8_t*)s.data(),s.size()); }
inline std::string sha256_hex(const std::vector<uint8_t>& v) { return sha256_hex(v.data(),v.size()); }

// ── HMAC-SHA256 ───────────────────────────────────────────────────────────────

inline std::array<uint8_t,HMAC_BYTES> hmac_sha256(
    const uint8_t* key, std::size_t kl,
    const uint8_t* msg, std::size_t ml
) {
    std::array<uint8_t,64> k{};
    if (kl > 64) { auto h=sha256(key,kl); std::copy(h.begin(),h.end(),k.begin()); }
    else std::copy(key,key+kl,k.begin());
    std::array<uint8_t,64> ip{}, op{};
    for (int i=0;i<64;++i){ip[i]=k[i]^0x36;op[i]=k[i]^0x5C;}
    std::vector<uint8_t> im(ip.begin(),ip.end());
    im.insert(im.end(),msg,msg+ml);
    auto ih = sha256(im);
    std::vector<uint8_t> om(op.begin(),op.end());
    om.insert(om.end(),ih.begin(),ih.end());
    return sha256(om);
}
inline std::array<uint8_t,HMAC_BYTES> hmac_sha256(
    const std::vector<uint8_t>& k, const std::vector<uint8_t>& m) {
    return hmac_sha256(k.data(),k.size(),m.data(),m.size());
}

// ── AES-256-GCM ───────────────────────────────────────────────────────────────

#ifdef ORGANISM_CRYPTO_USE_OPENSSL

inline EncryptedPayload encrypt(
    const std::array<uint8_t, AES_KEY_BYTES>& key,
    const uint8_t* pt, std::size_t pt_len
) {
    auto nonce = random_bytes(GCM_NONCE_BYTES);
    std::vector<uint8_t> ct(pt_len);
    uint8_t tag[GCM_TAG_BYTES]{};
    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    EVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), nullptr, nullptr, nullptr);
    EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, (int)GCM_NONCE_BYTES, nullptr);
    EVP_EncryptInit_ex(ctx, nullptr, nullptr, key.data(), nonce.data());
    int l=0; EVP_EncryptUpdate(ctx, ct.data(), &l, pt, (int)pt_len);
    int f=0; EVP_EncryptFinal_ex(ctx, ct.data()+l, &f);
    EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_GET_TAG, (int)GCM_TAG_BYTES, tag);
    EVP_CIPHER_CTX_free(ctx);
    ct.resize(l+f); ct.insert(ct.end(), tag, tag+GCM_TAG_BYTES);
    return {base64_encode(nonce), base64_encode(ct)};
}

inline std::vector<uint8_t> decrypt(
    const std::array<uint8_t, AES_KEY_BYTES>& key,
    const EncryptedPayload& p
) {
    auto nonce = base64_decode(p.nonce);
    auto ct    = base64_decode(p.ciphertext);
    if (nonce.size() != GCM_NONCE_BYTES) throw CryptoError("Bad nonce size");
    if (ct.size() < GCM_TAG_BYTES) throw CryptoError("Ciphertext too short");
    std::vector<uint8_t> tag(ct.end()-GCM_TAG_BYTES, ct.end());
    ct.resize(ct.size()-GCM_TAG_BYTES);
    std::vector<uint8_t> pt(ct.size());
    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    EVP_DecryptInit_ex(ctx, EVP_aes_256_gcm(), nullptr, nullptr, nullptr);
    EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, (int)GCM_NONCE_BYTES, nullptr);
    EVP_DecryptInit_ex(ctx, nullptr, nullptr, key.data(), nonce.data());
    int l=0; EVP_DecryptUpdate(ctx, pt.data(), &l, ct.data(), (int)ct.size());
    EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_TAG, (int)GCM_TAG_BYTES, tag.data());
    int f=0, ret=EVP_DecryptFinal_ex(ctx, pt.data()+l, &f);
    EVP_CIPHER_CTX_free(ctx);
    if (ret != 1) throw CryptoError("AES-GCM: authentication tag mismatch");
    pt.resize(l+f); return pt;
}

#else

// Fallback: XOR + HMAC (development mode — NOT production-secure)
inline EncryptedPayload encrypt(
    const std::array<uint8_t, AES_KEY_BYTES>& key,
    const uint8_t* pt, std::size_t n
) {
    auto nonce = random_bytes(GCM_NONCE_BYTES);
    std::vector<uint8_t> ct(n);
    for (std::size_t i = 0; i < n; ++i) ct[i] = pt[i] ^ key[i % AES_KEY_BYTES];
    auto mac = hmac_sha256(std::vector<uint8_t>(key.begin(),key.end()), ct);
    ct.insert(ct.end(), mac.begin(), mac.begin()+GCM_TAG_BYTES);
    return {base64_encode(nonce), base64_encode(ct)};
}

inline std::vector<uint8_t> decrypt(
    const std::array<uint8_t, AES_KEY_BYTES>& key,
    const EncryptedPayload& p
) {
    auto full = base64_decode(p.ciphertext);
    if (full.size() < GCM_TAG_BYTES) throw CryptoError("Ciphertext too short");
    std::vector<uint8_t> ct(full.begin(), full.end()-GCM_TAG_BYTES);
    auto exp = hmac_sha256(std::vector<uint8_t>(key.begin(),key.end()), ct);
    bool ok = true;
    for (std::size_t i = 0; i < GCM_TAG_BYTES; ++i)
        ok &= (full[full.size()-GCM_TAG_BYTES+i] == exp[i]);
    if (!ok) throw CryptoError("Authentication tag mismatch");
    std::vector<uint8_t> pt(ct.size());
    for (std::size_t i = 0; i < ct.size(); ++i) pt[i] = ct[i] ^ key[i % AES_KEY_BYTES];
    return pt;
}

#endif

inline EncryptedPayload encrypt(const std::array<uint8_t,AES_KEY_BYTES>& k, const std::vector<uint8_t>& v) { return encrypt(k,v.data(),v.size()); }
inline EncryptedPayload encrypt(const std::array<uint8_t,AES_KEY_BYTES>& k, const std::string& s) { return encrypt(k,(const uint8_t*)s.data(),s.size()); }

} // namespace organism::crypto
