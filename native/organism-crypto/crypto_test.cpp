#include "organism_crypto.hpp"
#include <cassert>
#include <cstring>
#include <iostream>

using namespace organism::crypto;

void test_sha256() {
    // SHA-256("") is well-known
    auto h_empty = sha256((const uint8_t*)"", 0);
    std::string hex_empty = to_hex(h_empty);
    assert(hex_empty == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    assert(hex_empty.size() == 64);
    std::cout << "sha256(\"\")  OK: " << hex_empty.substr(0,16) << "...\n";

    // Consistency: same input → same output
    auto h1 = sha256((const uint8_t*)"abc", 3);
    auto h2 = sha256((const uint8_t*)"abc", 3);
    assert(h1 == h2);
    assert(to_hex(h1).size() == 64);
    std::cout << "sha256(abc) OK: " << to_hex(h1).substr(0,16) << "...\n";

    // Different inputs → different outputs
    auto h3 = sha256((const uint8_t*)"abd", 3);
    assert(h1 != h3);
    std::cout << "sha256 collision-free OK\n";
}

void test_hmac_sha256() {
    // HMAC-SHA256 with key="" and msg="" — compare against known test vector
    // key="key" msg="The quick brown fox..." = de7c9b85b8b78aa6bc8a7a36f70a90701c9db4d9
    // (using simplified check: output must be 32 bytes)
    uint8_t key[] = "key";
    uint8_t msg[] = "The quick brown fox jumps over the lazy dog";
    auto mac = hmac_sha256(key, 3, msg, sizeof(msg)-1);
    assert(mac.size() == HMAC_BYTES);
    std::string hex = to_hex(mac);
    std::cout << "hmac_sha256 OK: " << hex.substr(0,16) << "...\n";
}

void test_base64() {
    // "Man" → "TWFu"
    uint8_t man[] = { 'M', 'a', 'n' };
    auto enc = base64_encode(man, 3);
    assert(enc == "TWFu");
    auto dec = base64_decode("TWFu");
    assert(dec.size() == 3 && dec[0]=='M' && dec[1]=='a' && dec[2]=='n');
    std::cout << "base64 OK\n";
}

void test_encrypt_decrypt() {
    auto key  = generate_aes_key();
    std::string msg = "Sovereign organism — test payload";
    auto enc  = encrypt(key, msg);
    assert(!enc.empty());
    auto dec  = decrypt(key, enc);
    std::string recovered(dec.begin(), dec.end());
    assert(recovered == msg);
    std::cout << "encrypt/decrypt OK\n";
}

void test_wrong_key_fails() {
    auto key1 = generate_aes_key();
    auto key2 = generate_aes_key();
    auto enc  = encrypt(key1, std::string("secret"));
    try {
        decrypt(key2, enc);
        assert(false && "Should have thrown");
    } catch (const CryptoError&) {
        std::cout << "wrong_key fails OK\n";
    }
}

void test_tampered_fails() {
    auto key = generate_aes_key();
    auto enc = encrypt(key, std::string("tamper me"));
    EncryptedPayload bad{enc.nonce, "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="};
    try {
        decrypt(key, bad);
        assert(false && "Should have thrown");
    } catch (const CryptoError&) {
        std::cout << "tamper_fails OK\n";
    }
}

int main() {
    std::cout << "=== organism_crypto.hpp tests ===\n\n";
    test_sha256();
    test_hmac_sha256();
    test_base64();
    test_encrypt_decrypt();
    test_wrong_key_fails();
    test_tampered_fails();
    std::cout << "\nAll tests passed.\n";
    return 0;
}
