import { describe, it, expect } from 'vitest';
import { encryptToken, decryptToken, generateRandomState } from '../src/utils/crypto.js';

describe('AES-256-GCM Token Encryption & Decryption', () => {
  it('should encrypt and decrypt a plain token correctly', () => {
    const rawToken = 'gho_secret_access_token_1234567890';
    const encrypted = encryptToken(rawToken);

    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(rawToken);
    expect(encrypted.split(':').length).toBe(3); // iv : authTag : ciphertext

    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(rawToken);
  });

  it('should handle empty/null tokens gracefully', () => {
    expect(encryptToken(null)).toBeNull();
    expect(decryptToken(null)).toBeNull();
  });

  it('should throw an error for malformed encrypted strings', () => {
    expect(() => decryptToken('malformed:string')).toThrow();
  });

  it('should generate a 64-char hex random state', () => {
    const state1 = generateRandomState();
    const state2 = generateRandomState();
    expect(state1).toHaveLength(64);
    expect(state2).toHaveLength(64);
    expect(state1).not.toBe(state2);
  });
});

